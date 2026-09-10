// ─────────────────────────────────────────────────────────────────────
// Teste de isolamento entre empresas (Fase 1 — multiempresa).
// ─────────────────────────────────────────────────────────────────────
// Prova, contra as REGRAS DE VERDADE (firestore.rules), que uma sessão
// vinculada à Empresa A não consegue ler nem escrever nenhum dado da
// Empresa B — por nenhum caminho (leitura direta por ID, consulta em
// lista, criação, atualização). Roda no Firebase Local Emulator Suite —
// nunca toca no banco real da ACII.
//
// Como rodar:
//   bun run test:rules
// (isso sobe o emulador do Firestore, roda este arquivo com o runner de
// testes nativo do Node, e derruba o emulador — tudo em um comando).
//
// Se qualquer teste aqui falhar depois de uma mudança em firestore.rules,
// NÃO prossiga para a próxima fase até entender e corrigir o motivo.

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

  // Fixtures: duas empresas de teste (ACII e uma "Beta" qualquer),
  // cada uma com admin, setor, funcionário/usuário colaborador,
  // documento guardado, e permissões próprias — gravados direto,
  // ignorando as regras (é assim que qualquer teste de regras semeia
  // dados: as regras só são exercitadas nas leituras/escritas do teste
  // em si, não na preparação do cenário).
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    await setDoc(doc(db, 'companies', 'acii'), { id: 'acii', name: 'ACII', status: 'ativo' });
    await setDoc(doc(db, 'companies', 'beta'), { id: 'beta', name: 'Beta Ltda', status: 'ativo' });

    // Vínculos de sessão (auth_links) — uid-admin-acii já "logado" como
    // admin da ACII, uid-colab-acii como colaborador do setor SEC-ACII-1.
    await setDoc(doc(db, 'auth_links', 'uid-admin-acii'), { companyId: 'acii', userId: 'admin-acii', role: 'admin', sectorId: null });
    await setDoc(doc(db, 'auth_links', 'uid-colab-acii'), { companyId: 'acii', userId: 'colab-acii', role: 'colaborador', sectorId: 'SEC-ACII-1' });
    await setDoc(doc(db, 'auth_links', 'uid-admin-beta'), { companyId: 'beta', userId: 'admin-beta', role: 'admin', sectorId: null });

    await setDoc(doc(db, 'sectors', 'SEC-ACII-1'), { id: 'SEC-ACII-1', companyId: 'acii', name: 'RH' });
    await setDoc(doc(db, 'sectors', 'SEC-BETA-1'), { id: 'SEC-BETA-1', companyId: 'beta', name: 'Financeiro' });

    await setDoc(doc(db, 'users', 'admin-acii'), { id: 'admin-acii', companyId: 'acii', username: 'admin', name: 'Admin ACII', role: 'admin', passwordHash: 'x' });
    await setDoc(doc(db, 'users', 'admin-beta'), { id: 'admin-beta', companyId: 'beta', username: 'admin', name: 'Admin Beta', role: 'admin', passwordHash: 'y' });

    await setDoc(doc(db, 'login_index', 'acii__admin'), { companyId: 'acii', userId: 'admin-acii', username: 'admin', passwordHash: 'x', status: 'ativo' });

    await setDoc(doc(db, 'permissions', 'acii'), { colaborador: { canSeeAllDocs: true }, gestor: { canSeeAllDocs: true } });
    await setDoc(doc(db, 'permissions', 'beta'), { colaborador: { canSeeAllDocs: false }, gestor: { canSeeAllDocs: true } });

    await setDoc(doc(db, 'guarded_documents', 'doc-acii-1'), { id: 'doc-acii-1', companyId: 'acii', sectorId: 'SEC-ACII-1', title: 'Contrato ACII' });
    await setDoc(doc(db, 'guarded_documents', 'doc-beta-1'), { id: 'doc-beta-1', companyId: 'beta', sectorId: 'SEC-BETA-1', title: 'Contrato Beta' });
  });
});

after(async () => {
  await testEnv.cleanup();
});

// ── Setores ─────────────────────────────────────────────────────────

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

test('admin da ACII cria setor da própria empresa', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertSucceeds(setDoc(doc(db, 'sectors', 'SEC-ACII-2'), { id: 'SEC-ACII-2', companyId: 'acii', name: 'TI' }));
});

test('admin da ACII NÃO consegue criar setor marcado como da Beta', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertFails(setDoc(doc(db, 'sectors', 'SEC-FORJADO'), { id: 'SEC-FORJADO', companyId: 'beta', name: 'Invasão' }));
});

test('admin da ACII NÃO consegue atualizar setor da Beta', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertFails(updateDoc(doc(db, 'sectors', 'SEC-BETA-1'), { name: 'Alterado pela ACII' }));
});

test('admin da Beta NÃO consegue ler setor da ACII (simétrico)', async () => {
  const db = testEnv.authenticatedContext('uid-admin-beta').firestore();
  await assertFails(getDoc(doc(db, 'sectors', 'SEC-ACII-1')));
});

// ── Usuários (users) ────────────────────────────────────────────────

test('admin da ACII lista usuários da própria empresa', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  const q = query(collection(db, 'users'), where('companyId', '==', 'acii'));
  const snap = await assertSucceeds(getDocs(q));
  assert.equal(snap.size, 1);
});

test('admin da ACII NÃO consegue listar usuários da Beta', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  const q = query(collection(db, 'users'), where('companyId', '==', 'beta'));
  await assertFails(getDocs(q));
});

// ── login_index (lookup pré-login) ──────────────────────────────────

test('sessão anônima (pré-login) consegue GET por ID exato em login_index', async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  // Sem request.auth, isAuthenticated() é falso — então isto também
  // prova que o get exige pelo menos uma sessão do Firebase (mesmo que
  // anônima), não que está aberto a qualquer requisição sem nenhuma auth.
  await assertFails(getDoc(doc(db, 'login_index', 'acii__admin')));
});

test('sessão anônima autenticada (bridge) consegue GET por ID exato em login_index', async () => {
  const db = testEnv.authenticatedContext('uid-nova-sessao-anonima').firestore();
  await assertSucceeds(getDoc(doc(db, 'login_index', 'acii__admin')));
});

test('login_index NUNCA aceita list (nem para admin)', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertFails(getDocs(collection(db, 'login_index')));
});

// ── Permissões (permissions/{companyId}) ────────────────────────────

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

// ── Documentos guardados (guarded_documents) ────────────────────────

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

// ── companies (cadastro de empresas) ────────────────────────────────

test('qualquer sessão autenticada lê a lista de empresas (necessário para a tela de login)', async () => {
  const db = testEnv.authenticatedContext('uid-qualquer').firestore();
  const snap = await assertSucceeds(getDocs(collection(db, 'companies')));
  assert.equal(snap.size, 2);
});

test('ninguém escreve em companies pelo cliente (nem admin) — só script administrativo', async () => {
  const db = testEnv.authenticatedContext('uid-admin-acii').firestore();
  await assertFails(setDoc(doc(db, 'companies', 'gama'), { id: 'gama', name: 'Gama', status: 'ativo' }));
});
