// Checagem de segurança — SOMENTE LEITURA, não grava nada.
//
// Lista as empresas (companies) cadastradas hoje no Firestore, pra
// confirmar se sobrou alguma empresa de teste além da ACII.
//
// Uso:
//   cd functions
//   node check-companies.js

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const FIRESTORE_DATABASE_ID = 'ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900';
const PROJECT_ID = 'dogwood-loader-bln7n';

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(FIRESTORE_DATABASE_ID);

async function main() {
  const snap = await db.collection('companies').get();
  console.log(`Total de empresas cadastradas: ${snap.size}`);
  for (const d of snap.docs) {
    const data = d.data();
    const usersSnap = await db.collection('users').where('companyId', '==', d.id).get();
    console.log(`  - ${d.id} | nome: "${data.name}" | status: ${data.status} | usuários: ${usersSnap.size}`);
  }
}

main().catch(err => { console.error('Erro na checagem:', err); process.exit(1); });
