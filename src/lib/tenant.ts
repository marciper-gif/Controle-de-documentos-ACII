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
