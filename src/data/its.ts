import { IT } from '../types';

export const initialITs: IT[] = [
  {
    id: 'IT-001',
    title: 'Higienização de Teclados e Mouses',
    sector: 'Tecnologia da Informação',
    objective: 'Garantir a limpeza física rápida e correta de mouses e teclados nos postos de atendimento para evitar mau funcionamento e acúmulo de sujeira.',
    responsible: 'Assistente de TI',
    steps: [
      'Desconectar o periférico (mouse/teclado) da porta USB do computador.',
      'Utilizar um pincel de cerdas macias para remover resíduos sólidos entre as teclas e botões.',
      'Umedecer levemente um pano de microfibra com álcool isopropílico (não utilizar álcool líquido comum nem aplicar diretamente).',
      'Passar o pano suavemente sobre a superfície das teclas, laterais e cabo.',
      'Aguardar secar por 1 minuto, reconectar na porta USB e testar o funcionamento.'
    ],
    emissionDate: '2026-01-15',
    revision: '1',
    revisionDate: '2026-01-15'
  },
  {
    id: 'IT-002',
    title: 'Impressão de Relatório Diário de Atendimento',
    sector: 'Atendimento',
    objective: 'Instrução simples para exportação e impressão física do relatório consolidado do sistema interno.',
    responsible: 'Recepcionista',
    steps: [
      'Acessar o Painel de Atendimento com login e senha.',
      'Navegar até o menu Superior > Relatórios > Consolidado Diário.',
      'Selecionar a data atual e clicar no botão "Filtrar".',
      'Clicar no ícone de Impressora no canto direito superior.',
      'Escolher a impressora "ACII-RECEP-01", selecionar o modo "Preto e Branco" e clicar em Imprimir.'
    ],
    emissionDate: '2026-02-10',
    revision: '1',
    revisionDate: '2026-02-10'
  },
  {
    id: 'IT-003',
    title: 'Arquivamento de Notas Fiscais Recebidas',
    sector: 'Financeiro',
    objective: 'Definir o fluxo de armazenamento digital e físico de notas fiscais recebidas para prestação de contas mensal.',
    responsible: 'Auxiliar de Faturamento',
    steps: [
      'Baixar o arquivo XML e PDF da nota fiscal eletrônica.',
      'Renomear os arquivos no padrão "AAAA-MM-DD_CNPJ_NUMERO.pdf".',
      'Salvar na pasta compartilhada "Financeiro > Notas Recebidas > [Ano Atual] > [Mês Atual]".',
      'Imprimir uma cópia física apenas se houver solicitação específica da Diretoria.',
      'Registrar o valor, número e fornecedor na planilha de controle do caixa semanal.'
    ],
    emissionDate: '2026-03-05',
    revision: '1'
  }
];
