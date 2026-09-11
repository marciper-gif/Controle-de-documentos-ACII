import { ATR } from '../types';

// ─────────────────────────────────────────────────────────────────────
// Fase 4 (rebranding) — catálogo de EXEMPLO pra empresa nova (ver nota
// grande em src/data/sectors.ts; mesmo raciocínio aqui). Antes trazia ~20
// ATRs reais da ACII; reduzido a 3 exemplos genéricos, editáveis/
// removíveis livremente por qualquer empresa depois do primeiro acesso.
export const initialATRs: ATR[] = [
  {
    id: 'Atr-001',
    title: 'Assistente Administrativo',
    sector: 'Administrativo',
    directLeader: 'Coordenador Administrativo',
    summary: 'Apoia as rotinas administrativas da empresa, incluindo organização de documentos, agendamentos e suporte às demais áreas.',
    detailedTasks: [
      'Organizar e arquivar documentos físicos e digitais',
      'Agendar reuniões e gerenciar a agenda da coordenação',
      'Receber e direcionar correspondências e solicitações internas',
      'Auxiliar na elaboração de relatórios administrativos'
    ],
    requirements: {
      education: 'Ensino médio completo; desejável cursando ensino superior em Administração ou áreas afins',
      technicalCompetencies: ['Pacote Office / Google Workspace', 'Organização de arquivos físicos e digitais'],
      experience: '6 meses em rotinas administrativas',
      skills: ['Organização', 'Comunicação escrita', 'Atenção a detalhes'],
      attitudes: ['Proatividade', 'Discrição', 'Trabalho em equipe']
    },
    emissionDate: '01/01/2026',
    revision: '00'
  },
  {
    id: 'Atr-002',
    title: 'Analista Financeiro',
    sector: 'Financeiro',
    directLeader: 'Coordenador Financeiro',
    summary: 'Responsável pelo controle de contas a pagar e receber, conciliação bancária e apoio ao fechamento financeiro mensal.',
    detailedTasks: [
      'Lançar e conferir contas a pagar e a receber',
      'Realizar conciliação bancária diária',
      'Apoiar o fechamento financeiro mensal',
      'Emitir relatórios de fluxo de caixa'
    ],
    requirements: {
      education: 'Ensino superior em Administração, Contabilidade ou áreas afins',
      technicalCompetencies: ['Planilhas eletrônicas avançadas', 'Sistemas de gestão financeira (ERP)'],
      experience: '1 ano em rotinas financeiras',
      skills: ['Análise numérica', 'Organização', 'Precisão'],
      attitudes: ['Ética', 'Responsabilidade', 'Foco em prazos']
    },
    emissionDate: '01/01/2026',
    revision: '00'
  },
  {
    id: 'Atr-003',
    title: 'Coordenador de TI',
    sector: 'TI',
    directLeader: 'Diretoria Executiva',
    summary: 'Coordena a infraestrutura de tecnologia, suporte técnico e segurança da informação da empresa.',
    detailedTasks: [
      'Gerenciar chamados de suporte técnico e priorizar atendimentos',
      'Manter a infraestrutura de rede e servidores',
      'Definir e acompanhar políticas de segurança da informação',
      'Avaliar e propor melhorias em sistemas internos'
    ],
    requirements: {
      education: 'Ensino superior em Tecnologia da Informação ou áreas afins',
      technicalCompetencies: ['Redes e infraestrutura', 'Segurança da informação (LGPD)', 'Gestão de sistemas internos'],
      experience: '2 anos em cargos técnicos ou de coordenação de TI',
      skills: ['Resolução de problemas', 'Comunicação técnica', 'Planejamento'],
      attitudes: ['Liderança', 'Proatividade', 'Atualização constante']
    },
    emissionDate: '01/01/2026',
    revision: '00'
  }
];
