// Script de manutenção — roda MANUALMENTE, quando precisar redefinir a
// senha da conta admin direto no banco (ex: a tela de gestão de usuários
// não está conseguindo salvar, ou é a primeira definição de uma senha
// real para a conta). Usa o Admin SDK, então ignora completamente as
// Firestore Rules — só funciona rodando com uma conta autenticada com
// permissão no projeto (ex: dentro do Cloud Shell, já logado com
// `firebase login`).
//
// Como rodar (Cloud Shell):
//   cd ~/Controle-de-documentos-ACII/functions
//   node set-admin-password.js "SuaNovaSenhaAqui"
//
// A senha NUNCA fica salva neste arquivo nem em nenhum commit — ela só
// existe no comando que você digita na hora, e no hash (irreversível)
// que o script grava no Firestore.

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

// Precisam bater com os mesmos valores usados em functions/index.js e
// nos outros scripts de manutenção (mesmo cuidado documentado em
// storage.rules e firestore.rules).
const PROJECT_ID = 'dogwood-loader-bln7n';
const FIRESTORE_DATABASE_ID = 'ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900';

function sha256Hex(input) {
  return crypto.createHash('sha256').update(String(input), 'utf8').digest('hex');
}

async function main() {
  const novaSenha = process.argv[2];

  if (!novaSenha || novaSenha.trim().length < 4) {
    console.error('Uso: node set-admin-password.js "SuaNovaSenhaAqui" (mínimo 4 caracteres)');
    process.exit(1);
  }

  initializeApp({ projectId: PROJECT_ID });
  const db = getFirestore(FIRESTORE_DATABASE_ID);

  // Localiza a conta admin: tenta pelo username "admin" primeiro, depois
  // por role == 'admin' (caso o username seja outro), depois pelo próprio
  // ID de documento "1" (padrão histórico de seed deste projeto).
  const usersRef = db.collection('users');

  let snap = await usersRef.where('username', '==', 'admin').limit(1).get();
  if (snap.empty) {
    snap = await usersRef.where('role', '==', 'admin').limit(1).get();
  }

  let targetDoc = null;
  if (!snap.empty) {
    targetDoc = snap.docs[0];
  } else {
    const directDoc = await usersRef.doc('1').get();
    if (directDoc.exists) targetDoc = directDoc;
  }

  if (!targetDoc) {
    console.error('❌ Não encontrei nenhuma conta com username "admin", role "admin", nem documento "1" na coleção users.');
    process.exit(1);
  }

  const passwordHash = sha256Hex(novaSenha);

  await targetDoc.ref.update({
    passwordHash,
    password: FieldValue.delete(), // garante que não sobra nenhum texto puro
    role: 'admin',
    accountStatus: 'ativo',
    status: 'Ativo',
    firstAccess: false,
    primeiro_acesso: false,
    updatedAt: FieldValue.serverTimestamp()
  });

  console.log(`✅ Senha atualizada com sucesso para a conta "${targetDoc.data().username || targetDoc.id}" (documento: ${targetDoc.id}).`);
  console.log('   Teste o login agora com a senha que você acabou de definir.');
}

main().catch(err => {
  console.error('Erro ao definir a senha do admin:', err);
  process.exit(1);
});
