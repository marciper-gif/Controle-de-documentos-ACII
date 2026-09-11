// ─────────────────────────────────────────────────────────────────────
// Teste de isolamento entre empresas (Fase 1 — multiempresa) + gestor de
// setor (correção portada da branch claude/acii-saas-multitenant-fxrohc).
// ─────────────────────────────────────────────────────────────────────
// Prova, contra as REGRAS DE VERDADE (firestore.rules), que:
//   1. uma sessão vinculada à Empresa A não consegue ler nem escrever
//      nenhum dado da Empresa B — por nenhum caminho (leitura direta por
//      ID, consulta em lista, criação, atualização);
//   2. dentro da MESMA empresa, um gestor só cria/edita/apaga POP, ATR,
//      IT ou documento guardado do PRÓPRIO setor — admin continua
//      mexendo em qualquer setor da empresa.
// Roda no Firebase Local Emulator Suite — nunca toca no banco real da
// ACII.
//
// Como rodar:
//   npm run test:rules
// (isso sobe o emulador do Firestore, roda este arquivo com o runner de
// testes nativo do Node, e derruba o emulador — tudo em um comando).
//
// Se qualquer teste aqui falhar depois de uma mudança em firestore.rules,
// NÃO publique a mudança em produção até entender e corrigir o motivo.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where
} from 'firebase/firestore';

/** @type {import('@firebase/rules-unit-testing').RulesTestEnvironment} */
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'acii-isolation-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080
    }
  });

  // Fixtures: duas empresas (ACII e uma "Beta" qualquer), cada uma com
  // admin, dois setores, um gestor vinculado ao primeiro setor, um
  // colaborador, e um documento de cada tipo — gravados direto,
  // ignorando as regras (é assim que qualquer teste de regras semeia
  // dados: as regras só são exercitadas nas leituras/escritas do teste
  // em si, não na preparação do cenário).
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    await setDoc(doc(db, 'companies', 'acii'), { id: 'acii', name: 'ACII', status: 'ativo' });
    await setDoc(doc(db, 'companies', 'beta'), { id: 'beta', name: 'Beta Ltda', status: 'ativo' });

    // Vínculos de sessão (auth_links) — o que a Cloud Function `login`
    // gravaria depois de validar a senha. uid-gestor-acii e
    // uid-colab-acii apontam pro MESMO setor (SEC-ACII-1); uid-admin-*
    // não tem setor (admin não precisa).
    await setDoc(doc(db, 'auth_links', 'uid-admin-acii'), { companyId: 'acii', userId: 'admin-acii', role: 'admin', sectorId: null });
    await setDoc(doc(db, 'auth_links', 'uid-gestor-acii'), { companyId: 'acii', userId: 'gestor-acii', role: 'gestor', sectorId: 'SEC-ACII-1' });
    await setDoc(doc(db, 'auth_links', 'uid-colab-acii'), { companyId: 'acii', userId: 'colab-acii', role: 'colaborador', sectorId: 'SEC-ACII-1' });
    await setDoc(doc(db, 'auth_links', 'uid-admin-beta'), { companyId: 'beta', userId: 'admin-beta', role: 'admin', sectorId: null });

    // Setores — o NOME (não o ID) é o que ATR/POP/IT gravam no campo
    // `sector` (herdado de antes da multiempresa/gestor-de-setor — ver
    // comentário de canManageSectorByName em firestore.rules).
    await setDoc(doc(db, 'sectors', 'SEC-ACII-1'), { id: 'SEC-ACII-1', companyId: 'acii', name: 'RH' });
    await setDoc(doc(db, 'sectors', 'SEC-ACII-2'), { id: 'SEC-ACII-2', companyId: 'acii', name: 'Financeiro' });
    await setDoc(doc(db, 'sectors', 'SEC-BETA-1'), { id: 'SEC-BETA-1', companyId: 'beta', name: 'Financeiro' });

    await setDoc(doc(db, 'users', 'admin-acii'), { id: 'admin-acii', companyId: 'acii', username: 'admin', name: 'Admin ACII', role: 'admin', passwordHash: 'x' });
    await setDoc(doc(db, 'users', 'gestor-acii'), { id: 'gestor-acii', companyId: 'acii', username: 'gestor', name: 'Gestor ACII', role: 'gestor', passwordHash: 'g' });
    await setDoc(doc(db, 'users', 'colab-acii'), { id: 'colab-acii', companyId: 'acii', username: 'colaborador', name: 'Colaborador ACII', role: 'colaborador', passwordHash: 'z' });
    await setDoc(doc(db, 'users', 'admin-beta'), { id: 'admin-beta', companyId: 'beta', username: 'admin', name: 'Admin Beta', role: 'admin', passwordHash: 'y' });

    await setDoc(doc(db, 'atrs', 'atr-sec1'), { id: 'atr-sec1', companyId: 'acii', sector: 'RH', title: 'ATR setor RH' });
    await setDoc(doc(db, 'atrs', 'atr-sec2'), { id: 'atr-sec2', companyId: 'acii', sector: 'Financeiro', title: 'ATR setor Financeiro' });
    await setDoc(doc(db, 'atrs', 'atr-beta1'), { id: 'atr-beta1', companyId: 'beta', sector: 'Financeiro', title: 'ATR da Beta' });

    await setDoc(doc(db, 'permissions', 'acii'), { colaborador: { canSeeAllDocs: true }, gestor: { canSeeAllDocs: true } });
    await setDoc(doc(db, 'permissions', 'beta'), { colaborador: { canSeeAllDocs: false }, gestor: { canSeeAllDocs: true } });

    await setDoc(doc(db, 'guarded_documents', 'doc-acii-1'), { id: 'doc-acii-1', companyId: 'acii', sectorId: 'SEC-ACII-1', title: 'Contrato ACII' });
    await setDoc(doc(db, 'guarded_documents', 'doc-beta-1'), { id: 'doc-beta-1', companyId: 'beta', sectorId: 'SEC-BETA-1', title: 'Contrato Beta' });
  });
});

after(async () => {
  await testEnv.cleanup();
});

// ── Isolamento entre empresas: setores ──────────────────────────────

test('admin da ACII lê o próprio setor', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertSucceeds(getDoc(doc(db, 'sectors', 'SEC-ACII-1')));
});

test('admin da ACII NÃO lê setor da Beta (get direto por ID)', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertFails(getDoc(doc(db, 'sectors', 'SEC-BETA-1')));
});

test('admin da ACII NÃO consegue listar setores filtrando pela empresa Beta', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  const q = query(collection(db, 'sectors'), where('companyId', '==', 'beta'));
  await assertFails(getDocs(q));
});

test('admin da Beta NÃO consegue ler setor da ACII (simétrico)', async () => {
  const db = testEnv.authenticatedContext('uid-admin-beta').firestore();
  await assertFails(getDoc(doc(db, 'sectors', 'SEC-ACII-1')));
});

// ── Isolamento entre empresas: companies ────────────────────────────

test('admin da ACII lê a própria empresa', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertSucceeds(getDoc(doc(db, 'companies', 'acii')));
});

test('admin da ACII NÃO lê o registro da empresa Beta', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertFails(getDoc(doc(db, 'companies', 'beta')));
});

test('ninguém escreve em companies pelo cliente, nem o próprio admin (só a migração/Admin SDK)', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertFails(setDoc(doc(db, 'companies', 'gama'), { id: 'gama', name: 'Gama', status: 'ativo' }));
});

// ── Isolamento entre empresas: usuários e permissões ────────────────

test('admin da ACII lista usuários da própria empresa', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  const q = query(collection(db, 'users'), where('companyId', '==', 'acii'));
  const snap = await assertSucceeds(getDocs(q));
  assert.equal(snap.size, 3); // admin-acii + gestor-acii + colab-acii
});

test('admin da ACII NÃO consegue listar usuários da Beta', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  const q = query(collection(db, 'users'), where('companyId', '==', 'beta'));
  await assertFails(getDocs(q));
});

test('admin da ACII lê e escreve as permissões da própria empresa', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertSucceeds(getDoc(doc(db, 'permissions', 'acii')));
  await assertSucceeds(setDoc(doc(db, 'permissions', 'acii'), { colaborador: { canSeeAllDocs: false }, gestor: { canSeeAllDocs: true } }));
});

test('admin da ACII NÃO lê nem escreve as permissões da Beta', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertFails(getDoc(doc(db, 'permissions', 'beta')));
  await assertFails(setDoc(doc(db, 'permissions', 'beta'), { colaborador: { canSeeAllDocs: true }, gestor: { canSeeAllDocs: true } }));
});

// ── Blindagem contra autopromoção ───────────────────────────────────

test('colaborador troca a própria conta (campo qualquer sem restrição), mas NÃO o próprio papel', async () => {
  const db = testEnv.authenticatedContext('uid-colab-acii').firestore();
  await assertSucceeds(updateDoc(doc(db, 'users', 'colab-acii'), { name: 'Colaborador ACII (editado)' }));
  await assertFails(updateDoc(doc(db, 'users', 'colab-acii'), { role: 'admin' }));
});

test('colaborador NÃO consegue "migrar" a própria conta pra outra empresa', async () => {
  const db = testEnv.authenticatedContext('uid-colab-acii').firestore();
  await assertFails(updateDoc(doc(db, 'users', 'colab-acii'), { companyId: 'beta' }));
});

// ── Documentos guardados (guarded_documents): isolamento + setor ────

test('admin da ACII lê documento guardado da própria empresa', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertSucceeds(getDoc(doc(db, 'guarded_documents', 'doc-acii-1')));
});

test('admin da ACII NÃO lê documento guardado da Beta', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertFails(getDoc(doc(db, 'guarded_documents', 'doc-beta-1')));
});

test('colaborador da ACII (setor SEC-ACII-1) lê documento do próprio setor', async () => {
  const db = testEnv.authenticatedContext('uid-colab-acii').firestore();
  await assertSucceeds(getDoc(doc(db, 'guarded_documents', 'doc-acii-1')));
});

test('colaborador da ACII NÃO lê documento da Beta mesmo citando o ID de cabeça', async () => {
  const db = testEnv.authenticatedContext('uid-colab-acii').firestore();
  await assertFails(getDoc(doc(db, 'guarded_documents', 'doc-beta-1')));
});

test('gestor da ACII (setor SEC-ACII-1) cria documento guardado do PRÓPRIO setor', async () => {
  const db = testEnv.authenticatedContext('uid-gestor-acii').firestore();
  await assertSucceeds(setDoc(doc(db, 'guarded_documents', 'doc-acii-novo'), {
    id: 'doc-acii-novo', companyId: 'acii', sectorId: 'SEC-ACII-1', title: 'Novo contrato'
  }));
});

test('gestor da ACII NÃO cria documento guardado de OUTRO setor (correção portada da fxrohc)', async () => {
  const db = testEnv.authenticatedContext('uid-gestor-acii').firestore();
  await assertFails(setDoc(doc(db, 'guarded_documents', 'doc-acii-invasao'), {
    id: 'doc-acii-invasao', companyId: 'acii', sectorId: 'SEC-ACII-2', title: 'Tentativa'
  }));
});

test('gestor da ACII NÃO edita documento guardado de outro setor', async () => {
  const db = testEnv.authenticatedContext('uid-gestor-acii').firestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'guarded_documents', 'doc-acii-sec2'), {
      id: 'doc-acii-sec2', companyId: 'acii', sectorId: 'SEC-ACII-2', title: 'Doc do Financeiro'
    });
  });
  await assertFails(updateDoc(doc(db, 'guarded_documents', 'doc-acii-sec2'), { title: 'Invasão' }));
});

// ── Fase "gestor de setor" em ATR/POP/IT (campo `sector`, por NOME) ──

test('gestor edita ATR do PRÓPRIO setor (nome do setor resolvido via sectors/{sectorId})', async () => {
  const db = testEnv.authenticatedContext('uid-gestor-acii').firestore();
  await assertSucceeds(updateDoc(doc(db, 'atrs', 'atr-sec1'), { title: 'ATR setor RH (editado)' }));
});

test('gestor NÃO edita ATR de outro setor da MESMA empresa', async () => {
  const db = testEnv.authenticatedContext('uid-gestor-acii').firestore();
  await assertFails(updateDoc(doc(db, 'atrs', 'atr-sec2'), { title: 'Invasão de setor' }));
});

test('gestor NÃO cria ATR direto para outro setor', async () => {
  const db = testEnv.authenticatedContext('uid-gestor-acii').firestore();
  await assertFails(setDoc(doc(db, 'atrs', 'atr-novo-sec2'), { id: 'atr-novo-sec2', companyId: 'acii', sector: 'Financeiro', title: 'Tentativa' }));
});

test('gestor cria ATR para o PRÓPRIO setor', async () => {
  const db = testEnv.authenticatedContext('uid-gestor-acii').firestore();
  await assertSucceeds(setDoc(doc(db, 'atrs', 'atr-novo-sec1'), { id: 'atr-novo-sec1', companyId: 'acii', sector: 'RH', title: 'Novo cargo do RH' }));
});

test('gestor NÃO "muda de setor" um ATR do próprio setor via update', async () => {
  const db = testEnv.authenticatedContext('uid-gestor-acii').firestore();
  await assertFails(updateDoc(doc(db, 'atrs', 'atr-sec1'), { sector: 'Financeiro' }));
});

test('gestor NÃO apaga ATR de outro setor', async () => {
  const db = testEnv.authenticatedContext('uid-gestor-acii').firestore();
  await assertFails(deleteDoc(doc(db, 'atrs', 'atr-sec2')));
});

test('admin edita e apaga ATR de qualquer setor da própria empresa', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertSucceeds(updateDoc(doc(db, 'atrs', 'atr-sec2'), { title: 'Editado pelo admin' }));
});

test('gestor da ACII NÃO edita ATR da Beta (isolamento entre empresas continua valendo, mesmo com a checagem de setor)', async () => {
  const db = testEnv.authenticatedContext('uid-gestor-acii').firestore();
  await assertFails(updateDoc(doc(db, 'atrs', 'atr-beta1'), { title: 'Invasão entre empresas' }));
});
