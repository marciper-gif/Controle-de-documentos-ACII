/**
 * syncAuthLinkClaims
 * ─────────────────────────────────────────────────────────────────────
 * Por quê isso existe: as Storage Rules do módulo de guarda de documentos
 * (storage.rules) precisam saber o papel (role) e o setor (sectorId) de
 * quem está pedindo, pra decidir se pode ler/enviar um arquivo. O jeito
 * natural seria o Storage consultar auth_links/{uid} no Firestore
 * ("cross-service rules", firestore.get()) — só que esse recurso do
 * Firebase SÓ funciona com o banco Firestore "(default)", e este projeto
 * usa um banco NOMEADO. Então o Storage nunca consegue ler auth_links
 * diretamente, e qualquer checagem de papel/setor no storage.rules falha
 * sempre (mesmo para admin).
 *
 * A solução recomendada pelo próprio Firebase pra esse cenário é usar
 * Custom Claims: gravar papel/setor DENTRO do token de autenticação do
 * usuário (request.auth.token.role / .sectorId), que o Storage Rules lê
 * de graça, sem nenhuma consulta cross-service. Só o Admin SDK (rodando
 * em uma Cloud Function, nunca no cliente) pode gravar custom claims —
 * daí esta function: toda vez que auth_links/{uid} é criado/atualizado
 * pelo app (ver src/lib/authLink.ts), ela espelha role/sectorId pros
 * custom claims daquele uid no Firebase Auth.
 *
 * O cliente, depois de gravar em auth_links, força um refresh do ID
 * token (getIdTokenResult(true), com retry) até ver os claims batendo —
 * só então tenta o upload/leitura no Storage. Ver waitForClaimsSync em
 * src/lib/authLink.ts.
 */

const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');

initializeApp();

// Precisa bater com firestoreDatabaseId em firebase-applet-config.json.
// Se o banco Firestore for recriado/renomeado, atualizar aqui também
// (mesmo cuidado documentado no topo de storage.rules e firestore.rules).
const FIRESTORE_DATABASE_ID = 'ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900';

exports.syncAuthLinkClaims = onDocumentWritten(
  {
    document: 'auth_links/{uid}',
    database: FIRESTORE_DATABASE_ID,
    region: 'us-central1'
  },
  async event => {
    const uid = event.params.uid;
    const after = event.data?.after?.exists ? event.data.after.data() : null;

    try {
      if (!after) {
        // Documento apagado (não deveria acontecer no fluxo normal do
        // app) — limpa os claims por segurança, em vez de deixar um
        // papel/setor obsoleto valendo pra sempre no token desse uid.
        await getAuth().setCustomUserClaims(uid, { role: null, sectorId: null });
        logger.info(`Claims limpos para uid=${uid} (auth_links removido).`);
        return;
      }

      const role = after.role ?? null;
      const sectorId = after.sectorId ?? null;
      await getAuth().setCustomUserClaims(uid, { role, sectorId });
      logger.info(`Claims sincronizados para uid=${uid}: role=${role}, sectorId=${sectorId}`);
    } catch (err) {
      // Não há como "falhar" de volta pro cliente aqui (é um trigger
      // assíncrono) — o retry do cliente (waitForClaimsSync) vai apenas
      // dar timeout e seguir com os claims antigos/ausentes, o que é o
      // pior caso seguro (acesso negado, não indevido).
      logger.error(`Falha ao sincronizar claims para uid=${uid}:`, err);
    }
  }
);
