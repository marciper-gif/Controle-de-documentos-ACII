// Script de limpeza — roda UMA VEZ, manualmente (Cloud Shell).
//
// Apaga COMPLETAMENTE uma empresa (tenant) de teste: o documento em
// `companies`, todos os documentos com esse companyId em cada coleção de
// negócio, as entradas de login_index correspondentes, e os arquivos no
// Storage sob os caminhos dessa empresa (documentos/{companyId}/... e
// company_logos/{companyId}/...).
//
// SEGURANÇA:
//   - Dry-run por padrão: só LISTA o que seria apagado, não apaga nada.
//   - Para apagar de verdade: passe --apply.
//   - Nunca mexe em nenhum dado de OUTRA empresa (tudo filtrado por
//     companyId == o que foi passado).
//
// Uso:
//   cd functions
//   node delete-company.js <companyId>              (dry-run)
//   node delete-company.js <companyId> --apply       (apaga de verdade)

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

const FIRESTORE_DATABASE_ID = 'ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900';
const PROJECT_ID = 'dogwood-loader-bln7n';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const companyId = args.find(a => !a.startsWith('--'));

if (!companyId) {
  console.error('Uso: node delete-company.js <companyId> [--apply]');
  process.exit(1);
}
if (companyId === 'acii') {
  console.error('Recusado: este script nunca apaga a empresa "acii" (proteção contra erro de digitação).');
  process.exit(1);
}

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(FIRESTORE_DATABASE_ID);
const bucket = getStorage().bucket();

const BUSINESS_COLLECTIONS = ['sectors', 'employees', 'atrs', 'pops', 'its', 'users', 'guarded_documents'];

async function main() {
  console.log(`Modo: ${APPLY ? 'APAGANDO DE VERDADE' : 'SOMENTE LEITURA (dry-run)'}`);
  console.log(`Empresa alvo: ${companyId}\n`);

  const companyRef = db.collection('companies').doc(companyId);
  const companySnap = await companyRef.get();
  if (!companySnap.exists) {
    console.log(`[companies] "${companyId}" não existe — nada a fazer.`);
    return;
  }
  console.log(`[companies] encontrado: "${companySnap.data().name}" (status: ${companySnap.data().status})`);

  let totalDocs = 0;
  for (const col of BUSINESS_COLLECTIONS) {
    const snap = await db.collection(col).where('companyId', '==', companyId).get();
    console.log(`[${col}] ${snap.size} documento(s) a apagar.`);
    totalDocs += snap.size;
    if (APPLY && snap.size > 0) {
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      console.log(`[${col}] apagado(s).`);
    }
  }

  // login_index: chave é "{companyId}__{username}" — varre tudo e filtra
  // pelo prefixo, já que não dá pra usar where() numa chave composta assim.
  const loginIndexSnap = await db.collection('login_index').get();
  const loginIndexMatches = loginIndexSnap.docs.filter(d => d.id.startsWith(`${companyId}__`));
  console.log(`[login_index] ${loginIndexMatches.length} entrada(s) a apagar.`);
  if (APPLY && loginIndexMatches.length > 0) {
    const batch = db.batch();
    loginIndexMatches.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log('[login_index] apagado(s).');
  }

  // Documentos de configuração únicos por empresa
  for (const col of ['permissions', 'document_type_settings']) {
    const ref = db.collection(col).doc(companyId);
    const snap = await ref.get();
    console.log(`[${col}] ${snap.exists ? '1 documento a apagar' : 'nada a apagar'}.`);
    if (APPLY && snap.exists) {
      await ref.delete();
      console.log(`[${col}] apagado.`);
    }
  }

  // Arquivos no Storage: documentos/{companyId}/... e company_logos/{companyId}/...
  for (const prefix of [`documentos/${companyId}/`, `company_logos/${companyId}/`]) {
    const [files] = await bucket.getFiles({ prefix });
    console.log(`[storage: ${prefix}] ${files.length} arquivo(s) a apagar.`);
    if (APPLY && files.length > 0) {
      await Promise.all(files.map(f => f.delete()));
      console.log(`[storage: ${prefix}] apagado(s).`);
    }
  }

  // Por último, o próprio documento da empresa
  console.log('[companies] 1 documento a apagar.');
  if (APPLY) {
    await companyRef.delete();
    console.log('[companies] apagado.');
  }

  console.log(`\n${APPLY ? `Empresa "${companyId}" totalmente removida.` : 'Dry-run concluído — nada foi apagado. Revise a lista acima e rode de novo com --apply.'}`);
}

main().catch(err => { console.error('Erro ao apagar empresa:', err); process.exit(1); });
