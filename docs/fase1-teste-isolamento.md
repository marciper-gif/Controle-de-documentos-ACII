# Fase 1 — Roteiro de teste manual de isolamento entre empresas

Este roteiro complementa o teste automatizado (`bun run test:rules`), que já
prova o isolamento nas regras do Firestore. Aqui a confirmação é "com os
próprios olhos", na tela real do app, em um projeto Firebase de
teste/staging (nunca no projeto de produção da ACII).

## 1. Preparar duas empresas de teste

Usando o console do Firebase (projeto de teste) ou um script com o Admin
SDK:

1. Crie `companies/empresa-a` e `companies/empresa-b` (`{ name, status: "ativo" }`).
2. Em cada uma, crie um usuário admin (`users/{id}` com `companyId` da
   respectiva empresa, `role: "admin"`, `passwordHash` — use
   `createCompanyWithAdmin` em `src/lib/firebaseSync.ts` como referência
   de como gravar corretamente, incluindo o espelho em `login_index`).
3. Em cada empresa, cadastre 1 setor, 1 funcionário e 1 documento
   digitalizado, pela própria tela do app (login normal).

## 2. Confirmar isolamento pela UI

Com dois navegadores (ou um normal + uma aba anônima):

1. Faça login como admin da Empresa A. Anote o que aparece: nome da
   empresa no cabeçalho do login, setores, funcionários, documentos.
2. Faça login como admin da Empresa B na outra sessão.
3. **Confirme que nenhuma tela da Empresa B mostra qualquer setor,
   funcionário, ATR/POP/IT ou documento cadastrado na Empresa A**, e
   vice-versa.
4. Na tela de login, selecione a Empresa A mas tente a senha de um
   usuário da Empresa B (mesmo que por coincidência tenham o mesmo
   nome de usuário) — o login deve falhar.

## 3. Confirmar isolamento por fora da UI (tentativa direta)

Isto é o que prova que a proteção está nas regras, não só escondida na
tela:

1. Logado como admin da Empresa A, abra o DevTools do navegador
   (F12 → Console).
2. Rode uma consulta direta ao Firestore pedindo dados da Empresa B —
   por exemplo, usando o SDK já carregado na página:
   ```js
   // cole no console do navegador, autenticado como Empresa A
   const { getDocs, collection, query, where } = await import('firebase/firestore');
   const { db } = await import('/src/lib/firebase.ts'); // ajuste o caminho servido pelo Vite
   const snap = await getDocs(query(collection(db, 'sectors'), where('companyId', '==', 'empresa-b')));
   console.log(snap.size, snap.docs.map(d => d.data()));
   ```
3. **Resultado esperado: erro `permission-denied`**, nunca uma lista
   (mesmo vazia) de dados da Empresa B.
4. Repita para `employees`, `atrs`, `pops`, `its`, `users`,
   `guarded_documents` trocando o nome da coleção.

## 4. Confirmar que um documento não pode ser "adotado" por outra empresa

1. Logado como admin da Empresa A, tente atualizar um setor da própria
   empresa mudando o campo `companyId` para `empresa-b` (via console,
   como no passo 3, usando `updateDoc`).
2. **Resultado esperado: erro `permission-denied`** — o documento não
   muda de dono.

## 5. Quando este roteiro passa

Se todos os itens acima se comportarem como descrito, o isolamento está
confirmado tanto pela tela quanto pela API direta. Isso é o que a Fase 1
exige antes de avançar para a Fase 2 — reproduza este roteiro de novo
sempre que uma regra em `firestore.rules` ou `storage.rules` mudar.
