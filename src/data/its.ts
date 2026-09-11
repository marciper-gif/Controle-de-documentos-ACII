import { IT } from '../types';

// ─────────────────────────────────────────────────────────────────────
// Fase 4 (rebranding) — catálogo de EXEMPLO pra empresa nova (mesmo
// raciocínio de src/data/sectors.ts). Reduzido a 2 exemplos genéricos.
export const initialITs: IT[] = [
  {
    id: 'IT-001',
    title: 'Como Solicitar Reembolso de Despesas',
    sector: 'Financeiro',
    objective: 'Orientar o colaborador sobre o passo a passo para solicitar reembolso de despesas realizadas a serviço da empresa.',
    responsible: 'Colaborador solicitante',
    steps: [
      'Reunir os comprovantes (notas fiscais ou recibos) das despesas realizadas',
      'Preencher o formulário de solicitação de reembolso com data, valor e finalidade',
      'Anexar os comprovantes ao formulário',
      'Enviar a solicitação ao setor Financeiro para análise e pagamento'
    ],
    emissionDate: '01/01/2026',
    revision: '00'
  },
  {
    id: 'IT-002',
    title: 'Como Abrir um Chamado de Suporte de TI',
    sector: 'TI',
    objective: 'Orientar o colaborador sobre como registrar corretamente uma solicitação de suporte técnico.',
    responsible: 'Colaborador solicitante',
    steps: [
      'Descrever o problema com o máximo de detalhes possível',
      'Informar o nível de urgência da solicitação',
      'Registrar o chamado pelo canal oficial de suporte (sistema, e-mail ou telefone)',
      'Acompanhar o andamento até a confirmação de resolução'
    ],
    emissionDate: '01/01/2026',
    revision: '00'
  }
];
