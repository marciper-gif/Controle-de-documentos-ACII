// Script de manutenção — roda UMA VEZ, manualmente (Cloud Shell):
//   cd functions
//   npm install   (se ainda não tiver rodado nesta sessão do Cloud Shell)
//   node backfill-title-lower.js
//
// Preenche o campo titleLower em documentos de guarded_documents que
// foram criados ANTES desse campo existir (qualquer upload feito antes
// do commit que adicionou a busca por prefixo de título). Sem isso,
// esses documentos nunca aparecem em nenhuma busca — o Firestore não
// inclui documentos com o campo ausente em consultas de intervalo
// (titleLower >= X / titleLower < X).
//
// Seguro de rodar mais de uma vez (idempotente): só grava de novo nos
// documentos cujo titleLower estiver ausente ou desatualizado.

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Precisa bater com firestoreDatabaseId em firebase-applet-config.json
// (mesmo cuidado documentado em storage.rules e firestore.rules).
const FIRESTORE_DATABASE_ID = 'ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900';
const PROJECT_ID = 'dogwood-loader-bln7n';

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(FIRESTORE_DATABASE_ID);

// Mesma normalização usada no cliente (src/lib/guardedDocumentsQuery.ts,
// normalizeForSearch) — minúsculas + remove os acentos combináveis mais
// comuns do português, pra bater exatamente com o que a busca compara.
function normalizeForSearch(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

async function main() {
  const snapshot = await db.collection('guarded_documents').get();
  console.log(`Encontrados ${snapshot.size} documento(s) na coleção.`);

  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.title) continue;
    const expected = normalizeForSearch(data.title);
    if (data.titleLower === expected) continue; // já está certo, pula
    await doc.ref.update({ titleLower: expected });
    updated++;
    console.log(`  atualizado: ${doc.id} -> "${data.title}"`);
  }

  console.log(`Concluído. ${updated} documento(s) atualizado(s) de ${snapshot.size} no total.`);
}

main().catch(err => {
  console.error('Erro no backfill:', err);
  process.exit(1);
});
