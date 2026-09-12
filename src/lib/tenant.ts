import { CompanyId } from '../types';

// ─────────────────────────────────────────────────────────────────────
// Contexto de empresa (tenant) da sessão atual — Fase 1 da transformação
// em SaaS multiempresa.
// ─────────────────────────────────────────────────────────────────────
// A ACII é o primeiro tenant do sistema. Todo registro criado antes desta
// fase pertence a ela; o script functions/migrate-add-company-id.js
// carimba companyId=DEFAULT_COMPANY_ID em todos eles antes das novas
// regras do Firestore/Storage (que passam a EXIGIR companyId) irem para
// produção — ver o resumo da Fase 1 para o roteiro de migração.
//
// Guardamos o companyId da sessão aqui, num único lugar (em vez de passar
// como parâmetro por toda função de leitura/gravação já existente), pelo
// mesmo motivo que `db`/`auth` em config/firebase.ts já são um singleton:
// simplicidade de manutenção (regra 5 do prompt) — é um valor por sessão
// de navegador, igual a eles. Quem GRAVA (src/lib/firebaseSync.ts) lê
// daqui; quem LÊ/CONSULTA (hooks de estado, guardedDocumentsQuery.ts,
// documentStorage.ts) recebe companyId explícito por parâmetro — filtrar
// errado numa consulta é o tipo de bug de segurança que deve ficar visível
// no código, não escondido atrás de um singleton.
export const DEFAULT_COMPANY_ID: CompanyId = 'acii';

let currentCompanyId: CompanyId | null = null;

/** Chamado pelo App.tsx assim que o login (por senha ou Google) resolve o usuário. */
export function setCurrentCompanyId(companyId: CompanyId | null): void {
  currentCompanyId = companyId;
}

/**
 * companyId da sessão atual. Cai para DEFAULT_COMPANY_ID (ACII) quando
 * ainda não foi definido — mesmo comportamento de fallback usado no
 * servidor (functions/index.js) para contas ainda não migradas.
 */
export function getCurrentCompanyId(): CompanyId {
  return currentCompanyId || DEFAULT_COMPANY_ID;
}

// ─────────────────────────────────────────────────────────────────────
// Endereço real (chave do documento no Firestore) de um item com "código
// de exibição" sequencial — sectors/atrs/pops/its. Achado depois de
// publicado: o código bonito que o usuário vê e edita ("POP-001") e a
// chave do documento no banco eram o MESMO campo. Cada empresa numera os
// próprios POP/ATR/IT/setor a partir de 1, então toda empresa NOVA tinha
// "POP-001" — e como a coleção é compartilhada entre empresas, isso
// colidia com o "POP-001" de verdade da ACII (Firestore trata escrever
// numa chave que já existe como EDIÇÃO, não criação, e a regra bloqueia
// por ser de outra empresa).
//
// A correção: o CÓDIGO (campo `id` dentro do documento, o que aparece na
// tela, na URL, no PDF impresso) continua limpo e sem sufixo pra
// qualquer empresa. Só a CHAVE do documento no Firestore (nunca exposta
// na interface) ganha o companyId na frente pra qualquer empresa que não
// seja a ACII, garantindo endereço único mesmo com códigos repetidos
// entre empresas diferentes. A ACII mantém a chave idêntica ao código de
// sempre (dado real já em produção — nenhuma migração necessária).
// ─────────────────────────────────────────────────────────────────────
export function tenantDocPath(companyId: CompanyId | null | undefined, id: string): string {
  const cid = companyId || getCurrentCompanyId();
  return cid === DEFAULT_COMPANY_ID ? id : `${cid}__${id}`;
}
