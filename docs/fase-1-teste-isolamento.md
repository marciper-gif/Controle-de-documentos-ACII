# Fase 1 — Roteiro de teste de isolamento entre empresas

Este é o teste que a regra 3 do seu prompt original pede: uma prova
reproduzível de que uma empresa **não consegue**, por nenhum caminho, ler
ou escrever dado de outra empresa. Não exige programar nada — só seguir os
passos no Console do Firebase e no navegador.

**Quando rodar:** depois de publicar `firestore.rules` e `storage.rules`
novos (e SÓ depois de rodar `functions/migrate-add-company-id.js` — ver o
aviso na Fase 1 sobre a ordem certa). Pode ser feito em produção com
segurança porque cria uma empresa de teste totalmente separada da ACII, que
você apaga no final.

---

## Parte 1 — Criar uma empresa de teste (só para este teste)

A tela de "criar nova empresa" ainda não existe (é a Fase 3). Por enquanto,
criamos a empresa de teste direto no Console do Firebase — é só para provar
o isolamento, e você apaga tudo no passo final.

1. Abra o [Console do Firebase](https://console.firebase.google.com/) →
   projeto `dogwood-loader-bln7n` → Firestore Database → banco
   `ai-studio-aciicontroledodo-...`.
2. Coleção `companies` → **Adicionar documento**:
   - ID do documento: `empresa-teste`
   - Campos: `id` (string) = `empresa-teste`, `name` (string) = `Empresa Teste`, `status` (string) = `ativo`
3. Coleção `sectors` → **Adicionar documento** (ID automático):
   - `companyId` (string) = `empresa-teste`
   - `id` (string) = `SEC-TESTE-001`
   - `name` (string) = `Setor Secreto da Empresa Teste`
4. Coleção `users` → **Adicionar documento**:
   - ID do documento: `user-teste-1`
   - Campos: `id` = `user-teste-1`, `companyId` = `empresa-teste`,
     `username` = `teste.isolamento`, `name` = `Usuário Teste`,
     `role` = `admin`, `status` = `Ativo`
   - Campo `passwordHash`: gere um hash SHA-256 de uma senha simples (ex.
     `teste123`) — mais fácil pedir pra mim gerar o hash certo nesta
     conversa antes de rodar este teste, ou usar qualquer ferramenta online
     de "SHA-256 online" e colar o resultado em hexadecimal minúsculo.

## Parte 2 — Confirmar que a empresa de teste enxerga só o próprio dado

1. Abra o app publicado, em uma aba anônima do navegador (evita cache de
   sessão antiga).
2. Faça login com `teste.isolamento` / a senha que você definiu.
3. Confira: a tela de Setores mostra **só** "Setor Secreto da Empresa
   Teste" — nenhum dos 10 setores da ACII deve aparecer.
4. Se algum setor da ACII aparecer aqui → **PARE**. O isolamento está
   falhando e as regras não devem ir pra produção assim. Volte e revise
   `firestore.rules`.

## Parte 3 — A prova real: tentar ler dado da ACII por fora da tela

Isto é o que prova isolamento de verdade — não só que a *tela* filtra
certo, mas que o **banco em si** recusa, mesmo pedindo por outro caminho.

1. Ainda logado como `teste.isolamento`, abra o Console de Desenvolvedor
   do navegador (F12 → aba "Console").
2. Cole e rode o trecho abaixo (ele tenta ler os setores da ACII
   diretamente, ignorando a tela):

   ```js
   const { getFirestore, collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js');
   const db = getFirestore();
   const q = query(collection(db, 'sectors'), where('companyId', '==', 'acii'));
   try {
     const snap = await getDocs(q);
     console.log('LEU', snap.size, 'documento(s) da ACII — ISOLAMENTO FALHOU');
   } catch (e) {
     console.log('BLOQUEADO como esperado:', e.code);
   }
   ```

3. **Resultado esperado:** `BLOQUEADO como esperado: permission-denied`.
   Se em vez disso aparecer `LEU ... documento(s) da ACII`, o isolamento
   está quebrado — não publique essas regras em produção, volte e revise.

4. Repita o mesmo teste pra `guarded_documents` e `employees` trocando o
   nome da coleção no trecho acima — são as coleções com o dado mais
   sensível (documentos digitalizados e dados de funcionários).

## Parte 4 — Confirmar que a ACII também não enxerga a empresa de teste

Mesma lógica, na direção contrária — importante porque uma regra mal
escrita pode vazar só num sentido.

1. Faça login no app como um usuário normal da ACII (ex. admin).
2. Repita o trecho do Console do navegador da Parte 3, trocando
   `'acii'` por `'empresa-teste'`.
3. Resultado esperado: `BLOQUEADO como esperado: permission-denied`.

## Parte 5 — Limpeza

Depois que os 4 testes acima passarem:

1. Apague o documento `companies/empresa-teste`.
2. Apague o setor de teste em `sectors`.
3. Apague o usuário `users/user-teste-1`.
4. (Se algum `auth_links` sobrou ligado a este teste, também pode
   apagar — ele já não é mais lido por ninguém sem o `users` correspondente.)

---

## O que este teste NÃO cobre (documentando o limite, não escondendo)

- Não testa o Storage (upload/download de arquivo) por falta de um jeito
  simples de simular isso no Console do navegador — o `storage.rules`
  segue a mesma lógica (`companyId` do caminho == `companyId` do token),
  já coberta pela leitura de código nesta fase. Se quiser um teste manual
  disso também, é só pedir — dá pra montar um roteiro parecido tentando
  abrir a URL de um arquivo de outra empresa direto pelo link.
- Não é um teste automatizado (rodar sozinho, sem alguém seguir os
  passos). Automatizar isso de verdade exigiria o emulador do Firebase e a
  biblioteca `@firebase/rules-unit-testing`, que este projeto ainda não
  usa — decidimos não trazer essa complexidade extra na Fase 1 (regra 5 do
  seu prompt: simplicidade de manutenção). Se no futuro isso passar a valer
  a pena (por exemplo, quando o número de empresas crescer e testar na mão
  toda vez ficar arriscado), é um bom item pra revisitar.
