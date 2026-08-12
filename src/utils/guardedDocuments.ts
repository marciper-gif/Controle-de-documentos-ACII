import { GuardedDocument } from '../types';

/**
 * retentionUntil = uploadedAt + retentionYears (item da especificação:
 * "calculado = uploadedAt + retentionYears"). Recebe o ISO de referência
 * (normalmente "agora", no upload; ou a data atual, ao renovar guarda).
 */
export function calculateRetentionUntil(fromIso: string, retentionYears: number): string {
  const date = new Date(fromIso);
  date.setFullYear(date.getFullYear() + retentionYears);
  return date.toISOString();
}

/**
 * Quantos dias faltam para o documento vencer, com base em retentionUntil.
 * Negativo = já venceu há N dias.
 */
export function daysUntilRetentionEnds(doc: GuardedDocument): number {
  const until = new Date(doc.retentionUntil);
  const today = new Date();
  until.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((until.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Status recalculado no carregamento comparando retentionUntil com a data
 * atual — não depende de job agendado (item 5 da especificação).
 * 'eliminado' é um estado manual (ver "Marcar para eliminação") e nunca é
 * sobrescrito por esse cálculo.
 */
export function computeDocumentStatus(doc: GuardedDocument): GuardedDocument['status'] {
  if (doc.status === 'eliminado') return 'eliminado';
  const daysLeft = daysUntilRetentionEnds(doc);
  if (daysLeft < 0) return 'vencido';
  if (daysLeft <= 90) return 'vencendo';
  return 'ativo';
}

export const DOCUMENT_STATUS_LABEL: Record<GuardedDocument['status'], string> = {
  ativo: 'Ativo',
  vencendo: 'Vencendo',
  vencido: 'Vencido',
  eliminado: 'Eliminado'
};

export const DOCUMENT_STATUS_DOT: Record<GuardedDocument['status'], string> = {
  ativo: '🟢',
  vencendo: '🟡',
  vencido: '🔴',
  eliminado: '⚫'
};

export const DOCUMENT_STATUS_CLASSES: Record<GuardedDocument['status'], string> = {
  ativo: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  vencendo: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  vencido: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  eliminado: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
};

// Sugestões padrão de tempo de guarda por tipo de documento (item 4.3 da
// especificação) — usado pelo modal de upload (etapa 5), mas fica aqui
// junto do resto da lógica de domínio do módulo.
export const DEFAULT_RETENTION_YEARS_BY_TYPE: Record<string, number> = {
  'Contrato': 5,
  'Nota Fiscal': 5,
  'Ata': 100, // "permanente" na prática — ver observação da especificação
  'Ficha Funcional': 30, // contados a partir do desligamento, ajustável manualmente
  'Política Interna': 10,
  'Certidão': 5,
  'Outro': 5
};

export const DOCUMENT_TYPE_SUGGESTIONS = [
  'Contrato',
  'Nota Fiscal',
  'Ata',
  'Política Interna',
  'Ficha Funcional',
  'Certidão',
  'Outro'
];
