import { POP } from '../types';

export const initialPOPs: POP[] = [
  {
    id: 'POP-001',
    title: 'Participação em Eventos e Reuniões de Patrocínio',
    process: 'ADMINISTRATIVO',
    sector: 'Administrativo',
    emissionDate: '05/03/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Padronizar o planejamento, logística e comunicação para participação institucional em eventos externos e reuniões de captação de patrocínio, garantindo alinhamento estratégico e representação adequada da ACII.',
    applicationField: [
      'Diretoria',
      'Gerência Executiva',
      'Secretaria Executiva',
      'Marketing',
      'Financeiro',
      'Assessoria de Imprensa'
    ],
    responsiblePrimary: 'Secretária Executiva',
    responsibleSupport: [
      'Gerente Executiva',
      'Diretoria',
      'Financeiro',
      'Coordenador de Marketing',
      'Assessoria de Imprensa'
    ],
    inputs: [
      'Convite formal ou demanda da Diretoria',
      'Calendário institucional',
      'Solicitação de patrocínio ou reunião institucional',
      'Diretrizes estratégicas de representação'
    ],
    steps: [
      {
        title: '5.1 Participação em Eventos (dentro ou fora da cidade)',
        description: 'Processo de recebimento, triagem e providências logísticas para a participação da Diretoria em eventos externos.',
        substeps: [
          'A Secretária Executiva recebe o convite ou solicitação de participação.',
          'Informa imediatamente à Gerente Executiva sobre o evento.',
          'A Secretária Executiva providencia: Contato com a organização para definir grau de participação da Diretoria e confirmação de presença ou ausência via ofício formal.',
          'O setor Financeiro providencia, quando aplicável, as passagens e hospedagem.',
          'O Financeiro repassa vouchers e comprovantes à Secretária Executiva, que os encaminha à Diretoria.',
          'A Secretária Executiva inclui o evento na Agenda Geral.',
          'O Coordenador de Marketing, com base na Agenda, realiza cotações para assessoria de imprensa.',
          'Envia os orçamentos ao Financeiro, que aprova a contratação junto à Diretoria Financeira e devolve a escolha ao Marketing.',
          'O Coordenador de Marketing repassa ao Assessor de Imprensa as diretrizes de cobertura da participação.',
          'O Marketing executa a cobertura, publica as mídias e dá publicidade institucional.'
        ]
      },
      {
        title: '5.2 Reunião de Pedido de Patrocínio',
        description: 'Fluxo para viagens, elaboração de materiais institucionais, relatórios e prestação de contas para captação de patrocínio.',
        substeps: [
          'A Diretoria informa à Gerente Executiva a necessidade de viagem para pedido de patrocínio.',
          'A Gerente Executiva repassa à Secretária Executiva com todas as determinações e objetivos.',
          'A Secretária Executiva providencia: Elaboração do roteiro de visitas por localização e logística, elaboração de ofícios de solicitação de agenda, envio de ofício sugerindo datas, confirmação telefônica do recebimento e registro da resposta.',
          'A Gerente Executiva solicita ao Marketing a confecção de materiais: proposta de patrocínio, relatório de prestação de contas, cartões de visita e brindes.',
          'O Marketing envia 3 cotações por item ao Financeiro para aprovação.',
          'O Financeiro, em conjunto com a Gerente Executiva e Diretor Financeiro, aprova os orçamentos e efetua as compras.',
          'A Secretária Executiva elabora os ofícios de solicitação impressos e organiza todos os materiais adquiridos.',
          'A Diretoria recebe o kit de viagem (impressos, brindes, ofícios, cartões, relatórios) em quantidade superior ao número de visitas previstas.',
          'A Assessoria de Imprensa registra a reunião, publica em tempo real e organiza material para as redes sociais.',
          'Após a reunião, a Diretoria devolve os ofícios protocolados à Gerência Executiva, que os repassa à Secretária Executiva para digitalização, arquivamento no sistema e guarda física.'
        ]
      }
    ],
    outputs: [
      'Agenda Geral atualizada',
      'Ofícios protocolados/arquivados',
      'Cobertura midiática publicada',
      'Kit de materiais entregue à Diretoria',
      'Relatório de prestação de contas (quando aplicável)'
    ],
    performanceIndicators: [
      '% de eventos com cobertura publicada no prazo',
      'Taxa de conversão de reuniões de patrocínio',
      'Conformidade logística (zero atrasos/falhas)'
    ]
  },
  {
    id: 'POP-002',
    title: 'Recepção em Eventos',
    process: 'ADMINISTRATIVO',
    sector: 'Administrativo',
    emissionDate: '05/03/2026',
    revision: '00',
    pages: '1 de 2',
    objective: 'Garantir a organização, credenciamento eficiente e acolhimento adequado de participantes em eventos realizados ou apoiados pela ACII.',
    applicationField: [
      'Secretaria Executiva',
      'TI',
      'Equipe de Apoio',
      'Setor de Eventos'
    ],
    responsiblePrimary: 'Secretária Executiva',
    responsibleSupport: [
      'TI',
      'Auxiliar de Eventos',
      'Marketing'
    ],
    inputs: [
      'Lista de inscritos/participantes',
      'Kits montados (credenciais, sacolas, canetas, blocos)',
      'Equipamentos de TI (computadores, impressoras)',
      'Cronograma do evento'
    ],
    steps: [
      {
        title: '5.1 Eventos de Grande Porte (exceto FECOIMP)',
        description: 'Ações de preparação e execução do credenciamento em grandes cerimônias e feiras.',
        substeps: [
          'Um dia antes do evento: Definir o local exato da recepção.',
          'Um dia antes do evento: O TI instala computadores e impressoras no local designado.',
          'Um dia antes do evento: A Secretária Executiva leva os kits dos participantes.',
          'No dia do evento: O participante apresenta ingresso impresso ou informa seu nome para confirmação no sistema.',
          'No dia do evento: Imprime etiqueta com o nome, cola na credencial e entrega ao participante.',
          'No dia do evento: Mantém o fluxo de credenciamento ativo por toda a duração do evento.'
        ]
      },
      {
        title: '5.2 Pequenos Eventos e Reuniões Gerais',
        description: 'Fluxo simplificado para reuniões, palestras de menor porte ou encontros internos.',
        substeps: [
          'Antes: Enviar convites e confirmar presença dos participantes.',
          'Durante: Imprimir e disponibilizar listas de assinatura com campos para nome, empresa e telefone.',
          'Manter o controle de presença ativo durante todo o evento.'
        ]
      }
    ],
    outputs: [
      'Participantes credenciados',
      'Listas de presença assinadas',
      'Kits entregues conforme planejamento'
    ],
    performanceIndicators: [
      'Tempo médio de credenciamento por participante',
      '% de listas de presença preenchidas corretamente',
      'Índice de satisfação com o acolhimento (pesquisa rápida/pós-evento)'
    ]
  },
  {
    id: 'POP-003',
    title: 'Organização da Reunião Geral',
    process: 'ADMINISTRATIVO',
    sector: 'Administrativo',
    emissionDate: '05/03/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Padronizar o planejamento, execução, documentação e logística das Reuniões Gerais da ACII, assegurando transparência e participação institucional.',
    applicationField: [
      'Secretaria Executiva',
      'Marketing',
      'Gerência Executiva',
      'Financeiro',
      'RH',
      'Secretário Geral',
      'Equipe de Apoio'
    ],
    responsiblePrimary: 'Secretária Executiva',
    responsibleSupport: [
      'Marketing',
      'Gerente Executiva',
      'Financeiro',
      'RH',
      'Secretário Geral',
      'Auxiliar de Eventos'
    ],
    inputs: [
      'Solicitação da Diretoria/Gerência Executiva',
      'Disponibilidade de local (preferencialmente Mezanino ACII)',
      'Lista de associados e novos filiados',
      'Pauta preliminar e diretrizes da Gerência Executiva'
    ],
    steps: [
      {
        title: '5.1 Antes da Reunião',
        description: 'Passos operacionais para preparação de convites, certificados, roteiros, buffet e alinhamentos.',
        substeps: [
          'Confirmar disponibilidade do local.',
          'Acompanhar elaboração do convite junto ao Marketing.',
          'Receber o convite e enviar para aprovação da Gerente Executiva. Se houver alterações, retornar ao Marketing; se aprovado, segue.',
          'Enviar o convite nos grupos da Diretoria Setorial, ACII Jovem, ACII Mulher e entidades parceiras.',
          'Enviar individualmente e ligar para confirmar presença.',
          'Realizar checklist de novos associados desde a última reunião e enviar convites para entrega de certificado.',
          'Reiterar convites a novos associados faltantes em reuniões subsequentes até sua presença.',
          'Marketing cria o certificado; Secretaria executa a impressão.',
          'Montar roteiro da reunião com informações da Gerente Executiva.',
          'Enviar roteiro para aprovação da Gerente Executiva (ajustar se necessário).',
          'Enviar roteiro aprovado ao Marketing para criação dos slides.',
          'Caso haja apresentação externa, solicitar material aos convidados e enviar ao Marketing para integração.',
          'Marketing envia slide à Secretária Executiva para revisão e correção.',
          'Gerar PDF da apresentação e enviar ao Secretário Geral para análise de ajustes.',
          'Enviar material final ao Auxiliar de Eventos, que repassa ao operador de som/imagem contratado.',
          'Imprimir listas de assinatura (nome, empresa, telefone).',
          'Financeiro cotar buffet (3 fornecedores), enviar para aprovação por custo-benefício e fechar contratação.',
          'Confirmar com o Marketing a equipe de cobertura.',
          'Acompanhar montagem do layout conforme confirmações e tipo de evento.',
          'Imprimir pautas da reunião.'
        ]
      },
      {
        title: '5.2 Durante a Reunião Geral',
        description: 'Procedimento de recepção, pautas, termos de filiação e registros fotográficos em tempo real.',
        substeps: [
          'Confirmar com o RH se a Consultora do Comercial disponível foi convidada.',
          'Recepcionar convidados, recolher assinaturas e separar termos dos novos associados presentes.',
          'Dispor pautas nas mesas.',
          'Acompanhar apresentador e tirar dúvidas sobre o roteiro.',
          'Entregar ao Secretário Geral os termos de novos associados, junto com apresentação e foto para registro.',
          'Recolher materiais restantes, guardar no arquivo, e digitar lista de presença no Google Sheets.'
        ]
      }
    ],
    outputs: [
      'Convites enviados e presença confirmada',
      'Pauta e slides validados',
      'Lista de presença digitalizada',
      'Certificados entregues e termos arquivados',
      'Cobertura midiática publicada'
    ],
    performanceIndicators: [
      '% de presença de associados convocados',
      'Cumprimento do cronograma da reunião',
      'Conformidade na digitalização e arquivamento de listas'
    ]
  },
  {
    id: 'POP-004',
    title: 'Atualização de Certidões',
    process: 'ADMINISTRATIVO',
    sector: 'Administrativo',
    emissionDate: '05/03/2026',
    revision: '00',
    pages: '1 de 2',
    objective: 'Garantir a regularidade, atualização e arquivamento correto das certidões negativas e documentos legais da ACII, evitando riscos de inadimplência ou irregularidade institucional.',
    applicationField: [
      'Setor Administrativo/Secretaria',
      'Jurídico',
      'Financeiro'
    ],
    responsiblePrimary: 'Auxiliar Administrativo/Secretaria',
    responsibleSupport: [
      'Jurídico',
      'Financeiro',
      'Gerente Executiva'
    ],
    inputs: [
      'Planilha de controle de validades',
      'Pasta física de certidões vigentes',
      'Alertas de vencimento (pré-configurados)'
    ],
    steps: [
      {
        title: '5.1 Procedimento de Monitoramento e Emissão',
        description: 'Fluxo de verificação mensal e atualização periódica das certidões obrigatórias da entidade.',
        substeps: [
          'As certidões (Federais, Estaduais e Municipais) são mantidas em pasta específica do setor.',
          'O setor monitora a validade utilizando planilha com: nome da certidão, data de emissão e vencimento.',
          'Ao identificar proximidade do vencimento ou certidão vencida, emitir nova via no órgão competente e substituir na pasta.',
          'A Certidão de Falência e Concordata é emitida no Fórum, exigindo apoio do Auxiliar Administrativo de Eventos para retirada física.',
          'A Certidão de Inteiro Teor pode ser emitida online ou presencialmente em Cartório.',
          'Manter sob controle a lista padrão: Certidão de Inteiro Teor do Estatuto, Certidão de Falência e Concordata, Certidões Negativas do FGTS, Dívidas Trabalhistas, Débito Federal, Débito Estadual, Débito Municipal, Débitos CAEMA e Dívida Ativa da União - PF do Presidente da ACII.'
        ]
      }
    ],
    outputs: [
      'Pasta física atualizada',
      'Planilha de controle revisada',
      'Certidões válidas arquivadas e digitalizadas'
    ],
    performanceIndicators: [
      '% de certidões dentro da validade',
      'Tempo médio de renovação após alerta',
      'Zero penalidades ou apontamentos por documentos vencidos'
    ]
  },
  {
    id: 'POP-005',
    title: 'Gestão da Agenda Geral',
    process: 'ADMINISTRATIVO',
    sector: 'Administrativo',
    emissionDate: '05/03/2026',
    revision: '00',
    pages: '1 de 2',
    objective: 'Centralizar, filtrar e gerenciar a agenda institucional da ACII, assegurando alinhamento estratégico, priorização de demandas e participação adequada da Diretoria.',
    applicationField: [
      'Secretaria Executiva',
      'Gerente Executiva',
      'Diretoria Setorial',
      'Presidente'
    ],
    responsiblePrimary: 'Secretária Executiva',
    responsibleSupport: [
      'Gerente Executiva',
      'Presidente',
      'Diretorias Setoriais'
    ],
    inputs: [
      'Demanda de associado, parceiro ou entidade',
      'Projeto formal ou pedido informal',
      'Solicitação interna da Diretoria/Gerência'
    ],
    steps: [
      {
        title: '5.1 Triagem e Alinhamento Logístico',
        description: 'Processo de recepção de demandas, análise de escopo com a Gerência e formalização dos compromissos.',
        substeps: [
          'A demanda é iniciada por associado, parceiro, diretoria ou gerência.',
          'A Secretária Executiva realiza filtro inicial (avaliando se o processo segue para instâncias superiores ou é negado de plano, informando à Gerente).',
          'Quando ultrapassa o escopo inicial, a Secretaria encaminha o pedido à Gerente Executiva, que analisa e identifica qual diretoria setorial deverá atuar.',
          'A Gerente Executiva decide sobre a participação obrigatória do Presidente em instâncias governamentais superiores ou patrocinadores de alto impacto.',
          'A Secretária Executiva contata o solicitante para alinhar data, confirmar participantes e formalizar o agendamento.',
          'Após o alinhamento, registrar o compromisso na Agenda Geral e iniciar a organização logística.',
          'Seguir o POP-003 a partir do capítulo 5.1 (item 9 em diante) para etapas pertinentes ao tipo de reunião.'
        ]
      }
    ],
    outputs: [
      'Agenda Geral atualizada e compartilhada',
      'Reuniões agendadas com pauta e participantes definidos',
      'Registro de demandas atendidas ou negadas com justificativa'
    ],
    performanceIndicators: [
      'Tempo médio de resposta à demanda',
      'Taxa de aproveitamento e execução de agendas',
      'Índice de sobreposição/conflito de horários (meta: zero)'
    ]
  },
  {
    id: 'POP-006',
    title: 'Organização dos Arquivos de Filiação dos Associados',
    process: 'ADMINISTRATIVO',
    sector: 'Administrativo',
    emissionDate: '05/03/2026',
    revision: '00',
    pages: '1 de 2',
    objective: 'Padronizar o recebimento, organização, identificação e arquivamento físico da documentação de novos associados, garantindo rastreabilidade e segurança documental.',
    applicationField: [
      'Secretaria Executiva',
      'Financeiro',
      'Jurídico'
    ],
    responsiblePrimary: 'Secretária Executiva',
    responsibleSupport: [
      'Financeiro',
      'Jurídico'
    ],
    inputs: [
      'Documentação completa do novo associado',
      'Termo de adesão assinado',
      'Ficha cadastral preenchida',
      'Número do associado (gerado no SIGAEM)'
    ],
    steps: [
      {
        title: '5.1 Recebimento, Triagem e Arquivamento Físico',
        description: 'Ordenação padrão de contratos, confecção de etiquetas e preenchimento de somatório anual.',
        substeps: [
          'O Financeiro ou Jurídico repassa a documentação completa do novo associado à Secretaria.',
          'Organizar na ordem padrão de arquivamento: a. Termo de Adesão, b. Ficha Cadastral, c. Contrato Social, d. Documentação do Proprietário (CPF, RG ou CNH).',
          'Confeccionar etiqueta com nome fantasia da empresa e número do Associado (gerado pelo Financeiro no SIGAEM).',
          'Incluir o nome do novo associado na Planilha do Sumário de Associados em ordem alfabética. Reimprimir as folhas daquela letra específica para o arquivo físico.',
          'Arquivar na gaveta correspondente, mantendo a ordem alfabética rigorosa.'
        ]
      }
    ],
    outputs: [
      'Pasta física do associado arquivada e etiquetada',
      'Sumário de Associados atualizado',
      'Controle de numeração de associado validado'
    ],
    performanceIndicators: [
      'Tempo médio de arquivamento após recebimento (meta: ≤ 48h)',
      'Conformidade com a ordem padrão de documentos',
      'Zero extravios ou falhas de indexação'
    ]
  },
  {
    id: 'POP-007',
    title: 'Atualização Cadastral de Categorias do SIGAEM',
    process: 'ADMINISTRATIVO',
    sector: 'Administrativo',
    emissionDate: '05/03/2026',
    revision: '00',
    pages: '1 de 2',
    objective: 'Manter a base de dados de categorias institucionais, parceiras e autoridades atualizada no sistema SIGAEM, assegurando precisão para comunicações, convites e gestão de relacionamento.',
    applicationField: [
      'Secretaria Executiva',
      'Marketing',
      'Suporte de TI'
    ],
    responsiblePrimary: 'Secretária Executiva / Equipe Administrativa',
    responsibleSupport: [
      'Marketing',
      'TI (acesso/suporte sistêmico)'
    ],
    inputs: [
      'Relatório atual de categorias extraído do SIGAEM',
      'Lista de instituições parceiras e autoridades',
      'Histórico de contatos e e-mails retornados'
    ],
    steps: [
      {
        title: '5.1 Emissão e Validação de Contatos',
        description: 'Procedimento semestral de ligações, coleta de novos dados e atualização de autoridades locais no sistema.',
        substeps: [
          'Imprimir no SIGAEM a lista atual de categorias: Autoridades, Associações Comerciais, Prefeituras do MA, Secretarias, Câmara, Juízes, Bancos, Patrocinadores, Universidades, etc.',
          'Entrar em contato individual com todos os responsáveis das categorias listadas para validar/atualizar dados.',
          'Coletar e validar: Nome da Instituição, Nome do Responsável, e-mail corporativo, telefone direto e endereço completo.',
          'Após a coleta, lançar as alterações diretamente no SIGAEM, substituindo os dados desatualizados e validando o salvamento.'
        ]
      }
    ],
    outputs: [
      'Relatório SIGAEM atualizado',
      'Base de dados validada e expurgada de contatos inválidos',
      'Registro de histórico de atualizações (data, responsável, alterações)'
    ],
    performanceIndicators: [
      '% de cadastros atualizados por ciclo (semestral/trimestral)',
      'Taxa de resposta dos contatos',
      'Consistência dos dados cruzados com e-mails enviados (taxa de bounce < 5%)'
    ]
  },
  {
    id: 'POP-008',
    title: 'Recrutamento e Seleção',
    process: 'RECURSOS HUMANOS / ADMINISTRATIVO',
    sector: 'RH',
    emissionDate: '26/05/2026',
    revision: '00',
    pages: '1 de 2',
    objective: 'Estabelecer o processo de recrutamento e seleção de colaboradores da ACII, garantindo transparência, critérios técnicos e alinhamento com as necessidades institucionais.',
    applicationField: [
      'Recursos Humanos (RH)',
      'Todos os setores da ACII envolvidos na contratação de novos colaboradores, estagiários e demais quadros funcionais'
    ],
    responsiblePrimary: 'Recursos Humanos (RH)',
    responsibleSupport: [
      'Gerência Executiva',
      'Líder do setor solicitante',
      'Diretor da pasta correspondente',
      'Presidência',
      'Marketing'
    ],
    inputs: [
      'Solicitação formal de vaga com justificativa técnica',
      'Aprovação orçamentária e da Presidência',
      'Definição de perfil, requisitos e atribuições pelo líder solicitante'
    ],
    steps: [
      {
        title: '5.1 Identificação e Validação',
        description: 'Identificação e formalização da necessidade de contratação de novos profissionais.',
        substeps: [
          'O gestor da área identifica a necessidade de contratação.',
          'A demanda é formalizada e enviada ao RH com justificativa da vaga.',
          'RH e Gerência Executiva avaliam a pertinência da contratação.',
          'A solicitação é encaminhada para aprovação da Presidência.',
          'Decisão: Caso não seja autorizada, o processo é encerrado. Caso seja autorizada, o processo segue para recrutamento.'
        ]
      },
      {
        title: '5.2 Divulgação e Recepção',
        description: 'Atração de talentos por meio de mídias institucionais e recebimento de currículos.',
        substeps: [
          'RH solicita ao setor de Marketing a criação de card de divulgação contendo: nome da vaga, principais atribuições, requisitos da função e prazo para envio de currículos.',
          'O material é enviado ao RH e à Gerência Executiva para aprovação.',
          'Marketing realiza a divulgação nos canais institucionais da ACII. É definido prazo para recebimento de currículos.',
          'RH organiza os currículos recebidos.'
        ]
      },
      {
        title: '5.3 Triagem e Entrevistas',
        description: 'Triagem técnica, entrevistas presenciais e avaliações de perfil de candidatos.',
        substeps: [
          'A análise dos currículos é realizada por: Gerência Executiva, RH, Líder do setor solicitante e Diretor da pasta correspondente.',
          'Os candidatos selecionados são convocados para entrevista presencial.',
          'Realização das entrevistas: Para vagas de estágio participam RH, Líder do setor e Gerência Executiva; para vagas CLT participam RH, Líder do setor, Gerência Executiva e Diretor da pasta correspondente.',
          'Durante a entrevista podem ser aplicados: testes técnicos, avaliação de conhecimentos e análise de perfil profissional.'
        ]
      },
      {
        title: '5.4 Decisão e Encerramento',
        description: 'Escolha do candidato finalista e arquivamento de registros do processo.',
        substeps: [
          'Escolha do candidato.',
          'Decisão: Caso um candidato seja selecionado, o processo segue para admissão. Caso nenhum candidato seja aprovado, o processo retorna para a fase de recrutamento e nova divulgação da vaga.',
          'Registro do processo: RH arquiva os registros do processo seletivo para controle institucional.'
        ]
      }
    ],
    outputs: [
      'Vaga preenchida (ou reaberta para nova rodada)',
      'Contratos de trabalho/estágio formalizados',
      'Relatório de triagem e parecer de avaliação',
      'Arquivo físico/digital do processo seletivo'
    ],
    performanceIndicators: [
      'Tempo médio de fechamento de vaga (em dias úteis)',
      'Taxa de retenção no período de experiência',
      'Custo médio por contratação',
      'Nível de satisfação do gestor com o perfil contratado'
    ]
  },
  {
    id: 'POP-009',
    title: 'Admissão de Colaboradores',
    process: 'RECURSOS HUMANOS / ADMINISTRATIVO',
    sector: 'RH',
    emissionDate: '26/05/2026',
    revision: '00',
    pages: '1 de 2',
    objective: 'Padronizar o processo de admissão de colaboradores da ACII, garantindo conformidade legal, organização documental e experiência positiva ao novo colaborador.',
    applicationField: [
      'Recursos Humanos (RH)',
      'Contabilidade',
      'Todos os setores envolvidos na contratação de colaboradores (CLT, estágio e demais vínculos) da ACII'
    ],
    responsiblePrimary: 'Recursos Humanos (RH)',
    responsibleSupport: [
      'Contabilidade',
      'Gerência Executiva',
      'Financeiro (quando necessário)'
    ],
    inputs: [
      'Candidato aprovado no processo seletivo',
      'Documentação pessoal e funcional do colaborador',
      'Informações da função (cargo, salário, jornada, lotação)',
      'Encaminhamento para exame admissional',
      'Diretrizes contratuais da Contabilidade'
    ],
    steps: [
      {
        title: '5.1 Comunicação e Solicitação Documental',
        description: 'Contato inicial com o aprovado e solicitação formal de documentação padrão.',
        substeps: [
          'RH entra em contato com o candidato aprovado informando sua seleção.',
          'RH solicita via WhatsApp ou e-mail a documentação necessária para admissão, conforme lista padrão: RG, CPF, Comprovante de residência, Carteira de Trabalho, Título de Eleitor, Dados bancários, Certificado de Reservista (homens), Certidão de nascimento ou casamento, Número do PIS, Diploma de Graduação (quando exigido para a função), Documentos de dependentes se houver, e Checklist anexo de conferência.'
        ]
      },
      {
        title: '5.2 Recebimento e Conferência',
        description: 'Verificação rigorosa e validação da integridade dos documentos enviados.',
        substeps: [
          'RH recebe e organiza a documentação enviada pelo candidato.',
          'Caso o candidato não envie os documentos no prazo, o RH reforça a solicitação.',
          'Decisão: Caso não seja possível obter a documentação necessária após tentativas, o processo pode retornar à etapa de recrutamento.'
        ]
      },
      {
        title: '5.3 Exame Admissional',
        description: 'Encaminhamento clínico para obtenção do Atestado de Saúde Ocupacional (ASO).',
        substeps: [
          'RH emite encaminhamento para exame admissional em clínica credenciada pela instituição.',
          'Candidato realiza os exames conforme orientações.',
          'Decisão: Caso o candidato não seja considerado apto, o processo é encerrado e pode ser retomado o recrutamento. Caso o candidato seja considerado apto, o processo segue para formalização da contratação.'
        ]
      },
      {
        title: '5.4 Formalização Contratual',
        description: 'Consolidação das vias contratuais e registro nos sistemas legais correspondentes.',
        substeps: [
          'RH reúne: Documentos pessoais conferidos, Resultado do exame admissional (aptidão), e Informações da função (cargo, horário, salário, benefícios).',
          'A documentação é enviada à Contabilidade para: Elaboração do contrato de trabalho, e Registro do colaborador nos sistemas legais (eSocial, CAGED, etc.).'
        ]
      },
      {
        title: '5.5 Integração e Arquivamento',
        description: 'Alinhamento de datas de início, boas-vindas e criação do prontuário funcional.',
        substeps: [
          'RH entra em contato com o novo colaborador confirmando: data de início das atividades, horário de chegada, local de apresentação, e orientações sobre vestimenta.',
          'No dia de início: RH recebe o colaborador, realiza as boas-vindas institucionais e o encaminha ao processo de integração (conhecimento da estrutura, equipe, normas internas e cultura ACII).',
          'Toda documentação é arquivada no prontuário funcional do colaborador (físico e/ou digital), conforme política de guarda documental da ACII.'
        ]
      }
    ],
    outputs: [
      'Contrato de trabalho registrado',
      'Prontuário funcional completo e arquivado',
      'Colaborador integrado e apto a iniciar suas atividades',
      'Registro no eSocial e demais obrigações acessórias cumpridas'
    ],
    performanceIndicators: [
      'Tempo médio entre aprovação e admissão (em dias úteis)',
      'Taxa de desistência na fase documental',
      'Conformidade documental (auditoria interna)',
      'Nível de satisfação do novo colaborador com o processo de admissão (pesquisa de onboarding)'
    ]
  },
  {
    id: 'POP-010',
    title: 'Integração do Novo Colaborador (Onboarding)',
    process: 'RECURSOS HUMANOS / ADMINISTRATIVO',
    sector: 'RH',
    emissionDate: '26/05/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Estabelecer o processo de integração de novos colaboradores da ACII, garantindo adaptação à cultura institucional, compreensão das responsabilidades do cargo e alinhamento com os processos organizacionais.',
    applicationField: [
      'Recursos Humanos (RH)',
      'Gerência Executiva',
      'Liderança do setor do colaborador',
      'Todos os colaboradores admitidos pela ACII (CLT, estágio e demais vínculos)'
    ],
    responsiblePrimary: 'Recursos Humanos (RH)',
    responsibleSupport: [
      'Gerência Executiva',
      'Líder do setor do colaborador',
      'Diretoria da pasta correspondente',
      'Colaborador contratado'
    ],
    inputs: [
      'Colaborador aprovado e com admissão formalizada',
      'ATR (Atribuições, Tarefas e Responsabilidades) do cargo',
      'Regulamento Interno e Código de Ética da ACII',
      'Planejamento Estratégico vigente',
      'Organograma institucional atualizado',
      'Modelos de relatório e indicadores da função'
    ],
    steps: [
      {
        title: '5.1 Etapa 1 – Integração Institucional (Dia 01)',
        description: 'Recepção formal, apresentação geral da instituição e entrega de documentos institucionais.',
        substeps: [
          'RH realiza a recepção formal do novo colaborador.',
          'Apresentação da equipe e das áreas da instituição.',
          'Apresentação da história, missão e posicionamento institucional da ACII.',
          'Entrega do Regulamento Interno e Código de Ética.',
          'Apresentação do Planejamento Estratégico vigente.',
          'Entrega da ATR (Atribuições, Tarefas e Responsabilidades) para leitura inicial.',
          'Apresentação do organograma institucional.'
        ]
      },
      {
        title: '5.2 Etapa 2 – ATR e Alinhamento Estratégico (Dias 02 e 03)',
        description: 'Leitura conjunta das atribuições do cargo e definição de relatórios de atividades.',
        substeps: [
          'RH e Gerência Executiva realizam leitura compartilhada da ATR com o colaborador.',
          'Revisão detalhada das atribuições da função.',
          'Esclarecimento das responsabilidades e expectativas institucionais.',
          'Gerência Executiva define os indicadores de desempenho da função.',
          'Definição do modelo de relatório mensal de atividades.',
          'Registro das primeiras impressões do colaborador sobre o setor.'
        ]
      },
      {
        title: '5.3 Etapa 3 – Imersão nos Processos (Semana 01)',
        description: 'Apresentação de fluxos operacionais, simulação prática e plano de ação inicial.',
        substeps: [
          'Gerência Executiva e Líder do setor apresentam os fluxos operacionais da área.',
          'Apresentação dos fluxos de campanhas, projetos ou eventos, quando aplicável.',
          'Apresentação do fluxo de contratação de fornecedores e demais processos administrativos.',
          'Atividade prática: Simulação de uma demanda real do setor.',
          'Planejamento inicial: Solicitação ao colaborador da elaboração de um Plano de Ação para 30 dias.',
          'Reunião de validação do plano com a Gerência Executiva.',
          'Entrega formal do plano de ação.',
          'Avaliação inicial: Realização de feedback com o colaborador após 7 dias de atividades.'
        ]
      },
      {
        title: '5.4 Etapa 4 – Diagnóstico Inicial (Semana 02)',
        description: 'Diagnóstico operacional do setor e plano de ação para 60 dias.',
        substeps: [
          'Colaborador elabora relatório de diagnóstico do setor.',
          'Identificação de gargalos operacionais e oportunidades de melhoria.',
          'Gerência Executiva solicita Plano de Ação para 60 dias.',
          'Reunião de validação do plano com a Gerência Executiva.',
          'Recebimento da versão final do plano.'
        ]
      },
      {
        title: '5.5 Etapa 5 – Avaliação Comportamental e Desenvoltura (Semanas 03 e 04)',
        description: 'Acompanhamento do comportamento, feedback formal e plano de ação de longo prazo.',
        substeps: [
          'Gerência Executiva observa: postura profissional, relacionamento com equipe, capacidade de iniciativa, organização e cumprimento de prazos.',
          'RH participa de reunião para análise do comportamento e adaptação do colaborador.',
          'Feedback formal: Realização de reunião de feedback com o colaborador.',
          'Desenvolvimento: Solicitação de Plano de Ação para 90 dias.',
          'Monitoramento da evolução do colaborador.',
          'Avaliação intermediária: Até 45 dias é realizada apresentação de resultados parciais.',
          'Reunião de avaliação com Gerência Executiva e RH.'
        ]
      },
      {
        title: '5.6 Etapa 6 – Avaliação do Período de Experiência (Até 90 dias)',
        description: 'Reunião final de desempenho, análise de resultados e decisão de efetivação.',
        substeps: [
          'Gerência Executiva realiza reunião final de avaliação com o colaborador.',
          'Análise dos resultados obtidos durante o período de experiência.',
          'Decisão: Caso o desempenho seja satisfatório -> efetivação do colaborador. Caso não atenda às expectativas -> encerramento do contrato conforme legislação.',
          'Formalização: RH registra a decisão e arquiva os documentos do processo.'
        ]
      }
    ],
    outputs: [
      'Colaborador integrado e alinhado à cultura ACII',
      'ATR assinada e compreendida',
      'Planos de Ação (30, 60 e 90 dias) aprovados',
      'Relatórios de diagnóstico e feedback registrados',
      'Decisão de efetivação ou desligamento formalizada',
      'Prontuário de onboarding arquivado'
    ],
    performanceIndicators: [
      'Taxa de retenção no período de experiência',
      'Nível de satisfação do colaborador com o onboarding (pesquisa pós-90 dias)',
      'Tempo médio para autonomia operacional',
      'Aderência dos Planos de Ação entregues',
      'Avaliação de desempenho ao final do período de experiência'
    ]
  },
  {
    id: 'POP-011',
    title: 'Desligamento de Colaboradores (Demissão)',
    process: 'RECURSOS HUMANOS / ADMINISTRATIVO',
    sector: 'RH',
    emissionDate: '26/05/2026',
    revision: '00',
    pages: '1 de 2',
    objective: 'Estabelecer os procedimentos para desligamento de colaboradores da ACII, garantindo conformidade com a legislação trabalhista, organização documental, preservação da imagem institucional e respeito ao colaborador.',
    applicationField: [
      'Recursos Humanos (RH)',
      'Gestores de Áreas',
      'Contabilidade',
      'Financeiro',
      'Todos os processos de desligamento de colaboradores da ACII (pedido de demissão, dispensa sem/com justa causa ou término de estágio)'
    ],
    responsiblePrimary: 'Recursos Humanos (RH)',
    responsibleSupport: [
      'Gestor da área',
      'Financeiro',
      'Gerência Executiva (quando necessário)',
      'Contabilidade'
    ],
    inputs: [
      'Solicitação formal de desligamento com justificativa',
      'Histórico funcional e disciplinar do colaborador',
      'Diretrizes da legislação trabalhista (CLT)',
      'Aprovação da Gerência Executiva ou Presidência, conforme o caso',
      'Documentação para cálculo rescisório'
    ],
    steps: [
      {
        title: '5.1 Identificação e Solicitação',
        description: 'Comunicação inicial do gestor do setor solicitando o desligamento formal ao RH.',
        substeps: [
          'O gestor da área identifica a necessidade de desligamento.',
          'O gestor comunica formalmente ao RH, apresentando justificativa técnica e/ou comportamental.'
        ]
      },
      {
        title: '5.2 Análise e Validação',
        description: 'Conformidade jurídica trabalhista, levantamento de histórico e validação executiva.',
        substeps: [
          'RH avalia o motivo do desligamento, verificando conformidade legal e consistência da justificativa.',
          'RH verifica histórico do colaborador (advertências, suspensões, avaliações de desempenho) e impactos administrativos.',
          'RH encaminha a solicitação à Gerência Executiva para validação.',
          'Decisão: Caso não seja aprovado, o processo é encerrado e o colaborador permanece. Caso seja aprovado, segue para comunicação.'
        ]
      },
      {
        title: '5.3 Comunicação ao Colaborador',
        description: 'Reunião respeitosa e formal de desligamento dependendo do nível do cargo.',
        substeps: [
          'Para cargos de Auxiliares e Assistentes: RH e Gestor da área realizam reunião de desligamento.',
          'Para cargos de Gestão: RH e Gerência Executiva realizam reunião de desligamento.',
          'A decisão é comunicada de forma clara, objetiva e respeitosa, com registro em ata ou termo de ciência.'
        ]
      },
      {
        title: '5.4 Procedimentos Administrativos e Rescisórios',
        description: 'Acionamento de cálculos de rescisão junto à contabilidade e exames demissionais.',
        substeps: [
          'RH solicita à Contabilidade os seguintes documentos e cálculos: Aviso prévio (trabalhado ou indenizado), Cálculo de rescisão (salários, férias, 13º, FGTS, multa), e Emissão de documentos rescisórios (TRCT, guias de FGTS, seguro-desemprego).',
          'RH realiza as seguintes ações: Agendamento de exame demissional em clínica credenciada, Solicitação formal de cancelamento de convênios (plano de saúde, odontológico, vale-refeição, etc.), e Recolhimento de crachá, equipamentos e materiais institucionais.'
        ]
      },
      {
        title: '5.5 Encaminhamento ao Financeiro e Pagamento',
        description: 'Pagamento das verbas rescisórias dentro do prazo legal.',
        substeps: [
          'RH envia ao Financeiro as informações validadas para pagamento das verbas rescisórias dentro do prazo legal.',
          'Financeiro processa o pagamento e emite comprovante para arquivamento.'
        ]
      },
      {
        title: '5.6 Entrevista de Desligamento e Encerramento',
        description: 'Pesquisa de desligamento com o profissional e arquivamento de prontuário.',
        substeps: [
          'RH realiza entrevista de desligamento (voluntária para o colaborador) para identificar causas, percepções e oportunidades de melhoria institucional.',
          'As informações coletadas são registradas em relatório confidencial para análise estratégica.',
          'Arquivamento: Toda documentação (termos, cálculos, exames, entrevista) é arquivada no prontuário funcional do colaborador, conforme política de guarda documental da ACII.'
        ]
      }
    ],
    outputs: [
      'Documentação rescisória emitida e entregue',
      'Verbas rescisórias pagas dentro do prazo legal',
      'Exame demissional realizado e arquivado',
      'Convênios e acessos institucionais cancelados',
      'Relatório de entrevista de desligamento registrado',
      'Prontuário funcional encerrado e arquivado'
    ],
    performanceIndicators: [
      'Conformidade legal nos processos de desligamento (auditoria interna)',
      'Tempo médio entre solicitação e conclusão do desligamento',
      'Taxa de contestação trabalhista pós-desligamento',
      'Nível de clareza e respeito na comunicação (pesquisa interna com gestores)',
      'Qualidade do registro documental (índice de pendências)'
    ]
  },
  {
    id: 'POP-012',
    title: 'Treinamento e Desenvolvimento',
    process: 'RECURSOS HUMANOS / ADMINISTRATIVO',
    sector: 'RH',
    emissionDate: '26/05/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Promover capacitação contínua dos colaboradores e associados da ACII, aumentando eficiência, qualidade do trabalho, desenvolvimento profissional e alinhamento com os objetivos institucionais.',
    applicationField: [
      'Recursos Humanos (RH)',
      'Gestores de Áreas',
      'Gerência Executiva',
      'Diretoria de Capacitação',
      'Todos os processos de treinamento voltados a colaboradores internos e associados da ACII'
    ],
    responsiblePrimary: 'Recursos Humanos (RH)',
    responsibleSupport: [
      'Gestores das áreas',
      'Gerência Executiva',
      'Diretoria de Capacitação'
    ],
    inputs: [
      'Demandas de capacitação levantadas pelos gestores',
      'Lacunas de competências identificadas em avaliações de desempenho',
      'Solicitações de treinamentos para associados',
      'Planejamento estratégico da ACII',
      'Orçamento disponível para capacitação'
    ],
    steps: [
      {
        title: '5.1 Levantamento de Necessidades',
        description: 'Identificação de gaps com base em avaliações de desempenho, ATRs e metas setoriais.',
        substeps: [
          'RH solicita aos gestores das áreas as demandas de capacitação para suas equipes.',
          'RH identifica lacunas de competências com base em avaliações de desempenho, ATRs e indicadores setoriais.',
          'RH recebe e consolida demandas de treinamentos voltados para associados, encaminhadas pela Diretoria de Capacitação.'
        ]
      },
      {
        title: '5.2 Planejamento de Treinamentos',
        description: 'Estruturação de temas, cargas horárias, formatos e materiais de apoio.',
        substeps: [
          'Definição dos seguintes elementos para cada ação de capacitação: Tema e objetivos de aprendizado, Público-alvo (colaboradores internos ou associados), Formato: interno (ministrado por equipe ACII) ou externo (parceria com instituições/consultores), Carga horária, metodologia e recursos necessários.',
          'Elaboração de cronograma e plano de ação integrado ao calendário institucional.'
        ]
      },
      {
        title: '5.3 Aprovação',
        description: 'Validação técnica e orçamentária do plano pela Gerência Executiva.',
        substeps: [
          'RH submete o plano de treinamento à Gerência Executiva para análise de viabilidade técnica e orçamentária.',
          'Decisão: Caso aprovado, o processo segue para execução. Caso não aprovado, o plano é reavaliado ou arquivado conforme justificativa.'
        ]
      },
      {
        title: '5.4 Execução',
        description: 'Apoio logístico, coordenação de sessões de treinamento e listas de presença.',
        substeps: [
          'Para colaboradores: RH coordena a realização do treinamento programado, garantindo logística, materiais e facilitadores.',
          'Para associados: Diretoria de Capacitação realiza o agendamento e acompanhamento do treinamento, com suporte do RH quando necessário.',
          'Registro de presença e controle de participação durante a atividade.'
        ]
      },
      {
        title: '5.5 Registro e Documentação',
        description: 'Registro de conteúdo e histórico de participação no prontuário do colaborador.',
        substeps: [
          'RH registra as seguintes informações para treinamentos de colaboradores: Lista de participantes, Conteúdo programático ministrado, Carga horária total e data de realização, Nome do facilitador/instrutor.',
          'Os dados são inseridos no sistema de gestão de pessoas e no histórico funcional.'
        ]
      },
      {
        title: '5.6 Avaliação de Treinamento (Colaboradores)',
        description: 'Aplicação de formulários de feedback e consolidação em relatórios executivos.',
        substeps: [
          'Aplicação de formulário de avaliação ao final do treinamento, contemplando: Nível de aprendizado e aplicabilidade do conteúdo, Satisfação com metodologia, facilitador e estrutura, e Sugestões de melhoria para futuras edições.',
          'Consolidação dos resultados em relatório para análise da Gerência Executiva e RH.'
        ]
      },
      {
        title: '5.7 Arquivamento e Monitoramento',
        description: 'Arquivamento físico de avaliações de desempenho e monitoramento da aplicação prática.',
        substeps: [
          'RH arquiva todos os registros (lista de presença, conteúdo, avaliações) no prontuário funcional do colaborador.',
          'Para associados, a Diretoria de Capacitação mantém banco de dados específico com histórico de participação.',
          'Monitoramento: RH e gestores acompanham a aplicação prática dos conhecimentos adquiridos, por meio de indicadores de desempenho pós-treinamento.'
        ]
      }
    ],
    outputs: [
      'Plano de treinamento aprovado e executado',
      'Colaboradores e associados capacitados conforme demanda',
      'Registros de participação e carga horária documentados',
      'Relatórios de avaliação de aprendizado e satisfação',
      'Histórico de capacitação atualizado no sistema institucional'
    ],
    performanceIndicators: [
      'Taxa de adesão aos treinamentos ofertados',
      'Nível de satisfação médio dos participantes (escala 1-5)',
      'Aplicabilidade prática do conteúdo (avaliação pós-30 dias)',
      'Evolução de indicadores setoriais pós-capacitação',
      'Custo médio por hora de treinamento por colaborador/associado'
    ]
  },
  {
    id: 'POP-013',
    title: 'Administração de Pessoal',
    process: 'RECURSOS HUMANOS / ADMINISTRATIVO',
    sector: 'RH',
    emissionDate: '26/05/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Gerenciar as rotinas trabalhistas e administrativas relacionadas aos colaboradores da ACII, garantindo conformidade legal, precisão nas informações de folha de pagamento e organização documental.',
    applicationField: [
      'Recursos Humanos (RH)',
      'Financeiro',
      'Contabilidade',
      'Gerência Executiva',
      'Todos os processos administrativos de gestão de pessoas da ACII'
    ],
    responsiblePrimary: 'Recursos Humanos (RH)',
    responsibleSupport: [
      'Financeiro',
      'Contabilidade',
      'Gerência Executiva'
    ],
    inputs: [
      'Registro de ponto eletrônico/manual dos colaboradores',
      'Informações de comissões, convênios, adiantamentos e variáveis da folha',
      'Calendário de férias e períodos aquisitivos',
      'Diretrizes legais (CLT, eSocial, obrigações acessórias)',
      'Dados cadastrais atualizados dos colaboradores'
    ],
    steps: [
      {
        title: '5.1 Controle de Jornada',
        description: 'Conferência de atestados, horas extras, faltas e banco de horas.',
        substeps: [
          'RH realiza o registro e conferência do ponto dos colaboradores (eletrônico ou manual).',
          'Monitoramento de horas extras, atrasos, faltas e banco de horas.',
          'Decisão: Divergências identificadas são validadas com o gestor da área antes do processamento da folha.'
        ]
      },
      {
        title: '5.2 Folha de Pagamento',
        description: 'Consolidação de descontos, convênios e variáveis da folha para faturamento.',
        substeps: [
          'RH consolida as informações trabalhistas: comissões, convênios, adiantamentos, afastamentos e outras variáveis.',
          'RH envia os dados ao Financeiro para consolidação em Relatório Geral de Descontos.',
          'Financeiro devolve o relatório ao RH para conferência.',
          'Após conferência do RH, o relatório é reencaminhado ao Financeiro, que o envia à Contabilidade para geração da folha de pagamento.',
          'Financeiro recebe o extrato da folha gerado pela Contabilidade e encaminha ao RH para conferência final antes do pagamento.',
          'Decisão: Caso haja divergência na conferência final, o processo retorna à etapa de ajuste. Caso aprovado, segue para pagamento.'
        ]
      },
      {
        title: '5.3 Gestão de Benefícios',
        description: 'Administração e cancelamento de benefícios, convênios e planos de saúde.',
        substeps: [
          'RH administra os benefícios concedidos pela ACII (vale-transporte, plano de saúde, alimentação, etc.).',
          'Inclusão, alteração ou cancelamento de benefícios são processados e refletidos na folha de pagamento.',
          'Comunicação clara ao colaborador sobre mudanças ou dúvidas relacionadas aos benefícios.'
        ]
      },
      {
        title: '5.4 Controle de Férias',
        description: 'Planejamento anual de férias e emissão de avisos prévios regulamentares.',
        substeps: [
          'RH controla os períodos aquisitivos e concessivos de cada colaborador.',
          'Elaboração do planejamento anual de férias em conjunto com os gestores das áreas.',
          'Emissão de comunicado de férias ao colaborador com antecedência mínima legal.',
          'Registro do período de férias no sistema e na folha de pagamento.'
        ]
      },
      {
        title: '5.5 Atualização Cadastral',
        description: 'Manutenção periódica de dados residenciais, telefônicos e familiares.',
        substeps: [
          'RH realiza a manutenção contínua dos dados funcionais dos colaboradores (endereço, telefone, dependentes, formação, etc.).',
          'Solicitação periódica de atualização documental para manter o prontuário em conformidade.'
        ]
      },
      {
        title: '5.6 Obrigações Legais e Compliance',
        description: 'Garantia de envio tempestivo e compliance fiscal trabalhista nos órgãos reguladores.',
        substeps: [
          'RH garante o envio tempestivo de informações aos órgãos competentes (eSocial, RAIS, CAGED, DIRF, etc.).',
          'Monitoramento de prazos legais para entrega de declarações e guias.',
          'Decisão: Pendências identificadas são tratadas com prioridade para evitar autuações.'
        ]
      },
      {
        title: '5.7 Arquivo Funcional e Guarda Documental',
        description: 'Controle de acesso restrito de prontuários em conformidade com a LGPD.',
        substeps: [
          'RH organiza e guarda toda a documentação dos colaboradores (física e digitalmente), conforme política de retenção da ACII.',
          'Controle de acesso restrito a documentos confidenciais, em conformidade com a LGPD.',
          'Digitalização e backup periódico dos prontuários funcionais.'
        ]
      }
    ],
    outputs: [
      'Folha de pagamento processada e paga dentro do prazo legal',
      'Benefícios administrados e atualizados',
      'Calendário de férias planejado e comunicado',
      'Obrigações acessórias entregues em conformidade',
      'Prontuários funcionais organizados e arquivados',
      'Relatórios de controle de jornada e variáveis da folha'
    ],
    performanceIndicators: [
      'Índice de erros na folha de pagamento (retrabalho)',
      'Conformidade no envio de obrigações legais (auditoria interna)',
      'Tempo médio para resolução de pendências cadastrais',
      'Nível de satisfação dos colaboradores com a gestão de benefícios',
      'Aderência ao planejamento anual de férias'
    ]
  },
  {
    id: 'POP-014',
    title: 'Clima e Cultura Organizacional',
    process: 'RECURSOS HUMANOS / ADMINISTRATIVO',
    sector: 'RH',
    emissionDate: '26/05/2026',
    revision: '00',
    pages: '1 de 2',
    objective: 'Promover ambiente organizacional saudável, alinhado aos valores e à cultura institucional da ACII, fortalecendo o engajamento, a retenção de talentos e a produtividade das equipes.',
    applicationField: [
      'Recursos Humanos (RH)',
      'Gerência Executiva',
      'Gestores de Áreas',
      'Todas as ações de monitoramento, diagnóstico e fortalecimento do clima e da cultura organizacional da ACII'
    ],
    responsiblePrimary: 'Recursos Humanos (RH)',
    responsibleSupport: [
      'Gerência Executiva',
      'Gestores de área'
    ],
    inputs: [
      'Resultados de pesquisas de clima organizacional',
      'Indicadores de turnover, absenteísmo e satisfação',
      'Feedbacks de colaboradores e líderes',
      'Valores, missão e visão institucional da ACII',
      'Demandas de melhoria identificadas em avaliações de desempenho'
    ],
    steps: [
      {
        title: '5.1 Monitoramento do Clima Organizacional',
        description: 'Aplicação de questionários sigilosos periódicos de satisfação interna.',
        substeps: [
          'RH realiza pesquisas de clima organizacional periódicas (semestrais ou anuais), com aplicação de questionários estruturados e sigilosos.',
          'Coleta de dados qualitativos e quantitativos sobre satisfação, reconhecimento, comunicação, liderança e condições de trabalho.',
          'Consolidação dos resultados em relatório analítico para apresentação à Gerência Executiva.'
        ]
      },
      {
        title: '5.2 Identificação de Problemas e Oportunidades',
        description: 'Triagem de conflitos, descontentamento de benefícios e planos estratégicos.',
        substeps: [
          'Análise dos resultados com foco em: Conflitos internos e relacionamentos interpessoais, Insatisfação com processos, benefícios ou reconhecimento, e Dificuldades de comunicação entre áreas ou níveis hierárquicos.',
          'Decisão: Caso sejam identificadas críticas pontuais, o RH encaminha para tratamento direto com o gestor. Caso sejam identificadas questões sistêmicas, elabora-se plano de ação estruturado.'
        ]
      },
      {
        title: '5.3 Elaboração de Plano de Melhoria',
        description: 'Correções estruturadas, definição de metas e validações com a gerência.',
        substeps: [
          'RH elabora ações corretivas e preventivas em conjunto com os gestores das áreas impactadas.',
          'Definição de responsáveis, prazos e indicadores de sucesso para cada ação.',
          'Validação do plano pela Gerência Executiva antes da implementação.'
        ]
      },
      {
        title: '5.4 Fortalecimento da Cultura Institucional',
        description: 'Eventos internos de integração, feedback público e reuniões de alinhamento cultural.',
        substeps: [
          'Promoção de eventos institucionais que reforcem os valores da ACII (confraternizações, datas comemorativas, celebrações de resultados).',
          'Realização de reuniões de alinhamento cultural com equipes e lideranças.',
          'Implementação de ações de valorização da equipe (reconhecimento público, programas de mérito, feedbacks positivos).',
          'Divulgação de histórias de sucesso e boas práticas internas.'
        ]
      },
      {
        title: '5.5 Comunicação Interna e Transparência',
        description: 'Incentivo à escuta ativa, rodas de conversa, e-mails corporativos e sugestões.',
        substeps: [
          'Incentivo à transparência e ao diálogo aberto entre áreas e níveis hierárquicos.',
          'Utilização de canais institucionais (intranet, murais, e-mail, reuniões) para disseminar informações relevantes.',
          'RH media processos de escuta ativa (rodas de conversa, caixinha de sugestões, canais de denúncia ética).'
        ]
      },
      {
        title: '5.6 Acompanhamento e Reavaliação',
        description: 'Acompanhamento de turnover voluntário, pesquisas rápidas e alinhamento trimestral.',
        substeps: [
          'RH monitora continuamente indicadores de clima (pesquisas rápidas, taxa de engajamento, turnover voluntário).',
          'Realização de reuniões trimestrais com gestores para revisão do plano de melhoria.',
          'Decisão: Caso os indicadores não apresentem evolução, o plano é reestruturado com novas ações e prazos.'
        ]
      }
    ],
    outputs: [
      'Relatório de pesquisa de clima organizacional consolidado',
      'Plano de ação para melhoria do clima aprovado e em execução',
      'Eventos e ações de fortalecimento cultural realizados',
      'Indicadores de clima monitorados e atualizados',
      'Prontuário de ações de cultura arquivado para histórico institucional'
    ],
    performanceIndicators: [
      'Índice de satisfação geral com o clima organizacional (escala 1-5)',
      'Taxa de turnover voluntário (por período)',
      'Nível de engajamento em pesquisas e ações culturais',
      'Tempo médio para implementação de ações corretivas',
      'Evolução dos indicadores após intervenções (comparativo pré/pós)'
    ]
  },
  {
    id: 'POP-015',
    title: 'Participação em Eventos',
    process: 'MARKETING',
    sector: 'Marketing',
    emissionDate: '26/02/2026',
    revision: '00',
    pages: '2 de 2',
    objective: 'Padronizar a participação institucional da ACII em eventos próprios e de terceiros, garantindo posicionamento estratégico da marca, geração de relacionamento e captação de oportunidades.',
    applicationField: [
      'Setor de Marketing da ACII',
      'Áreas envolvidas na participação institucional em eventos'
    ],
    responsiblePrimary: 'Coordenador de Marketing',
    responsibleSupport: [
      'Gerente Executiva',
      'Diretoria',
      'Comercial',
      'Financeiro'
    ],
    inputs: [
      'Convite formal ou planejamento interno de evento',
      'Calendário institucional',
      'Orçamento disponível',
      'Diretrizes estratégicas da Diretoria'
    ],
    steps: [
      {
        title: '5.1 Avaliação Estratégica',
        description: 'Análise de relevância e alinhamento com objetivos estratégicos da ACII.',
        substeps: [
          'Analisar relevância do evento (público, posicionamento e impacto institucional).',
          'Verificar alinhamento com objetivos estratégicos da ACII.',
          'Submeter à Gerente Executiva para validação da participação.'
        ]
      },
      {
        title: '5.2 Planejamento',
        description: 'Elaboração do plano de ação e alinhamento orçamentário.',
        substeps: [
          'Definir objetivos da participação.',
          'Elaborar plano de ação (estrutura, fala institucional, materiais e cobertura digital).',
          'Definir equipe participante.',
          'Solicitar orçamento ao Financeiro, quando aplicável.',
          'Registrar contatos estratégicos de patrocinadores e parceiros em planilha institucional.'
        ]
      },
      {
        title: '5.3 Produção e Preparação',
        description: 'Produção de materiais e planejamento de cobertura.',
        substeps: [
          'Produzir materiais institucionais (folders, banners, brindes).',
          'Elaborar roteiros de fala e briefings para representantes.',
          'Planejar cobertura de mídia (fotos, vídeos, stories e imprensa).'
        ]
      },
      {
        title: '5.4 Execução',
        description: 'Ações de presença e relacionamento durante o evento.',
        substeps: [
          'Garantir presença e organização da equipe no evento.',
          'Realizar registros audiovisuais.',
          'Coletar leads quando não houver equipe Comercial presente.',
          'Ativar relacionamento institucional com público estratégico.'
        ]
      },
      {
        title: '5.5 Pós-Evento',
        description: 'Divulgação de resultados e relatórios.',
        substeps: [
          'Publicar cobertura institucional.',
          'Organizar banco de imagens e vídeos.',
          'Encaminhar leads ao setor Comercial, quando aplicável.',
          'Elaborar relatório de resultados.',
          'Elaborar prestação de contas, quando aplicável.'
        ]
      }
    ],
    outputs: [
      'Relatório de participação',
      'Conteúdo publicado',
      'Banco de imagens atualizado',
      'Leads coletados'
    ],
    performanceIndicators: [
      'Engajamento das publicações',
      'Convites recebidos após o evento',
      'Retorno institucional percebido'
    ]
  },
  {
    id: 'POP-016',
    title: 'Produção de Conteúdos',
    process: 'MARKETING',
    sector: 'Marketing',
    emissionDate: '26/02/2026',
    revision: '00',
    pages: '2 de 2',
    objective: 'Garantir produção contínua, estratégica e alinhada ao posicionamento institucional da ACII e às demandas de eventos e campanhas.',
    applicationField: [
      'Setor de Marketing',
      'Áreas envolvidas na comunicação institucional'
    ],
    responsiblePrimary: 'Coordenador de Marketing',
    responsibleSupport: [
      'Designer',
      'Social Media',
      'Gerente Executiva',
      'Diretoria'
    ],
    inputs: [
      'Calendário editorial',
      'Pautas institucionais',
      'Demandas internas',
      'Diretrizes estratégicas'
    ],
    steps: [
      {
        title: '5.1 Planejamento Editorial',
        description: 'Elaboração do calendário editorial e aprovação de pautas.',
        substeps: [
          'Elaborar calendário editorial mensal contendo as tarefas a serem executadas.',
          'Definir temas estratégicos.',
          'Submeter planejamento à aprovação da Gerência/Diretoria.',
          'Quando necessário, solicitar orçamento e contratar equipe externa mediante aprovação formal.'
        ]
      },
      {
        title: '5.2 Production',
        description: 'Desenvolvimento e revisão de materiais de comunicação.',
        substeps: [
          'Redigir textos institucionais.',
          'Desenvolver artes e vídeos.',
          'Realizar revisão ortográfica e institucional.',
          'Acompanhar produção de fornecedores terceirizados, quando aplicável.'
        ]
      },
      {
        title: '5.3 Aprovação',
        description: 'Validação e ajustes de conteúdo.',
        substeps: [
          'Submeter conteúdos à Gerente Executiva quando necessário.',
          'Realizar ajustes conforme feedback.',
          'Validar materiais de agências terceirizadas antes da publicação.'
        ]
      },
      {
        title: '5.4 Publicação',
        description: 'Postagem de conteúdos nas plataformas.',
        substeps: [
          'Programar conteúdos nas plataformas institucionais.',
          'Aplicar boas práticas de SEO no site.',
          'Monitorar publicações realizadas por terceiros.'
        ]
      },
      {
        title: '5.5 Monitoramento',
        description: 'Análise de métricas de desempenho.',
        substeps: [
          'Acompanhar métricas de desempenho.',
          'Identificar conteúdos de maior performance.',
          'Ajustar estratégia com base nos resultados.'
        ]
      }
    ],
    outputs: [
      'Conteúdo publicado',
      'Relatório mensal de desempenho',
      'Banco de pautas atualizado'
    ],
    performanceIndicators: [
      'Taxa de engajamento',
      'Crescimento de seguidores',
      'Tráfego no site',
      'Conversão para eventos e associação'
    ]
  },
  {
    id: 'POP-017',
    title: 'Assessoria de Imprensa',
    process: 'MARKETING',
    sector: 'Marketing',
    emissionDate: '26/02/2026',
    revision: '00',
    pages: '2 de 2',
    objective: 'Gerenciar o relacionamento institucional com a imprensa local e regional, fortalecendo a imagem e reputação da ACII.',
    applicationField: [
      'Setor de Marketing',
      'Diretoria no relacionamento com veículos de comunicação'
    ],
    responsiblePrimary: 'Coordenador de Marketing',
    responsibleSupport: [
      'Diretoria',
      'Porta-voz Institucional'
    ],
    inputs: [
      'Eventos institucionais',
      'Posicionamentos oficiais',
      'Pautas relevantes do setor empresarial',
      'Demandas da imprensa'
    ],
    steps: [
      {
        title: '5.1 Planejamento Anual',
        description: 'Estruturação de pautas e definição de porta-vozes.',
        substeps: [
          'Elaborar calendário anual de pautas.',
          'Identificar temas com potencial jornalístico.',
          'Definir porta-voz conforme pauta.',
          'Estruturar pauta estratégica.'
        ]
      },
      {
        title: '5.2 Produção',
        description: 'Desenvolvimento de releases e kits de imprensa.',
        substeps: [
          'Redigir release institucional.',
          'Preparar kit imprensa (fotos, dados e histórico).',
          'Submeter material para validação da Gerente Executiva e Diretoria.'
        ]
      },
      {
        title: '5.3 Distribuição',
        description: 'Envio de materiais e agendamento de interviews.',
        substeps: [
          'Enviar release aos veículos de comunicação.',
          'Realizar follow-up com jornalistas.',
          'Agendar entrevistas quando necessário.'
        ]
      },
      {
        title: '5.4 Acompanhamento',
        description: 'Monitoramento e arquivamento de notícias veiculadas.',
        substeps: [
          'Monitorar publicações.',
          'Realizar clipping institucional.',
          'Arquivar matérias veiculadas.'
        ]
      },
      {
        title: '5.5 Gestão de Crise',
        description: 'Elaboração de posicionamentos em momentos críticos.',
        substeps: [
          'Elaborar nota oficial, quando necessário.',
          'Definir estratégia de posicionamento.',
          'Centralizar comunicação no porta-voz definido.'
        ]
      }
    ],
    outputs: [
      'Releases enviados',
      'Clipping mensal',
      'Relatório de mídia espontânea'
    ],
    performanceIndicators: [
      'Número de publicações',
      'Alcance estimado',
      'Qualidade do posicionamento institucional',
      'Convites da imprensa para novas pautas'
    ]
  },
  {
    id: 'POP-018',
    title: 'Prestação de Contas de Eventos',
    process: 'MARKETING',
    sector: 'Marketing',
    emissionDate: '26/02/2026',
    revision: '00',
    pages: '2 de 2',
    objective: 'Padronizar o processo de prestação de contas dos eventos institucionais, assegurando transparência e cumprimento das contrapartidas aos patrocinadores.',
    applicationField: [
      'Setor de Marketing',
      'Presidência da ACII'
    ],
    responsiblePrimary: 'Coordenador de Marketing',
    responsibleSupport: [
      'Gerente Executiva',
      'Presidência',
      'Assessoria de Comunicação'
    ],
    inputs: [
      'Relatórios de mídia',
      'Materiais gráficos produtos',
      'Registros audiovisuais',
      'Contrapartidas pactuadas'
    ],
    steps: [
      {
        title: '5.1 Compilação',
        description: 'Reunião e valoração de mídias.',
        substeps: [
          'Reunir mídia online e offline.',
          'Organizar materiais gráficos.',
          'Elaborar relatório de valoração de mídia.'
        ]
      },
      {
        title: '5.2 Organização por Patrocinador',
        description: 'Pasta individual de comprovação.',
        substeps: [
          'Separar comprovações das contrapartidas realizadas.',
          'Criar pasta individual para cada patrocinador.'
        ]
      },
      {
        title: '5.3 Revisão',
        description: 'Ajustes e validação final.',
        substeps: [
          'Submeter material à revisão da Coordenadora de Marketing e Gerente Executiva.',
          'Realizar ajustes necessários.'
        ]
      },
      {
        title: '5.4 Entrega',
        description: 'Apresentação oficial aos parceiros.',
        substeps: [
          'Definir formato de entrega (digital e/ou impressa).',
          'Encaminhar à Presidência para entrega oficial ao patrocinador.'
        ]
      },
      {
        title: '5.5 Comunicação',
        description: 'Publicidade da entrega da prestação.',
        substeps: [
          'Realizar publicação institucional sobre a entrega da prestação de contas.'
        ]
      }
    ],
    outputs: [
      'Prestação de contas formalizada',
      'Relatório de valoração de mídia',
      'Registro institucional da entrega'
    ],
    performanceIndicators: [
      'Cumprimento integral das contrapartidas',
      'Satisfação dos patrocinadores',
      'Renovação de patrocínios futuros'
    ]
  },
  {
    id: 'POP-019',
    title: 'Contratação de Fornecedores – Marketing',
    process: 'MARKETING',
    sector: 'Marketing',
    emissionDate: '26/02/2026',
    revision: '00',
    pages: '4 de 2',
    objective: 'Padronizar o processo de contratação de fornecedores para ações de marketing da ACII, garantindo qualidade, transparência, controle financeiro e alinhamento institucional.',
    applicationField: [
      'Setor de Marketing',
      'Financeiro',
      'Gerência Executiva',
      'Diretoria Financeira'
    ],
    responsiblePrimary: 'Coordenador de Marketing',
    responsibleSupport: [
      'Financeiro',
      'Gerência Executiva',
      'Diretor Financeiro'
    ],
    inputs: [
      'Necessidade de ação de marketing',
      'Planejamento de campanha ou evento',
      'Demanda institucional',
      'Solicitação da Diretoria'
    ],
    steps: [
      {
        title: '5.1 Identificação da Necessidade',
        description: 'Definição do escopo e estimativa.',
        substeps: [
          'Identificar a necessidade de contratação (designer, agência, gráfica, tráfego pago, filmagem, etc.).',
          'Definir escopo do serviço.',
          'Estabelecer prazo de execução.',
          'Estimar orçamento inicial.'
        ]
      },
      {
        title: '5.2 Pesquisa e Solicitação de Orçamentos',
        description: 'Busca de fornecedores qualificados.',
        substeps: [
          'Pesquisar fornecedores qualificados.',
          'Solicitar no mínimo 3 orçamentos.',
          'Receber propostas comerciais.',
          'Organizar comparativo de valores e serviços.'
        ]
      },
      {
        title: '5.3 Envio dos Orçamentos ao Financeiro',
        description: 'Compartilhamento de propostas para análise.',
        substeps: [
          'Encaminhar os orçamentos recebidos ao setor financeiro.',
          'Informar objetivo da contratação.',
          'Informar prazo e prioridade da demanda.'
        ]
      },
      {
        title: '5.4 Análise e Decisão da Contratação',
        description: 'Reunião de escolha do fornecedor.',
        substeps: [
          'Analisar os orçamentos recebidos.',
          'Avaliar disponibilidade financeira.',
          'Realizar reunião com a Gerência Executiva ou Diretor Financeiro.',
          'Definir qual fornecedor será contratado.'
        ]
      },
      {
        title: '5.5 Formalização da Contratação',
        description: 'Formalidades administrativas e contratuais.',
        substeps: [
          'Formalizar contratação com o fornecedor escolhido (contrato, proposta assinada ou pedido formal).',
          'Definir forma de pagamento.',
          'Registrar a contratação.'
        ]
      },
      {
        title: '5.6 Execução do Serviço',
        description: 'Desenvolvimento e acompanhamento da entrega.',
        substeps: [
          'Realização do serviço contratado.',
          'Monitoramento da qualidade e prazos.',
          'Aprovação de peças e materiais.'
        ]
      },
      {
        title: '5.7 Conferência e Pagamento',
        description: 'Validação final e liquidação financeira.',
        substeps: [
          'Conferir entrega do serviço.',
          'Validar autorização do marketing.',
          'Realizar pagamento conforme acordado.'
        ]
      },
      {
        title: '5.8 Avaliação do Fornecedor',
        description: 'Qualificação e registro para futuras ações.',
        substeps: [
          'Avaliar qualidade do serviço.',
          'Registrar desempenho do fornecedor.',
          'Manter cadastro de fornecedores confiáveis.'
        ]
      }
    ],
    outputs: [
      'Fornecedor contratado',
      'Serviço de marketing executado',
      'Pagamento realizado',
      'Cadastro atualizado de fornecedores'
    ],
    performanceIndicators: [
      'Cumprimento de prazos',
      'Qualidade das entregas',
      'Custo das contratações'
    ]
  },
  {
    id: 'POP-020',
    title: 'Processo de Venda de Certificados Digitais',
    process: 'AR',
    sector: 'Autoridade de Registro',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 4',
    objective: 'Padronizar o processo de venda, renovação, validação e entrega de certificados digitais da ACII, garantindo segurança, conformidade com as exigências da certificadora e qualidade no atendimento ao cliente.',
    applicationField: [
      'Agente de Registro',
      'Atendimento da Certificação Digital',
      'Coordenação Administrativa'
    ],
    responsiblePrimary: 'Agente de Registro',
    responsibleSupport: [
      'Atendimento da Certificação Digital',
      'Coordenação Administrativa',
      'Gerência Executiva'
    ],
    inputs: [
      'Solicitação do cliente',
      'Lista de vencimentos de certificados',
      'Documentação pessoal e/ou empresarial',
      'Sistema da Certificadora',
      'Token (quando aplicável)'
    ],
    steps: [
      {
        title: '5.1 Entrada do Cliente',
        description: 'Início do contato e identificação da necessidade.',
        substeps: [
          'O atendimento poderá ocorrer por iniciativa do cliente via internet.',
          'Por indicação de contadores.',
          'Por busca ativa da ACII para clientes com certificados próximos do vencimento.'
        ]
      },
      {
        title: '5.2 Identificação do Tipo de Certificado',
        description: 'Determinação da modalidade a ser emitida.',
        substeps: [
          'Verificar qual modalidade será emitida: Pessoa Física, Pessoa Jurídica, OAB, Médico ou Judiciário.'
        ]
      },
      {
        title: '5.3 Processo de Renovação',
        description: 'Análise mensal e contato para renovação.',
        substeps: [
          'Mensalmente deverá ser realizada análise da lista de vencimentos.',
          'Identificar certificados próximos do vencimento.',
          'Entrar em contato com os clientes.',
          'Conduzir o processo de renovação.'
        ]
      },
      {
        title: '5.4 Compra pelo Site',
        description: 'Acompanhamento das vendas online.',
        substeps: [
          'O cliente realiza a compra diretamente no site (quando aplicável).',
          'O setor acompanha a continuidade do processo até a validação.'
        ]
      },
      {
        title: '5.5 Solicitação de Documentação',
        description: 'Identificação dos documentos obrigatórios.',
        substeps: [
          'Solicitar os seguintes documentos: Documento oficial com foto, CPF, E-mail, Telefone.',
          'Documentos aceitos: CNH, RG, Carteira de Estrangeiro, Carteira Profissional.'
        ]
      },
      {
        title: '5.6 Verificação da Documentação',
        description: 'Garantia de conformidade dos documentos.',
        substeps: [
          'O Agente de Registro deverá confirmar autenticidade dos documentos.',
          'Validar identidade do cliente.',
          'Verificar consistência das informações.'
        ]
      },
      {
        title: '5.7 Coleta Biométrica',
        description: 'Captura dos dados biométricos obrigatórios.',
        substeps: [
          'Realizar a captura das digitais.',
          'Realizar o registro fotográfico do cliente.'
        ]
      },
      {
        title: '5.8 Inclusão de Dados no Sistema',
        description: 'Alimentação do sistema da certificadora.',
        substeps: [
          'Inserir no sistema da certificadora: RG, CPF, Biometria, Telefone, E-mail.'
        ]
      },
      {
        title: '5.9 Reconhecimento e Aceite',
        description: 'Validação das informações pelo cliente.',
        substeps: [
          'O cliente deverá revisar os dados cadastrados.',
          'O cliente deverá assinar o Termo de Responsabilidade.'
        ]
      },
      {
        title: '5.10 Finalização do Processo',
        description: 'Conclusão do atendimento no sistema.',
        substeps: [
          'Após conferência, finalizar o processo no sistema da certificadora.'
        ]
      },
      {
        title: '5.11 Aprovação e Entrega do Certificado',
        description: 'Entrega dos formatos A1 e A3.',
        substeps: [
          'Para Certificado A1: Certificado aprovado, envio do Termo de Titularidade por e-mail, envio do certificado digital por e-mail.',
          'Para Certificado A3: Certificado aprovado, envio do Termo de Titularidade por e-mail, entrega física do token (do próprio cliente ou adquirido na ACII).'
        ]
      }
    ],
    outputs: [
      'Certificado digital emitido',
      'Termo de Titularidade enviado',
      'Registro concluído no sistema'
    ],
    performanceIndicators: [
      'Quantidade de certificados emitidos',
      'Quantidade de renovações realizadas',
      'Tempo médio de atendimento',
      'Índice de retrabalho documental',
      'Taxa de aprovação na certificadora'
    ]
  },
  {
    id: 'POP-021',
    title: 'Processo de Venda de Certificados Digitais II',
    process: 'AR',
    sector: 'Autoridade de Registro',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 4',
    objective: 'Padronizar o processo de venda, renovação, validação e entrega de certificados digitais da ACII, garantindo segurança, conformidade com as exigências da certificadora e qualidade no atendimento ao cliente.',
    applicationField: [
      'Agente de Registro',
      'Atendimento da Certificação Digital',
      'Coordenação Administrativa'
    ],
    responsiblePrimary: 'Agente de Registro',
    responsibleSupport: [
      'Atendimento da Certificação Digital',
      'Coordenação Administrativa',
      'Gerência Executiva'
    ],
    inputs: [
      'Solicitação do cliente',
      'Lista de vencimentos de certificados',
      'Documentação pessoal e/ou empresarial',
      'Sistema da Certificadora',
      'Token (quando aplicável)'
    ],
    steps: [
      {
        title: '5.1 Entrada do Cliente',
        description: 'Início do contato e identificação da necessidade.',
        substeps: [
          'O atendimento poderá ocorrer por iniciativa do cliente via internet.',
          'Por indicação de contadores.',
          'Por busca ativa da ACII para clientes com certificados próximos do vencimento.'
        ]
      },
      {
        title: '5.2 Identificação do Tipo de Certificado',
        description: 'Determinação da modalidade a ser emitida.',
        substeps: [
          'Verificar qual modalidade será emitida: Pessoa Física, Pessoa Jurídica, OAB, Médico ou Judiciário.'
        ]
      },
      {
        title: '5.3 Processo de Renovação',
        description: 'Análise mensal e contato para renovação.',
        substeps: [
          'Mensalmente deverá ser realizada análise da lista de vencimentos.',
          'Identificar certificados próximos do vencimento.',
          'Entrar em contato com os clientes.',
          'Conduzir o processo de renovação.'
        ]
      },
      {
        title: '5.4 Compra pelo Site',
        description: 'Acompanhamento das vendas online.',
        substeps: [
          'O cliente realiza a compra diretamente no site (quando aplicável).',
          'O setor acompanha a continuidade do processo até a validação.'
        ]
      },
      {
        title: '5.5 Solicitação de Documentação',
        description: 'Identificação dos documentos obrigatórios.',
        substeps: [
          'Solicitar os seguintes documentos: Documento oficial com foto, CPF, E-mail, Telefone.',
          'Documentos aceitos: CNH, RG, Carteira de Estrangeiro, Carteira Profissional.'
        ]
      },
      {
        title: '5.6 Verificação da Documentação',
        description: 'Garantia de conformidade dos documentos.',
        substeps: [
          'O Agente de Registro deverá confirmar autenticidade dos documentos.',
          'Validar identidade do cliente.',
          'Verificar consistência das informações.'
        ]
      },
      {
        title: '5.7 Coleta Biométrica',
        description: 'Captura dos dados biométricos obrigatórios.',
        substeps: [
          'Realizar a captura das digitais.',
          'Realizar o registro fotográfico do cliente.'
        ]
      },
      {
        title: '5.8 Inclusão de Dados no Sistema',
        description: 'Alimentação do sistema da certificadora.',
        substeps: [
          'Inserir no sistema da certificadora: RG, CPF, Biometria, Telefone, E-mail.'
        ]
      },
      {
        title: '5.9 Reconhecimento e Aceite',
        description: 'Validação das informações pelo cliente.',
        substeps: [
          'O cliente deverá revisar os dados cadastrados.',
          'O cliente deverá assinar o Termo de Responsabilidade.'
        ]
      },
      {
        title: '5.10 Finalização do Processo',
        description: 'Conclusão do atendimento no sistema.',
        substeps: [
          'Após conferência, finalizar o processo no sistema da certificadora.'
        ]
      },
      {
        title: '5.11 Aprovação e Entrega do Certificado',
        description: 'Entrega dos formatos A1 e A3.',
        substeps: [
          'Para Certificado A1: Certificado aprovado, envio do Termo de Titularidade por e-mail, envio do certificado digital por e-mail.',
          'Para Certificado A3: Certificado aprovado, envio do Termo de Titularidade por e-mail, entrega física do token (do próprio cliente ou adquirido na ACII).'
        ]
      }
    ],
    outputs: [
      'Certificado digital emitido',
      'Termo de Titularidade enviado',
      'Registro concluído no sistema'
    ],
    performanceIndicators: [
      'Quantidade de certificados emitidos',
      'Quantidade de renovações realizadas',
      'Tempo médio de atendimento',
      'Índice de retrabalho documental',
      'Taxa de aprovação na certificadora'
    ]
  },
  {
    id: 'POP-022',
    title: 'Contratação de Segurança para a FECOIMP',
    process: 'AR - EVENTOS / SEGURANÇA PATRIMONIAL',
    sector: 'Autoridade de Registro',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 2',
    objective: 'Padronizar o processo de contratação e coordenação de empresas de segurança para atuação na FECOIMP, garantindo proteção patrimonial, integridade de participantes e conformidade com normas de segurança pública.',
    applicationField: [
      'Coordenação de Eventos da ACII',
      'Presidência',
      'Financeiro',
      'Jurídico',
      'Empresas terceirizadas de segurança'
    ],
    responsiblePrimary: 'Coordenador de Eventos / Gerente Executiva',
    responsibleSupport: [
      'Presidência',
      'Financeiro',
      'Jurídico',
      'Forças de Segurança Públicas (PM, Guarda Civil, Bombeiros)'
    ],
    inputs: [
      'Cronograma oficial da FECOIMP',
      'Planta baixa e layout do evento',
      'Estimativa de público e expositores',
      'Diretrizes de segurança da Presidência'
    ],
    steps: [
      {
        title: '5.1 Planejamento e Orçamentos',
        description: 'Etapa inicial de solicitação e cotação de serviços.',
        substeps: [
          'Em abril: solicitar 3 orçamentos de empresas de segurança para atuação na FECOIMP.'
        ]
      },
      {
        title: '5.2 Avaliação e Seleção',
        description: 'Análise técnica, de preço e contratação.',
        substeps: [
          'Presidência avalia as empresas e propostas com base em: preço, prazo, qualidade técnica e capacidade de reembolso em caso de sinistro.',
          'Presidência seleciona a empresa vencedora e formaliza a contratação.'
        ]
      },
      {
        title: '5.3 Alinhamento Institucional',
        description: 'Alinhamento com forças públicas e setores envolvidos.',
        substeps: [
          'Realizar reunião de alinhamento com todos os setores envolvidos, empresa contratada e forças de segurança estaduais e municipais (Secretário Municipal de Segurança, PM, Guarda Civil, Comando Tático Aéreo e Corpo de Bombeiros).'
        ]
      },
      {
        title: '5.4 Alinhamento Operacional',
        description: 'Definição de fluxos e escalas específicas.',
        substeps: [
          'Próximo à data da Feira: realizar reunião operacional para alinhar pontos específicos com a empresa escolhida e setores da ACII responsáveis pela contratação e fluxo de informações.',
          'Registrar atas de reunião e cronograma de escalas aprovadas.'
        ]
      }
    ],
    outputs: [
      'Contrato de segurança firmado',
      'Plano de ação integrado com forças públicas',
      'Ata de reunião de alinhamento registrada',
      'Cronograma de escalas de segurança aprovado'
    ],
    performanceIndicators: [
      'Tempo médio de resposta a incidentes',
      'Conformidade com o plano de segurança contratado',
      'Índice de satisfação dos expositores com a segurança'
    ]
  },
  {
    id: 'POP-023',
    title: 'Controle de Entrada e Saída de Produtos na FECOIMP',
    process: 'AR - EVENTOS / LOGÍSTICA',
    sector: 'Autoridade de Registro',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 2',
    objective: 'Estabelecer procedimento padronizado para controle de entrada e saída de itens dos expositores na FECOIMP, prevenindo perdas, extravios e responsabilizando as partes em caso de divergência.',
    applicationField: [
      'Expositores da FECOIMP',
      'Equipe de segurança terceirizada',
      'Coordenação de eventos',
      'Setor jurídico da ACII'
    ],
    responsiblePrimary: 'Coordenador de Eventos / Supervisor de Segurança',
    responsibleSupport: [
      'Equipe de Segurança',
      'Expositores',
      'Jurídico da ACII'
    ],
    inputs: [
      'Formulário de Controle de Itens (fornecido pela ACII)',
      'Lista de itens preenchida e devolvida pelo expositor',
      'Cronograma de montagem e desmontagem da Feira'
    ],
    steps: [
      {
        title: '5.1 Entrega e Preenchimento de Listas',
        description: 'Fornecimento e devolução do formulário pelo expositor.',
        substeps: [
          'ACII entrega ao expositor o Formulário de Controle de Itens para preenchimento dos produtos que serão instalados no stand.',
          'Expositor preenche e devolve a lista à ACII antes da entrada na Feira.'
        ]
      },
      {
        title: '5.2 Procedimento no Dia da Entrada',
        description: 'Conferência física e validação de recebimento.',
        substeps: [
          'No dia da entrada dos itens: Empresa de segurança confronta lista com itens físicos.',
          'Segurança e expositor assinam o formulário, validando a conferência.'
        ]
      },
      {
        title: '5.3 Procedimento no Dia da Saída',
        description: 'Segunda conferência e baixa física.',
        substeps: [
          'No dia da retirada dos itens: Nova verificação é realizada pela segurança.',
          'É dada baixa no formulário, confirmando a saída dos itens.'
        ]
      },
      {
        title: '5.4 Tratamento de Divergências',
        description: 'Fluxo em caso de perda ou extravio.',
        substeps: [
          'Em caso de falta de item: Registrar Boletim Interno de Ocorrência.',
          'Encaminhar ao Jurídico da ACII para as providências cabíveis.',
          'Arquivar formulários assinados e relatórios de conferência.'
        ]
      }
    ],
    outputs: [
      'Formulário de Controle de Itens assinado (entrada e saída)',
      'Boletim Interno de Ocorrência (quando aplicável)',
      'Relatório final de conferência patrimonial'
    ],
    performanceIndicators: [
      'Taxa de divergência entre lista e itens físicos (meta: < 2%)',
      'Tempo médio de conferência por expositor',
      'Número de ocorrências registradas e resolvidas'
    ]
  },
  {
    id: 'POP-024',
    title: 'Contratação e Coordenação de Equipe de Limpeza durante a FECOIMP',
    process: 'AR - EVENTOS / INFRAESTRUTURA',
    sector: 'Autoridade de Registro',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 2',
    objective: 'Padronizar a contratação, supervisão e execução dos serviços de limpeza durante a FECOIMP, assegurando higiene, segurança e conformidade com normas trabalhistas e de segurança do trabalho.',
    applicationField: [
      'Coordenação de Eventos da ACII',
      'Presidência',
      'Financeiro',
      'Empresa terceirizada de limpeza'
    ],
    responsiblePrimary: 'Coordenador de Eventos / Gerente Executiva',
    responsibleSupport: [
      'Presidência',
      'Financeiro',
      'RH',
      'Empresa de Limpeza'
    ],
    inputs: [
      'Cronograma da FECOIMP',
      'Planta baixa e áreas de atuação da limpeza',
      'Especificações de EPIs e uniformes',
      'Diretrizes da Presidência para contratação'
    ],
    steps: [
      {
        title: '5.1 Contratação',
        description: 'Tomada de preços e contratação.',
        substeps: [
          'Em abril: solicitar 3 orçamentos de empresas de limpeza para atuação na FECOIMP.',
          'Presidência avalia as propostas com base em: preço, prazo, qualidade, capacidade de reembolso em sinistro e apresentação de antecedentes criminais da equipe.',
          'Coordenação da ACII define prazo de entrega de documentos e insumos pela empresa contratada.',
          'Após fechamento do contrato, a empresa deve entregar: Lista com nomes, CPFs, endereços e antecedentes criminais dos membros da equipe.',
          'Escala de trabalho com alocação por turno e área, entregue à coordenação da limpeza.'
        ]
      },
      {
        title: '5.2 Execução Durante a Feira',
        description: 'Rotina e supervisão operacional durante o evento.',
        substeps: [
          'Durante a Feira, os funcionários da equipe de limpeza deverão: Estar uniformizados, utilizando EPIs obrigatórios e credencial do evento.',
          'Respeitar os horários estabelecidos na escala para execução das tarefas.',
          'Verificar se a limpeza nos horários anteriores à abertura da Feira foi executada conforme padrão.',
          'Supervisionar a execução das tarefas e registrar ocorrências, quando aplicável.'
        ]
      },
      {
        title: '5.3 Encerramento',
        description: 'Vistoria final e envio para faturamento.',
        substeps: [
          'Ao final da Feira: executar limpeza final após a desmontagem dos stands.',
          'Realizar vistoria de entrega da área limpa e desocupada.',
          'Emitir relatório de execução dos serviços e encaminhar ao Financeiro para faturamento.'
        ]
      }
    ],
    outputs: [
      'Contrato de prestação de serviços de limpeza firmado',
      'Escala de trabalho e documentação da equipe validada',
      'Relatório de execução dos serviços (diário/final)',
      'Termo de entrega da área limpa e desocupada'
    ],
    performanceIndicators: [
      'Conformidade com a escala de trabalho (meta: 100%)',
      'Índice de satisfação dos expositores com a limpeza',
      'Número de ocorrências relacionadas à equipe de limpeza'
    ]
  },
  {
    id: 'POP-025',
    title: 'Gestão de Manutenção Predial',
    process: 'EVENTOS / INFRAESTRUTURA',
    sector: 'Eventos',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Padronizar o processo de identificação, planejamento, contratação e execução de serviços de manutenção predial na ACII, garantindo a preservação do patrimônio, segurança dos usuários e conformidade com as diretrizes administrativas e financeiras da instituição.',
    applicationField: [
      'Eventos',
      'Administrativo',
      'Financeiro',
      'Jurídico',
      'Gerência Executiva da ACII',
      'Prestadores de serviços terceirizados'
    ],
    responsiblePrimary: 'Auxiliar Administrativo de Eventos / Coordenador de Eventos',
    responsibleSupport: [
      'Gerente Executiva',
      'Financeiro',
      'Jurídico',
      'Diretor Financeiro',
      'Presidente da ACII',
      'Prestadores de serviço'
    ],
    inputs: [
      'Chamado interno de colaborador ou solicitação da Diretoria',
      'Relatório de avaliação técnica preventiva',
      'Especificação do problem ou necessidade de intervenção',
      'Orçamentos de prestadores de serviço e fornecedores de materiais',
      'Diretrizes de aprovação da Gerência Executiva e Diretoria'
    ],
    steps: [
      {
        title: '5.1 Identificação da Necessidade',
        description: 'Detecção do problema por rotina ou abertura de chamado.',
        substeps: [
          'Avaliação técnica preventiva programada.',
          'Chamado realizado por um colaborador ou setor da ACII.',
          'Registrar a solicitação em planilha ou sistema de controle de manutenção, com data, descrição do problema, local e prioridade.'
        ]
      },
      {
        title: '5.2 Análise Inicial do Problema',
        description: 'Classificação e definição preliminar de escopo.',
        substeps: [
          'Verificar o tipo de manutenção necessária: Corretiva (reparo de falha ou avaria já ocorrida) ou Preventiva (intervenção programada para evitar falhas).',
          'Definir escopo preliminar: serviços a serem executados, materiais necessários e prazo estimado.',
          'Consultar, quando necessário, apoio técnico especializado para avaliação de complexidade.'
        ]
      },
      {
        title: '5.3 Cotação de Serviços e Materiais',
        description: 'Coleta de orçamentos múltiplos no mercado.',
        substeps: [
          'Realizar, no mínimo, 3 (três) cotações com prestadores de serviços qualificados para a execução do serviço.',
          'Realizar, no mínimo, 3 (três) cotações de materiais necessários para a execução, quando aplicável.',
          'Documentar as cotações com: razão social, CNPJ, valor total, prazo de execução, condições de pagamento e garantias oferecidas.'
        ]
      },
      {
        title: '5.4 Envio ao Financeiro para Triagem',
        description: 'Análise e compilação de propostas.',
        substeps: [
          'Encaminhar as cotações consolidadas ao setor Financeiro, com parecer técnico preliminar.',
          'O Financeiro analisa a documentação e encaminha à Gerente Executiva para escolha do fornecedor, com cópia para conhecimento da Diretoria quando necessário.'
        ]
      },
      {
        title: '5.5 Escolha do Fornecedor e Emissão da Ordem de Serviço',
        description: 'Seleção, emissão e aprovação da OS.',
        substeps: [
          'O fornecedor é escolhido em decisão conjunta da Gerente Executiva, Diretor Financeiro ou Presidente da ACII, com base nos critérios: Preço, Prazo, Qualidade técnica e referências, Condição de associado à ACII (quando aplicável) e Capacidade de suporte a sinistros e garantias contratuais.',
          'O Financeiro gera a Ordem de Serviço (OS) com número de controle, descrição do serviço, valor aprovado e prazo de execução.',
          'A OS é entregue à Gerente Executiva, que busca a assinatura do Diretor Financeiro ou do Presidente da ACII, conforme alçada de aprovação.',
          'Após a assinatura, o processo retorna ao Financeiro para prosseguimento.'
        ]
      },
      {
        title: '5.6 Contratação do Serviço',
        description: 'Aquisição direta ou minuta de contrato jurídico.',
        substeps: [
          'O Financeiro realiza a contratação do serviço e a compra dos produtos de forma direta, quando o valor e a complexidade permitirem.',
          'Para serviços de maior complexidade ou valor elevado, o Financeiro repassa ao Jurídico para confecção de contrato de prestação de serviços, com cláusulas de escopo, prazo, pagamento, garantias e penalidades.',
          'O contrato ou ordem de compra é assinado pelas partes e arquivado no sistema de gestão documental.'
        ]
      },
      {
        title: '5.7 Execução do Serviço',
        description: 'Supervisão ativa no início e decorrer da atividade.',
        substeps: [
          'Iniciar a execução da manutenção conforme cronograma aprovado.',
          'O Auxiliar Administrativo de Eventos ou responsável designado acompanha o acesso do prestador às dependências da ACII, garantindo conformidade com normas de segurança e preservação do patrimônio.',
          'Registrar eventuais intercorrências durante a execução.'
        ]
      },
      {
        title: '5.8 Recebimento e Encaminhamento de Documentação Fiscal',
        description: 'Coleta de notas e boletos.',
        substeps: [
          'O Auxiliar Administrativo de Eventos recebe do prestador: Notas fiscais dos serviços e materiais, Boletos e demais comprovantes de pagamento.',
          'Conferir se a documentação está completa e em conformidade com a OS ou contrato.',
          'Encaminhar a documentação ao Financeiro para processamento do pagamento e arquivamento.'
        ]
      },
      {
        title: '5.9 Acompanhamento e Validação Final',
        description: 'Vistoria, aprovação técnica e cadastro patrimonial.',
        substeps: [
          'Acompanhar a execução do serviço até a conclusão.',
          'Verificar, em conjunto com o solicitante ou setor técnico, se o problema foi efetivamente sanado.',
          'Validar a conformidade do serviço com o escopo aprovado na OS ou contrato.',
          'Emitir termo de recebimento ou relatório de conformidade, quando aplicável.',
          'Atualizar o histórico de manutenção do imóvel no sistema de gestão patrimonial.'
        ]
      }
    ],
    outputs: [
      'Ordem de Serviço (OS) ou contrato firmado e assinado',
      'Serviço de manutenção executado e validado',
      'Documentação fiscal (notas, boletos) processada pelo Financeiro',
      'Registro de manutenção no histórico patrimonial',
      'Termo de recebimento ou relatório de conformidade'
    ],
    performanceIndicators: [
      'Tempo médio entre identificação e conclusão da manutenção',
      '% de serviços concluídos dentro do prazo e escopo aprovados',
      'Índice de satisfação do solicitante com o serviço executado',
      'Conformidade documental (OS, contrato, notas fiscais) – meta: 100%',
      'Redução de retrabalho por falha na execução (meta: < 5%)'
    ]
  },
  {
    id: 'POP-026',
    title: 'Locação de Espaços para Eventos Externos',
    process: 'EVENTOS / GESTÃO DE ESPAÇOS',
    sector: 'Eventos',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Padronizar o processo de locação e gestão de espaços para eventos externos realizados pela ACII ou por terceiros, garantindo planejamento adequado, conformidade contratual, execução supervisionada e entrega conforme as condições acordadas.',
    applicationField: [
      'Setor de Eventos da ACII',
      'Assessoria Jurídica',
      'Financeiro',
      'Gerência Executiva',
      'Presidência',
      'Empresas contratantes/locatárias'
    ],
    responsiblePrimary: 'Gerente Executiva (Responsável Geral) / Coordenador de Eventos – Daniel (Execução Direta)',
    responsibleSupport: [
      'Auxiliar Administrativo de Eventos',
      'Auxiliar Jurídico',
      'Financeiro',
      'Presidente da ACII'
    ],
    inputs: [
      'Planejamento e demanda da empresa contratante',
      'Calendário de disponibilidade do centro de convenções',
      'Diretrizes orçamentárias e de precificação da ACII',
      'Requisitos técnicos do evento (som, telão de LED, estrutura, serviços)'
    ],
    steps: [
      {
        title: '5.1 Planejamento Inicial',
        description: 'Triagem e verificação técnica e logística.',
        substeps: [
          'Receber o planejamento detalhado da empresa contratante, incluindo data, porte do evento, público estimado, estrutura necessária e serviços complementares.',
          'Validar a viabilidade técnica e logística da demanda junto à Coordenação de Eventos.'
        ]
      },
      {
        title: '5.2 Reserva do Espaço',
        description: 'Bloqueio na agenda oficial de ocupação.',
        substeps: [
          'Reservar o local no centro de convenções conforme o porte e as necessidades do evento.',
          'Garantir a alocação dos equipamentos de apoio da ACII (som e telão de LED), quando aplicável.',
          'Confirmar a reserva no sistema interno e atualizar a agenda de ocupação.'
        ]
      },
      {
        title: '5.3 Levantamento de Dados para Confecção do Contrato',
        description: 'Parametrização legal e confecção de minutas.',
        substeps: [
          'O Auxiliar Jurídico levanta todas as características e cláusulas pertinentes ao porte do evento, incluindo prazos, valores, responsabilidades, seguros, normas de uso e penalidades.',
          'Validar as cláusulas com a Gerente Executiva e a Coordenação de Eventos.'
        ]
      },
      {
        title: '5.4 Encaminhamento para Assinatura',
        description: 'Assinaturas formais e guarda em arquivo.',
        substeps: [
          'O Auxiliar Jurídico encaminha o contrato para coleta de assinaturas do Locatário (empresa contratante), Locador (Presidente da ACII) e testemunhas.',
          'Arquivar o contrato assinado no sistema de gestão documental e fornecer cópia às partes envolvidas.'
        ]
      },
      {
        title: '5.5 Contratações de Serviços Complementares',
        description: 'Obtenção de cotações para serviços de terceiros.',
        substeps: [
          'Caso sejam necessários serviços adicionais (montagem, segurança, limpeza, alimentação, etc.), o Auxiliar Administrativo de Eventos realiza cotação em, no mínimo, 3 fornecedores.',
          'Consolidar os orçamentos e repassar ao setor Financeiro para análise.'
        ]
      },
      {
        title: '5.6 Aprovação Financeira e Diretoria',
        description: 'Validação de orçamentos e repasse para contratação.',
        substeps: [
          'O Financeiro analisa os orçamentos e encaminha à Gerente Executiva e Direção para autorização.',
          'Caso aprovado: o Financeiro repassa as instruções ao Auxiliar Administrativo de Eventos, que formaliza as contratações.',
          'Caso não aprovado: retorna para solicitação de novos orçamentos ou readequação do escopo.'
        ]
      },
      {
        title: '5.7 Vistoria Pré-Evento',
        description: 'Checklist inicial e formalização do recebimento.',
        substeps: [
          'O Auxiliar Administrativo de Eventos realiza vistoria técnica no local do evento.',
          'Preencher checklist de condições iniciais (infraestrutura, equipamentos, limpeza, segurança) e colher assinatura do contratante como termo de recebimento.'
        ]
      },
      {
        title: '5.8 Supervisão Durante o Evento',
        description: 'Acompanhamento ativo de conformidade.',
        substeps: [
          'Acompanhar e supervisionar a execução do evento conforme o planejamento aprovado.',
          'Assegurar que a utilização do espaço, equipamentos e serviços esteja em conformidade com o contrato e as normas da ACII.',
          'Registrar e solucionar intercorrências, quando necessário.'
        ]
      },
      {
        title: '5.9 Vistoria e Recebimento Pós-Evento',
        description: 'Checklist final, apuração de avarias e encerramento.',
        substeps: [
          'Após o término do evento e desmontagem, realizar nova vistoria utilizando o checklist de entrega.',
          'Verificar se o local e os equipamentos foram devolvidos nas mesmas condições do recebimento.',
          'Registrar eventuais avarias ou divergências e acionar o Jurídico/Financeiro para cobrança ou ressarcimento, conforme cláusulas contratuais.',
          'Arquivar checklist final e encerrar o processo.'
        ]
      }
    ],
    outputs: [
      'Contrato de locação assinado e arquivado',
      'Espaço reservado e equipamentos alocados',
      'Serviços complementares contratados e aprovados',
      'Checklist de vistoria pré-evento assinado',
      'Relatório de supervisão e checklist de recebimento pós-evento',
      'Registro de eventuais não conformidades ou cobranças'
    ],
    performanceIndicators: [
      'Tempo médio entre solicitação e assinatura do contrato',
      '% de eventos entregues dentro do escopo e prazo contratual',
      'Índice de satisfação do locatário com a estrutura e suporte',
      'Conformidade entre vistoria de entrada e saída (meta: < 3% de divergências)',
      'Adesão ao orçamento aprovado para contratações complementares'
    ]
  },
  {
    id: 'POP-027',
    title: 'Promoção e Realização de Eventos',
    process: 'EVENTOS / GESTÃO DE EVENTOS',
    sector: 'Eventos',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Padronizar o planejamento, contratação, execução e avaliação de eventos promovidos ou realizados pela ACII, garantindo qualidade logística, conformidade contratual, controle orçamentário e alcance dos objetivos estratégicos estabelecidos.',
    applicationField: [
      'Coordenação de Eventos',
      'Gerência Executiva',
      'Financeiro',
      'Diretoria',
      'Fornecedores e parceiros envolvidos na realização de eventos'
    ],
    responsiblePrimary: 'Gerente Executiva (Responsável Geral) / Daniel – Coordenação de Eventos (Execução Direta)',
    responsibleSupport: [
      'Auxiliar Administrativo de Eventos',
      'Financeiro',
      'Diretoria',
      'Fornecedores e Parceiros'
    ],
    inputs: [
      'Planejamento detalhado da empresa contratante ou da diretoria',
      'Calendário e disponibilidade de espaços',
      'Diretrizes orçamentárias e estratégicas da ACII',
      'Requisitos técnicos, logísticos e de segurança do evento'
    ],
    steps: [
      {
        title: '5.1 Planejamento Inicial',
        description: 'Triagem e viabilização na agenda oficial.',
        substeps: [
          'Receber o planejamento da empresa contratante ou diretoria, contendo data, público estimado, estrutura necessária e cronograma.',
          'Validar a viabilidade técnica, logística e de disponibilidade de espaços junto à Coordenação de Eventos.',
          'Registrar a demanda no sistema de gestão de eventos da ACII.'
        ]
      },
      {
        title: '5.2 Reserva do Espaço',
        description: 'Alocação física e de recursos audiovisuais.',
        substeps: [
          'Reservar o local no centro de convenções ou outro espaço adequado, conforme o porte e as necessidades do evento.',
          'Garantir a alocação dos equipamentos da ACII (som e telão de LED), quando aplicável.',
          'Confirmar a reserva e atualizar a agenda de ocupação do patrimônio.'
        ]
      },
      {
        title: '5.3 Levantamento de Orçamento e Logística',
        description: 'Cotação de fornecedores essenciais e plano logístico.',
        substeps: [
          'Orçar itens essenciais: segurança, bombeiros, grid, estrutura física, limpeza, alimentação, energia e demais serviços necessários.',
          'Estruturar o plano logístico completo do evento, incluindo cronograma de montagem, operação e desmontagem.',
          'Consolidar todas as cotações em planilha ou sistema interno para análise comparativa.'
        ]
      },
      {
        title: '5.4 Encaminhamento ao Financeiro',
        description: 'Compilação de custos para validação e aprovação formal.',
        substeps: [
          'Encaminhar os orçamentos consolidados ao setor Financeiro para organização e validação documental.',
          'O Financeiro encaminha o material à Gerente Executiva e Direção para análise, validação e aprovação formal.'
        ]
      },
      {
        title: '5.5 Repasse de Instruções e Autorização',
        description: 'Distribuição de verba e aprovação de início.',
        substeps: [
          'Após aprovação, o Financeiro repassa os orçamentos validados e instruções financeiras ao Auxiliar Administrativo de Eventos, que dará andamento aos processos de contratação.',
          'Caso não aprovado, retornar à etapa 5.3 para readequação de escopo, negociação ou novas cotações.'
        ]
      },
      {
        title: '5.6 Contato com Fornecedores e Parceiros',
        description: 'Contatos formais e confecção de contratos e OSs.',
        substeps: [
          'Realizar contatos formais com fornecedores e parceiros envolvidos.',
          'Confirmar escopo, prazos, condições de acesso, horários de entrega e retirada.',
          'Formalizar contratos, ordens de serviço ou termos de parceria, conforme alçada de aprovação e complexidade.'
        ]
      },
      {
        title: '5.7 Vistoria Pré-Evento',
        description: 'Checklist pré-montagem para garantir condições básicas.',
        substeps: [
          'Realizar vistoria técnica no local do evento antes do início da montagem.',
          'Preencher checklist de condições iniciais (infraestrutura, equipamentos, segurança, limpeza) e colher assinatura do contratante como termo de recebimento do espaço.'
        ]
      },
      {
        title: '5.8 Supervisão Durante o Evento',
        description: 'Supervisão ativa no local durante todo o evento.',
        substeps: [
          'O Coordenador de Eventos (Daniel) acompanha e supervisiona a execução conforme o planejamento aprovado.',
          'Assegurar que a utilização do espaço, equipamentos e serviços esteja em conformidade com o contrato e as normas da ACII.',
          'Registrar, solucionar ou escalar intercorrências em tempo real, mantendo comunicação direta com a Gerente Executiva.'
        ]
      },
      {
        title: '5.9 Vistoria e Recebimento Pós-Evento',
        description: 'Apuração final de avarias, perdas e desmontagem.',
        substeps: [
          'Após o término do evento e desmontagem, realizar nova vistoria utilizando o checklist de entrega.',
          'Verificar se o local e os equipamentos foram devolvidos nas mesmas condições.',
          'Registrar eventuais avarias, perdas ou divergências e acionar o Jurídico/Financeiro para ressarcimento, conforme cláusulas contratuais.'
        ]
      },
      {
        title: '5.10 Avaliação e Relatório Final',
        description: 'Relatório de indicadores de satisfação e contas.',
        substeps: [
          'Avaliar os resultados do evento com base nos indicadores pré-definidos e no alcance dos objetivos estratégicos.',
          'Elaborar relatório com análise de desempenho, pontos de melhoria, feedback de stakeholders e prestação de contas.',
          'Submeter o relatório à Gerente Executiva para revisão, aprovação final e arquivamento no sistema de gestão.'
        ]
      }
    ],
    outputs: [
      'Espaço reservado e equipamentos alocados',
      'Orçamentos aprovados e contratos formalizados',
      'Checklist de vistoria pré-evento assinado',
      'Evento executado conforme planejamento e normas de segurança',
      'Checklist de recebimento pós-evento validado',
      'Relatório final de avaliação e desempenho arquivado'
    ],
    performanceIndicators: [
      '% de eventos entregues dentro do prazo e orçamento aprovado',
      'Índice de satisfação do contratante e público participante',
      'Conformidade entre vistoria de entrada e saída (meta: < 3% de divergências)',
      'Tempo médio entre aprovacão financeira e início da montagem',
      'Número de intercorrências registradas e tempo médio de resolução'
    ]
  },
  {
    id: 'POP-028',
    title: 'Contas a Pagar e Conciliação',
    process: 'FINANCEIRO',
    sector: 'Financeiro',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 4',
    objective: 'Estabelecer o procedimento padrão para recebimento, lançamento, autorização, execução, conciliação e arquivamento das despesas da ACII, garantindo controle financeiro rigoroso, conformidade documental, segurança nas transações e transparência na gestão dos recursos.',
    applicationField: [
      'Departamento Financeiro',
      'Diretoria Financeira',
      'Setores solicitantes de despesas da ACII'
    ],
    responsiblePrimary: 'Colaborador do Setor Financeiro (ex: Karla)',
    responsibleSupport: [
      'Diretoria Financeira',
      'Setores Solicitantes',
      'Gerente Executiva'
    ],
    inputs: [
      'Autorização de Despesa aprovada',
      'Nota Fiscal ou documento fiscal equivalente',
      'Forma de pagamento definida (PIX ou boleto)',
      'Centro de custo vinculado à despesa (quando aplicável)',
      'Calendário de pagamentos da ACII',
      'Extrato bancário para conciliação'
    ],
    steps: [
      {
        title: '5.1 Recebimento da Autorização de Despesa',
        description: 'Chegada da despesa e validação básica.',
        substeps: [
          'O processo inicia com a chegada da Autorização de Despesa, acompanhada da Nota Fiscal e da forma de pagamento definida (PIX ou boleto).',
          'O financeiro verifica se a documentação está completa e correta, conferindo dados do fornecedor (razão social, CNPJ/CPF), valor, descrição, vencimento e aprovação prévia.',
          'Registrar o recebimento no sistema de controle interno.'
        ]
      },
      {
        title: '5.2 Lançamento no Sistema e Programação dos Pagamentos',
        description: 'Lançamento e distribuição de acordo com o calendário.',
        substeps: [
          'A colaboradora do financeiro realiza o lançamento da despesa no sistema, associando fornecedor, valor, vencimento, forma de pagamento e centro de custo.',
          'A despesa é programada conforme o calendário de pagamentos da ACII (Autorizações dias 01-09 pagos no dia 01, dias 10-19 pagos no dia 10, dias 20-24 pagos no dia 20, dias 25-31 pagos no dia 25).',
          'Gerar relatório de pagamentos programados para conferência da Diretoria.'
        ]
      },
      {
        title: '5.3 Autorização dos Pagamentos pela Diretoria',
        description: 'Aprovação presencial ou digital dos pagamentos.',
        substeps: [
          'Nos dias programados (01, 10, 20, 25), o Diretor Financeiro comparece pessoalmente ao setor financeiro para conferir lançamentos e autorizar pagamentos.',
          'Caso não possa comparecer, analisa relatórios e autoriza digitalmente por assinatura digital em sistema ou confirmação expressa por e-mail corporativo.',
          'Registrar a autorização no sistema com data, horário e responsável.'
        ]
      },
      {
        title: '5.4 Execução dos Pagamentos',
        description: 'Transferência de fundos via gerenciador bancário.',
        substeps: [
          'O Diretor realiza os pagamentos diretamente no gerenciador bancário (internet banking ou plataforma corporativa).',
          'Após o pagamento, os comprovantes são gerados pelo sistema bancário.',
          'Comunicar ao setor financeiro a conclusão dos pagamentos para prosseguimento da conferência.'
        ]
      },
      {
        title: '5.5 Conferência e Organização pela Área Financeira',
        description: 'Análise diária de extratos e conferência de valores.',
        substeps: [
          'O financeiro acessa o extrato bancário no mesmo dia para conferir se todos os pagamentos foram realizados corretamente.',
          'Verificar se os valores batem com os programados e identificar eventuais divergências (tarifas, duplicidades, etc.).',
          'Registrar as conferências em planilha ou sistema de conciliação.'
        ]
      },
      {
        title: '5.6 Emissão de Comprovantes e Arquivamento',
        description: 'Montagem do dossiê físico ou digital de despesa.',
        substeps: [
          'A colaboradora do financeiro imprime os comprovantes de pagamento.',
          'Todos os documentos relacionados ao pagamento (Autorização, Nota Fiscal, Comprovantes, Boleto) são reunidos e organizados.',
          'Documentos são anexados física ou digitalmente na pasta correspondente conforme política de retenção.'
        ]
      },
      {
        title: '5.7 Conciliação Bancária',
        description: 'Baixa de duplicatas e conferência contábil.',
        substeps: [
          'Após a verificação no sistema, realizar a baixa das duplicatas a pagar.',
          'Efetuar a conciliação bancária confrontando lançamentos internos vs extrato bancário, valores programados vs debitados, e saldo contábil vs bancário.',
          'Registrar pendências, providenciar ajustes se necessário, e assinar/arquivar relatório mensal de conciliação.'
        ]
      },
      {
        title: '5.8 Organização Conforme o Caixa do Dia',
        description: 'Ajuste do fluxo financeiro de acordo com a disponibilidade.',
        substeps: [
          'O financeiro organiza o fluxo de pagamentos de forma compatível com o saldo disponível no caixa.',
          'Priorizar obrigações conforme cronograma de vencimentos, criticidade da despesa (folha, impostos, parceiros estratégicos) e recursos disponíveis.',
          'Comunicar à Diretoria Financeira eventuais restrições de caixa que impactem os pagamentos.'
        ]
      }
    ],
    outputs: [
      'Pagamentos executados e comprovados',
      'Conciliação bancária realizada e documentada',
      'Documentação fiscal e financeira arquivada conforme política interna',
      'Relatório de conciliação mensal assinado',
      'Planilha de controle de caixa atualizada'
    ],
    performanceIndicators: [
      '% de pagamentos realizados dentro do prazo programado',
      'Tempo médio entre recebimento da autorização e execução do pagamento',
      'Índice de divergências na conciliação bancária (meta: < 1%)',
      'Conformidade documental (arquivamento completo e rastreável) – meta: 100%',
      'Satisfação dos setores solicitantes com o tempo de resposta do Financeiro'
    ]
  },
  {
    id: 'POP-029',
    title: 'Contas a Receber e Conciliação Bancária',
    process: 'FINANCEIRO',
    sector: 'Financeiro',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 4',
    objective: 'Estabelecer o procedimento padrão para identificação, registro, recebimento, baixa e conciliação das receitas da ACII, garantindo controle financeiro rigoroso, integridade dos dados, conformidade documental e suporte ao fechamento contábil e auditorias.',
    applicationField: [
      'Departamento Financeiro',
      'Contabilidade externa',
      'Setores geradores de receita (Comercial, Eventos, Certificação Digital)',
      'Diretoria Financeira da ACII'
    ],
    responsiblePrimary: 'Colaborador do Setor Financeiro',
    responsibleSupport: [
      'Contabilidade',
      'Diretoria Financeira',
      'Gerência Executiva',
      'Setores comercial e de eventos'
    ],
    inputs: [
      'Vendas concretizadas ou serviços prestados',
      'Relatórios de produtos/serviços recorrentes',
      'Boletos, TEDs, PIX e comprovantes de transferência',
      'Extratos bancários diários',
      'Arquivo de retorno bancário (CNAB/retorno)',
      'Sistema de gestão da ACII (SIGAEM ou equivalente)'
    ],
    steps: [
      {
        title: '5.1 Identificação da Venda ou Recebimento',
        description: 'Mapeamento das origens de receitas e emissão de boletos.',
        substeps: [
          'Identificar valores a receber (Mensalidades, SERASA, AC Celular, Medicor, Placas publicitárias, Certificado Digital, Locação de espaços, Eventos, Comissão PROE, Patrocínios).',
          'A colaboradora do financeiro emite o boleto bancário contra o sacado.',
          'Garantir o registro no sistema com dados completos do sacado, valor, vencimento, descrição e centro de custo.'
        ]
      },
      {
        title: '5.2 Acesso aos Dados Bancários e Extratos',
        description: 'Monitoramento diário de compensações bancárias.',
        substeps: [
          'Diariamente, o Financeiro acessa o gerenciador bancário para monitorar as entradas.',
          'A colaboradora emite os extratos do dia anterior para visualizar créditos compensados na conta da ACII.',
          'Conferir se os valores creditados correspondem aos boletos emitidos e vencidos.'
        ]
      },
      {
        title: '5.3 Processamento do Arquivo de Retorno',
        description: 'Importação automática do arquivo CNAB.',
        substeps: [
          'O Financeiro realiza o download do Arquivo de Retorno diretamente no site do banco.',
          'Este arquivo é importado no sistema de gestão da ACII, identificando boletos pagos, datas e valores líquidos recebidos.',
          'Validar o processamento e registrar eventuais falhas de importação.'
        ]
      },
      {
        title: '5.4 Baixa dos Títulos no Sistema',
        description: 'Ação de baixa automatizada ou conciliação manual.',
        substeps: [
          'Com a leitura do arquivo, o sistema realiza a baixa automática dos boletos recebidos.',
          'O Financeiro verifica o relatório para garantir que saíram da lista de "Contas a Receber" para "Recebidos/Baixados".',
          'Caso algum boleto não conste no arquivo, fazer baixa manual mediante conferência do comprovante e registrar justificativa.'
        ]
      },
      {
        title: '5.5 Conciliação Bancária',
        description: 'Garantia de batimento entre saldo real e do sistema.',
        substeps: [
          'Após as baixas, a colaboradora realiza a conciliação final confrontando os dados de recebimento vs extrato bancário real.',
          'Investigar e corrigir divergências imediatamente, com registro da tratativa.',
          'Assinar e arquivar o relatório de conciliação diária/semanal.'
        ]
      },
      {
        title: '5.6 Arquivamento e Organização',
        description: 'Organização dos relatórios de conciliação diários.',
        substeps: [
          'Salvar digitalmente ou imprimir os relatórios de retorno e comprovantes.',
          'Organizar a documentação por data e tipo de receita para fechamento contábil mensal, auditorias e consultas futuras.',
          'Garantir backup automático dos arquivos digitais conforme a política de retenção.'
        ]
      },
      {
        title: '5.7 Envio dos Relatórios para a Contabilidade',
        description: 'Fechamento do mês e remessa contábil externa.',
        substeps: [
          'Até o dia 10 de cada mês, enviar os relatórios consolidados de recebimentos para a Contabilidade externa.',
          'A remessa deve incluir: Relatório de recebimentos, Conciliação assinada, Exceções, e Planilha de controle por centro de custo.',
          'Confirmar o recebimento e registrar o envio no sistema interno.'
        ]
      }
    ],
    outputs: [
      'Boletos emitidos e registrados no sistema',
      'Títulos baixados automaticamente ou manualmente com justificativa',
      'Conciliação bancária diária/semanal realizada e documentada',
      'Relatórios de recebimentos enviados à Contabilidade até o dia 10',
      'Documentação fiscal e financeira arquivada conforme política interna',
      'Saldo contábil conferido e validado'
    ],
    performanceIndicators: [
      '% de recebimentos conciliados automaticamente via arquivo de retorno (meta: > 95%)',
      'Tempo médio entre vencimento e baixa do título',
      'Índice de divergências na conciliação bancária (meta: < 1%)',
      'Conformidade no envio de relatórios à Contabilidade (meta: 100% até o dia 10)',
      'Redução de inadimplência ativa por acompanhamento sistemático'
    ]
  },
  {
    id: 'POP-030',
    title: 'Conferência do Caixa Semanal pela Gerência Executiva / Diretoria',
    process: 'FINANCEIRO / CONTROLE GERENCIAL',
    sector: 'Financeiro',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Estabelecer o procedimento padrão para conferência semanal do caixa da ACII pela Gerência Executiva e/ou Diretoria, garantindo transparência financeira, identificação tempestiva de divergências e suporte à tomada de decisão estratégica.',
    applicationField: [
      'Departamento Financeiro',
      'Gerência Executiva',
      'Diretoria Financeira da ACII'
    ],
    responsiblePrimary: 'Gerente Executiva / Diretoria Financeira',
    responsibleSupport: [
      'Colaborador do Setor Financeiro',
      'Contabilidade'
    ],
    inputs: [
      'Caixas semanais organizados pelo Financeiro',
      'Extratos bancários do período',
      'Relatórios de contas a pagar e a receber',
      'Comprovantes de despesas e receitas',
      'Planilha de controle de fluxo de caixa'
    ],
    steps: [
      {
        title: '5.1 Preparação pelo Setor Financeiro',
        description: 'Organização prévia e consolidação do dossiê semanal.',
        substeps: [
          'O Financeiro separa e organiza os caixas semanais, consolidando extratos bancários, comprovantes de pagamentos executados, relatórios de recebimentos e conciliação preliminar.',
          'Organizar documentação em pasta física ou digital para verificação.',
          'Encaminhar com antecedência a agenda de conferência para alinhamento de disponibilidade.'
        ]
      },
      {
        title: '5.2 Conferência pela Gerência Executiva / Diretoria',
        description: 'Auditoria semanal de transações realizadas e conciliações.',
        substeps: [
          'Na segunda-feira, a Gerência Executiva e/ou Diretoria analisa os caixas.',
          'Conferir conciliação extrato/sistema, conformidade dos pagamentos com as autorizações prévias, consistência de recebimentos, e o saldo final.',
          'Vistar os documentos de acordo com a análise, registrando aprovação ou ressalvas.'
        ]
      },
      {
        title: '5.3 Tratamento de Divergências',
        description: 'Ações imediatas para corrigir erros ou inconsistências.',
        substeps: [
          'Caso seja encontrada diferença, comunicar imediatamente o financeiro para apuração e registrar em planilha de controle de ocorrências.',
          'Aguardar justificativa formal e documentação comprovando a correção, reavaliando após o esclarecimento.',
          'Se tudo estiver correto, assinar o termo de conferência e encerrar o procedimento semanal.'
        ]
      },
      {
        title: '5.4 Consolidação Mensal',
        description: 'Planilhamento global de contas e envio para estudos estratégicos.',
        substeps: [
          'Ao fim do mês, o Financeiro gera uma planilha do Excel contendo despesas fixas/variáveis, receitas fixas/variáveis, saldos e fluxo de caixa.',
          'Organizar planilha para consultas, auditorias e suporte ao planejamento orçamentário.',
          'Enviar a consolidação mensal à Gerente Executiva e Diretoria para análise estratégica.'
        ]
      }
    ],
    outputs: [
      'Caixas semanais conferidos e vistados',
      'Termo de conferência assinado pela Gerência / Diretoria',
      'Registro de divergências tratadas (quando aplicável)',
      'Planilha mensal de despesas e receitas consolidada',
      'Base de dados para consultas e auditorias futuras'
    ],
    performanceIndicators: [
      '% de conferências realizadas dentro do prazo semanal (meta: 100%)',
      'Tempo médio para resolução de divergências identificadas',
      'Conformidade entre saldo bancário e registro interno (meta: 100%)',
      'Disponibilidade da planilha mensal até o 5º dia útil do mês subsequente',
      'Satisfação da Diretoria com a clareza e confiabilidade das informações'
    ]
  },
  {
    id: 'POP-031',
    title: 'Faturamento de Produtos e Serviços',
    process: 'FINANCEIRO / FATURAMENTO',
    sector: 'Financeiro',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Padronizar o processo de faturamento dos produtos e serviços recorrentes da ACII (SERASA, AC Celular, MEDICOR e FECOIMP), garantindo emissão tempestiva de boletos, conciliação correta com os sistemas internos e envio adequado aos clientes, com controle de vencimentos e rastreabilidade documental.',
    applicationField: [
      'Departamento Financeiro da ACII',
      'Setor Jurídico',
      'Serviços associados: SERASA, AC Celular, MEDICOR e FECOIMP'
    ],
    responsiblePrimary: 'Colaborador do Setor Financeiro',
    responsibleSupport: [
      'Jurídico',
      'Comercial',
      'TI (suporte ao SIGAEM)',
      'Gerência Executiva'
    ],
    inputs: [
      'Relatório de consultas SERASA do mês vigente',
      'Relatório de valores da AC Celular por cliente',
      'Acesso ao portal MEDICOR para verificação de adesões/cancelamentos',
      'Contratos firmados da FECOIMP encaminhados pelo Jurídico',
      'Sistema SIGAEM para geração de faturamento',
      'Sistema bancário para remessa de boletos'
    ],
    steps: [
      {
        title: '5.1 Faturamento SERASA',
        description: 'Geração do faturamento de consultas de crédito.',
        substeps: [
          'No dia 01 de cada mês, acessar o sistema SERASA e exportar todas as consultas do mês anterior para o Excel.',
          'Configurar a planilha com os campos obrigatórios (Produto, Ano, Mês, Logon, Quantidade) e importar para o SIGAEM.',
          'Conferir faturamento gerado (valores, clientes, quantidades), enviar remessa de boletos para o banco e despachar para os clientes até o dia 20 de cada mês.'
        ]
      },
      {
        title: '5.2 Faturamento AC Celular',
        description: 'Faturamento de telefonia corporativa por cliente.',
        substeps: [
          'Receber o relatório da AC Celular com valores a receber segregados por cliente.',
          'Verificar consistência de valores, cadastro e centro de custo.',
          'Gerar e enviar boletos via banco para os clientes, com vencimento padronizado para o dia 20, arquivando os comprovantes.'
        ]
      },
      {
        title: '5.3 Faturamento MEDICOR',
        description: 'Faturamento de plano de saúde / convênio.',
        substeps: [
          'Acessar o portal MEDICOR para verificar adesões e exclusões do período.',
          'Atualizar os dados de clientes ativos no sistema interno da ACII.',
          'Gerar remessa bancária de acordo com as adesões, emitir boletos para o dia 10 do mês, enviar aos clientes por e-mail e registrar históricos.'
        ]
      },
      {
        title: '5.4 Faturamento FECOIMP',
        description: 'Faturamento de stands e serviços para a Feira.',
        substeps: [
          'Setor Jurídico encaminha o contrato assinado da FECOIMP para o Financeiro.',
          'Analisar parcelamentos, valores, dados de faturamento e datas de vencimento contratadas.',
          'Gerar e emitir boletos nas datas acordadas, fazer remessa bancária, enviar aos clientes e notificar o setor de Eventos.'
        ]
      },
      {
        title: '5.5 Controle e Conciliação Pós-Faturamento',
        description: 'Cobrança, acompanhamento de inadimplência e feedback de gestão.',
        substeps: [
          'Acompanhar a liquidação dos boletos emitidos via arquivo de retorno bancário e baixar títulos no SIGAEM.',
          'Conciliar os valores, alertar o setor Comercial ou Jurídico sobre casos de inadimplência para tratativa, e gerar relatórios mensais para a Gerência.'
        ]
      }
    ],
    outputs: [
      'Boletos emitidos e enviados aos clientes dentro do prazo',
      'Remessas bancárias processadas e confirmadas',
      'Faturamento registrado no sistema SIGAEM',
      'Relatório mensal de faturamento por produto/serviço',
      'Conciliação bancária realizada e documentada',
      'Histórico de comunicações com clientes arquivado'
    ],
    performanceIndicators: [
      '% de boletos emitidos dentro do prazo mensal (meta: 100%)',
      'Tempo médio entre geração do faturamento e envio ao cliente',
      'Índice de divergências na conciliação bancária (meta: < 1%)',
      'Taxa de inadimplência por produto/serviço',
      'Satisfação dos clientes com clareza e pontualidade no envio dos boletos'
    ]
  },
  {
    id: 'POP-032',
    title: 'Análise de Contratos',
    process: 'JURÍDICO / COMPLIANCE',
    sector: 'Juridico',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Garantir que todos os contratos recebidos pela ACII passem por uma análise jurídica completa, assegurando conformidade com normas legais, políticas internas, orçamento aprovado e mitigação de riscos antes da assinatura formal.',
    applicationField: [
      'Setor Jurídico da ACII',
      'Gerência Executiva',
      'Diretoria',
      'Fornecedores',
      'Demais signatários envolvidos em processos contratuais'
    ],
    responsiblePrimary: 'Assessor Jurídico / Departamento Jurídico',
    responsibleSupport: [
      'Gerente Executiva',
      'Financeiro',
      'Fornecedores',
      'Signatários autorizados'
    ],
    inputs: [
      'Contrato enviado pela Gerência Executiva para análise',
      'Informações complementares: orçamento aprovado, escopo do serviço/produto, documentos de suporte',
      'Diretrizes contratuais e políticas internas da ACII',
      'Legislação aplicável (Código Civil, LGPD, normas setoriais)'
    ],
    steps: [
      {
        title: '5.1 Recebimento e Triagem Inicial',
        description: 'Recepção de contratos e registro de entrada.',
        substeps: [
          'Receber o contrato encaminhado pela Gerência Executiva, conferindo se está acompanhado de: Orçamento aprovado, Escopo detalhado do serviço ou produto, e Documentos de suporte (propostas, cotações, termos de referência).',
          'Registrar o recebimento no sistema de controle de processos jurídicos, atribuindo número de protocolo e data de entrada.'
        ]
      },
      {
        title: '5.2 Agendamento da Análise',
        description: 'Definição de prioridades e cronograma de análise jurídica.',
        substeps: [
          'Agendar a análise conforme disponibilidade da equipe jurídica e grau de urgência informado pela Gerência Executiva.',
          'Definir cronograma interno para conclusão da análise, priorizando contratos com prazos críticos de assinatura.'
        ]
      },
      {
        title: '5.3 Execução da Análise Jurídica',
        description: 'Exame minucioso de cláusulas contratuais e conformidade.',
        substeps: [
          'Realizar a análise técnica do contrato, comparando valores e prazos com o orçamento aprovado pelo Financeiro.',
          'Verificar cláusulas contratuais: objeto, obrigações, penalidades, rescisão e foro.',
          'Validar a qualificação completa das partes (razão social, CNPJ, endereço, representantes legais).',
          'Garantir conformidade com a LGPD para tratamento de dados pessoais.',
          'Avaliar viabilidade jurídica, riscos potenciais e medidas de mitigação.',
          'Conferir alinhamento com políticas internas de compliance da ACII.',
          'Emitir parecer jurídico fundamentado, classificando o contrato como: Aprovado sem ressalvas, Aprovado com ajustes recomendados, ou Não aprovado (com justificativa técnica).'
        ]
      },
      {
        title: '5.4 Retorno do Parecer à Gerência Executiva',
        description: 'Despacho do parecer e recomendações para a Gerência.',
        substeps: [
          'Encaminhar o parecer jurídico à Gerência Executiva, com cópia para conhecimento da Diretoria quando aplicável.',
          'Incluir no retorno: Resumo executivo da análise, Pontos de atenção e recomendações, e Prazo sugerido para ajustes ou assinatura.'
        ]
      },
      {
        title: '5.5 Tratamento de Aprovação ou Ajustes',
        description: 'Coleta de assinaturas ou solicitação de alterações.',
        substeps: [
          'Contrato Aprovado: Providenciar a assinatura conforme procedimento adequado (digital, presencial ou híbrido), orientar os signatários sobre formalidades e prazos, e registrar a assinatura no sistema de gestão documental.',
          'Contrato com Pendências: Solicitar ajustes ao fornecedor ou parte contratada, especificando as alterações necessárias, acompanhar o retorno do contrato revisado, e reanalisar o documento ajustado e emitir novo parecer, se necessário.',
          'Repetir o ciclo até aprovação final ou cancelamento do processo.'
        ]
      },
      {
        title: '5.6 Encerramento e Arquivamento',
        description: 'Encerramento formal de processos jurídicos e backup.',
        substeps: [
          'Após a assinatura do contrato e conferência final, encerrar o processo no sistema jurídico.',
          'Arquivar a documentação final conforme políticas de compliance e gestão documental da ACII: Contrato assinado (versão digital e física, quando aplicável), Parecer jurídico emitido, Histórico de ajustes e comunicações com o fornecedor, e Comprovantes de assinatura e autenticação.',
          'Garantir backup seguro e controle de acesso aos arquivos contratuais.'
        ]
      }
    ],
    outputs: [
      'Parecer jurídico emitido e registrado',
      'Contrato aprovado, ajustado ou recusado com fundamentação técnica',
      'Contrato assinado e arquivado conforme política de retenção documental',
      'Relatório de análise contratual para auditoria e compliance',
      'Histórico de processos jurídicos atualizado no sistema interno'
    ],
    performanceIndicators: [
      'Tempo médio de análise jurídica (meta: ≤ 3 dias úteis)',
      'Percentual de contratos aprovados na primeira análise (meta: > 90%)',
      'Percentual de contratos com pendências ou devoluções (meta: < 10%)',
      'Conformidade com prazos de assinatura definidos pela Gerência Executiva',
      'Satisfação da Gerência Executiva com clareza e agilidade do parecer jurídico'
    ]
  },
  {
    id: 'POP-033',
    title: 'Atendimento Parceiro SEBRAE',
    process: 'SALA PARCEIRO SEBRAE / ATENDIMENTO AO EMPREENDEDOR',
    sector: 'Juridico',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 4',
    objective: 'Padronizar o atendimento da Sala Parceiro SEBRAE da ACII para formalização, orientação e baixa de MEI, bem como consultas SERASA, garantindo conformidade legal, qualidade no atendimento, geração de valor ao empreendedor e fortalecimento do relacionamento institucional.',
    applicationField: [
      'Sala Parceiro SEBRAE da ACII',
      'Setor Comercial',
      'Financeiro',
      'Empreendedores atendidos (MEI, microempresas e interessados em formalização)'
    ],
    responsiblePrimary: 'Atendente da Sala Parceiro SEBRAE',
    responsibleSupport: [
      'Comercial',
      'Financeiro',
      'Jurídico',
      'SEBRAE-MA',
      'Gerente Executiva'
    ],
    inputs: [
      'Demanda do cliente para formalização, orientação ou consulta',
      'Documentação do cliente (RG/CPF, comprovante de endereço, e-mail, telefone)',
      'Conta GOV.BR ativa e válida do cliente',
      'Acesso aos sistemas: Portal do Empreendedor, SERASA (Concentre/Crednet)',
      'Termo de Abertura/Baixa do MEI (modelo ACII)',
      'Formulário de consentimento para registro fotográfico'
    ],
    steps: [
      {
        title: '5.1 Triagem Inicial e Identificação da Demanda',
        description: 'Recepção de cliente e classificação da solicitação.',
        substeps: [
          'Receber o cliente e identificar a natureza da demanda: Formalização de MEI (abertura), Orientação para MEI já constituído, Baixa de MEI, Consulta SERASA (CPF ou CNPJ), ou Filiação à ACII.',
          'Registrar a entrada no sistema de atendimento da Sala Parceiro SEBRAE.'
        ]
      },
      {
        title: '5.2 MEI – Abertura',
        description: 'Procedimento completo de abertura e formalização de MEI.',
        substeps: [
          'Informar ao cliente os documentos necessários para formalização: Identidade e CPF (originais ou cópias autenticadas), Comprovante de endereço atualizado, E-mail válido e Telefone para contato.',
          'Orientar sobre a obrigatoriedade da conta GOV.BR válida para acesso ao Portal do Empreendedor.',
          'Esclarecer benefícios e consequências da abertura do MEI: Possível perda de auxílios governamentais, Baixos custos tributários (DAS mensal), Direitos previdenciários (aposentadoria, auxílio-doença), Acesso a serviços bancários e linhas de crédito, Apoio técnico gratuito do SEBRAE, Emissão facilitada de Nota Fiscal, e Possibilidade de participação em licitações públicas.',
          'Acessar a conta GOV.BR do cliente e iniciar o preenchimento do cadastro no Portal do Empreendedor.',
          'Ao finalizar o preenchimento, ler o termo de consentimento ao cliente e obter sua concordância expressa.',
          'Concluir o processo com a geração do cartão CNPJ e do CCMEI (Certificado de Condição de Microempreendedor Individual).',
          'Solicitar assinatura do Termo de Abertura do MEI (modelo próprio da ACII – Anexo).',
          'Realizar registros fotográficos do atendimento, conforme permissão concedida no Termo de Abertura.',
          'Entregar ao cliente os documentos gerados e orientar sobre próximos passos (emissão de DAS, nota fiscal, etc.).'
        ]
      },
      {
        title: '5.3 MEI – Orientação',
        description: 'Orientação e emissão de guias de impostos mensais.',
        substeps: [
          'Receber o cliente com demanda específica de orientação para MEI.',
          'Analisar a necessidade do cliente conforme normas legais pertinentes ao porte MEI.',
          'Orientar o cliente na tomada de decisões, cumprindo requisitos técnicos e legais.',
          'Emitir e orientar sobre o Documento de Arrecadação do Simples Nacional (DAS) mensal.',
          'Orientar sobre a emissão da Declaração Anual do MEI (DASN-SIMEI) e prazos de entrega.',
          'Esclarecer procedimentos para emissão de Nota Fiscal (municipal, estadual ou federal, conforme atividade).',
          'Registrar a orientação prestada no sistema de atendimento.'
        ]
      },
      {
        title: '5.4 MEI – Baixa',
        description: 'Processo de baixa e extinção de CNPJ do MEI.',
        substeps: [
          'Receber o cliente solicitando baixa do CNPJ MEI.',
          'Consultar sistemas para identificar pendências (DAS em aberto, declaração não entregue, obrigações acessórias).',
          'Informar ao cliente sobre eventuais pendências e orientar sobre regularização prévia.',
          'Caso não haja pendências, dialogar com o cliente para compreender o motivo da baixa e apresentar soluções técnicas alternativas, quando aplicável.',
          'Acessar o Portal do Empreendedor em conjunto com o cliente, utilizando conta GOV.BR.',
          'Efetivar a baixa do CNPJ MEI no sistema oficial, emitir a Certidão de Baixa do CNPJ e imprimir ou enviar em PDF a certidão ao cliente, conforme preferência.',
          'Colocar-se à disposição para dúvidas futuras por meio dos canais da Sala Parceiro SEBRAE da ACII.',
          'Registrar o atendimento e arquivar documentação no sistema interno.'
        ]
      },
      {
        title: '5.5 Consulta SERASA (CPF ou CNPJ)',
        description: 'Consulta de adimplência financeira e situação cadastral.',
        substeps: [
          'Receber o cliente solicitando consulta SERASA.',
          'Buscar compreender o motivo da consulta para direcionar adequadamente o atendimento.',
          'Informar ao cliente sobre os tipos de consulta disponíveis: CONCENTRE (relatório completo de restrições e histórico) e CREDNET (consulta simplificada de situação cadastral).',
          'Orientar o cliente na escolha conforme sua necessidade.',
          'Gerar PIX ou QR Code da ACII para pagamento da consulta.',
          'Após confirmação do pagamento, realizar a consulta no sistema SERASA.',
          'Imprimir o resultado e enviar em PDF via WhatsApp ao cliente (ambas as entregas são obrigatórias).',
          'Explicar o conteúdo da consulta ao cliente, destacando pendências ou inexistência de restrições.',
          'Esclarecer dúvidas e orientar sobre os melhores caminhos para resolução de eventuais lides (com apoio técnico do consultor designado).',
          'Registrar a consulta no sistema de controle financeiro e de atendimento.'
        ]
      }
    ],
    outputs: [
      'Cartão CNPJ e CCMEI emitidos (abertura)',
      'Termo de Abertura/Baixa assinado e arquivado',
      'DAS e orientações sobre declarações entregues',
      'Certidão de Baixa do CNPJ emitida',
      'Consulta SERASA impressa e enviada em PDF',
      'Registros fotográficos autorizados arquivados',
      'Atendimento registrado no sistema interno'
    ],
    performanceIndicators: [
      'Tempo médio de atendimento por demanda (meta: ≤ 30 minutos para consultas; ≤ 60 minutos para abertura/baixa)',
      '% de formalizações concluídas na primeira visita (meta: > 90%)',
      'Índice de satisfação do cliente com o atendimento (pesquisa pós-atendimento)',
      'Volume de atendimentos por período (abertura, orientação, baixa, consulta)',
      'Taxa de conversão de atendidos em associados da ACII'
    ]
  },
  {
    id: 'POP-034',
    title: 'Elaboração de Contratos',
    process: 'JURÍDICO / CONTRATOS',
    sector: 'Juridico',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 2',
    objective: 'Assegurar a elaboração de contratos conforme o padrão institucional da ACII, com base em proposta comercial aprovada e observância dos critérios jurídicos, técnicos e administrativos, garantindo segurança jurídica e rastreabilidade documental.',
    applicationField: [
      'Setor Jurídico da ACII',
      'Gerência Executiva',
      'Presidência',
      'Fornecedores/empresas contratadas',
      'Setor Financeiro'
    ],
    responsiblePrimary: 'Departamento Jurídico',
    responsibleSupport: [
      'Gerente Executiva',
      'Presidente da ACII',
      'Fornecedor/Empresa Contratada',
      'Setor Financeiro'
    ],
    inputs: [
      'Proposta comercial e/ou orçamento aprovado',
      'Informações e documentos do fornecedor/profissional',
      'Modelo contratual padrão da ACII',
      'Diretrizes comerciais e administrativas vigentes'
    ],
    steps: [
      {
        title: '5.1 Recebimento e Agendamento',
        description: 'Recepção da proposta comercial e enquadramento de prazo.',
        substeps: [
          'Receber a proposta comercial e/ou orçamento aprovado pela Gerência Executiva.',
          'Agendar a elaboração conforme disponibilidade da equipe jurídica e grau de urgência informado.'
        ]
      },
      {
        title: '5.2 Análise da Proposta',
        description: 'Mapeamento comercial para confecção da minuta.',
        substeps: [
          'Analisar a proposta para compreender o produto/serviço, escopo técnico e modelo contratual aplicável.',
          'Consolidar o entendimento jurídico e comercial necessário para a elaboração da minuta.'
        ]
      },
      {
        title: '5.3 Elaboração da Minuta Contratual',
        description: 'Redação de cláusulas obrigatórias e salvaguardas legais.',
        substeps: [
          'Elaborar o contrato seguindo o padrão institucional da ACII, aplicando técnicas jurídicas e incorporando os termos negociados na proposta comercial.',
          'Incluir cláusulas obrigatórias: conformidade com LGPD, multas por inadimplência ou descumprimento, condições de rescisão, prazos de vigência e datas/formas de pagamento.',
          'Validar a coerência entre a proposta comercial e as obrigações das partes, garantindo que os termos reflitam exatamente o acordado.',
          'Adequar a linguagem jurídica e a terminologia técnica ao contexto específico do negócio.'
        ]
      },
      {
        title: '5.4 Coleta de Dados e Validação Interna',
        description: 'Verificação de dados cadastrais e revisão com a Gerência.',
        substeps: [
          'Solicitar à empresa/profissional os dados cadastrais completos: CNPJ/CPF, documento de identidade, e-mail, dados bancários e indicação de testemunhas.',
          'Realizar reunião com a Gerência Executiva para confirmar informações, alinhar expectativas e obter aprovação da minuta.',
          'Garantir a rastreabilidade de versões e aprovações, registrando todas as alterações realizadas no sistema ou em planilha de controle.'
        ]
      },
      {
        title: '5.5 Treatment of Aprovação ou Ajustes',
        description: 'Tratativa pós-revisão e assinaturas digitais.',
        substeps: [
          'Se aprovado: Enviar o documento para assinatura digital, envolvendo o Presidente da ACII, testemunhas e o fornecedor/contratado.',
          'Se não aprovado: Retornar a minuta para elaboração de ajustes conforme orientações da Gerência Executiva, repetindo o ciclo de validação até aprovação final.'
        ]
      },
      {
        title: '5.6 Arquivamento e Encerramento',
        description: 'Registro no sistema Dataflex e indexação.',
        substeps: [
          'Após a assinatura digital, salvar o contrato assinado na pasta específica do setor financeiro no sistema Dataflex.',
          'Encerrar o processo no sistema de gestão jurídica.',
          'Registrar o encerramento e indexar os documentos para fins de auditoria e compliance interno.'
        ]
      }
    ],
    outputs: [
      'Minuta de contrato elaborada e validada',
      'Contrato assinado digitalmente por todas as partes',
      'Registro de versões e aprovações no sistema de controle',
      'Contrato arquivado na pasta do Financeiro no Dataflex',
      'Processo encerrado e auditável'
    ],
    performanceIndicators: [
      'Percentual de contratos revisados e aprovados sem alterações superiores a 90%',
      'Tempo médio de elaboração da minuta (meta: ≤ 5 dias úteis)',
      'Zero contratos emitidos sem assinatura digital devidamente registrada',
      'Conformidade com o modelo padrão e cláusulas obrigatórias (meta: 100%)'
    ]
  },
  {
    id: 'POP-035',
    title: 'Help Desk: Atendimento e Suporte Técnico',
    process: 'TI / Suporte',
    sector: 'TI',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 4',
    objective: 'Padronizar o processo de recebimento, registro, classificação, atendimento e encerramento de chamados de suporte técnico na ACII, garantindo agilidade na resolução de incidentes, rastreabilidade das demandas e satisfação dos usuários internos.',
    applicationField: [
      'Setor de Tecnologia da Informação da ACII',
      'Todos os colaboradores que utilizam recursos tecnológicos institucionais (hardware, software, redes e sistemas)'
    ],
    responsiblePrimary: 'Técnico de Suporte / Analista de TI',
    responsibleSupport: [
      'Coordenador de TI',
      'Fornecedores de Assistência Técnica',
      'Gerente Executiva'
    ],
    inputs: [
      'Demanda do usuário (problema técnico ou solicitação de serviço)',
      'Canal de abertura de chamado (telefone, presencial, e-mail ou sistema)',
      'Descrição detalhada do incidente ou necessidade',
      'Acesso ao sistema de gestão de chamados (em implantação)',
      'SLA (Acordo de Nível de Serviço) definido por prioridade'
    ],
    steps: [
      {
        title: '5.1 Abertura de Chamado',
        description: 'Identificação de problemas e abertura por canais disponíveis.',
        substeps: [
          'O usuário (colaborador de qualquer área) identifica problema ou necessidade relacionada à TI.',
          'Abre chamado por um dos canais disponíveis: Telefone (canal constante e prioritário), Atendimento presencial na mesa de suporte, E-mail (uso raro, para demandas não urgentes), ou Sistema interno de chamados (em fase de implantação).',
          'Informar ao usuário o número de protocolo gerado para rastreamento.'
        ]
      },
      {
        title: '5.2 Registro da Solicitação',
        description: 'Registro e captura de informações de chamados.',
        substeps: [
          'O Técnico de Suporte ou Assistente de TI recebe o chamado e registra no sistema de gestão.',
          'Registrar: Nome do solicitante e setor de lotação, Data e hora do registro, Descrição detalhada do problema ou solicitação, Canal de entrada (telefone, presencial, e-mail, sistema), e Anexos quando aplicável (prints, logs, mensagens de erro).',
          'Gerar número de protocolo único para rastreamento da demanda e comunicar ao usuário o prazo estimado de resolução conforme SLA.'
        ]
      },
      {
        title: '5.3 Classificação do Chamado',
        description: 'Análise de criticidade, urgência e SLA.',
        substeps: [
          'O Técnico de Suporte ou Analista de TI analisa a criticidade e urgência do chamado.',
          'Classificar conforme matriz interna de prioridade: Urgente (Parada total de sistema, risco à operação crítica, impacto em múltiplos usuários. SLA: até 2 horas), Normal (Problema relevante sem parada operacional, impacto limitado. SLA: até 24 horas), ou Baixa Prioridade (Dúvidas, ajustes cosméticos, solicitações não emergenciais. SLA: até 72 horas).',
          'Definir e registrar o SLA aplicável no sistema de gestão.'
        ]
      },
      {
        title: '5.4 Atendimento Técnico',
        description: 'Atendimento do chamado remoto ou presencial.',
        substeps: [
          'O Técnico de Suporte (Nível 1) ou Analista de Suporte (Nível 2) inicia o atendimento conforme a prioridade definida.',
          'Realizar atendimento remoto sempre que possível, utilizando ferramentas de acesso seguro.',
          'Quando necessário, agendar atendimento presencial no local do usuário.',
          'Registrar todas as ações tomadas, testes realizados e observações técnicas no histórico do chamado.',
          'Comunicar ao usuário o andamento da tratativa em casos de prazo estendido.'
        ]
      },
      {
        title: '5.5 Encaminhamento para Níveis Superiores (se necessário)',
        description: 'Escalonamento do chamado para especialistas ou coordenador.',
        substeps: [
          'Caso o problema não possa ser resolvido no primeiro nível de atendimento, o Técnico de Suporte encaminha o chamado para Analista de TI ou Coordenador de TI (Nível 2 ou 3).',
          'Incluir no encaminhamento: Histórico detalhado das ações já realizadas, Logs, mensagens de erro e evidências técnicas, e Justificativa para o escalonamento.',
          'O Analista ou Coordenador assume a tratativa e pode: Realizar análise avançada de logs e configurações, Contatar fornecedores externos para suporte especializado, Solicitar autorização da Gerência para intervenções complexas ou aquisições, e Manter o usuário informado sobre o status e novo prazo estimado.'
        ]
      },
      {
        title: '5.6 Solução e Fechamento do Chamado',
        description: 'Resolução, validação e arquivamento.',
        substeps: [
          'O Técnico ou Analista responsável soluciona o problema e registra detalhadamente a solução aplicada no sistema.',
          'Realizar teste de validação junto ao usuário para confirmar a resolução.',
          'Marcar o chamado como "Resolvido" no sistema de gestão.',
          'Encaminhar e-mail ou notificação automática ao usuário informando: Descrição da solução aplicada, Orientações preventivas quando aplicável, e Canal para reabertura caso o problema persista.',
          'Arquivar o chamado para fins de auditoria e métricas.'
        ]
      },
      {
        title: '5.7 Avaliação de Satisfação (Opcional)',
        description: 'Pesquisa pós-atendimento para melhoria de processos.',
        substeps: [
          'Após o fechamento, o sistema envia ao usuário um link ou formulário simples com pergunta sobre a qualidade do atendimento (ex: "Você ficou satisfeito com o atendimento recebido?").',
          'O feedback é registrado automaticamente e analisado periodicamente pela equipe de TI.',
          'Utilizar os resultados para identificar oportunidades de melhoria no processo de suporte.'
        ]
      }
    ],
    outputs: [
      'Chamado registrado com número de protocolo e SLA definido',
      'Incidente resolvido ou encaminhado com histórico completo',
      'Usuário comunicado sobre solução ou status da demanda',
      'Relatório de chamados atendidos por período e prioridade',
      'Indicadores de satisfação do usuário (quando aplicável)'
    ],
    performanceIndicators: [
      '% de chamados resolvidos dentro do SLA definido (meta: > 90%)',
      'Tempo médio de resolução por nível de prioridade',
      'Taxa de resolução no primeiro contato (Nível 1) – meta: > 70%',
      'Índice de satisfação do usuário com o atendimento (pesquisa pós-chamado)',
      'Volume de chamados recorrentes por tipo de incidente (meta: redução contínua)'
    ]
  },
  {
    id: 'POP-036',
    title: 'Backup de Dados',
    process: 'TI / Backup',
    sector: 'TI',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Estabelecer o procedimento padrão para execução, validação e armazenamento de backups dos dados institucionais da ACII, garantindo integridade das informações, recuperação em caso de falhas e conformidade com políticas de segurança e continuidade de negócios.',
    applicationField: [
      'Setor de Tecnologia da Informação da ACII',
      'Servidores de arquivos',
      'Máquinas dos usuários e ferramentas de backup (servidor proxy mox e Google Drive)'
    ],
    responsiblePrimary: 'Analista de TI / Coordenador de TI',
    responsibleSupport: [
      'Técnicos de Suporte',
      'Usuários finais',
      'Gerente Executiva'
    ],
    inputs: [
      'Acesso ao servidor de arquivos e máquina virtual de backup',
      'Ferramenta de backup instalada e configurada',
      'Conta corporativa Google Drive para backup de usuários',
      'Logs de backup automático do servidor',
      'Pasta padrão definida para backup em cada máquina de usuário'
    ],
    steps: [
      {
        title: '5.1 Backup do Servidor de Arquivos',
        description: 'Procedimento técnico de backup incremental do servidor.',
        substeps: [
          'Acessar o servidor de arquivos da ACII com credenciais administrativas.',
          'Verificar se o backup automático foi realizado com sucesso, consultando os logs gerados pelo sistema.',
          'Acessar a máquina virtual onde está instalada a ferramenta de backup e abrir o programa.',
          'Executar a comparação de arquivos atuais com os do último backup realizado.',
          'Comandar o sistema para realizar cópia incremental, ou seja, acrescentar apenas os arquivos que sofreram modificações desde a última cópia.',
          'Após a varredura e comparação, executar manualmente o processo de guarda dos documentos no servidor proxy mox, garantindo redundância.',
          'Validar a conclusão do processo e registrar no log de atividades de TI, encerrando o processo no servidor.'
        ]
      },
      {
        title: '5.2 Backup das Máquinas dos Usuários (Google Drive)',
        description: 'Sincronização e organização de dados individuais.',
        substeps: [
          'Acessar a conta corporativa de backup no Google Drive com credenciais administrativas.',
          'Criar uma pasta individual no Google Drive para cada usuário, identificada por nome e setor (ex: "Financeiro_Karla").',
          'Compartilhar o acesso de cada pasta exclusivamente com o e-mail corporativo do usuário correspondente, garantindo isolamento de dados.',
          'Orientar o usuário a criar na máquina local uma pasta padrão para backup, seguindo a estrutura (Exemplo: Financeiro >>> Caixas >>> Caixa 01.03.2026 >>> Documento do caixa).',
          'Configurar a sincronização automática da pasta local com a pasta correspondente no Google Drive.',
          'Informar ao usuário que: apenas arquivos salvos dentro da pasta de backup serão sincronizados, arquivos alterados nessa pasta serão atualizados automaticamente na nuvem, e o acesso é individual/seguro.',
          'Realizar teste de sincronização com o usuário para validar e registrar a configuração no inventário de backup.'
        ]
      },
      {
        title: '5.3 Rotina de Validação e Monitoramento',
        description: 'Testes de integridade e auditoria de logs.',
        substeps: [
          'Realizar verificação semanal dos logs de backup do servidor para identificar falhas ou interrupções.',
          'Testar mensalmente a recuperação de arquivos críticos (restore) para validar integridade dos backups.',
          'Monitorar o espaço disponível no Google Drive corporativo e solicitar expansão quando necessário.',
          'Comunicar à Gerente Executiva eventuais incidentes ou riscos identificados no processo de backup.'
        ]
      }
    ],
    outputs: [
      'Backup incremental do servidor armazenado no proxy mox',
      'Pastas individuais de usuários sincronizadas no Google Drive',
      'Logs de backup validados e arquivados',
      'Relatório mensal de integridade de backup para a Gerência',
      'Inventário de usuários com backup configurado atualizado'
    ],
    performanceIndicators: [
      '% de backups diários concluídos com sucesso (meta: 100%)',
      'Tempo médio para recuperação de arquivos críticos (meta: ≤ 2 horas)',
      'Conformidade na configuração de backup por usuário (meta: 100% dos colaboradores com pasta sincronizada)',
      'Zero perda de dados por falha de backup (meta: 0 incidentes/ano)',
      'Satisfação dos usuários com a simplicidade e segurança do processo de backup'
    ]
  },
  {
    id: 'POP-037',
    title: 'Gerenciamento de Redes de Internet',
    process: 'TI / Infraestrutura',
    sector: 'TI',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Estabelecer o procedimento padrão para monitoramento, diagnóstico e contingência dos links de internet da ACII, garantindo continuidade operacional, rápida identificação de falhas e minimização de impactos nas atividades institucionais.',
    applicationField: [
      'Setor de Tecnologia da Informação da ACII',
      'Firewall corporativo e servidores',
      'Provedores de internet e colaboradores que dependem de conectividade'
    ],
    responsiblePrimary: 'Analista de TI / Coordenador de TI',
    responsibleSupport: [
      'Técnicos de Suporte',
      'Provedores de Link de Internet',
      'Gerente Executiva'
    ],
    inputs: [
      'Acesso administrativo ao firewall corporativo',
      'Credenciais de acesso ao servidor e equipamentos de rede',
      'Contatos de suporte dos provedores de internet',
      'Dispositivos móveis com plano de dados para contingência',
      'Logs de monitoramento de rede'
    ],
    steps: [
      {
        title: '5.1 Monitoramento Diário dos Links',
        description: 'Acompanhamento preventivo de conexão e latência.',
        substeps: [
          'Acessar o firewall corporativo diariamente, preferencialmente no início do expediente.',
          'Verificar o status dos links de internet (primário e secundário), observando: indicador de conexão (up/down), latência e perda de pacotes, e tráfego de dados/utilização da banda.',
          'Se os links estiverem operacionais ("OK"), repetir a verificação em intervalos regulares ao longo do dia (ex: meio-dia e final do expediente).',
          'Registrar o status verificado no log de monitoramento de rede.'
        ]
      },
      {
        title: '5.2 Diagnóstico de Falhas',
        description: 'Isolamento de problemas físicos ou de operadora.',
        substeps: [
          'Caso algum link não esteja operacional ("não OK"), iniciar o procedimento de diagnóstico.',
          'Acessar o servidor e verificar se os equipamentos de rede (switches, roteadores, firewall) estão funcionando normalmente.',
          'Conferir indicadores de energia, temperatura e conexões físicas dos equipamentos.',
          'Se os equipamentos estiverem operacionais no lado da ACII: entrar em contato com os fornecedores dos links de internet para averiguar a origem e solicitar número de protocolo de atendimento e prazo estimado.'
        ]
      },
      {
        title: '5.3 Tratamento por Tipo de Ocorrência',
        description: 'Tratamento de falhas internas e de provedores.',
        substeps: [
          'Falha na linha da empresa (provedor): solicitar suporte técnico especializado ao fornecedor, acompanhar a tratativa até a normalização, e registrar o tempo de indisponibilidade e causa raiz para relatório mensal.',
          'Falha geral (fora do controle da ACII): solicitar previsão de normalização ao fornecedor, comunicar à Gerente Executiva e aos setores impactados sobre a indisponibilidade, e aguardar a restauração com monitoramento ativo.'
        ]
      },
      {
        title: '5.4 Plano de Contingência',
        description: 'Acionamento de redes de apoio móvel (tethering).',
        substeps: [
          'Caso ambos os links de internet estejam indisponíveis simultaneamente: acionar o plano de contingência com uso de dispositivos móveis como roteadores (tethering).',
          'Priorizar o acesso para atividades críticas: sistemas financeiros, e-mail corporativo e atendimento ao associado.',
          'Orientar os colaboradores a utilizarem a rede de contingência apenas para tarefas essenciais, preservando banda.',
          'Registrar a ativação do plano no log de incidentes. Após a normalização dos links principais, desativar o uso de roteadores móveis.',
          'Validar a estabilidade da conexão restaurada e emitir relatório pós-incidente com lições aprendidas.'
        ]
      },
      {
        title: '5.5 Registro e Relatório',
        description: 'Documentação sistemática e consolidação de métricas.',
        substeps: [
          'Documentar todas as ocorrências, ações tomadas e tempos de resolução no sistema de gestão de TI.',
          'Gerar relatório mensal de disponibilidade de links para a Gerente Executiva contendo: percentual de uptime por provedor, principais causas de indisponibilidade, e ações de melhoria implementadas.'
        ]
      }
    ],
    outputs: [
      'Links de internet monitorados e status registrado',
      'Incidentes diagnosticados e tratados com fornecedores',
      'Plano de contingência acionado quando necessário',
      'Relatório mensal de disponibilidade de rede',
      'Log de incidentes atualizado para auditoria'
    ],
    performanceIndicators: [
      'Disponibilidade média dos links de internet (meta: > 99% mensal)',
      'Tempo médio de detecção de falhas (meta: ≤ 15 minutos)',
      'Tempo médio de resolução com suporte de fornecedor (meta: ≤ 4 horas)',
      '% de incidentes com plano de contingência ativado com sucesso (meta: 100%)',
      'Satisfação dos usuários com a estabilidade da conexão (pesquisa trimestral)'
    ]
  },
  {
    id: 'POP-038',
    title: 'Aquisição de Hardwares e Softwares (Geral)',
    process: 'TI / Suprimentos',
    sector: 'TI',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Padronizar o processo de identificação, cotação, aprovação, aquisição, instalação e baixa de hardwares e softwares na ACII, garantindo controle patrimonial, conformidade orçamentária, segurança na implantação e rastreabilidade documental.',
    applicationField: [
      'Setor de Tecnologia da Informação',
      'Financeiro',
      'Gerência Executiva',
      'Demais setores da ACII que demandam aquisição de equipamentos ou licenças'
    ],
    responsiblePrimary: 'Assistente de TI / Analista de TI',
    responsibleSupport: [
      'Financeiro',
      'Gerência Executiva',
      'Jurídico (para contratos complexos)',
      'Usuário solicitante'
    ],
    inputs: [
      'Chamado de usuário ou observação técnica de obsolescência/defeito',
      'Especificação técnica do hardware/software necessário',
      'Orçamentos de fornecedores (mínimo 3)',
      'Aprovação orçamentária da Gerência Executiva e Financeiro',
      'Nota Fiscal e documentação fiscal do fornecedor'
    ],
    steps: [
      {
        title: '5.1 Identificação da Necessidade',
        description: 'Mapeamento de demanda por quebra, lentidão ou obsolescência.',
        substeps: [
          'Identificar a necessidade de aquisição por: Chamado aberto por usuário relatando defeito/lentidão, Observação direta do Assistente de TI em manutenções preventivas, ou Planejamento de renovação por obsolescência tecnológica.',
          'Registrar a demanda no sistema de gestão de TI, especificando: descrição, justificativa técnica, impacto de não aquisição e prioridade (urgente, normal, baixa).'
        ]
      },
      {
        title: '5.2 Cotação e Encaminhamento ao Financeiro',
        description: 'Coleta de orçamentos e planilha comparativa.',
        substeps: [
          'Realizar cotação em, no mínimo, 3 (três) empresas fornecedoras, contemplando: especificações compatíveis, prazos de entrega/instalação, condições de pagamento/garantia e suporte pós-venda.',
          'Consolidar os orçamentos em planilha comparativa e encaminhar ao setor Financeiro com parecer técnico do TI.'
        ]
      },
      {
        title: '5.3 Aprovação e Finalização da Compra',
        description: 'Auditoria financeira e emissão do pedido de compra.',
        substeps: [
          'O Financeiro analisa os orçamentos e encaminha à Gerente Executiva para aprovação final, considerando: conformidade orçamentária, menor custo-benefício e condição de fornecedor associado à ACII.',
          'Após aprovação, o Financeiro devolve o processo ao Assistente de TI para finalização da compra.',
          'O Assistente de TI formaliza o pedido ao fornecedor selecionado, registrando número do pedido e prazo de entrega.'
        ]
      },
      {
        title: '5.4 Recebimento e Encaminhamento Fiscal',
        description: 'Inspeção física, conferência de NF e envio para faturamento.',
        substeps: [
          'Receber a mercadoria, conferindo: integridade física, conformidade com as especificações do pedido e quantidade de acessórios inclusos.',
          'Receber a Nota Fiscal e boletos do fornecedor e encaminhar imediatamente para o Financeiro para processamento do pagamento e arquivamento.'
        ]
      },
      {
        title: '5.5 Instalação, Configuração e Baixa',
        description: 'Troca de equipamentos antigos e atualização patrimonial.',
        substeps: [
          'Realizar a troca ou instalação do produto no local definido, efetuando a configuração inicial e instalação de softwares essenciais com padrões de segurança da ACII.',
          'Realizar testes de funcionamento com o usuário solicitante.',
          'Atualizar o inventário de ativos de TI com: número de patrimônio, dados do equipamento (modelo, serial, specs) e usuário/local de alocação.',
          'Realizar a baixa do equipamento substituído quando aplicável, com registro do motivo e descarte ecológico/doação institucional.'
        ]
      },
      {
        title: '5.6 Encerramento e Comunicação',
        description: 'Finalização do chamado e arquivo físico/digital.',
        substeps: [
          'Comunicar ao usuário solicitante a conclusão do processo.',
          'Fechar o chamado no sistema de gestão de TI, com registro das ações realizadas.',
          'Arquivar documentação técnica (garantia, manual, nota fiscal) na pasta digital do ativo.'
        ]
      }
    ],
    outputs: [
      'Equipamento/software adquirido, instalado e configurado',
      'Inventário de ativos de TI atualizado',
      'Documentação fiscal processada pelo Financeiro',
      'Chamado fechado com registro de solução',
      'Equipamento substituído baixado e destinado conforme política'
    ],
    performanceIndicators: [
      'Tempo médio entre solicitação e instalação (meta: ≤ 10 dias úteis para itens em estoque)',
      '% de aquisições dentro do orçamento aprovado (meta: 100%)',
      'Conformidade na atualização do inventário de ativos (meta: 100%)',
      'Satisfação do usuário com o equipamento entregue (pesquisa pós-instalação)',
      'Redução de chamados recorrentes por falha de hardware após renovação'
    ]
  },
  {
    id: 'POP-039',
    title: 'Controle de Inventário de TI',
    process: 'TI / Gestão de Ativos',
    sector: 'TI',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 2',
    objective: 'Padronizar o cadastro, etiquetagem, atualização e auditoria mensal dos ativos de tecnologia da informação da ACII, garantindo precisão no controle patrimonial, suporte às decisões de manutenção/aquisição e conformidade com políticas internas de gestão de ativos.',
    applicationField: [
      'Setor de Tecnologia da Informação',
      'Setor de Patrimônio/Financeiro',
      'Todos os colaboradores que utilizam equipamentos e periféricos nas dependências'
    ],
    responsiblePrimary: 'Analista de TI / Coordenador de TI',
    responsibleSupport: [
      'Técnicos de Suporte',
      'Setor de Patrimônio/Financeiro',
      'Usuários finais'
    ],
    inputs: [
      'Relação de novos equipamentos adquiridos ou substituídos',
      'Etiquetas de patrimônio e materiais de identificação',
      'Planilha mestre de inventário (armazenada em nuvem)',
      'Acesso físico às salas, departamentos e estações de trabalho'
    ],
    steps: [
      {
        title: '5.1 Cadastro e Atualização do Banco de Dados',
        description: 'Mapeamento constante de dados de ativos e seus usuários.',
        substeps: [
          'Manter atualizado o banco de dados de todos os itens de TI sob gestão do setor, incluindo: Computadores, notebooks/estações de trabalho e Periféricos (mouses, teclados, webcams, passadores, etc.).',
          'Registrar no sistema/planilha: tipo, marca, modelo, número de série, setor de alocação, usuário responsável, data de aquisição e status (ativo, em manutenção, baixado).',
          'Atualizar o cadastro imediatamente após qualquer movimentação (troca de setor, devolução, descarte ou nova aquisição).'
        ]
      },
      {
        title: '5.2 Etiquetagem e Controle por Planilha',
        description: 'Fixação de identificadores patrimoniais e controle de acesso à planilha.',
        substeps: [
          'Identificar e etiquetar fisicamente todos os itens que permitirem a fixação de etiquetas de patrimônio.',
          'Para itens impossibilitados, manter controle rigoroso na planilha de Excel compartilhada na nuvem, garantindo links ou referências cruzadas.',
          'Restringir a edição da planilha mestra aos responsáveis pela TI, mantendo acesso apenas de leitura para demais setores.'
        ]
      },
      {
        title: '5.3 Auditoria Mensal de Inventário',
        description: 'Auditoria física e reconciliação com o banco de dados.',
        substeps: [
          'Realizar auditoria física mensal de todos os itens de TI percorrendo os departamentos da ACII.',
          'Conferir a presença física confrontando com os registros e verificar o estado de conservação e integridade das etiquetas.',
          'Registrar divergências encontradas (itens faltantes, não cadastrados, trocados sem comunicação) e apurar responsabilidades.',
          'Consolidar resultados em relatório mensal para a Gerente Executiva e Patrimônio/Financeiro, atualizando os registros cadastrais.'
        ]
      }
    ],
    outputs: [
      'Banco de dados de ativos de TI atualizado e confiável',
      'Itens etiquetados e/ou registrados na planilha de controle em nuvem',
      'Relatório mensal de auditoria de inventário',
      'Registro de divergências e ações corretivas implementadas',
      'Base de dados validada para decisões de compra, manutenção e baixa'
    ],
    performanceIndicators: [
      '% de precisão do inventário físico vs. sistema (meta: > 98%)',
      'Conformidade na realização da auditoria mensal (meta: 100%)',
      'Tempo médio para registro de novos ativos no banco de dados (meta: ≤ 48 horas)',
      'Redução contínua de itens não identificados ou sem etiqueta (meta: < 5% do total)',
      'Satisfação dos setores com a agilidade e confiabilidade do controle patrimonial de TI'
    ]
  },
  {
    id: 'POP-040',
    title: 'Gestão de Segurança e Proteção de Dados',
    process: 'TI / Compliance',
    sector: 'TI',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Estabelecer diretrizes, responsabilidades e controles para garantir a confidencialidade, integridade e disponibilidade das informações e dos ativos de tecnologia da ACII, prevenindo incidentes de segurança e assegurando conformidade com a LGPD.',
    applicationField: [
      'Todos os colaboradores, diretoria, prestadores de serviço, estagiários e terceiros que utilizam recursos da ACII'
    ],
    responsiblePrimary: 'Analista de TI / Coordenador de TI',
    responsibleSupport: [
      'Gerente Executiva',
      'RH',
      'Colaboradores',
      'Diretoria'
    ],
    inputs: [
      'Solicitações formais de acesso (e-mail ou sistema interno)',
      'Dispositivos, sistemas e redes corporativas',
      'Política de senhas e controles de autenticação',
      'Materiais de treinamento e Termo de Responsabilidade Digital',
      'Relatórios de logs, incidentes e auditorias de segurança'
    ],
    steps: [
      {
        title: '5.1 Gestão de Acessos',
        description: 'Governança de credenciais pelo princípio de menor privilégio.',
        substeps: [
          'Todo acesso deve ser solicitado formalmente via e-mail ou sistema interno.',
          'O TI concederá acesso conforme perfil da função (princípio do menor privilégio).',
          'Acessos administrativos exigem autorização expressa da Gerente Executiva.',
          'Registrar todos os acessos em planilha/sistema e revisar a árvore de permissões trimestralmente.'
        ]
      },
      {
        title: '5.2 Política de Senhas e Autenticação',
        description: 'Definição de regras de complexidade e MFA.',
        substeps: [
          'Senhas devem conter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.',
          'Exigir alteração obrigatória a cada 90 dias e proibir terminantemente o compartilhamento de senhas.',
          'Configurar autenticação em dois fatores (2FA) em todos os sistemas críticos.',
          'Armazenar senhas administrativas em sistema digital criptografado com acesso restrito ao TI e à Gerência Executiva.'
        ]
      },
      {
        title: '5.3 Segurança de Rede',
        description: 'Controle de firewall, antivírus corporativo e Wi-Fi segmentado.',
        substeps: [
          'Garantir a utilização de firewall ativo e atualizado.',
          'Instalar e manter atualizado antivírus corporativo em todos os dispositivos da ACII.',
          'Habilitar atualizações automáticas de sistemas operacionais e softwares.',
          'Segmentar as redes Wi-Fi em: Administrativa, Comercial, Visitantes, e Clientes, com bloqueio de sites considerados inseguros ou inadequados.'
        ]
      },
      {
        title: '5.4 Proteção de Dados e LGPD',
        description: 'Conformidade legal e mitigação de vazamentos.',
        substeps: [
          'Restringir acesso a dados pessoais estritamente às áreas autorizadas.',
          'Proibir o armazenamento de dados institucionais em dispositivos pessoais de colaboradores.',
          'Efetuar o descarte de documentos físicos e digitais seguindo rigorosas políticas de eliminação segura.',
          'Em caso de vazamento de dados suspeito ou confirmado, comunicar imediatamente à Gerência Executiva.'
        ]
      },
      {
        title: '5.5 Resposta a Incidentes',
        description: 'Etapas de mitigação em caso de ciberataques ou incidentes.',
        substeps: [
          'Seguir as etapas: Identificação do problema, Comunicação imediata ao TI, Registro formal, Contenção da ameaça, Análise de causa raiz, Relatório final à Gerência, e Implementação de ações corretivas.'
        ]
      },
      {
        title: '5.6 Procedimento de Desligamento de Colaborador',
        description: 'Rotina de desativação imediata de credenciais de ex-colaboradores.',
        substeps: [
          'Comunicação formal do RH ao TI antes do desligamento do colaborador.',
          'Proceder com o bloqueio imediato de contas de e-mail, sistemas corporativos e VPN.',
          'Realizar o recolhimento físico de equipamentos, periféricos e acessórios corporativos.',
          'Efetuar a alteração de senhas compartilhadas ou administrativas que o colaborador detinha acesso, registrando o encerramento no sistema.'
        ]
      },
      {
        title: '5.7 Conscientização e Treinamento',
        description: 'Treinamentos de phishing e boas práticas de segurança.',
        substeps: [
          'Promover treinamento semestral obrigatório sobre boas práticas digitais.',
          'Exigir assinatura de Termo de Responsabilidade Digital por todos os usuários.',
          'Realizar simulação anual de phishing para avaliar a vulnerabilidade da equipe.'
        ]
      },
      {
        title: '5.8 Continuidade do Negócio',
        description: 'Procedimentos de disaster recovery e backups externos.',
        substeps: [
          'Manter atualizado plano de contingência para falhas de energia, servidor ou link de internet.',
          'Garantir backup externo acessível remotamente em caso de indisponibilidade física.',
          'Realizar avaliação anual do plano de continuidade e testes práticos de restauração.'
        ]
      }
    ],
    outputs: [
      'Acessos concedidos, revisados e bloqueados conforme política',
      'Senhas atualizadas e logs de autenticação registrados',
      'Redes segmentadas, protegidas por firewall e antivírus ativo',
      'Relatórios de incidentes, contenções e planos corretivos implementados',
      'Equipamentos recolhidos e acessos encerrados no desligamento',
      'Registros de treinamento, simulações e termos assinados',
      'Plano de continuidade validado e backups testados com sucesso'
    ],
    performanceIndicators: [
      'Percentual de backups realizados com sucesso (meta: 100%)',
      'Percentual de máquinas com sistemas e antivírus atualizados (meta: 100%)',
      'Número de incidentes de segurança registrados por semestre (meta: redução contínua)',
      'Percentual de colaboradores treinados e com termo assinado (meta: 100%)',
      'Tempo médio de resposta e contenção de incidentes (meta: ≤ 4 horas)'
    ]
  },
  {
    id: 'POP-041',
    title: 'Manutenção dos Sites da ACII',
    process: 'TI / Gestão WEB',
    sector: 'TI',
    emissionDate: '26/04/2026',
    revision: '00',
    pages: '1 de 3',
    objective: 'Padronizar o processo de levantamento, execução, validação e publicação de alterações nos sites institucionais mantidos pelo setor de TI da ACII, garantindo conformidade com diretrizes da Gerência, qualidade técnica e segurança da informação.',
    applicationField: [
      'Setor de Tecnologia da Informação',
      'Gerência Executiva',
      'Marketing',
      'Demais áreas que solicitam alterações nos portais institucionais'
    ],
    responsiblePrimary: 'Analista de TI / Coordenador de TI',
    responsibleSupport: [
      'Gerente Executiva',
      'Marketing',
      'Setor de Eventos'
    ],
    inputs: [
      'Solicitação de alterações em reunião com a Gerente Executiva',
      'Conteúdo textual, imagens e materiais para publicação',
      'Acessos administrativos aos ambientes de desenvolvimento e produção',
      'Sites sob gestão: ACII (aciima.com.br), FECOIMP (fecoimp.com.br), Fórum da Mulher (forumdamulherempresaria.com.br), Feira da Beleza (feiradabelezadomaranhao.com.br)'
    ],
    steps: [
      {
        title: '5.1 Levantamento de Demandas',
        description: 'Reunião, priorização e cadastro de solicitações.',
        substeps: [
          'Em reunião periódica com a Gerente Executiva, realizar o levantamento detalhado das alterações necessárias para os sites.',
          'Registrar as solicitações em planilha ou sistema de controle, contendo: site de destino, tipo de alteração (texto, imagem, link, feature), prioridade/prazo desejado e responsável pela validação.'
        ]
      },
      {
        title: '5.2 Execução das Alterações',
        description: 'Desenvolvimento das demandas sob diretrizes técnicas.',
        substeps: [
          'O TI realiza as alterações solicitadas inicialmente em ambiente de homologação (staging) se disponível, ou diretamente em produção seguindo critério de criticidade/risco.',
          'Aplicar boas práticas de desenvolvimento web: validação de links e formulários, otimização de imagens, validação de responsividade (mobile/desktop) e conformidade com diretrizes de acessibilidade/LGPD.'
        ]
      },
      {
        title: '5.3 Validação Prévia pela Gerência',
        description: 'Homologação e aprovação antes do deploy definitivo.',
        substeps: [
          'Informar à Gerente Executiva sobre as mudanças realizadas, disponibilizando link de pré-visualização ou prints das telas alteradas.',
          'Aguardar aprovação formal por e-mail, sistema ou assinatura digital antes de publicar as alterações em produção.',
          'Caso haja ajustes solicitados, retornar à etapa de execução para devidas correções e nova submissão.'
        ]
      },
      {
        title: '5.4 Publicação e Monitoramento',
        description: 'Deploy definitivo em produção e acompanhamento pós-publicação.',
        substeps: [
          'Após aprovação formal, publicar as alterações no ambiente de produção dos respectivos sites.',
          'Realizar testes pós-publicação para confirmar integridade de links, envios de formulários e exibição em múltiplos navegadores.',
          'Monitorar ativamente eventuais erros ou feedbacks de usuários nas 24 horas subsequentes.'
        ]
      },
      {
        title: '5.5 Registro e Encerramento',
        description: 'Fechamento formal de demandas de alteração web.',
        substeps: [
          'Registrar no sistema de controle de TI: data e hora da publicação, descrição detalhada das mudanças efetuadas, nome do validador, e arquivamento de prints de evidências.',
          'Comunicar à Gerente Executiva a conclusão do processo e fechamento da demanda.'
        ]
      }
    ],
    outputs: [
      'Sites institucionais atualizados conforme solicitação aprovada',
      'Registro de alterações em sistema de controle de TI',
      'Aprovação formal da Gerente Executiva documentada',
      'Relatório de publicação para auditoria e compliance'
    ],
    performanceIndicators: [
      'Tempo médio entre solicitação e publicação (meta: ≤ 3 dias úteis para alterações simples)',
      '% de alterações publicadas sem necessidade de retrabalho (meta: > 95%)',
      'Conformidade com aprovação prévia da Gerência (meta: 100%)',
      'Zero incidentes de segurança ou quebra de funcionalidade pós-publicação',
      'Satisfação da Gerência Executiva com agilidade e qualidade das entregas'
    ]
  }
];

