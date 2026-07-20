import { SectorData } from '../types';

export const initialSectors: SectorData[] = [
  { 
    id: 'SEC-001', 
    name: 'Administrativo', 
    description: 'Coordenação operacional, secretaria, suprimentos e processos gerais de controle interno da associação.', 
    color: 'border-sky-500/20 hover:border-sky-500 bg-sky-500/5 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400' 
  },
  { 
    id: 'SEC-002', 
    name: 'RH', 
    description: 'Recursos Humanos, departamento pessoal, recrutamento, seleção, treinamento e integração da equipe.', 
    color: 'border-emerald-500/20 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450' 
  },
  { 
    id: 'SEC-003', 
    name: 'Marketing', 
    description: 'Comunicação institucional, assessoria de imprensa, mídias sociais, identidade e campanhas promocionais.', 
    color: 'border-purple-500/20 hover:border-purple-500 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400' 
  },
  { 
    id: 'SEC-004', 
    name: 'Autoridade de Registro', 
    description: 'Certificação digital ICP-Brasil, agendamentos, validação, verificação de documentação e emissão de certificados.', 
    color: 'border-amber-500/20 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400' 
  },
  { 
    id: 'SEC-005', 
    name: 'Eventos', 
    description: 'Planejamento de feiras, captação de patrocínio, negociação, logística de montagem e recepção de eventos.', 
    color: 'border-indigo-500/20 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
  },
  { 
    id: 'SEC-006', 
    name: 'Financeiro', 
    description: 'Fluxo de caixa, conciliação bancária, contas a pagar, faturamento de associados e demonstrativos financeiros.', 
    color: 'border-rose-500/20 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-455' 
  },
  { 
    id: 'SEC-007', 
    name: 'Juridico', 
    description: 'Assessoria jurídica, análise de contratos, atas, pareceres legais e conformidade de regimentos da ACII.', 
    color: 'border-teal-500/20 hover:border-teal-500 bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 dark:text-teal-400' 
  },
  { 
    id: 'SEC-008', 
    name: 'TI', 
    description: 'Suporte técnico aos computadores, manutenção de servidores, gerenciamento de sistemas de gestão e rede.', 
    color: 'border-slate-500/20 hover:border-slate-500 bg-slate-500/5 hover:bg-slate-500/10 text-slate-600 dark:text-slate-400' 
  },
  { 
    id: 'SEC-009', 
    name: 'Comercial', 
    description: 'Prospecção de novos associados, vendas de soluções, negociação de patrocínios e relacionamento comercial com empresas.', 
    color: 'border-blue-500/20 hover:border-blue-500 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400' 
  }
];
