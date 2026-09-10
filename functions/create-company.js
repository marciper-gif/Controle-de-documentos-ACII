// Script administrativo — roda UMA VEZ por empresa nova, manualmente
// (Cloud Shell, mesmo padrão de backfill-title-lower.js):
//
//   cd functions
//   npm install   (se ainda não tiver rodado nesta sessão do Cloud Shell)
//   node create-company.js <companyId> "<Nome da Empresa>" "<Nome do Admin>" <usuario-admin>
//
// Exemplo:
//   node create-company.js beta "Beta Comércio Ltda" "Maria Silva" maria.silva
//
// Por que isto é um script com o Admin SDK, e não uma tela dentro do
// app: firestore.rules fecha a coleção `companies` pra qualquer escrita
// vinda do cliente (allow write: if false) DE PROPÓSITO — criar uma
// empresa nova é um evento raro e sensível (é o próprio limite de quem
// paga pelo produto), então por enquanto só quem tem acesso direto ao
// projeto Firebase consegue fazer isso. A Fase 3 decide se isso vira
// uma tela de onboarding dentro do produto — este script continua
// valendo como base de referência se isso acontecer.
//
// O que o script faz:
//   1. Cria companies/{companyId}.
//   2. Cria o primeiro usuário admin dessa empresa, com uma senha
//      aleatória (mostrada só uma vez, no terminal — nunca gravada em
//      texto puro no Firestore, só o hash).
//   3. Espelha esse usuário em login_index (necessário pro login
//      funcionar — ver o comentário em firestore.rules, match
//      /login_index).
//
// NÃO cria setores, tipos de documento nem nenhum conteúdo — isso é
// decisão da Fase 2 (cada empresa configura o próprio catálogo).

const crypto = require('crypto');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Precisa bater com firestoreDatabaseId em firebase-applet-config.json
// (mesmo cuidado documentado em storage.rules e firestore.rules).
const FIRESTORE_DATABASE_ID = 'ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900';
const PROJECT_ID = 'dogwood-loader-bln7n';

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(FIRESTORE_DATABASE_ID);

// Mesmo algoritmo de hash usado no cliente (src/lib/userManagement.ts,
// hashPassword) — SHA-256 do texto da senha. Precisa ser exatamente
// igual, senão o login por CPF/senha nunca vai bater com este hash.
function hashPassword(password) {
  return crypto.createHash('sha256').update(password, 'utf8').digest('hex');
}

function loginIndexKey(companyId, username) {
  return `${companyId}__${username.trim().toLowerCase()}`;
}

async function main() {
  const [companyId, companyName, adminName, adminUsername] = process.argv.slice(2);
  if (!companyId || !companyName || !adminName || !adminUsername) {
    console.error('Uso: node create-company.js <companyId> "<Nome da Empresa>" "<Nome do Admin>" <usuario-admin>');
    process.exit(1);
  }

  const companyRef = db.collection('companies').doc(companyId);
  if ((await companyRef.get()).exists) {
    console.error(`Já existe uma empresa com o id "${companyId}". Escolha outro id.`);
    process.exit(1);
  }

  await companyRef.set({
    id: companyId,
    name: companyName,
    status: 'ativo',
    createdAt: new Date().toISOString()
  });

  const adminPassword = crypto.randomBytes(8).toString('base64url'); // senha aleatória, só exibida abaixo
  const passwordHash = hashPassword(adminPassword);
  const adminId = `admin-${companyId}`;

  await db.collection('users').doc(adminId).set({
    id: adminId,
    companyId,
    username: adminUsername,
    name: adminName,
    passwordHash,
    role: 'admin',
    status: 'Ativo',
    accountStatus: 'ativo',
    firstAccess: true,
    primeiro_acesso: true
  });

  await db.collection('login_index').doc(loginIndexKey(companyId, adminUsername)).set({
    companyId,
    userId: adminId,
    username: adminUsername.trim().toLowerCase(),
    passwordHash,
    status: 'ativo'
  });

  console.log('✅ Empresa criada com sucesso.');
  console.log(`   Empresa: ${companyName} (id: ${companyId})`);
  console.log(`   Login admin: ${adminUsername}`);
  console.log(`   Senha inicial (repasse com segurança, troca obrigatória no 1º acesso): ${adminPassword}`);
}

main().catch(err => {
  console.error('Erro ao criar empresa:', err);
  process.exit(1);
});
