# Fase 6 — Plano de migração dos dados reais da ACII para produção

Este é o único momento do prompt inteiro que mexe em **dado real** da
ACII em produção — por isso é a única fase que eu não avanço sozinho,
mesmo você tendo me pedido pra seguir rápido até aqui. A regra 4 do seu
prompt original é clara: *"não apague nem sobrescreva dados reais da
ACII sem antes propor e eu aprovar um plano de migração"*. Isto é essa
proposta.

## O que já existe, pronto (desde a Fase 1)

- **`functions/migrate-add-company-id.js`** — o script de migração em
  si. Carimba `companyId="acii"` em todo documento existente que ainda
  não tiver esse campo, e cria `companies/acii`. É **100% aditivo**:
  nunca apaga, nunca sobrescreve um campo já preenchido, e é seguro
  rodar mais de uma vez (se rodar de novo depois de tudo migrado, não
  muda nada).
- **`firestore.rules` / `storage.rules`** novos (Fases 1–3) — as regras
  de isolamento entre empresas, prontas pra publicar.
- **`docs/fase-1-teste-isolamento.md`** — o roteiro pra provar que
  isolamento funciona, depois das regras publicadas.

**Nenhuma dessas três coisas está em produção ainda.** Tudo isso vive
neste repositório Git, na branch `claude/eloquent-brahmagupta-9g3q3l` —
até você (ou eu, com sua autorização explícita e acesso) publicar isso
de verdade no Firebase, o app da ACII continua rodando exatamente como
antes, sem nenhum risco. Preciso confirmar uma coisa importante com você
antes de continuar: **nada disto foi publicado no Firebase ainda,
certo?** Se por acaso você já publicou algo manualmente nesse meio
tempo, me avise antes de seguir o plano abaixo.

## Por que eu não faço isso sozinho

Eu não tenho as credenciais do seu projeto Firebase neste ambiente — não
consigo publicar regras, rodar Cloud Functions ou tocar no banco de
produção mesmo que quisesse. Mas mesmo que tivesse acesso técnico, a
regra 4 do seu prompt pede explicitamente sua aprovação antes desse
passo — e é o tipo de decisão (mexer no dado real de um cliente pagante)
que realmente deveria passar por você, não ser automática.

## O plano, passo a passo

### Passo 0 — Backup (antes de qualquer coisa)

1. No [Console do Firebase](https://console.firebase.google.com/) →
   projeto `dogwood-loader-bln7n` → Firestore Database.
2. Menu (⋮) → **Exportar dados** (ou pelo `gcloud`, se preferir linha de
   comando: `gcloud firestore export gs://SEU-BUCKET/backups/pre-fase6
   --database=ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900`).
3. Guarde a confirmação de que o backup terminou antes de seguir — sem
   isso, não avançamos.

### Passo 1 — Testar em cópia, não em produção

O jeito mais simples de ter uma "cópia de teste" sem criar um projeto
Firebase novo do zero: importar o backup do Passo 0 dentro do
**Emulador do Firestore** (roda local, na sua máquina ou aqui na sessão,
sem tocar em produção). Alternativa mais próxima do real, se preferir:
criar um segundo projeto Firebase (gratuito, camada Spark) e importar o
backup nele.

1. Restaurar o backup na cópia de teste.
2. Rodar `node migrate-add-company-id.js` apontando pra essa cópia (o
   script já imprime, documento por documento, o que está alterando —
   dá pra acompanhar em tempo real).
3. Conferir no Console (da cópia de teste) que os documentos ganharam
   `companyId="acii"` e que `companies/acii` foi criado.
4. Publicar `firestore.rules`/`storage.rules` novos **na cópia de
   teste**.
5. Rodar o roteiro de `docs/fase-1-teste-isolamento.md` inteiro contra
   essa cópia.
6. Testar o app apontando pra essa cópia (login, ver documentos, criar
   um setor) — confirmar que nada quebrou pra um usuário comum da ACII.

### Passo 2 — Sua aprovação explícita

Só depois do Passo 1 passar limpo, e só com um "sim, pode migrar
produção" seu — por escrito, aqui mesmo — eu (ou você, seguindo o mesmo
roteiro) repito os passos 1–4 do Passo 1 acima, desta vez no banco de
**produção** de verdade.

### Passo 3 — Produção

1. Rodar `node migrate-add-company-id.js` contra produção.
2. Conferir no Console que os dados ganharam `companyId`.
3. Publicar `firestore.rules`/`storage.rules` novos.
4. Rodar o roteiro de isolamento (`docs/fase-1-teste-isolamento.md`) uma
   última vez, agora em produção, com uma empresa de teste descartável
   (crie e apague pelo botão "Empresas", como o próprio roteiro já
   descreve).
5. Confirmar login normal funcionando pra um usuário real da ACII.

## O que eu preciso de você agora

1. Confirmar que nada disso foi publicado no Firebase ainda (ou me
   dizer o que já foi, se algo foi).
2. Me dizer como você quer rodar os passos que exigem terminal/Console
   do Firebase — algumas opções:
   - Você roda sozinho, seguindo este documento (eu fico disponível pra
     dúvida a cada passo);
   - Você me dá acesso (ex.: me adiciona como colaborador no projeto
     Firebase, ou abre uma sessão de Cloud Shell comigo) e eu conduzo
     junto com você, passo a passo, pedindo sua confirmação antes de
     cada ação que mexe em produção.
3. Sua aprovação explícita antes do Passo 3 (produção) — mesmo depois do
   Passo 1 (teste) ter passado limpo.
