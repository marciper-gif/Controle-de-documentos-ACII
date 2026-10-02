# Fase 6 — Plano de migração do acervo real da ACII

> **Status: executada em produção em 02/10/2026.** Rodada via Cloud
> Shell, com o Márcio acompanhando cada passo. Dry-run revisado antes de
> aplicar; `--apply` rodado uma vez e confirmado idempotente (uma
> segunda rodada sem `--apply` não encontrou mais nada pendente). Veja
> o resumo no final deste documento.

Este documento é a proposta formal de migração exigida antes de qualquer
alteração nos dados reais da ACII. Nada aqui é executado automaticamente:
a migração só roda em produção depois de você revisar este plano e
aprovar explicitamente, e mesmo assim primeiro em modo de leitura
(dry-run).

## Por que isto é necessário

O acervo real da ACII foi criado **antes** da arquitetura multiempresa
existir: nenhum setor, funcionário, ATR, POP, IT, usuário ou documento
digitalizado tem o campo `companyId`. Desde a Fase 1, as Firestore Rules
exigem `companyId` em tudo — então, sem esta migração, a ACII fica sem
acesso ao próprio acervo assim que o código novo for publicado.

## O que o script faz

Arquivo: `functions/migrate-acii-to-multitenant.js` (mesmo padrão dos
scripts administrativos já existentes, `create-company.js` e
`backfill-title-lower.js` — roda uma vez, manualmente, via Admin SDK).

1. Cria `companies/acii` (nome "ACII", status "ativo") se ainda não existir.
2. Carimba `companyId: "acii"` em todo documento que ainda não tiver, nas
   coleções: `sectors`, `atrs`, `pops`, `its`, `employees`, `users`,
   `guarded_documents`.
3. Em `atrs`/`pops`/`its`, também tenta preencher o campo `sectorId`
   (usado pela Fase 3 para restringir gestor ao próprio setor),
   casando o texto livre do campo `sector` com o nome de um setor já
   cadastrado. Quando não encontra correspondência exata, **não
   adivinha** — deixa o campo vazio (continua funcionando normalmente,
   só sem a restrição de setor do gestor) e lista o documento no
   relatório para você decidir.
4. Para cada usuário, cria a entrada correspondente em `login_index`
   (necessária para o login funcionar) e, só para contas antigas que
   ainda têm senha em texto puro e nenhum hash, calcula e grava o hash
   — **sem apagar o texto puro** nesta etapa (ver seção de riscos).
5. Copia `permissions/default` (documento único e antigo) para
   `permissions/acii`, sem apagar o original.
6. Cria `document_type_settings/acii` com os 4 tipos de documento
   habilitados e com os nomes padrão (ATR, POP, Instrução de Trabalho,
   Guarda de Documentos) — ajustável depois, pela tela de Admin.

## Garantias de segurança do script

- **Dry-run por padrão.** Sem a flag `--apply`, o script só lê e
  imprime um relatório — nunca grava nada.
- **Idempotente.** Rodar de novo depois de aplicado não duplica nem
  sobrescreve nada: só toca o que ainda estiver faltando.
- **Nunca apaga nada.** Nenhuma coleção, documento ou campo antigo é
  removido. `permissions/default` continua existindo, só deixa de ser
  lido pelo app depois da migração.
- **Nunca sobrescreve dado já migrado.** Se `companies/acii`,
  `permissions/acii` ou `document_type_settings/acii` já existirem, o
  script não mexe neles.

## Risco identificado e decisão pendente

Contas de usuário criadas antes da Fase 1 podem ter a senha gravada em
**texto puro** no campo `password` (bug histórico, independente desta
migração — já documentado e corrigido no código para contas novas desde
a Fase 1). O script calcula o hash dessas senhas e grava em
`passwordHash`, mas **mantém o texto puro por enquanto**, para não
arriscar travar o login de ninguém no mesmo passo em que o resto do
acervo está sendo migrado.

Depois de confirmar que o login por hash está funcionando normalmente
para todo mundo (alguns dias de uso real), o próximo passo recomendado
é um segundo script, bem mais simples, que apenas remove o campo
`password` de texto puro de quem já tiver `passwordHash` — fechando de
vez esse risco. Posso preparar esse script já junto com este, ou depois
de confirmarmos que a migração principal rodou bem — como preferir.

## Roteiro de execução (produção)

Pré-requisito: acesso ao Google Cloud Shell (ou ambiente equivalente)
com `gcloud` e Node 20 configurados para o projeto
`dogwood-loader-bln7n`, que é de onde os outros dois scripts
administrativos (`create-company.js`, `backfill-title-lower.js`) já são
rodados hoje.

```bash
# 1. Backup do Firestore ANTES de qualquer escrita
gcloud firestore export gs://<seu-bucket>/backups/pre-fase6-$(date +%Y%m%d) \
  --project=dogwood-loader-bln7n \
  --database=ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900

# 2. Dry-run — só lê, não grava nada
cd functions
npm install
node migrate-acii-to-multitenant.js

# 3. Revisar o relatório do dry-run com calma, principalmente a lista de
#    ATR/POP/IT com "setor não reconhecido". Se quiser resolver algum
#    antes de aplicar, crie um aliases.json:
#      { "Tecnologia da Informação": "SEC-008" }
#    e rode de novo o dry-run com --sector-aliases=aliases.json para
#    conferir que resolveu.

# 4. Aplicar de verdade
node migrate-acii-to-multitenant.js --apply
# (ou, se usou aliases: node migrate-acii-to-multitenant.js --apply --sector-aliases=aliases.json)

# 5. Testar login real com um usuário de cada papel (admin, gestor,
#    colaborador) no ambiente de produção, antes de avisar o restante
#    da equipe.
```

Se algo der errado antes do passo 4 (dry-run), nada foi gravado — é só
corrigir e rodar de novo. Se algo der errado depois do passo 4, o backup
do passo 1 é a rede de segurança para restaurar o estado anterior.

## Teste já realizado (emulador, antes de propor este plano)

Antes de propor rodar isto contra produção, o script foi testado contra
o Firebase Local Emulator Suite com dados fictícios no mesmo formato do
acervo real (incluindo um setor com nome que não bate exatamente, para
confirmar que o script sinaliza em vez de adivinhar):

- Dry-run não grava nada — confirmado.
- Apply grava `companyId` em todas as 7 coleções, cria `companies/acii`,
  `document_type_settings/acii`, `permissions/acii` (copiado do antigo
  `permissions/default`, que continua intacto) e as entradas de
  `login_index`.
- `sectorId` é resolvido corretamente quando o nome do setor bate
  exatamente, e corretamente **deixado vazio e reportado** quando não
  bate (não adivinha).
- Rodar `--apply` uma segunda vez não altera nada (idempotência
  confirmada) — importante porque garante que, se a execução em
  produção precisar ser interrompida e retomada, não há risco de
  duplicar ou corromper dado nenhum.
- Senha em texto puro é mantida e o hash é calculado corretamente a
  partir dela; hash já existente não é sobrescrito.

Este teste não substitui o dry-run contra os dados reais da produção
(passo 2 do roteiro acima) — ele prova que a lógica do script está
correta, não que o acervo real da ACII não tem nenhuma outra
particularidade que só aparece com os dados de verdade.

## Resultado da execução em produção (02/10/2026)

O dry-run contra os dados reais revelou algo que não era esperado: a
maior parte do acervo (setores, ATRs, POPs, ITs, funcionário, usuários,
documentos digitalizados) **já tinha `companyId` gravado** antes mesmo
de rodar o script — provavelmente porque, durante as fases anteriores
deste projeto, esses registros já tinham sido salvos de novo pela tela
do próprio app (toda gravação feita pela UI desde a Fase 1 já carimba
`companyId` automaticamente). O `--apply` então teve pouco trabalho:

- **ATRs (20), POPs (41) e ITs (3):** não precisaram de `companyId`,
  mas ainda não tinham `sectorId` — esse campo é mais novo (Fase 3) e
  foi resolvido pelo nome do setor em todos, exceto um.
- **IT-001** ("Higienização de Teclados e Mouses"): o campo `sector`
  está escrito como "Tecnologia da Informação", que não bate
  exatamente com o setor cadastrado "TI". Ficou sem `sectorId` —
  corrigível a qualquer momento editando essa IT pela tela e
  reselecionando o setor. Não bloqueia nada, só deixa essa IT de fora
  da restrição "gestor só edita o próprio setor" até ser corrigida.
- **login_index:** nenhuma das 8 entradas existia — **este era o item
  crítico**, sem ele o login de qualquer usuário sem sessão já salva no
  navegador provavelmente não funcionava. As 8 foram criadas e
  confirmadas (uma segunda rodada do dry-run mostrou "0 a criar, 8 já
  existentes").
- **Senha em texto puro:** nenhum dos 8 usuários precisou de
  `passwordHash` calculado a partir de senha em texto puro — ou seja,
  o risco de segurança descrito mais acima (contas antigas com senha
  não criptografada) **não foi encontrado nos dados reais**. O segundo
  script de limpeza (remover texto puro) discutido com o Márcio pode
  não ser necessário — a confirmar numa checagem futura dos 8 usuários.
- **`permissions/default` não existia** (nem `permissions/acii`) — o
  app segue usando os padrões embutidos no próprio código, como já
  fazia antes. Normal, sem ação necessária.
- **`document_type_settings/acii`:** não existia, foi criado com os 4
  tipos habilitados e os rótulos padrão.

Rodado uma segunda vez sem `--apply` logo depois: relatório mostrou
tudo em zero (nada pendente) — confirma que a migração ficou completa e
que rodar de novo não duplica nem altera nada.

Próximo passo: confirmar com login real (um usuário de cada papel) que
tudo continua funcionando normalmente na tela do app.
