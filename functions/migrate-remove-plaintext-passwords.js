// Script de manutenção — roda UMA VEZ, manualmente (Cloud Shell), DEPOIS
// de já ter feito o deploy das novas Cloud Functions (login, linkGoogleUser,
// setPassword) e das novas firestore.rules/storage.rules:
//   cd functions
//   npm install   (se ainda não tiver rodado nesta sessão do Cloud Shell)
//   node migrate-remove-plaintext-passwords.js
//
// O QUE ISTO FAZ E POR QUÊ:
// Até este ponto, a coleção `users` guardava a senha de cada conta em
// DOIS lugares: `passwordHash` (SHA-256) e `password` (texto puro, sem
// nenhuma proteção). A leitura dessa coleção também era liberada pra
// qualquer sessão autenticada — inclusive a sessão anônima que o app
// cria automaticamente pra QUALQUER visitante, antes de logar. Ou seja,
// qualquer pessoa que abrisse o site conseguia, tecnicamente, ler CPF e
// senha de todo mundo. As novas firestore.rules já fecham a leitura
// (só admin/gestor ou o próprio dono), mas os documentos que já existem
// no banco continuam com `password` em texto puro guardado neles até
// alguém rodar esta limpeza.
//
// Para cada documento em `users`:
//   1. Se `passwordHash` estiver faltando mas `password` existir, calcula
//      o hash (mesmo algoritmo do cliente/Cloud Function: SHA-256 hex) e
//      grava `passwordHash` antes de apagar o texto puro — evita que
//      alguém fique sem conseguir logar depois da limpeza.
//   2. Remove o campo `password` do documento.
//
// Idempotente: pode rodar mais de uma vez sem problema (documentos já
// limpos são só ignorados).

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const crypto = require('crypto');

// Precisa bater com firestoreDatabaseId em firebase-applet-config.json
// (mesmo cuidado documentado em storage.rules e firestore.rules).
const FIRESTORE_DATABASE_ID = 'ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900';
const PROJECT_ID = 'dogwood-loader-bln7n';

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(FIRESTORE_DATABASE_ID);

function sha256Hex(input) {
  return crypto.createHash('sha256').update(String(input), 'utf8').digest('hex');
}

async function main() {
  const snapshot = await db.collection('users').get();
  console.log(`Encontrados ${snapshot.size} usuário(s) na coleção.`);

  let hashesGerados = 0;
  let senhasRemovidas = 0;
  let semNenhumaSenha = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const hasPlainPassword = typeof data.password === 'string' && data.password.length > 0;
    const hasHash = typeof data.passwordHash === 'string' && data.passwordHash.length > 0;

    if (!hasPlainPassword && hasHash) continue; // já está limpo

    const update = {};

    if (!hasHash) {
      if (hasPlainPassword) {
        update.passwordHash = sha256Hex(data.password);
        hashesGerados++;
      } else {
        // Conta sem NENHUMA senha registrada (não deveria acontecer,
        // mas registra pra investigação manual em vez de travar o script).
        console.warn(`  ⚠️  ${docSnap.id} (usuário "${data.username || '?'}") não tem password nem passwordHash — pulando.`);
        semNenhumaSenha++;
        continue;
      }
    }

    if (hasPlainPassword) {
      // FieldValue.delete() precisa vir de firebase-admin/firestore.
      const { FieldValue } = require('firebase-admin/firestore');
      update.password = FieldValue.delete();
      senhasRemovidas++;
    }

    await docSnap.ref.update(update);
    console.log(`  atualizado: ${docSnap.id} (usuário "${data.username || '?'}")`);
  }

  console.log('');
  console.log('Concluído.');
  console.log(`  Hashes gerados a partir da senha em texto puro: ${hashesGerados}`);
  console.log(`  Campos "password" em texto puro removidos: ${senhasRemovidas}`);
  if (semNenhumaSenha > 0) {
    console.log(`  ⚠️  Contas sem nenhuma senha (precisam de reset manual): ${semNenhumaSenha}`);
  }
}

main().catch(err => {
  console.error('Erro na migração:', err);
  process.exit(1);
});
