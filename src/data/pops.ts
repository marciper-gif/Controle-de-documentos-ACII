import { POP } from '../types';

// ─────────────────────────────────────────────────────────────────────
// Fase 4 (rebranding) — catálogo de EXEMPLO pra empresa nova (mesmo
// raciocínio de src/data/sectors.ts). Antes trazia dezenas de POPs reais
// da ACII (SEBRAE, SERASA, FECOIMP, Certisign...); reduzido a 3 exemplos
// genéricos que fazem sentido pra praticamente qualquer empresa.
export const initialPOPs: POP[] = [
  {
    id: 'POP-001',
    title: 'Integração de Novo Colaborador',
    process: 'RECURSOS HUMANOS',
    sector: 'RH',
    emissionDate: '01/01/2026',
    revision: '00',
    pages: '1/1',
    objective: 'Padronizar o processo de recepção e integração de novos colaboradores, garantindo que recebam as informações e acessos necessários desde o primeiro dia.',
    applicationField: ['Aplica-se a todo colaborador admitido pela empresa'],
    responsiblePrimary: 'Analista de RH',
    responsibleSupport: ['Coordenador da área de destino', 'TI'],
    inputs: ['Documentação admissional', 'Cronograma de integração'],
    steps: [
      { title: 'Preparação pré-chegada', description: 'Solicitar criação de acessos (e-mail, sistemas) e preparar posto de trabalho antes da data de admissão.' },
      { title: 'Recepção no primeiro dia', description: 'Apresentar o colaborador à equipe, explicar normas internas e entregar materiais de boas-vindas.' },
      { title: 'Treinamento inicial', description: 'Apresentar processos e ferramentas da área, com apoio do coordenador direto.' },
      { title: 'Acompanhamento', description: 'Verificar adaptação do colaborador após 30 e 90 dias.' }
    ],
    outputs: ['Colaborador integrado e apto a exercer suas funções'],
    performanceIndicators: ['Tempo médio de integração', 'Taxa de retenção nos primeiros 90 dias']
  },
  {
    id: 'POP-002',
    title: 'Abertura e Atendimento de Chamado de TI',
    process: 'TECNOLOGIA DA INFORMAÇÃO',
    sector: 'TI',
    emissionDate: '01/01/2026',
    revision: '00',
    pages: '1/1',
    objective: 'Padronizar o registro, priorização e atendimento de solicitações de suporte técnico.',
    applicationField: ['Aplica-se a todos os colaboradores que precisem de suporte técnico'],
    responsiblePrimary: 'Analista de Suporte',
    responsibleSupport: ['Coordenador de TI'],
    inputs: ['Solicitação do colaborador (sistema de chamados, e-mail ou verbal)'],
    steps: [
      { title: 'Registro do chamado', description: 'Registrar a solicitação com descrição do problema e nível de urgência.' },
      { title: 'Triagem e priorização', description: 'Classificar o chamado por criticidade e direcionar ao responsável.' },
      { title: 'Atendimento', description: 'Realizar o atendimento remoto ou presencial, documentando as ações tomadas.' },
      { title: 'Encerramento', description: 'Confirmar com o solicitante a resolução e encerrar o chamado.' }
    ],
    outputs: ['Chamado resolvido e documentado'],
    performanceIndicators: ['Tempo médio de atendimento', 'Taxa de reabertura de chamados']
  },
  {
    id: 'POP-003',
    title: 'Contas a Pagar e Conciliação Bancária',
    process: 'FINANCEIRO',
    sector: 'Financeiro',
    emissionDate: '01/01/2026',
    revision: '00',
    pages: '1/1',
    objective: 'Garantir o pagamento correto e no prazo das obrigações financeiras, com conciliação bancária periódica.',
    applicationField: ['Aplica-se a todos os pagamentos e recebimentos da empresa'],
    responsiblePrimary: 'Analista Financeiro',
    responsibleSupport: ['Coordenador Financeiro'],
    inputs: ['Notas fiscais e boletos recebidos', 'Extratos bancários'],
    steps: [
      { title: 'Lançamento', description: 'Registrar as contas a pagar e a receber no sistema financeiro.' },
      { title: 'Aprovação', description: 'Submeter pagamentos acima do limite estabelecido para aprovação da coordenação.' },
      { title: 'Pagamento', description: 'Efetuar os pagamentos aprovados dentro do prazo de vencimento.' },
      { title: 'Conciliação', description: 'Conferir os lançamentos com o extrato bancário e tratar divergências.' }
    ],
    outputs: ['Obrigações pagas em dia', 'Extrato conciliado'],
    performanceIndicators: ['Percentual de pagamentos em dia', 'Divergências identificadas na conciliação']
  }
];
