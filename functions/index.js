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
const { logger } = require('firebase-functions');
const crypto = require('crypto');

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
        await getAuth().setCustomUserClaims(uid, { role: null, sectorId: null, companyId: null });
        logger.info(`Claims limpos para uid=${uid} (auth_links removido).`);
        return;
      }

      const role = after.role ?? null;
      const sectorId = after.sectorId ?? null;
      // companyId (Fase 1): espelhado pro token igual role/sectorId, pelo
      // mesmo motivo (storage.rules não consegue consultar o Firestore
      // direto — ver comentário grande no topo deste arquivo).
      const companyId = after.companyId ?? DEFAULT_COMPANY_ID;
      await getAuth().setCustomUserClaims(uid, { role, sectorId, companyId });
      logger.info(`Claims sincronizados para uid=${uid}: role=${role}, sectorId=${sectorId}, companyId=${companyId}`);
    } catch (err) {
      // Não há como "falhar" de volta pro cliente aqui (é um trigger
      // assíncrono) — o retry do cliente (waitForClaimsSync) vai apenas
      // dar timeout e seguir com os claims antigos/ausentes, o que é o
      // pior caso seguro (acesso negado, não indevido).
      logger.error(`Falha ao sincronizar claims para uid=${uid}:`, err);
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
