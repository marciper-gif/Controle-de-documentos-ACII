import { SectorData } from '../types';

// ─────────────────────────────────────────────────────────────────────
// Fase 4 (rebranding) — catálogo de EXEMPLO usado só pra semear uma
// empresa nova sem nenhum setor cadastrado ainda (ver seedDatabaseIfEmpty
// em src/lib/firebaseSync.ts). Antes desta fase, este arquivo trazia os
// 10 setores REAIS da ACII (com descrições específicas dela — "Centro de
// Convenções", "Certificados Digitais ICP-Brasil", etc.), o que fazia
// pouco sentido como ponto de partida pra qualquer outra empresa. Os
// dados reais da ACII continuam intactos no Firestore dela — nada disto
// afeta o que já está em produção, só o que uma empresa NOVA recebe como
// sugestão inicial (totalmente editável/removível por ela depois, via
// SectorManager.tsx).
export const initialSectors: SectorData[] = [
  {
    id: 'SEC-001',
    name: 'Administrativo',
    description: 'Coordenação geral, secretaria, organização de reuniões e apoio operacional às demais áreas.',
    color: 'border-sky-500/20 hover:border-sky-500 bg-sky-500/5 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400'
  },
  {
    id: 'SEC-002',
    name: 'RH',
    description: 'Gestão de pessoas, recrutamento e seleção, integração de novos colaboradores e desenvolvimento de equipe.',
    color: 'border-emerald-500/20 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450'
  },
  {
    id: 'SEC-003',
    name: 'Financeiro',
    description: 'Contas a pagar e receber, fluxo de caixa, conciliação bancária e controle orçamentário.',
    color: 'border-rose-500/20 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-455'
  },
  {
    id: 'SEC-004',
    name: 'Comercial',
    description: 'Prospecção e relacionamento com clientes, propostas comerciais e acompanhamento de vendas.',
    color: 'border-blue-500/20 hover:border-blue-500 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400'
  },
  {
    id: 'SEC-005',
    name: 'TI',
    description: 'Suporte técnico, infraestrutura de rede, segurança da informação e sistemas internos.',
    color: 'border-slate-500/20 hover:border-slate-500 bg-slate-500/5 hover:bg-slate-500/10 text-slate-600 dark:text-slate-400'
  },
  {
    id: 'SEC-006',
    name: 'Jurídico',
    description: 'Análise e elaboração de contratos, conformidade regulatória e orientação jurídica interna.',
    color: 'border-teal-500/20 hover:border-teal-500 bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 dark:text-teal-400'
  }
];
