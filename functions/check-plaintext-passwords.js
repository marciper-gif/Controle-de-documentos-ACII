// Checagem de segurança — SOMENTE LEITURA, não grava nada.
//
// Verifica se alguma conta em `users` ainda tem o campo `password` (senha
// em texto puro, campo legado marcado como @deprecated em src/types.ts)
// gravado, independente de já ter `passwordHash` ou não. Usado para
// confirmar se o script de limpeza (remover o texto puro depois que todo
// mundo já estiver logando pelo hash) é realmente necessário antes de
// escrevê-lo.
//
// Uso:
//   cd functions
//   node check-plaintext-passwords.js

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const FIRESTORE_DATABASE_ID = 'ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900';
const PROJECT_ID = 'dogwood-loader-bln7n';

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(FIRESTORE_DATABASE_ID);

async function main() {
  const snap = await db.collection('users').get();
  const comPlaintext = [];

  snap.forEach(d => {
    const data = d.data();
    if (data.password) {
      comPlaintext.push({ id: d.id, username: data.username, temHash: !!data.passwordHash });
    }
  });

  console.log(`Total de usuários: ${snap.size}`);
  console.log(`Contas com campo "password" (texto puro) ainda presente: ${comPlaintext.length}`);
  if (comPlaintext.length > 0) {
    comPlaintext.forEach(u => console.log(`  - ${u.id} (${u.username}) — já tem passwordHash? ${u.temHash ? 'sim' : 'NÃO'}`));
  } else {
    console.log('Nenhuma conta com senha em texto puro. O script de limpeza não é necessário.');
  }
}

main().catch(err => { console.error('Erro na checagem:', err); process.exit(1); });
