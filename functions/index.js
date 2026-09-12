/**
 * syncAuthLinkClaims
 * ─────────────────────────────────────────────────────────────────────
 * Por quê isso existe: as Storage Rules do módulo de guarda de documentos
 * (storage.rules) precisam saber o papel (role) e o setor (sectorId) de
 * quem está pedindo, pra decidir se pode ler/enviar um arquivo. O jeito
 * natural seria o Storage consultar auth_links/{uid} no Firestore
 * ("cross-service rules", firestore.get()) — só que esse recurso do
 * Firebase SÓ funciona com o banco Firestore "(default)", e este projeto
 * usa um banco NOMEADO. Então o Storage nunca consegue ler auth_links
 * diretamente, e qualquer checagem de papel/setor no storage.rules falha
 * sempre (mesmo para admin).
 *
 * A solução recomendada pelo próprio Firebase pra esse cenário é usar
 * Custom Claims: gravar papel/setor DENTRO do token de autenticação do
 * usuário (request.auth.token.role / .sectorId), que o Storage Rules lê
 * de graça, sem nenhuma consulta cross-service. Só o Admin SDK (rodando
 * em uma Cloud Function, nunca no cliente) pode gravar custom claims —
 * daí esta function: toda vez que auth_links/{uid} é criado/atualizado
 * (hoje só pelas Cloud Functions login/linkGoogleUser, mais abaixo neste
 * arquivo — o cliente não tem mais permissão de escrita direta nessa
 * coleção, ver firestore.rules), ela espelha role/sectorId pros custom
 * claims daquele uid no Firebase Auth.
 *
 * O cliente, depois de logar, força um refresh do ID token
 * (getIdTokenResult(true), com retry) até ver os claims batendo — só
 * então tenta o upload/leitura no Storage. Ver waitForSessionClaims em
 * src/lib/authLink.ts.
 */

const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Senha de app do Gmail usado pra ENVIAR e-mail transacional (link de
// "esqueci minha senha") — guardada como Secret do Cloud Functions
// (Secret Manager), nunca em código: `firebase functions:secrets:set
// GMAIL_APP_PASSWORD` no Cloud Shell, uma vez, colando ali o valor (não
// a senha normal da conta Google — é uma "Senha de app" de 16
// caracteres, gerada em myaccount.google.com/apppasswords, exclusiva
// pra isso e revogável a qualquer momento sem afetar o login normal).
// Usada só por requestPasswordReset, mais abaixo.
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');

// Precisa bater com firestoreDatabaseId em firebase-applet-config.json.
// Se o banco Firestore for recriado/renomeado, atualizar aqui também
// (mesmo cuidado documentado no topo de storage.rules e firestore.rules).
const PROJECT_ID = 'dogwood-loader-bln7n';
const FIRESTORE_DATABASE_ID = 'ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900';
const REGION = 'us-central1';

// Fase 1 (multiempresa): primeiro tenant do sistema. Precisa ser IDÊNTICO
// a DEFAULT_COMPANY_ID em src/lib/tenant.ts — usado como fallback pra
// contas/documentos ainda não migrados (sem campo companyId) e como o ID
// gravado pelo script functions/migrate-add-company-id.js.
const DEFAULT_COMPANY_ID = 'acii';

initializeApp({ projectId: PROJECT_ID });

let firestoreInstance = null;
function db() {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(FIRESTORE_DATABASE_ID);
    try {
      firestoreInstance.settings({ ignoreUndefinedProperties: true });
    } catch (_) {
      // settings já aplicadas em invocações anteriores
    }
  }
  return firestoreInstance;
}

// Mesmo algoritmo do hashPassword do cliente (src/lib/userManagement.ts):
// SHA-256 em hex sobre os bytes UTF-8 da senha. Mantido idêntico de
// propósito para que hashes já gravados no Firestore por versões antigas
// do cliente continuem validando sem precisar de migração de algoritmo.
function sha256Hex(input) {
  return crypto.createHash('sha256').update(String(input), 'utf8').digest('hex');
}

/**
 * Resolve o SectorData.id de um usuário a partir do Employee vinculado —
 * mesma lógica de resolveUserSectorId em src/lib/authLink.ts, mas rodando
 * aqui (Admin SDK, servidor) porque authLink.ts deixou de poder escrever
 * auth_links diretamente (ver nota grande acima de exports.login).
 *
 * Fase 1 (multiempresa): a busca de setores é restrita à MESMA empresa do
 * funcionário — sem isso, um nome de setor igual em duas empresas
 * diferentes poderia resolver o sectorId da empresa errada.
 */
async function resolveSectorIdForEmployee(firestore, employeeId) {
  try {
    if (!employeeId) return null;
    const empSnap = await firestore.collection('employees').doc(String(employeeId)).get();
    if (!empSnap.exists) return null;
    const employee = empSnap.data();
    if (!employee.sector) return null;
    const companyId = employee.companyId || DEFAULT_COMPANY_ID;
    const sectorsSnap = await firestore.collection('sectors').where('companyId', '==', companyId).get();
    for (const sectorDoc of sectorsSnap.docs) {
      const s = sectorDoc.data();
      if (s.name === employee.sector || s.id === employee.sector || sectorDoc.id === employee.sector) {
        return s.id || sectorDoc.id;
      }
    }
    return null;
  } catch (err) {
    logger.warn('Falha ao resolver setor do colaborador:', err);
    return null;
  }
}

/**
 * Resolve se o papel pode enviar documento pro módulo de Guarda —
 * espelhado pros custom claims (ver storage.rules) porque, assim como
 * role/sectorId/companyId, o Storage não consegue ler o Firestore direto
 * (banco nomeado, sem cross-service rules).
 *
 * admin/gestor/lider sempre podem (storage.rules já libera esses papéis
 * incondicionalmente, sem olhar permissão nenhuma — igual sempre foi).
 * colaborador depende da permissão configurável por empresa
 * (permissions/{companyId}.colaborador.canUploadDocuments, editada em
 * AdminUsersModal.tsx) — sem espelhar isso aqui, a tela liberava o botão
 * de upload pra um colaborador com essa permissão marcada, mas o envio
 * sempre falhava no Storage (regra só olhava o papel, nunca essa flag).
 */
async function resolveCanUpload(firestore, role, companyId) {
  if (role === 'admin' || role === 'gestor' || role === 'lider') return true;
  if (role !== 'colaborador') return false;
  try {
    const permSnap = await firestore.collection('permissions').doc(companyId).get();
    if (!permSnap.exists) return false;
    return permSnap.data()?.colaborador?.canUploadDocuments === true;
  } catch (err) {
    logger.warn(`Falha ao resolver canUploadDocuments (companyId=${companyId}):`, err);
    return false;
  }
}

exports.syncAuthLinkClaims = onDocumentWritten(
  {
    document: 'auth_links/{uid}',
    database: FIRESTORE_DATABASE_ID,
    region: 'us-central1'
  },
  async event => {
    const uid = event.params.uid;
    const after = event.data?.after?.exists ? event.data.after.data() : null;

    try {
      if (!after) {
        // Documento apagado (não deveria acontecer no fluxo normal do
        // app) — limpa os claims por segurança, em vez de deixar um
        // papel/setor obsoleto valendo pra sempre no token desse uid.
        await getAuth().setCustomUserClaims(uid, { role: null, sectorId: null, companyId: null, canUpload: false });
        logger.info(`Claims limpos para uid=${uid} (auth_links removido).`);
        return;
      }

      const role = after.role ?? null;
      const sectorId = after.sectorId ?? null;
      // companyId (Fase 1): espelhado pro token igual role/sectorId, pelo
      // mesmo motivo (storage.rules não consegue consultar o Firestore
      // direto — ver comentário grande no topo deste arquivo).
      const companyId = after.companyId ?? DEFAULT_COMPANY_ID;
      const canUpload = await resolveCanUpload(db(), role, companyId);
      await getAuth().setCustomUserClaims(uid, { role, sectorId, companyId, canUpload });
      logger.info(`Claims sincronizados para uid=${uid}: role=${role}, sectorId=${sectorId}, companyId=${companyId}, canUpload=${canUpload}`);
    } catch (err) {
      // Não há como "falhar" de volta pro cliente aqui (é um trigger
      // assíncrono) — o retry do cliente (waitForClaimsSync) vai apenas
      // dar timeout e seguir com os claims antigos/ausentes, o que é o
      // pior caso seguro (acesso negado, não indevido).
      logger.error(`Falha ao sincronizar claims para uid=${uid}:`, err);
    }
  }
);

/**
 * syncPermissionsToClaims
 * ─────────────────────────────────────────────────────────────────────
 * syncAuthLinkClaims só reage a mudanças em auth_links/{uid} — se um
 * admin muda a permissão canUploadDocuments do colaborador
 * (permissions/{companyId}), os colaboradores já logados ficariam com o
 * claim `canUpload` desatualizado até o próximo login. Esta function
 * reage à mudança na permissão em si e ressincroniza na hora os claims
 * de todo colaborador daquela empresa (admin/gestor/lider não dependem
 * desta permissão, não precisam ser tocados).
 */
exports.syncPermissionsToClaims = onDocumentWritten(
  {
    document: 'permissions/{companyId}',
    database: FIRESTORE_DATABASE_ID,
    region: REGION
  },
  async event => {
    const companyId = event.params.companyId;
    const after = event.data?.after?.exists ? event.data.after.data() : null;
    const canUpload = after?.colaborador?.canUploadDocuments === true;

    try {
      const firestore = db();
      const linksSnap = await firestore.collection('auth_links')
        .where('companyId', '==', companyId)
        .where('role', '==', 'colaborador')
        .get();

      if (linksSnap.empty) return;

      await Promise.all(linksSnap.docs.map(async linkDoc => {
        const link = linkDoc.data();
        try {
          await getAuth().setCustomUserClaims(linkDoc.id, {
            role: link.role ?? null,
            sectorId: link.sectorId ?? null,
            companyId: link.companyId ?? DEFAULT_COMPANY_ID,
            canUpload
          });
        } catch (err) {
          logger.warn(`Falha ao ressincronizar claims (permissions) para uid=${linkDoc.id}:`, err);
        }
      }));
      logger.info(`Claims de ${linksSnap.size} colaborador(es) da empresa ${companyId} ressincronizados (canUpload=${canUpload}).`);
    } catch (err) {
      logger.error(`Falha ao ressincronizar claims após mudança de permissões (companyId=${companyId}):`, err);
    }
  }
);

// ───────────────────────────────────────────────────────────────────────
// login / linkGoogleUser / setPassword
// ─────────────────────────────────────────────────────────────────────
// HISTÓRICO: até aqui, o login por CPF/matrícula + senha era validado
// 100% no navegador (src/lib/userManagement.ts lia a coleção `users`
// inteira do Firestore e comparava a senha em JavaScript). Isso exigia
// que `users` fosse legível por qualquer sessão autenticada — inclusive
// a sessão anônima que o app cria automaticamente para TODO visitante,
// antes mesmo do login. Na prática, qualquer pessoa que abrisse o site
// conseguia ler CPF e senha (em texto puro) de todos os funcionários.
// Além disso, existia um atalho fixo no código (usuário "admin" com
// senha "admin" sempre entrava, não importa o que estivesse no banco) e
// auth_links/{uid} — de onde as Firestore/Storage Rules tiram o papel e
// o setor da sessão — podia ser escrito livremente pelo próprio cliente,
// então bastava chamar setDoc(auth_links/{uid}, {role:'admin'}) direto
// no console do navegador para virar administrador sem nunca logar.
//
// A correção: a verificação de usuário/senha passa a rodar aqui, com o
// Admin SDK (que ignora as Firestore Rules), e SOMENTE esta function
// grava auth_links/{uid} — o cliente perdeu a permissão de escrita
// direta nessa coleção (ver firestore.rules). `users` também deixou de
// ser legível por qualquer sessão autenticada (ver firestore.rules) —
// só admin/gestor ou o próprio dono do registro.
// ───────────────────────────────────────────────────────────────────────

const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPT_MAX = 10;

/**
 * login({ username, password })
 * Requer uma sessão do Firebase Auth já existente (mesmo anônima — é a
 * sessão-ponte criada por ensureAnonymousAuth no carregamento da página).
 * Em caso de sucesso, grava auth_links/{request.auth.uid} e devolve o
 * perfil do usuário SEM nenhum campo de senha.
 */
exports.login = onCall({ region: REGION }, async (request) => {
  const username = String(request.data?.username || '').trim();
  const password = String(request.data?.password || '');

  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sessão inválida. Recarregue a página e tente novamente.');
    }

    if (!username || !password) {
      throw new HttpsError('invalid-argument', 'Informe usuário e senha.');
    }

    const usernameLower = username.toLowerCase();
    const cpfDigits = username.replace(/\D/g, '');
    const firestore = db();

    // Limitação de tentativas por login (defesa contra força bruta — antes
    // não existia nenhuma, já que a senha nem chegava a ser validada aqui).
    const attemptsRef = firestore.collection('login_attempts').doc(usernameLower || 'desconhecido');
    const attemptsSnap = await attemptsRef.get();
    const now = Date.now();
    if (attemptsSnap.exists) {
      const data = attemptsSnap.data();
      if (data.count >= LOGIN_ATTEMPT_MAX && data.firstAttemptAt && (now - data.firstAttemptAt) < LOGIN_ATTEMPT_WINDOW_MS) {
        throw new HttpsError('resource-exhausted', 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.');
      }
    }

    const registerFailedAttempt = async () => {
      try {
        let count = 1;
        let firstAttemptAt = now;
        if (attemptsSnap.exists) {
          const data = attemptsSnap.data();
          if (data.firstAttemptAt && (now - data.firstAttemptAt) < LOGIN_ATTEMPT_WINDOW_MS) {
            count = (data.count || 0) + 1;
            firstAttemptAt = data.firstAttemptAt;
          }
        }
        await attemptsRef.set({ count, firstAttemptAt });
      } catch (attemptErr) {
        logger.warn('Falha ao registrar tentativa de login falha:', attemptErr);
      }
    };

    const usersRef = firestore.collection('users');
    let userDoc = null;
    let snap = await usersRef.where('username', '==', username).limit(1).get();
    if (snap.empty && username !== usernameLower) {
      snap = await usersRef.where('username', '==', usernameLower).limit(1).get();
    }
    if (snap.empty && cpfDigits) {
      snap = await usersRef.where('username', '==', cpfDigits).limit(1).get();
    }
    if (snap.empty && cpfDigits && !isNaN(Number(cpfDigits))) {
      snap = await usersRef.where('username', '==', Number(cpfDigits)).limit(1).get();
    }
    if (!snap.empty) userDoc = snap.docs[0];

    // Busca direta por ID do documento caso username seja o próprio id (ex: '1', 'admin', CPF)
    if (!userDoc && username) {
      const directDoc = await usersRef.doc(username).get();
      if (directDoc.exists) userDoc = directDoc;
    }

    if (!userDoc) {
      await registerFailedAttempt();
      throw new HttpsError('not-found', 'Usuário não encontrado. Verifique o CPF/Login informado.');
    }

    const userData = userDoc.data();
    const accountStatus = String(userData.accountStatus || userData.status || 'ativo').toLowerCase();
    if (accountStatus === 'inativo') {
      throw new HttpsError('permission-denied', 'Conta inativa. Contate o administrador.');
    }
    if (accountStatus === 'bloqueado') {
      throw new HttpsError('permission-denied', 'Conta bloqueada. Contate o administrador.');
    }

    const storedHash = userData.passwordHash || '';
    const plainLegacyPassword = userData.password ? String(userData.password) : null;
    let senhaValida = false;

    if (storedHash) {
      const candidateHashes = [sha256Hex(password), sha256Hex(password.toLowerCase())];
      if (candidateHashes.includes(storedHash)) {
        senhaValida = true;
      }
    }

    // Se ainda não validou pelo hash, verifica se a conta ainda tem senha em texto puro legada
    if (!senhaValida && plainLegacyPassword) {
      if (plainLegacyPassword === password || plainLegacyPassword.toLowerCase() === password.toLowerCase()) {
        senhaValida = true;
        // Migra automaticamente a senha para hash no banco e remove o texto puro
        const newHash = sha256Hex(password);
        userDoc.ref.update({
          passwordHash: newHash,
          password: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp()
        }).catch(e => logger.warn('Falha na migração automática de senha legada:', e));
      }
    }

    if (!senhaValida) {
      await registerFailedAttempt();
      if (!storedHash && !plainLegacyPassword) {
        throw new HttpsError('permission-denied', 'Conta sem senha configurada. Contate o administrador.');
      }
      throw new HttpsError('permission-denied', 'Senha incorreta.');
    }

    await attemptsRef.delete().catch(() => {});

    const role = userData.role || 'colaborador';
    const sectorId = await resolveSectorIdForEmployee(firestore, userData.employeeId);
    // Fase 1 (multiempresa): a conta define a que empresa pertence. Contas
    // criadas antes da migração (functions/migrate-add-company-id.js) ainda
    // não têm este campo — cai no primeiro tenant (a própria ACII), nunca
    // em "sem empresa" (o que deixaria as regras do Firestore travadas).
    const companyId = userData.companyId || DEFAULT_COMPANY_ID;

    await firestore.collection('auth_links').doc(request.auth.uid).set(
      {
        userId: userDoc.id,
        role,
        sectorId: sectorId ?? null,
        companyId,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    const precisaTrocarSenha = role !== 'admin' && (userData.firstAccess === true || userData.primeiro_acesso === true);

    return {
      success: true,
      userId: userDoc.id,
      precisaTrocarSenha,
      userData: {
        id: userDoc.id,
        companyId,
        username: userData.username,
        name: userData.name,
        role,
        employeeId: userData.employeeId || null,
        status: userData.status || null,
        accountStatus: userData.accountStatus || null,
        primeiro_acesso: userData.primeiro_acesso ?? false,
        firstAccess: userData.firstAccess ?? false,
        lastPasswordChange: userData.lastPasswordChange || null
      }
    };
  } catch (err) {
    logger.error('❌ ERRO DETALHADO NA FUNÇÃO LOGIN:', {
      message: err.message,
      code: err.code,
      details: err.details,
      stack: err.stack,
      username
    });
    if (err instanceof HttpsError) {
      throw err;
    }
    throw new HttpsError('unavailable', `Erro no login: ${err.message || 'Erro inesperado no servidor'}`, {
      code: err.code || 'UNKNOWN'
    });
  }
});

const RUNTIME_ADMIN_EMAIL = 'marciper@gmail.com';

// "Esqueci minha senha" self-service (recuperação por e-mail) — ver
// requestPasswordReset/confirmPasswordReset mais abaixo, perto do fim
// deste arquivo.
const GMAIL_SENDER_EMAIL = 'marciper@gmail.com';
// Domínio de produção do front-end — usado só pra montar o link que vai
// dentro do e-mail de redefinição. Atualizar aqui se o domínio mudar.
const APP_BASE_URL = 'https://controle-de-documentos-acii.vercel.app';
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos
const RESET_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const RESET_ATTEMPT_MAX = 5; // mesmo raciocínio de LOGIN_ATTEMPT_MAX acima, mas mais restrito: pedir e-mail repetido é mais barato de abusar que tentar senha

/**
 * linkGoogleUser()
 * Chamado pelo cliente logo após "Entrar com o Google" ter sucesso.
 * Calcula o papel (admin de runtime / gestor / colaborador, pelo cargo do
 * funcionário vinculado) no servidor, grava/atualiza users/{uid} e
 * auth_links/{uid}, e devolve o perfil já resolvido — o cliente não
 * decide mais o próprio papel sozinho.
 */
exports.linkGoogleUser = onCall({ region: REGION }, async (request) => {
  try {
    const token = request.auth?.token;
    if (!request.auth || !token?.email) {
      throw new HttpsError('unauthenticated', 'É necessário estar autenticado com o Google.');
    }

    const uid = request.auth.uid;
    const email = token.email;
    const emailLower = email.toLowerCase();
    const displayName = token.name || 'Usuário Google';
    const firestore = db();
    const isRuntimeAdmin = emailLower === RUNTIME_ADMIN_EMAIL;

    // LIMITAÇÃO CONHECIDA (Fase 1): a busca abaixo é por e-mail em TODAS as
    // empresas — é assim que a empresa do usuário é descoberta no login
    // Google, já que ainda não existe nenhuma tela de "escolha sua empresa"
    // (isso é Fase 3, onboarding). Funciona porque, na prática, só a ACII
    // existe hoje. No dia em que houver uma segunda empresa, dois
    // funcionários com o MESMO e-mail em empresas diferentes resolveriam
    // pra empresa errada — resolver isso é pré-requisito da Fase 3.
    let matchedEmployee = null;
    const empSnap = await firestore.collection('employees').where('email', '==', email).limit(1).get();
    if (!empSnap.empty) {
      matchedEmployee = { id: empSnap.docs[0].id, ...empSnap.docs[0].data() };
    } else {
      // E-mail pode estar salvo com outra caixa — verificação adicional
      // (coleção de funcionários costuma ser pequena, custo aceitável).
      const allEmp = await firestore.collection('employees').get();
      const found = allEmp.docs.find((d) => (d.data().email || '').toLowerCase() === emailLower);
      if (found) matchedEmployee = { id: found.id, ...found.data() };
    }

    let role = isRuntimeAdmin ? 'admin' : 'colaborador';
    if (matchedEmployee && !isRuntimeAdmin) {
      const roleLower = String(matchedEmployee.role || '').toLowerCase();
      const isLeadership = ['gerente', 'coordenador', 'diretor', 'supervisor', 'lider', 'gestor'].some((k) =>
        roleLower.includes(k)
      );
      role = isLeadership ? 'gestor' : 'colaborador';
    }

    const existingSnap = await firestore.collection('users').doc(uid).get();
    const existingData = existingSnap.data();
    const employeeId = matchedEmployee ? matchedEmployee.id : existingData?.employeeId;

    // Fase 1 (multiempresa): resolve a empresa pelo funcionário vinculado
    // (mesma fonte usada pra papel/setor), depois pela conta já existente,
    // e só por último cai no primeiro tenant — nunca fica "sem empresa".
    const companyId = matchedEmployee?.companyId || existingData?.companyId || DEFAULT_COMPANY_ID;

    const userDataToSave = {
      id: uid,
      companyId,
      username: emailLower.split('@')[0],
      name: displayName,
      role,
      employeeId: employeeId || FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await firestore.collection('users').doc(uid).set(userDataToSave, { merge: true });

    const sectorId = await resolveSectorIdForEmployee(firestore, employeeId);
    await firestore.collection('auth_links').doc(uid).set(
      { userId: uid, role, sectorId: sectorId ?? null, companyId, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    return {
      success: true,
      userId: uid,
      userData: {
        id: uid,
        companyId,
        username: userDataToSave.username,
        name: displayName,
        role,
        employeeId: employeeId || null
      }
    };
  } catch (err) {
    logger.error('❌ ERRO NA FUNÇÃO LINKGOOGLEUSER:', err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Erro no vínculo Google [${err.code || 'ERRO'}]: ${err.message || 'Erro inesperado'}`);
  }
});

/**
 * setPassword({ targetUserId, newPassword })
 * Substitui trocarSenha/resetarSenha (que gravavam a senha em texto puro
 * direto do navegador). Permitido para o próprio usuário (troca de senha
 * normal — marca a conta como acesso concluído) ou para admin/gestor
 * agindo sobre outra conta (reset — marca a conta como pendente de troca
 * no próximo login, igual ao comportamento anterior). Nunca grava o
 * campo `password` em texto puro — só `passwordHash`.
 */
exports.setPassword = onCall({ region: REGION }, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sessão inválida. Recarregue a página e tente novamente.');
    }

    const targetUserId = String(request.data?.targetUserId || '').trim();
    const newPassword = String(request.data?.newPassword || '');
    if (!targetUserId || !newPassword) {
      throw new HttpsError('invalid-argument', 'Dados incompletos para alterar a senha.');
    }
    if (newPassword.length < 3) {
      throw new HttpsError('invalid-argument', 'A senha é muito curta.');
    }

    const firestore = db();
    const authLinkSnap = await firestore.collection('auth_links').doc(request.auth.uid).get();
    const callerLink = authLinkSnap.exists ? authLinkSnap.data() : null;
    const callerRole = callerLink?.role;
    const callerUserId = callerLink?.userId;
    const callerCompanyId = callerLink?.companyId || DEFAULT_COMPANY_ID;

    const isSelf = callerUserId === targetUserId;
    const isPrivileged = callerRole === 'admin' || callerRole === 'gestor' || callerRole === 'lider';

    if (!isSelf && !isPrivileged) {
      throw new HttpsError('permission-denied', 'Sem permissão para alterar a senha deste usuário.');
    }

    const targetSnap = await firestore.collection('users').doc(targetUserId).get();
    if (!targetSnap.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado.');
    }

    // Fase 1 (multiempresa): admin/gestor só pode resetar senha de alguém
    // da PRÓPRIA empresa — sem isso, um gestor da empresa A poderia
    // resetar a senha de um usuário da empresa B só sabendo o ID dele.
    const targetCompanyId = targetSnap.data()?.companyId || DEFAULT_COMPANY_ID;
    if (!isSelf && targetCompanyId !== callerCompanyId) {
      throw new HttpsError('permission-denied', 'Sem permissão para alterar a senha deste usuário.');
    }

    const passwordHash = sha256Hex(newPassword);
    const nowFormatted = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    await firestore.collection('users').doc(targetUserId).update({
      passwordHash,
      password: FieldValue.delete(),
      firstAccess: !isSelf,
      primeiro_acesso: !isSelf,
      lastPasswordChange: nowFormatted,
      updatedAt: FieldValue.serverTimestamp()
    });

    return { success: true, userId: targetUserId, lastPasswordChange: nowFormatted };
  } catch (err) {
    logger.error('❌ ERRO NA FUNÇÃO SETPASSWORD:', err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Erro ao alterar senha [${err.code || 'ERRO'}]: ${err.message || 'Erro inesperado'}`);
  }
});

// ───────────────────────────────────────────────────────────────────────
// createCompany — Fase 3 (onboarding)
// ─────────────────────────────────────────────────────────────────────
// O prompt original pede um fluxo de criação de empresa "mesmo que
// inicialmente seja um cadastro feito por mim [o dono do produto] como
// admin, e não self-service público" — é exatamente isso: só quem está
// logado com o e-mail Google do dono do produto (RUNTIME_ADMIN_EMAIL,
// já usado hoje pra decidir quem vira admin "de fábrica" no login Google)
// pode chamar esta function. Nenhum admin de empresa cliente consegue
// criar outra empresa por aqui — isso abriria a porta pra qualquer
// cliente criar tenants à vontade, fora do controle comercial.
//
// Cria, na mesma escrita: o documento companies/{companyId} e a primeira
// conta (admin) dessa empresa em users/{userId}. auth_links só é criado
// no primeiro LOGIN dessa conta nova (mesmo fluxo de sempre, via
// exports.login) — não há sessão do Firebase Auth pra vincular ainda
// nesse momento, só o cadastro em si.
exports.createCompany = onCall({ region: REGION }, async (request) => {
  try {
    const callerEmail = (request.auth?.token?.email || '').toLowerCase();
    if (!request.auth || callerEmail !== RUNTIME_ADMIN_EMAIL) {
      throw new HttpsError('permission-denied', 'Só o administrador da plataforma pode cadastrar uma nova empresa.');
    }

    const companyName = String(request.data?.companyName || '').trim();
    const adminName = String(request.data?.adminName || '').trim();
    const adminUsernameInput = String(request.data?.adminUsername || '').trim();
    const adminPassword = String(request.data?.adminPassword || '');

    if (!companyName || !adminName || !adminUsernameInput || !adminPassword) {
      throw new HttpsError('invalid-argument', 'Preencha nome da empresa, nome do admin, login e senha inicial.');
    }
    if (adminPassword.length < 4) {
      throw new HttpsError('invalid-argument', 'A senha inicial precisa ter pelo menos 4 caracteres.');
    }

    const firestore = db();

    // Slug do companyId a partir do nome da empresa (ex.: "Comércio ABC
    // Ltda" -> "comercio-abc-ltda"), com sufixo numérico se já existir.
    const baseSlug = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40) || 'empresa';

    let companyId = baseSlug;
    let suffix = 1;
    while ((await firestore.collection('companies').doc(companyId).get()).exists) {
      suffix += 1;
      companyId = `${baseSlug}-${suffix}`;
    }

    // Login (username) continua único no SISTEMA INTEIRO, não só dentro da
    // empresa — decisão deliberada, não esquecimento: o login por CPF/
    // usuário ainda não tem seletor de empresa (ver comentário na Fase 1
    // do prompt), então dois usuários com o mesmo login em empresas
    // diferentes seriam ambíguos pra Cloud Function `login` descobrir qual
    // conta é qual. Resolver isso de verdade é adicionar um seletor de
    // empresa na tela de login — mudança de UX que fica pra depois desta
    // fase, não escondida: só avisando aqui de novo, no lugar onde o
    // problema é checado.
    const adminUsernameLower = adminUsernameInput.toLowerCase();
    const existingUsername = await firestore.collection('users').where('username', '==', adminUsernameLower).limit(1).get();
    if (!existingUsername.empty) {
      throw new HttpsError('already-exists', `O login "${adminUsernameInput}" já está em uso por outra conta no sistema. Escolha outro.`);
    }

    const now = new Date();

    await firestore.collection('companies').doc(companyId).set({
      id: companyId,
      name: companyName,
      status: 'ativo',
      createdAt: now.toISOString()
    });

    const passwordHash = sha256Hex(adminPassword);
    const newUserRef = firestore.collection('users').doc();
    await newUserRef.set({
      id: newUserRef.id,
      companyId,
      username: adminUsernameLower,
      name: adminName,
      passwordHash,
      role: 'admin',
      status: 'Ativo',
      accountStatus: 'ativo',
      primeiro_acesso: true,
      firstAccess: true,
      createdAt: FieldValue.serverTimestamp()
    });

    logger.info(`Empresa criada por ${callerEmail}: companyId=${companyId}, admin=${adminUsernameLower}`);

    return {
      success: true,
      companyId,
      companyName,
      adminUserId: newUserRef.id,
      adminUsername: adminUsernameLower
    };
  } catch (err) {
    logger.error('❌ ERRO NA FUNÇÃO CREATECOMPANY:', err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Erro ao criar empresa [${err.code || 'ERRO'}]: ${err.message || 'Erro inesperado'}`);
  }
});

// ───────────────────────────────────────────────────────────────────────
// platformResetPassword — recuperação de senha pra o DONO DA PLATAFORMA
// ─────────────────────────────────────────────────────────────────────
// Mesma lacuna que motivou createCompany acima, só que do lado oposto:
// setPassword (mais acima neste arquivo) exige que quem chama já esteja
// logado como admin/gestor/lider DA MESMA EMPRESA do usuário-alvo — o que
// é o comportamento certo pra evitar que uma empresa mexa na senha de
// outra. O problema é que isso deixa o próprio dono da plataforma sem
// saída se esquecer a senha de uma empresa em que nunca tem uma conta
// própria (ex.: uma empresa de teste criada só pra validar o sistema) —
// não existia NENHUM jeito de recuperar isso pela interface.
//
// Esta função resolve exatamente esse ponto cego, com o mesmo padrão de
// autorização de createCompany: só aceita chamadas do e-mail Google
// RUNTIME_ADMIN_EMAIL. Localiza a empresa por nome (comparação
// case-insensitive) ou por companyId direto, reseta a senha do admin
// daquela empresa (ou de um username específico, se houver mais de um
// admin e for preciso desambiguar) e devolve o login pra você repassar/
// usar. Mesma lógica de gravação de setPassword: só o hash SHA-256 é
// salvo, nunca a senha em texto puro.
exports.platformResetPassword = onCall({ region: REGION }, async (request) => {
  try {
    const callerEmail = (request.auth?.token?.email || '').toLowerCase();
    if (!request.auth || callerEmail !== RUNTIME_ADMIN_EMAIL) {
      throw new HttpsError('permission-denied', 'Só o administrador da plataforma pode resetar a senha de uma empresa.');
    }

    const companyIdInput = String(request.data?.companyId || '').trim();
    const companyNameInput = String(request.data?.companyName || '').trim();
    const usernameInput = String(request.data?.username || '').trim().toLowerCase();
    const newPassword = String(request.data?.newPassword || '');

    if (!companyIdInput && !companyNameInput) {
      throw new HttpsError('invalid-argument', 'Informe o ID ou o nome da empresa.');
    }
    if (!newPassword || newPassword.length < 4) {
      throw new HttpsError('invalid-argument', 'A nova senha precisa ter pelo menos 4 caracteres.');
    }

    const firestore = db();

    // Resolve a empresa: por ID direto (mais confiável, se você o tiver
    // anotado) ou por nome — comparação case-insensitive/sem espaços nas
    // pontas, já que é comum digitar "empresa teste" quando o nome salvo é
    // "Empresa Teste". A coleção companies tende a ser pequena (uma por
    // cliente), então trazer todas e filtrar em memória é mais simples e
    // seguro que tentar um índice case-insensitive no Firestore.
    let companyDoc = null;
    if (companyIdInput) {
      const directSnap = await firestore.collection('companies').doc(companyIdInput).get();
      if (directSnap.exists) companyDoc = directSnap;
    }
    if (!companyDoc && companyNameInput) {
      const allCompanies = await firestore.collection('companies').get();
      const target = companyNameInput.toLowerCase();
      companyDoc = allCompanies.docs.find(d => String(d.data()?.name || '').trim().toLowerCase() === target) || null;
    }
    if (!companyDoc) {
      throw new HttpsError('not-found', `Nenhuma empresa encontrada com esse ${companyIdInput ? 'ID' : 'nome'}.`);
    }

    const companyId = companyDoc.id;
    const companyName = companyDoc.data()?.name || companyId;

    // Localiza a(s) conta(s) admin dessa empresa — reset de senha só se
    // aplica a admin por essa via (é o cenário real: perdeu acesso ao
    // primeiro/único login de uma empresa de teste). Se houver mais de um
    // admin, exige o username pra saber qual escolher, em vez de resetar
    // "qualquer um" às cegas.
    let adminsSnap = await firestore.collection('users')
      .where('companyId', '==', companyId)
      .where('role', '==', 'admin')
      .get();

    if (adminsSnap.empty) {
      throw new HttpsError('not-found', `A empresa "${companyName}" não tem nenhuma conta admin cadastrada.`);
    }

    let targetDoc;
    if (adminsSnap.size === 1) {
      targetDoc = adminsSnap.docs[0];
    } else if (usernameInput) {
      targetDoc = adminsSnap.docs.find(d => String(d.data()?.username || '').toLowerCase() === usernameInput);
      if (!targetDoc) {
        throw new HttpsError('not-found', `Nenhuma conta admin com o login "${usernameInput}" na empresa "${companyName}".`);
      }
    } else {
      const usernames = adminsSnap.docs.map(d => d.data()?.username).filter(Boolean);
      throw new HttpsError(
        'failed-precondition',
        `A empresa "${companyName}" tem mais de uma conta admin (${usernames.join(', ')}). Informe qual login resetar.`
      );
    }

    const passwordHash = sha256Hex(newPassword);
    const nowFormatted = new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    await targetDoc.ref.update({
      passwordHash,
      password: FieldValue.delete(),
      firstAccess: true,
      primeiro_acesso: true,
      lastPasswordChange: nowFormatted,
      updatedAt: FieldValue.serverTimestamp()
    });

    logger.info(`Senha resetada por ${callerEmail}: companyId=${companyId}, username=${targetDoc.data()?.username}`);

    return {
      success: true,
      companyId,
      companyName,
      username: targetDoc.data()?.username,
      userId: targetDoc.id
    };
  } catch (err) {
    logger.error('❌ ERRO NA FUNÇÃO PLATFORMRESETPASSWORD:', err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Erro ao resetar senha [${err.code || 'ERRO'}]: ${err.message || 'Erro inesperado'}`);
  }
});

// ───────────────────────────────────────────────────────────────────────
// "Esqueci minha senha" — recuperação self-service por e-mail
// ─────────────────────────────────────────────────────────────────────
// Motivação de negócio (não só técnica): o modelo de venda em volume, com
// pouco suporte individual por empresa, só funciona se cada admin
// consegue recuperar a própria senha sozinho. Antes disso, só existiam
// dois caminhos quando um admin esquecia a senha: outro admin/gestor da
// MESMA empresa resetar (setPassword acima), ou — se ele fosse o único
// admin — não tinha jeito nenhum, a não ser platformResetPassword (só
// você, dono da plataforma, consegue chamar).
//
// Fluxo: requestPasswordReset (login -> gera um token de uso único,
// válido por 30min, manda por e-mail) -> usuário abre o link
// (/resetar-senha?token=...) -> confirmPasswordReset (token + nova
// senha -> valida e efetiva a troca). Nenhuma das duas exige estar
// logado — é exatamente o cenário de "não consigo entrar".
//
// Exige e-mail cadastrado na conta (users/{id}.email, opcional — ver
// AdminUsersModal.tsx). Contas sem e-mail cadastrado recebem uma
// mensagem clara dizendo isso, em vez de ficar esperando um e-mail que
// nunca chega.
async function findUserDocByUsername(firestore, username) {
  const usersRef = firestore.collection('users');
  const usernameLower = username.toLowerCase();
  const cpfDigits = username.replace(/\D/g, '');

  let snap = await usersRef.where('username', '==', username).limit(1).get();
  if (snap.empty && username !== usernameLower) {
    snap = await usersRef.where('username', '==', usernameLower).limit(1).get();
  }
  if (snap.empty && cpfDigits) {
    snap = await usersRef.where('username', '==', cpfDigits).limit(1).get();
  }
  if (!snap.empty) return snap.docs[0];

  if (username) {
    const directDoc = await usersRef.doc(username).get();
    if (directDoc.exists) return directDoc;
  }
  return null;
}

exports.requestPasswordReset = onCall({ region: REGION, secrets: [GMAIL_APP_PASSWORD] }, async (request) => {
  const username = String(request.data?.username || '').trim();
  try {
    if (!username) {
      throw new HttpsError('invalid-argument', 'Informe seu usuário/CPF.');
    }

    const firestore = db();
    const usernameLower = username.toLowerCase();

    // Mesmo limitador de tentativas do login (login_attempts), só que numa
    // coleção própria — pedir reenvio de e-mail em excesso é um vetor de
    // abuso diferente (spam pro dono da conta), não força bruta de senha.
    const attemptsRef = firestore.collection('password_reset_attempts').doc(usernameLower || 'desconhecido');
    const attemptsSnap = await attemptsRef.get();
    const now = Date.now();
    if (attemptsSnap.exists) {
      const data = attemptsSnap.data();
      if (data.count >= RESET_ATTEMPT_MAX && data.firstAttemptAt && (now - data.firstAttemptAt) < RESET_ATTEMPT_WINDOW_MS) {
        throw new HttpsError('resource-exhausted', 'Muitos pedidos de redefinição. Aguarde alguns minutos e tente novamente.');
      }
    }
    let count = 1;
    let firstAttemptAt = now;
    if (attemptsSnap.exists) {
      const data = attemptsSnap.data();
      if (data.firstAttemptAt && (now - data.firstAttemptAt) < RESET_ATTEMPT_WINDOW_MS) {
        count = (data.count || 0) + 1;
        firstAttemptAt = data.firstAttemptAt;
      }
    }
    await attemptsRef.set({ count, firstAttemptAt });

    const userDoc = await findUserDocByUsername(firestore, username);
    if (!userDoc) {
      // Mesmo padrão de mensagem do login (exports.login já revela
      // "usuário não encontrado" — usernames não são tratados como
      // segredo neste sistema, só a senha é).
      throw new HttpsError('not-found', 'Login não encontrado. Verifique o CPF/usuário informado.');
    }

    const userData = userDoc.data();
    const email = String(userData.email || '').trim();
    if (!email) {
      return {
        success: false,
        reason: 'no-email',
        message: 'Essa conta não tem e-mail cadastrado. Peça para o administrador da sua empresa resetar sua senha.'
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    await firestore.collection('password_reset_tokens').doc(token).set({
      userId: userDoc.id,
      companyId: userData.companyId || DEFAULT_COMPANY_ID,
      email,
      createdAt: now,
      expiresAt: now + RESET_TOKEN_TTL_MS,
      used: false
    });

    const resetLink = `${APP_BASE_URL}/resetar-senha?token=${token}`;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_SENDER_EMAIL, pass: GMAIL_APP_PASSWORD.value() }
    });
    await transporter.sendMail({
      from: `Normatiza <${GMAIL_SENDER_EMAIL}>`,
      to: email,
      subject: 'Redefinição de senha — Normatiza',
      text: `Olá, ${userData.name || ''}!\n\nRecebemos um pedido para redefinir a senha da sua conta (login: ${userData.username}) no Normatiza.\n\nClique no link abaixo para escolher uma nova senha (válido por 30 minutos):\n${resetLink}\n\nSe você não pediu isso, ignore este e-mail — sua senha continua a mesma.`,
      html: `<p>Olá, ${userData.name || ''}!</p><p>Recebemos um pedido para redefinir a senha da sua conta (login: <strong>${userData.username}</strong>) no Normatiza.</p><p><a href="${resetLink}">Clique aqui para escolher uma nova senha</a> (válido por 30 minutos).</p><p>Se você não pediu isso, ignore este e-mail — sua senha continua a mesma.</p>`
    });

    logger.info(`Pedido de reset de senha enviado: userId=${userDoc.id}, username=${userData.username}`);
    return { success: true, message: `Enviamos um link de redefinição para ${email.replace(/^(.{2}).*(@.*)$/, '$1***$2')}.` };
  } catch (err) {
    logger.error('❌ ERRO NA FUNÇÃO REQUESTPASSWORDRESET:', err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Erro ao pedir redefinição de senha [${err.code || 'ERRO'}]: ${err.message || 'Erro inesperado'}`);
  }
});

exports.confirmPasswordReset = onCall({ region: REGION }, async (request) => {
  try {
    const token = String(request.data?.token || '').trim();
    const newPassword = String(request.data?.newPassword || '');
    if (!token || !newPassword) {
      throw new HttpsError('invalid-argument', 'Dados incompletos.');
    }
    if (newPassword.length < 4) {
      throw new HttpsError('invalid-argument', 'A senha precisa ter pelo menos 4 caracteres.');
    }

    const firestore = db();
    const tokenRef = firestore.collection('password_reset_tokens').doc(token);
    const tokenSnap = await tokenRef.get();
    if (!tokenSnap.exists) {
      throw new HttpsError('not-found', 'Link inválido ou já utilizado. Peça um novo link de redefinição.');
    }
    const tokenData = tokenSnap.data();
    if (tokenData.used) {
      throw new HttpsError('failed-precondition', 'Este link já foi usado. Peça um novo link de redefinição.');
    }
    if (Date.now() > tokenData.expiresAt) {
      throw new HttpsError('deadline-exceeded', 'Este link expirou (validade de 30 minutos). Peça um novo link de redefinição.');
    }

    const userRef = firestore.collection('users').doc(tokenData.userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Conta não encontrada.');
    }

    const passwordHash = sha256Hex(newPassword);
    const nowFormatted = new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    await userRef.update({
      passwordHash,
      password: FieldValue.delete(),
      firstAccess: false,
      primeiro_acesso: false,
      lastPasswordChange: nowFormatted,
      updatedAt: FieldValue.serverTimestamp()
    });
    // Token de uso único — marcado como usado (não apagado, fica como
    // registro/auditoria de quando cada redefinição aconteceu).
    await tokenRef.update({ used: true, usedAt: Date.now() });

    logger.info(`Senha redefinida via self-service: userId=${tokenData.userId}`);
    return { success: true, username: userSnap.data()?.username };
  } catch (err) {
    logger.error('❌ ERRO NA FUNÇÃO CONFIRMPASSWORDRESET:', err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Erro ao redefinir senha [${err.code || 'ERRO'}]: ${err.message || 'Erro inesperado'}`);
  }
});
