// Script de migração — Fase 1 da transformação em SaaS multiempresa.
// Roda UMA VEZ, manualmente (Cloud Shell ou terminal com credenciais do
// projeto Firebase):
//   cd functions
//   npm install   (se ainda não tiver rodado nesta sessão)
//   node migrate-add-company-id.js
//
// ─────────────────────────────────────────────────────────────────────
// O QUE ESTE SCRIPT FAZ (e por quê é seguro rodar em produção)
// ─────────────────────────────────────────────────────────────────────
// Carimba companyId="acii" em TODO documento existente das coleções
// abaixo que ainda não tiver esse campo, e cria o registro da própria
// empresa em companies/acii. É uma migração 100% ADITIVA:
//   - NUNCA apaga um documento.
//   - NUNCA sobrescreve um campo que já existe (só ADICIONA companyId
//     onde falta — se companyId já estiver preenchido, o documento é
//     pulado).
//   - Seguro rodar mais de uma vez (idempotente): rodar de novo depois
//     que tudo já foi migrado não muda nada.
//
// PRÉ-REQUISITO PARA IR PRA PRODUÇÃO: este script precisa rodar ANTES de
// publicar o novo firestore.rules/storage.rules desta fase. As novas
// regras passam a EXIGIR companyId em todo documento — se elas forem
// publicadas antes da migração, o app da ACII perde acesso aos próprios
// dados (nenhum documento antigo tem companyId ainda). A ordem correta:
//   1. Rodar este script (dados ganham companyId="acii", app continua
//      funcionando normalmente com as regras ANTIGAS).
//   2. Conferir no Console do Firebase que os documentos têm companyId.
//   3. SÓ ENTÃO publicar firestore.rules e storage.rules novos.
// Ver o roteiro de teste de isolamento entre empresas no resumo da Fase 1
// para o passo seguinte, depois das regras publicadas.
//
// permissions/default -> permissions/acii: o antigo documento único de
// permissões vira o documento de permissões DA ACII (cada empresa tem o
// seu, a partir de agora). O antigo permissions/default é preservado
// (não apagado) por segurança/rollback.

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Precisa bater com firestoreDatabaseId em firebase-applet-config.json
// (mesmo cuidado documentado em storage.rules e firestore.rules).
const FIRESTORE_DATABASE_ID = 'ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900';
const PROJECT_ID = 'dogwood-loader-bln7n';

// Precisa ser IDÊNTICO a DEFAULT_COMPANY_ID em src/lib/tenant.ts e em
// functions/index.js.
const DEFAULT_COMPANY_ID = 'acii';
const DEFAULT_COMPANY_NAME = 'ACII - Associação Comercial e Industrial de Imperatriz';

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore(FIRESTORE_DATABASE_ID);

// Coleções tenant-scoped (toda coleção listada na Fase 0/Fase 1 que
// carrega dado de negócio da empresa — ver firestore.rules).
const COLLECTIONS_TO_STAMP = ['sectors', 'atrs', 'pops', 'its', 'employees', 'users', 'guarded_documents'];

async function stampCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  let updated = 0;
  let skipped = 0;

  // writeBatch tem limite de 500 operações — para coleções maiores
  // (ex.: guarded_documents pode chegar a dezenas/centenas de milhares,
  // ver o comentário sobre escala em src/lib/guardedDocumentsQuery.ts),
  // processa em lotes.
  const BATCH_SIZE = 400;
  let batch = db.batch();
  let opsInBatch = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.companyId) {
      skipped++;
      continue;
    }
    batch.update(doc.ref, { companyId: DEFAULT_COMPANY_ID, migratedAt: FieldValue.serverTimestamp() });
    opsInBatch++;
    updated++;
    if (opsInBatch >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      opsInBatch = 0;
    }
  }
  if (opsInBatch > 0) {
    await batch.commit();
  }

  console.log(`  ${collectionName}: ${updated} atualizado(s), ${skipped} já tinham companyId (${snapshot.size} no total).`);
  return { updated, skipped, total: snapshot.size };
}

async function ensureCompanyDoc() {
  const ref = db.collection('companies').doc(DEFAULT_COMPANY_ID);
  const snap = await ref.get();
  if (snap.exists) {
    console.log(`  companies/${DEFAULT_COMPANY_ID} já existe — não sobrescrito.`);
    return;
  }
  await ref.set({
    id: DEFAULT_COMPANY_ID,
    name: DEFAULT_COMPANY_NAME,
    status: 'ativo',
    createdAt: new Date().toISOString()
  });
  console.log(`  companies/${DEFAULT_COMPANY_ID} criado.`);
}

async function migratePermissions() {
  const oldRef = db.collection('permissions').doc('default');
  const newRef = db.collection('permissions').doc(DEFAULT_COMPANY_ID);
  const [oldSnap, newSnap] = await Promise.all([oldRef.get(), newRef.get()]);

  if (newSnap.exists) {
    console.log(`  permissions/${DEFAULT_COMPANY_ID} já existe — não sobrescrito.`);
    return;
  }
  if (!oldSnap.exists) {
    console.log('  permissions/default não existe — nada a copiar (o app usa os padrões embutidos no código).');
    return;
  }
  // Copia SEM apagar o original (permissions/default fica preservado).
  await newRef.set({ ...oldSnap.data(), companyId: DEFAULT_COMPANY_ID });
  console.log(`  permissions/default copiado para permissions/${DEFAULT_COMPANY_ID} (original preservado).`);
}

async function main() {
  console.log(`Migração multiempresa — carimbando companyId="${DEFAULT_COMPANY_ID}" em dados existentes.\n`);

  console.log('1. Registro da empresa (companies/acii):');
  await ensureCompanyDoc();

  console.log('\n2. Permissões (permissions/default -> permissions/acii):');
  await migratePermissions();

  console.log('\n3. Coleções de dados:');
  const results = {};
  for (const collectionName of COLLECTIONS_TO_STAMP) {
    results[collectionName] = await stampCollection(collectionName);
  }

  const totalUpdated = Object.values(results).reduce((sum, r) => sum + r.updated, 0);
  console.log(`\nConcluído. ${totalUpdated} documento(s) carimbado(s) com companyId="${DEFAULT_COMPANY_ID}" no total.`);
  console.log('Confira os dados no Console do Firebase antes de publicar firestore.rules e storage.rules novos.');
}

main().catch(err => {
  console.error('Erro na migração:', err);
  process.exit(1);
});
