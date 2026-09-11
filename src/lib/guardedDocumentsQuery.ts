// ─────────────────────────────────────────────────────────────────────
// Consultas escaláveis para o módulo de Guarda de Documentos.
// ─────────────────────────────────────────────────────────────────────
// Até aqui, a tela de Documentos baixava a coleção `guarded_documents`
// INTEIRA pro navegador de cada usuário (um único onSnapshot sem
// filtro nenhum), e ainda guardava tudo de novo no localStorage. Isso
// funciona bem com dezenas/centenas de documentos, mas não escala pra
// um cenário de digitalização em massa (dezenas ou centenas de
// milhares): a tela ficaria lenta pra carregar e o consumo de leituras
// do Firestore cresceria com o número de USUÁRIOS × documentos, não só
// com o número de documentos.
//
// Este módulo troca isso por consultas sempre limitadas por setor e
// paginadas (nunca "trazer tudo"). Cada função aqui corresponde a uma
// necessidade específica da tela:
//   - getSectorDocumentCount: contagem por pasta (não baixa os documentos).
//   - subscribeToSectorDocuments: lista paginada de uma pasta aberta.
//   - subscribeToSectorDocumentsByTitlePrefix: busca por título dentro
//     de uma pasta (Firestore não tem busca de texto livre nativa —
//     isso é busca por PREFIXO do título, não por qualquer palavra no
//     meio do texto; ver nota em types.ts sobre titleLower).
//   - subscribeToExpiringDocuments: painel de vencimentos, sem
//     depender de carregar a coleção inteira pra filtrar em memória.
//
// Índices compostos necessários no Firestore (o próprio Firestore
// mostra um link pronto pra criar quando uma consulta que precisa de
// índice roda pela primeira vez sem ele existir — é só clicar nesse
// link no console do navegador, ou criar manualmente no Console:
// Firestore → Índices → Adicionar índice). Atualizados na Fase 1
// (multiempresa) com companyId como primeiro filtro de igualdade:
//   1. guarded_documents: companyId ASC, sectorId ASC, uploadedAt DESC
//   2. guarded_documents: companyId ASC, sectorId ASC, titleLower ASC
//   3. guarded_documents: companyId ASC, status ASC, retentionUntil ASC
//   4. guarded_documents: companyId ASC, sectorId ASC, status ASC, retentionUntil ASC

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getCountFromServer,
  Unsubscribe,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import { GuardedDocument } from '../types';

const COLLECTION_NAME = 'guarded_documents';

/** Tamanho de página padrão (quantos documentos carregar por vez / por "carregar mais"). */
export const GUARDED_DOCS_PAGE_SIZE = 30;

/** Máximo de resultados por setor ao fazer busca global (soma de todos os setores fica limitada). */
export const SEARCH_RESULTS_PER_SECTOR = 15;

function docToGuardedDocument(snap: QueryDocumentSnapshot<DocumentData>): GuardedDocument {
  return { ...(snap.data() as GuardedDocument), id: snap.id };
}

/**
 * Normaliza um texto pra comparação de busca: minúsculas e sem os
 * acentos mais comuns do português (compatível com o que é gravado em
 * `titleLower` no upload — ver UploadDocumentModal.tsx).
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // remove diacríticos (á->a, ç->c, etc.)
}

/**
 * Contagem de documentos de um setor, SEM baixar os documentos em si
 * (usa a consulta de agregação do Firestore — custa uma fração do
 * preço de uma leitura normal, mesmo que o setor tenha milhares de
 * documentos). Usado nos cards da grade de pastas.
 */
export async function getSectorDocumentCount(companyId: string, sectorId: string): Promise<number> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('companyId', '==', companyId),
    where('sectorId', '==', sectorId)
  );
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

/**
 * Assina (tempo real) a página atual de documentos de UM setor,
 * ordenados por envio mais recente primeiro. `pageLimit` cresce a cada
 * "carregar mais" clicado (ver GUARDED_DOCS_PAGE_SIZE) — o próprio
 * Firestore reexecuta a consulta com o novo limite, então não precisa
 * gerenciar cursor manualmente.
 */
export function subscribeToSectorDocuments(
  companyId: string,
  sectorId: string,
  pageLimit: number,
  onData: (docs: GuardedDocument[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('companyId', '==', companyId),
    where('sectorId', '==', sectorId),
    orderBy('uploadedAt', 'desc'),
    limit(pageLimit)
  );
  return onSnapshot(
    q,
    snapshot => onData(snapshot.docs.map(docToGuardedDocument)),
    err => onError(err as Error)
  );
}

/**
 * Assina (tempo real) documentos de UM setor cujo título comece com
 * `prefixNormalized` (já passado por normalizeForSearch). Usado tanto
 * pra busca dentro de uma pasta aberta quanto, chamado uma vez por
 * setor, pra montar a busca global (ver DocumentsView.tsx).
 */
export function subscribeToSectorDocumentsByTitlePrefix(
  companyId: string,
  sectorId: string,
  prefixNormalized: string,
  resultLimit: number,
  onData: (docs: GuardedDocument[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('companyId', '==', companyId),
    where('sectorId', '==', sectorId),
    where('titleLower', '>=', prefixNormalized),
    where('titleLower', '<', prefixNormalized + ''),
    orderBy('titleLower'),
    limit(resultLimit)
  );
  return onSnapshot(
    q,
    snapshot => onData(snapshot.docs.map(docToGuardedDocument)),
    err => onError(err as Error)
  );
}

/**
 * Assina (tempo real) documentos com guarda vencendo/vencida — usado
 * pelo ExpiringDocumentsPanel. Sem `sectorId`, traz de todos os
 * setores (só é permitido pra admin pelas Firestore Rules); com
 * `sectorId`, fica restrito àquele setor (gestor / canManageRetention).
 * `status` gravado nunca é 'vencendo'/'vencido' (esses dois são
 * calculados no cliente a partir de retentionUntil — ver
 * computeDocumentStatus em utils/guardedDocuments.ts); só existe
 * 'ativo' ou 'eliminado' salvos de verdade, então filtrar por
 * status=='ativo' já cobre tudo que ainda não foi marcado pra
 * eliminação.
 */
export function subscribeToExpiringDocuments(
  companyId: string,
  options: { sectorId?: string | null; horizonDays?: number; resultLimit?: number },
  onData: (docs: GuardedDocument[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const horizonDays = options.horizonDays ?? 90;
  const resultLimit = options.resultLimit ?? 50;
  const horizonDate = new Date();
  horizonDate.setDate(horizonDate.getDate() + horizonDays);
  const horizonIso = horizonDate.toISOString();

  const constraints = [
    where('companyId', '==', companyId),
    where('status', '==', 'ativo'),
    where('retentionUntil', '<=', horizonIso)
  ];
  if (options.sectorId) {
    constraints.push(where('sectorId', '==', options.sectorId));
  }

  const q = query(
    collection(db, COLLECTION_NAME),
    ...constraints,
    orderBy('retentionUntil', 'asc'),
    limit(resultLimit)
  );
  return onSnapshot(
    q,
    snapshot => onData(snapshot.docs.map(docToGuardedDocument)),
    err => onError(err as Error)
  );
}
