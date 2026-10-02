// Script de migração — roda UMA VEZ, manualmente (Cloud Shell), Fase 6.
//
// O que faz: carimba companyId no acervo real da ACII, que foi criado
// ANTES da arquitetura multiempresa existir (nenhum documento tinha
// companyId). Sem isto, as Firestore Rules (que agora exigem
// resource.data.companyId == currentCompanyId() em tudo) bloqueiam
// qualquer leitura/escrita nesses dados antigos — a ACII ficaria sem
// acesso ao próprio acervo até isto rodar.
//
// SEGURANÇA:
//   - Por padrão roda em modo SOMENTE LEITURA (dry-run): mostra o que
//     SERIA alterado, sem gravar nada. Para gravar de verdade, passe
//     --apply.
//   - Idempotente: rodar de novo depois de já ter aplicado não duplica
//     nem sobrescreve nada — só toca documentos que ainda não têm
//     companyId (ou login_index que ainda não existe).
//   - NÃO apaga nenhum documento. O único "antigo" que deixa de ser
//     usado é permissions/default, que é COPIADO (não movido) para
//     permissions/{companyId} — o documento antigo continua existindo,
//     só não é mais lido por ninguém depois da migração.
//
// ANTES DE RODAR CONTRA PRODUÇÃO (obrigatório, nesta ordem):
//   1. Exportar um backup do Firestore:
//        gcloud firestore export gs://<seu-bucket>/backups/pre-fase6-$(date +%Y%m%d) \
//          --project=dogwood-loader-bln7n \
//          --database=ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900
//   2. Rodar SEM --apply e revisar o relatório com calma — principalmente
//      a lista de ATR/POP/IT com setor sem correspondência exata.
//   3. Só então rodar de novo com --apply.
//
// Uso:
//   cd functions
//   npm install   (se ainda não tiver rodado nesta sessão do Cloud Shell)
//   node migrate-acii-to-multitenant.js                        (dry-run)
//   node migrate-acii-to-multitenant.js --apply                (grava de verdade)
//   node migrate-acii-to-multitenant.js --apply --sector-aliases=aliases.json
//
// aliases.json (opcional): mapa { "texto exato do campo sector no
// documento": "SEC-XXX" } pra resolver o sectorId nos ATR/POP/IT cujo
// texto de setor não bate exatamente (sem diferenciar maiúsculas) com
// nenhum nome cadastrado em `sectors` — ex: um documento com
// sector="Tecnologia da Informação" quando o setor cadastrado se chama
// só "TI". Sem o alias, esses documentos continuam funcionando
// normalmente (sectorId é opcional em ATR/POP/IT) — só ficam de fora
// da restrição de "gestor só mexe no próprio setor" (Fase 3) até
// alguém corrigir o setor pela tela ou via alias.

const fs = require('fs');
const crypto = require('crypto');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Precisa bater com firestoreDatabaseId em firebase-applet-config.json
// (mesmo cuidado documentado em storage.rules e firestore.rules).
const FIRESTORE_DATABASE_ID = 'ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900';
const PROJECT_ID = 'dogwood-loader-bln7n';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const companyIdArg = args.find(a => a.startsWith('--company-id='));
const companyNameArg = args.find(a => a.startsWith('--company-name='));
const aliasesArg = args.find(a => a.startsWith('--sector-aliases='));

const COMPANY_ID = companyIdArg ? companyIdArg.split('=')[1] : 'acii';
const COMPANY_NAME = companyNameArg ? companyNameArg.split('=')[1] : 'ACII';
const sectorAliases = aliasesArg ? JSON.parse(fs.readFileSync(aliasesArg.split('=')[1], 'utf8')) : {};

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(FIRESTORE_DATABASE_ID);

// Mesmo algoritmo de hash usado no cliente (src/lib/userManagement.ts,
// hashPassword) — precisa ser exatamente igual, senão o login por
// CPF/senha nunca bate com o hash gravado aqui.
function hashPassword(password) {
  return crypto.createHash('sha256').update(password, 'utf8').digest('hex');
}

function loginIndexKey(companyId, username) {
  return `${companyId}__${username.trim().toLowerCase()}`;
}

async function commitInBatches(writes, applyFn) {
  const batchSize = 400; // limite do Firestore é 500 por batch
  for (let i = 0; i < writes.length; i += batchSize) {
    const batch = db.batch();
    writes.slice(i, i + batchSize).forEach(w => applyFn(batch, w));
    await batch.commit();
  }
}

async function migrateCollectionCompanyId(collectionName) {
  const snap = await db.collection(collectionName).get();
  const missing = snap.docs.filter(d => !d.data().companyId);
  console.log(`[${collectionName}] ${snap.size} documento(s) no total, ${missing.length} sem companyId.`);
  if (APPLY && missing.length > 0) {
    await commitInBatches(missing, (batch, d) => batch.update(d.ref, { companyId: COMPANY_ID }));
    console.log(`[${collectionName}] companyId="${COMPANY_ID}" gravado em ${missing.length} documento(s).`);
  }
  return { total: snap.size, missing: missing.length, docs: snap.docs };
}

async function main() {
  console.log(`Modo: ${APPLY ? 'APLICANDO ALTERAÇÕES' : 'SOMENTE LEITURA (dry-run)'}`);
  console.log(`Empresa de destino: ${COMPANY_ID} ("${COMPANY_NAME}")\n`);

  // 1. companies/{COMPANY_ID}
  const companyRef = db.collection('companies').doc(COMPANY_ID);
  const companySnap = await companyRef.get();
  if (!companySnap.exists) {
    console.log(`[companies] "${COMPANY_ID}" ainda não existe.`);
    if (APPLY) {
      await companyRef.set({ id: COMPANY_ID, name: COMPANY_NAME, status: 'ativo', createdAt: new Date().toISOString() });
      console.log(`[companies] "${COMPANY_ID}" criado.`);
    }
  } else {
    console.log(`[companies] "${COMPANY_ID}" já existe — não será alterado.`);
  }

  // 2. Setores primeiro — atrs/pops/its dependem do mapa nome -> id
  const sectorsResult = await migrateCollectionCompanyId('sectors');
  const sectorNameToId = {};
  sectorsResult.docs.forEach(d => {
    const data = d.data();
    if (data.name) sectorNameToId[data.name.trim().toLowerCase()] = data.id || d.id;
  });

  // 3. ATR / POP / IT — companyId + sectorId (quando possível)
  for (const col of ['atrs', 'pops', 'its']) {
    const snap = await db.collection(col).get();
    let companyIdMissing = 0;
    let sectorIdResolved = 0;
    const sectorIdUnresolved = [];
    const writes = [];

    snap.docs.forEach(d => {
      const data = d.data();
      const update = {};
      if (!data.companyId) { update.companyId = COMPANY_ID; companyIdMissing++; }
      if (!data.sectorId) {
        const key = (data.sector || '').trim().toLowerCase();
        const resolved = sectorNameToId[key] || sectorAliases[data.sector] || null;
        if (resolved) {
          update.sectorId = resolved;
          sectorIdResolved++;
        } else {
          sectorIdUnresolved.push({ id: d.id, sector: data.sector });
        }
      }
      if (Object.keys(update).length > 0) writes.push({ ref: d.ref, update });
    });

    console.log(`[${col}] ${snap.size} documento(s): ${companyIdMissing} sem companyId, ${sectorIdResolved} com sectorId resolvido, ${sectorIdUnresolved.length} com setor não reconhecido.`);
    if (sectorIdUnresolved.length > 0) {
      console.log(`  Setor não reconhecido (sectorId fica vazio até corrigir manualmente ou via --sector-aliases):`);
      sectorIdUnresolved.forEach(u => console.log(`    - ${u.id}: sector="${u.sector}"`));
    }
    if (APPLY && writes.length > 0) {
      await commitInBatches(writes, (batch, w) => batch.update(w.ref, w.update));
      console.log(`[${col}] ${writes.length} documento(s) atualizado(s).`);
    }
  }

  // 4. employees — companyId só (Fase 3 manteve este módulo sem
  // restrição por setor, decisão registrada no resumo da Fase 3)
  await migrateCollectionCompanyId('employees');

  // 5. users + login_index + passwordHash de contas antigas só com texto puro
  const usersSnap = await db.collection('users').get();
  let usersMissingCompanyId = 0;
  let loginIndexCreated = 0;
  let loginIndexExisting = 0;
  let passwordHashBackfilled = 0;

  for (const d of usersSnap.docs) {
    const data = d.data();
    const userUpdate = {};
    if (!data.companyId) { userUpdate.companyId = COMPANY_ID; usersMissingCompanyId++; }

    let passwordHash = data.passwordHash;
    if (!passwordHash && data.password) {
      passwordHash = hashPassword(data.password);
      userUpdate.passwordHash = passwordHash;
      passwordHashBackfilled++;
    }

    if (Object.keys(userUpdate).length > 0 && APPLY) {
      await d.ref.update(userUpdate);
    }

    if (data.username) {
      const key = loginIndexKey(COMPANY_ID, data.username);
      const indexRef = db.collection('login_index').doc(key);
      const indexSnap = await indexRef.get();
      if (!indexSnap.exists) {
        loginIndexCreated++;
        if (APPLY) {
          await indexRef.set({
            companyId: COMPANY_ID,
            userId: d.id,
            username: data.username.trim().toLowerCase(),
            passwordHash: passwordHash || '',
            status: (data.accountStatus || data.status || 'ativo').toLowerCase()
          });
        }
      } else {
        loginIndexExisting++;
      }
    }
  }
  console.log(`[users] ${usersSnap.size} documento(s): ${usersMissingCompanyId} sem companyId, ${passwordHashBackfilled} com passwordHash preenchido a partir da senha em texto puro (o campo de texto puro é mantido por enquanto — ver nota de segurança no plano da Fase 6).`);
  console.log(`[login_index] ${loginIndexCreated} entrada(s) a criar, ${loginIndexExisting} já existente(s).`);

  // 6. guarded_documents — só companyId (sectorId já é obrigatório desde
  // sempre nesse módulo, não depende desta migração)
  await migrateCollectionCompanyId('guarded_documents');

  // 7. permissions/default -> permissions/{COMPANY_ID} (copia, não apaga o antigo)
  const permsOldRef = db.collection('permissions').doc('default');
  const permsNewRef = db.collection('permissions').doc(COMPANY_ID);
  const [permsOldSnap, permsNewSnap] = await Promise.all([permsOldRef.get(), permsNewRef.get()]);
  if (permsNewSnap.exists) {
    console.log(`[permissions] "${COMPANY_ID}" já existe — não será sobrescrito.`);
  } else if (permsOldSnap.exists) {
    console.log(`[permissions] copiando permissions/default -> permissions/${COMPANY_ID}.`);
    if (APPLY) await permsNewRef.set(permsOldSnap.data());
  } else {
    console.log(`[permissions] nem "default" nem "${COMPANY_ID}" existem — o app usa o padrão embutido no código até alguém salvar pela tela de Admin.`);
  }

  // 8. document_type_settings/{COMPANY_ID} — cria com o padrão (tudo
  // habilitado, rótulos genéricos), só se ainda não existir
  const dtsRef = db.collection('document_type_settings').doc(COMPANY_ID);
  const dtsSnap = await dtsRef.get();
  if (dtsSnap.exists) {
    console.log(`[document_type_settings] "${COMPANY_ID}" já existe — não será sobrescrito.`);
  } else {
    console.log(`[document_type_settings] "${COMPANY_ID}" ainda não existe.`);
    if (APPLY) {
      await dtsRef.set({
        atr: { enabled: true, label: 'ATR' },
        pop: { enabled: true, label: 'POP' },
        it: { enabled: true, label: 'Instrução de Trabalho' },
        digitalizado: { enabled: true, label: 'Guarda de Documentos' }
      });
      console.log(`[document_type_settings] "${COMPANY_ID}" criado com os padrões.`);
    }
  }

  console.log(`\n${APPLY ? 'Migração aplicada.' : 'Dry-run concluído — nada foi gravado. Revise o relatório acima e rode de novo com --apply quando estiver tudo certo.'}`);
}

main().catch(err => {
  console.error('Erro na migração:', err);
  process.exit(1);
});
