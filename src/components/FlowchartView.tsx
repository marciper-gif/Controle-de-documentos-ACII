import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Layers, 
  Send, 
  FileText, 
  Users, 
  CheckCircle, 
  GitFork, 
  Folder, 
  ClipboardCheck, 
  GraduationCap, 
  Activity, 
  DollarSign, 
  UserPlus, 
  Calendar, 
  Megaphone, 
  UserCheck, 
  ArrowRight, 
  ArrowDown,
  Check, 
  Info,
  Briefcase,
  Plane,
  MapPin,
  ChevronRight,
  Printer,
  Map,
  LayoutGrid,
  Download,
  Loader2
} from 'lucide-react';
import { POP } from '../types';
import { exportElementToPdf } from '../utils/pdfExport';

interface FlowchartViewProps {
  pop: POP;
}

interface VisualCard {
  label: string;
  icon: string;
  isDecision?: boolean;
  decisionDetails?: {
    question: string;
    yesBranch?: string;
    noBranch?: string;
  };
}

interface VisualPhase {
  id: string;
  title: string;
  color: 'navy' | 'teal';
  icon: string;
  cards: VisualCard[];
}

// Map keywords to representative icons for flowchart cards
function getCardIcon(iconName: string) {
  switch (iconName) {
    case 'secretary':
      return <UserCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />;
    case 'send':
      return <Send className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />;
    case 'map':
      return <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
    case 'plane':
      return <Plane className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />;
    case 'dollar':
      return <DollarSign className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
    case 'calendar':
      return <Calendar className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />;
    case 'megaphone':
      return <Megaphone className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
    case 'check':
      return <ClipboardCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
    case 'folder':
      return <Folder className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
    case 'user':
      return <Users className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />;
    case 'graduation':
      return <GraduationCap className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />;
    case 'activity':
      return <Activity className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
    case 'decision':
      return <GitFork className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
    default:
      return <CheckCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />;
  }
}

// Check if a step string describes a decision point
function isDecisionStep(text: string): boolean {
  const t = text.toLowerCase();
  return t.startsWith('decisão:') || t.includes('decisão') || t.startsWith('decidir:');
}

// Parse decision step text to split between Title, Question, and Branches
function parseDecision(text: string) {
  const cleaned = text.replace(/^decisão:\s*/i, '').trim();
  const splitSim = cleaned.split(/caso\s+não|caso\s+seja\s+recusada|caso\s+não\s+seja/i);
  return {
    question: splitSim[0].replace(/,\s*$/g, '').replace(/[\.\->]$/, '').trim()
  };
}

function getIconNameFromText(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('decisão') || t.includes('caso') || t.includes('se aprovado') || t.includes('se não')) return 'decision';
  if (t.includes('solicita') || t.includes('enviar') || t.includes('envia') || t.includes('comunica') || t.includes('contato') || t.includes('whatsapp') || t.includes('e-mail')) return 'send';
  if (t.includes('marketing') || t.includes('divulgação') || t.includes('card') || t.includes('mídias') || t.includes('redes')) return 'megaphone';
  if (t.includes('triagem') || t.includes('currículo') || t.includes('análise') || t.includes('entrevista') || t.includes('candidato') || t.includes('seleção')) return 'user';
  if (t.includes('registro') || t.includes('arquiva') || t.includes('prontuário') || t.includes('documento') || t.includes('contrato') || t.includes('termo')) return 'folder';
  if (t.includes('recebe') || t.includes('conferência') || t.includes('verificação') || t.includes('ponto') || t.includes('valida') || t.includes('auditoria')) return 'check';
  if (t.includes('treinamento') || t.includes('capacitação') || t.includes('aprendizado') || t.includes('desenvolvimento')) return 'graduation';
  if (t.includes('exame') || t.includes('clínica') || t.includes('saúde') || t.includes('médico')) return 'activity';
  if (t.includes('pagamento') || t.includes('financeiro') || t.includes('folha') || t.includes('salário') || t.includes('desconto') || t.includes('custo') || t.includes('banco') || t.includes('vouchers') || t.includes('cotações')) return 'dollar';
  if (t.includes('integração') || t.includes('onboarding') || t.includes('boas-vindas')) return 'user';
  if (t.includes('férias') || t.includes('calendário') || t.includes('prazo') || t.includes('cronograma')) return 'calendar';
  return 'check';
}

function getPhasesForPop(pop: POP): VisualPhase[] {
  if (pop.id === 'POP-001') {
    return [
      {
        id: 'FASE 1',
        title: '5.1 Participação em Eventos (Logística e Agenda)',
        color: 'navy',
        icon: 'calendar',
        cards: [
          { label: 'Secretária recebe convite/solicitação', icon: 'secretary' },
          { label: 'Informa imediatamente à Gerência Executiva', icon: 'send' },
          { label: 'Define grau de participação e envia Ofício', icon: 'map' },
          { label: 'Financeiro providencia passagens e hospedagem', icon: 'plane' },
          { label: 'Vouchers repassados a Diretoria', icon: 'dollar' },
          { label: 'Secretária inclui evento na Agenda Geral', icon: 'calendar' }
        ]
      },
      {
        id: 'FASE 2',
        title: '5.1 Cobertura de Eventos (Marketing e Imprensa)',
        color: 'teal',
        icon: 'megaphone',
        cards: [
          { label: 'Marketing realiza cotações para assessoria', icon: 'megaphone' },
          { label: 'Financeiro aprova contratação com Diretoria', icon: 'check' },
          { label: 'Marketing repassa diretrizes ao Assessor', icon: 'send' },
          { label: 'Marketing executa cobertura e publica mídias', icon: 'megaphone' }
        ]
      },
      {
        id: 'FASE 3',
        title: '5.2 Planejamento de Reunião de Patrocínio',
        color: 'navy',
        icon: 'send',
        cards: [
          { label: 'Diretoria informa necessidade de viagem', icon: 'user' },
          { label: 'Gerência repassa determinações à Secretária', icon: 'send' },
          { label: 'Marketing confecciona propostas e brindes', icon: 'megaphone' },
          { label: 'Financeiro aprova as 3 cotações e compra', icon: 'dollar' },
          { label: 'Agenda Confirmada?', icon: 'decision', isDecision: true, decisionDetails: { question: 'Agenda Confirmada?' } }
        ]
      },
      {
        id: 'FASE 4',
        title: '5.2 Produção, Execução e Arquivamento',
        color: 'teal',
        icon: 'folder',
        cards: [
          { label: 'Secretária imprime ofícios e organiza os kits', icon: 'folder' },
          { label: 'Diretoria recebe Kit de Viagem', icon: 'user' },
          { label: 'Assessoria cobre em tempo real', icon: 'megaphone' },
          { label: 'Diretoria devolve ofícios protocolados', icon: 'folder' },
          { label: 'Digitalização e Arquivamento Físico (Processo Encerrado)', icon: 'check' }
        ]
      }
    ];
  }

  // Fallback dynamic generator for other POPs (like POP-008, 009, etc.)
  const phases: VisualPhase[] = [];
  let phaseCount = 1;

  pop.steps.forEach((step, stepIdx) => {
    const substeps = step.substeps || [];
    if (substeps.length === 0) {
      phases.push({
        id: `FASE ${phaseCount++}`,
        title: step.title,
        color: stepIdx % 2 === 0 ? 'navy' : 'teal',
        icon: 'check',
        cards: [
          { label: step.description || step.title, icon: 'check' }
        ]
      });
      return;
    }

    const chunkSize = 5;
    for (let i = 0; i < substeps.length; i += chunkSize) {
      const chunk = substeps.slice(i, i + chunkSize);
      const isSplit = substeps.length > chunkSize;
      const partTitle = isSplit ? ` (Parte ${Math.floor(i / chunkSize) + 1})` : '';
      
      const cards = chunk.map(sub => {
        const isDec = isDecisionStep(sub);
        return {
          label: sub,
          icon: getIconNameFromText(sub),
          isDecision: isDec,
          decisionDetails: isDec ? parseDecision(sub) : undefined
        };
      });

      phases.push({
        id: `FASE ${phaseCount++}`,
        title: `${step.title}${partTitle}`,
        color: (phases.length) % 2 === 0 ? 'navy' : 'teal',
        icon: getIconNameFromText(step.title),
        cards: cards
      });
    }
  });

  return phases;
}

export default function FlowchartView({ pop }: FlowchartViewProps) {
  const [viewMode, setViewMode] = useState<'lanes' | 'map'>('lanes');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const phases = getPhasesForPop(pop);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportElementToPdf({
        elementId: 'flowchart-printable-area',
        fileName: `Fluxograma_${pop.id}_${pop.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
        documentTitle: `Fluxograma ${pop.id} - ${pop.title}`
      });
    } catch (err) {
      console.error('Erro ao exportar PDF do fluxograma:', err);
      alert('Ocorreu um erro ao gerar o arquivo PDF do fluxograma.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800 dark:text-slate-150">
      
      {/* Dynamic Process Top Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Inputs */}
        <div className="bg-slate-50/70 dark:bg-slate-900/40 border border-slate-250/50 dark:border-slate-800/85 rounded-xl p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-5 pointer-events-none">
            <Layers className="w-24 h-24 text-amber-500" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center font-bold text-xs">
              IN
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350">
              Entradas do Processo (Insumos)
            </h4>
          </div>
          <ul className="space-y-2">
            {pop.inputs.map((input, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{input}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Responsible info */}
        <div className="bg-slate-50/70 dark:bg-slate-900/40 border border-slate-250/50 dark:border-slate-800/85 rounded-xl p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-5 pointer-events-none">
            <Users className="w-24 h-24 text-indigo-500" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-bold text-xs">
              RESP
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350">
              Responsabilidades e Atores
            </h4>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Responsável Direto:</span>
              <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-1 text-sm">{pop.responsiblePrimary}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Apoio / Validação:</span>
              <p className="text-slate-600 dark:text-slate-350 mt-1 font-medium text-sm leading-relaxed">
                {pop.responsibleSupport.join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* Outputs */}
        <div className="bg-slate-50/70 dark:bg-slate-900/40 border border-slate-250/50 dark:border-slate-800/85 rounded-xl p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-5 pointer-events-none">
            <CheckCircle className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center font-bold text-xs">
              OUT
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350">
              Saídas Esperadas (Entregáveis)
            </h4>
          </div>
          <ul className="space-y-2">
            {pop.outputs.slice(0, 4).map((output, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{output}</span>
              </li>
            ))}
            {pop.outputs.length > 4 && (
              <li className="text-[11px] text-slate-400 italic pl-5.5">
                + {pop.outputs.length - 4} saídas descritas no documento
              </li>
            )}
          </ul>
        </div>

      </div>

      {/* Main visual Flowchart Canvas (POP-001 standardized design model) */}
      <div id="flowchart-printable-area" className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950/80 shadow-md relative">
        
        {/* Blueprint graph paper grid background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] opacity-35 pointer-events-none"></div>

        {/* Canvas Header */}
        <div className="relative p-5 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 backdrop-blur-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#1F3A60] text-white rounded text-[10px] font-extrabold uppercase tracking-widest shadow-xs">
                {pop.id}
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight font-display">
                Fluxograma de Processo • {pop.title}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {viewMode === 'lanes' 
                ? 'Visualização sequencial por fases operacionais • Padrão de fluxos integrados'
                : 'Mapa de Setor (Ideal para impressão e fixação em mural do departamento)'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className="no-print flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200/60 dark:border-slate-800">
              <button
                onClick={() => setViewMode('lanes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                  viewMode === 'lanes'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-3xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Painel por Raias</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-3xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>Mapa de Setor (Mural)</span>
              </button>
            </div>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="no-print flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-400 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-3xs"
              title="Exportar Fluxograma em arquivo PDF"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1F3A60]"></span>
                Fases de Execução
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                Decisões
              </span>
            </div>
          </div>
        </div>

        {/* Lanes List or Sector Poster Map depending on viewMode */}
        {viewMode === 'lanes' ? (
          <div className="p-6 space-y-12 overflow-x-auto min-w-full z-10 relative scrollbar-thin">
            
            {phases.map((phase, pIdx) => {
              const isPop1Phase3 = pop.id === 'POP-001' && phase.id === 'FASE 3';

              return (
                <motion.div
                  key={pIdx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.35, delay: pIdx * 0.08 }}
                  className="relative flex flex-col pt-5 avoid-break"
                >
                  
                  {/* Floating lane header pill */}
                  <div className={`absolute -top-1 left-4 z-20 px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-white shadow-md ${
                    phase.color === 'navy' 
                      ? 'bg-[#1F3A60] border border-[#2F4A70]' 
                      : 'bg-[#2E7E78] border border-[#3E8E88]'
                  }`}>
                    {phase.color === 'navy' ? <Calendar className="w-3.5 h-3.5" /> : <Megaphone className="w-3.5 h-3.5" />}
                    <span className="uppercase tracking-wider">
                      {phase.id} - {phase.title}
                    </span>
                  </div>

                  {/* Horizontal Lane Track Body */}
                  <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 pt-8 pb-6 overflow-x-auto print:overflow-x-visible w-full flex items-center gap-4 relative shadow-2xs">
                    
                    {isPop1Phase3 ? (
                      // Hardcoded visual matching for POP-001 Phase 3 from PDF image
                      <div className="flex print:flex-wrap items-center gap-4 shrink-0 print:shrink py-2 pr-16 print:pr-0">
                        
                        {/* Card 1 */}
                        <div className="w-72 shrink-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3.5 shadow-3xs hover:shadow-xs transition-all avoid-break">
                          <div className="flex items-start gap-2.5">
                            {getCardIcon('user')}
                            <p className="text-[13px] md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold break-words whitespace-normal">
                              Diretoria informa necessidade de viagem
                            </p>
                          </div>
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 print:hidden" />

                        {/* Card 2 */}
                        <div className="w-72 shrink-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3.5 shadow-3xs hover:shadow-xs transition-all avoid-break">
                          <div className="flex items-start gap-2.5">
                            {getCardIcon('send')}
                            <p className="text-[13px] md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold break-words whitespace-normal">
                              Gerência repassa determinações à Secretária
                            </p>
                          </div>
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 print:hidden" />

                        {/* Dashed group container for "Materiais e Logística de Insumos" */}
                        <div className="border-2 border-dashed border-sky-600/30 dark:border-sky-500/20 bg-sky-500/5 dark:bg-sky-550/10 rounded-2xl p-4 flex flex-col relative shrink-0 avoid-break">
                          <span className="absolute -top-3 left-4 bg-[#1F3A60] text-white text-[8px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
                            Materiais e Logística de Insumos
                          </span>
                          <div className="flex items-center gap-3 pt-1">
                            
                            {/* Card 3 */}
                            <div className="w-64 shrink-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 shadow-3xs avoid-break">
                              <div className="flex items-start gap-2.5">
                                {getCardIcon('megaphone')}
                                <p className="text-[13px] md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold break-words whitespace-normal">
                                  Marketing confecciona propostas e brindes
                                </p>
                              </div>
                            </div>

                            {/* Arrow */}
                            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 print:hidden" />

                            {/* Card 4 */}
                            <div className="w-64 shrink-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 shadow-3xs avoid-break">
                              <div className="flex items-start gap-2.5">
                                {getCardIcon('dollar')}
                                <p className="text-[13px] md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold break-words whitespace-normal">
                                  Financeiro aprova as 3 cotações e compra
                                </p>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 print:hidden" />

                        {/* Decision Diamond card with perfect 45 deg tilt */}
                        <div className="flex flex-col items-center justify-center mx-6 relative shrink-0 py-4 avoid-break">
                          <div className="w-36 h-36 border-2 border-[#1F3A60] bg-[#1F3A60] dark:border-sky-500/70 dark:bg-slate-900 rotate-45 flex items-center justify-center shadow-md relative">
                            <div className="-rotate-45 text-center p-2.5 w-36 h-36 flex flex-col justify-center items-center">
                              <p className="text-[11px] font-bold text-sky-400 dark:text-sky-400 uppercase tracking-wide">Decisão</p>
                              <p className="text-[12px] font-extrabold text-white dark:text-sky-400 leading-tight mt-1.5 break-words whitespace-normal">
                                Agenda Confirmada?
                              </p>
                            </div>
                          </div>
                          {/* Yes/No branches */}
                          <div className="absolute -bottom-3.5 flex justify-between w-28 text-[9px] font-black uppercase tracking-wider">
                            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">Sim (Fase 4)</span>
                            <span className="text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">Não (Volta F3)</span>
                          </div>
                        </div>

                      </div>
                    ) : (
                      // General dynamic mapper with flex container wrapper and pr-16 padding
                      <div className="flex print:flex-wrap items-center gap-4 shrink-0 print:shrink py-2 pr-16 print:pr-0">
                        {phase.cards.map((card, cIdx) => {
                          const isLast = cIdx === phase.cards.length - 1;

                          if (card.isDecision) {
                            return (
                              <div key={cIdx} className="flex items-center gap-4 shrink-0 py-2">
                                
                                {/* Rotated Diamond decision container */}
                                <div className="flex flex-col items-center justify-center mx-6 relative shrink-0 py-4 avoid-break">
                                  <div className="w-36 h-36 border-2 border-[#1F3A60] bg-[#1F3A60] dark:border-amber-500/70 dark:bg-slate-900 rotate-45 flex items-center justify-center shadow-md relative">
                                    <div className="-rotate-45 text-center p-2.5 w-36 h-36 flex flex-col justify-center items-center">
                                      <p className="text-[11px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wide">Decisão</p>
                                      <p className="text-[12px] font-extrabold text-white dark:text-slate-100 leading-tight mt-1.5 break-words whitespace-normal">
                                        {card.decisionDetails?.question}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Decisões / Branches info */}
                                  <div className="absolute -bottom-3.5 flex justify-between w-28 text-[9px] font-black uppercase tracking-wider">
                                    <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">Avançar</span>
                                    <span className="text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">Encerra</span>
                                  </div>
                                </div>

                                {/* Arrow */}
                                {!isLast && (
                                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 print:hidden" />
                                )}
                              </div>
                            );
                          }

                          return (
                            <div key={cIdx} className="flex items-center gap-4 shrink-0 py-2">
                              
                              {/* Standard high-fidelity Process Card */}
                              <div className="w-72 shrink-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3.5 shadow-3xs hover:shadow-xs transition-all relative avoid-break">
                                
                                {/* Step index badge */}
                                <div className="absolute -top-2 left-3 bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded-full">
                                  {pIdx + 1}.{cIdx + 1}
                                </div>

                                <div className="flex items-start gap-2.5 mt-1.5">
                                  {getCardIcon(card.icon)}
                                  <p className="text-[13px] md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold break-words whitespace-normal">
                                    {card.label}
                                  </p>
                                </div>
                              </div>

                              {/* Arrow */}
                              {!isLast && (
                                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 print:hidden" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                </motion.div>
              );
            })}

          </div>
        ) : (
          /* Sector Poster Map (Wall-friendly linear vertical flowchart diagram) */
          <div className="p-4 md:p-8 space-y-6 z-10 relative max-w-3xl mx-auto print:p-0 print:max-w-none animate-fade-in">
            
            {/* Poster Quick Info / Instruction banner */}
            <div className="no-print bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-slate-750 dark:text-slate-300">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-slate-900 dark:text-white mb-0.5">Pôster de Parede (Ideal para Fixação no Setor)</p>
                Este formato foi projetado especificamente para ser impresso em folha A4/A3 e afixado no mural de cada setor. Ele organiza todas as etapas de forma linear e vertical com os responsáveis de cada atividade. Clique no botão de <strong>Imprimir / PDF</strong> no painel superior para obter a versão física.
              </div>
            </div>

            {/* Poster Sheet Container */}
            <div className="border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 rounded-2xl shadow-sm space-y-6 print:border-none print:shadow-none print:p-0 text-slate-850 dark:text-slate-100">
              
              {/* Poster Brand/Identification Header */}
              <div className="text-center pb-6 border-b border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[9px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  MAPA DE PROCESSO DE TRABALHO • SETOR
                </span>
                <h2 className="text-lg md:text-xl font-black text-slate-950 dark:text-white uppercase font-display leading-tight pt-1.5">
                  {pop.id} – {pop.title}
                </h2>
                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-2xs font-extrabold text-slate-500 dark:text-slate-400">
                  <span>SETOR: <strong className="text-slate-850 dark:text-slate-200 uppercase">{pop.sector || "ADMINISTRATIVO"}</strong></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                  <span>RESPONSÁVEL: <strong className="text-emerald-600 dark:text-emerald-450 uppercase">{pop.responsiblePrimary}</strong></span>
                </div>
              </div>

              {/* Start point circle marker */}
              <div className="flex flex-col items-center">
                <div className="bg-[#1F3A60] dark:bg-sky-950 text-white border border-sky-500/20 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  INÍCIO DO PROCESSO
                </div>
                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-800 my-1"></div>
              </div>

              {/* Steps vertical sequence layout */}
              <div className="space-y-1 relative">
                {/* Visual connecting timeline running vertically behind all steps */}
                <div className="absolute top-0 bottom-0 left-6 md:left-1/2 -translate-x-1/2 w-0.5 bg-slate-200 dark:bg-slate-850 pointer-events-none"></div>

                {pop.steps.map((step, idx) => {
                  const isDecision = step.substeps?.some(sub => isDecisionStep(sub)) || false;
                  
                  return (
                    <div key={idx} className="relative flex flex-col items-center">
                      
                      {/* Step block card */}
                      <div className="w-full md:max-w-2xl bg-slate-50/60 dark:bg-slate-900/30 border border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-500/40 rounded-xl p-4 relative z-10 transition-colors shadow-3xs avoid-break">
                        
                        {/* Edge accent strip */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
                          isDecision ? 'bg-amber-500' : 'bg-[#1F3A60]'
                        }`}></div>

                        <div className="pl-3 space-y-3">
                          {/* Card Header with index number */}
                          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/60 dark:border-slate-850/80 pb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-lg font-black text-2xs flex items-center justify-center border ${
                                isDecision 
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25' 
                                  : 'bg-[#1F3A60]/10 text-[#1F3A60] dark:text-sky-400 border-sky-500/20'
                              }`}>
                                {idx + 1}
                              </span>
                              <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase font-display tracking-tight">
                                {step.title}
                              </h3>
                            </div>
                            <span className="text-[10px] md:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">
                              Fase {idx + 1} de {pop.steps.length}
                            </span>
                          </div>

                          {/* Step description */}
                          {step.description && (
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic pl-1">
                              {step.description}
                            </p>
                          )}

                          {/* Substeps within the card layout */}
                          <div className="space-y-2 pl-1">
                            {step.substeps?.map((sub, sIdx) => {
                              const isDec = isDecisionStep(sub);
                              return (
                                <div 
                                  key={sIdx} 
                                  className={`p-3 rounded-lg border transition-all text-xs md:text-sm leading-relaxed ${
                                    isDec 
                                      ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 text-slate-800 dark:text-slate-300' 
                                      : 'bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-850/90 text-slate-650 dark:text-slate-350'
                                  }`}
                                >
                                  {isDec ? (
                                    <div className="flex items-start gap-2.5">
                                      <GitFork className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                      <div className="space-y-1 w-full">
                                        <div className="font-extrabold text-amber-600 dark:text-amber-400 text-[11px] uppercase tracking-wider">
                                          Ponto de Decisão
                                        </div>
                                        <p className="font-bold text-slate-900 dark:text-white">{sub}</p>
                                        <div className="flex gap-3 pt-1.5 text-[10px] font-black uppercase">
                                          <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Aprovado: Seguir</span>
                                          <span className="text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Recusado: Corrigir</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-start gap-2.5">
                                      <span className="font-mono text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-900 w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-slate-200/60 dark:border-slate-800">
                                        {sIdx + 1}
                                      </span>
                                      <span className="font-medium pt-0.5">{sub}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      </div>

                      {/* Arrow connector element downward */}
                      {idx < pop.steps.length - 1 && (
                        <div className="flex flex-col items-center my-1 z-10 relative">
                          <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-800"></div>
                          <ArrowDown className="w-4 h-4 text-emerald-500 dark:text-emerald-400 -mt-1.5 shrink-0" />
                          <div className="w-0.5 h-2 bg-slate-300 dark:bg-slate-800 mt-0.5"></div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {/* End of flow node */}
              <div className="flex flex-col items-center pt-4">
                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-800 my-1"></div>
                <div className="bg-emerald-600 text-white border border-emerald-500/20 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-md flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  FIM DO FLUXO • OBJETIVOS ENTREGUES
                </div>
              </div>

              {/* Poster bottom deliverables & targets box block */}
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/90 dark:border-slate-850 rounded-xl p-5 mt-6 grid grid-cols-1 md:grid-cols-2 gap-5 avoid-break">
                <div>
                  <h4 className="text-xs md:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Entregáveis Garantidos (Outputs)
                  </h4>
                  <ul className="space-y-1.5">
                    {pop.outputs.map((out, oIdx) => (
                      <li key={oIdx} className="flex items-start gap-2 text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-xs md:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    Indicadores de Metas de Execução
                  </h4>
                  <ul className="space-y-1.5">
                    {pop.performanceIndicators.map((ind, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2 text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        <span className="w-4 h-4 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {iIdx + 1}
                        </span>
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Wall Poster sign-offs row */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between gap-4 text-[9px] text-slate-400 font-mono uppercase avoid-break">
                <span>Procedimento Oficial</span>
                <span>Homologado por: Gerência Executiva</span>
                <span>Última Revisão: {pop.emissionDate} • Rev {pop.revision}</span>
              </div>

            </div>

          </div>
        )}

        {/* Canvas Footer Legend */}
        <div className="no-print p-4 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-850 flex flex-wrap justify-between items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 z-10 relative">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-700 dark:text-slate-350">Legenda de Ícones:</span>
            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/20 px-2.5 py-1 rounded border border-slate-200/55 dark:border-slate-800">
              <Send className="w-3.5 h-3.5 text-sky-500" /> Comunicação
            </span>
            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/20 px-2.5 py-1 rounded border border-slate-200/55 dark:border-slate-800">
              <Megaphone className="w-3.5 h-3.5 text-rose-500" /> Marketing / Mídia
            </span>
            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/20 px-2.5 py-1 rounded border border-slate-200/55 dark:border-slate-800">
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" /> Conferência
            </span>
            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/20 px-2.5 py-1 rounded border border-slate-200/55 dark:border-slate-800">
              <Folder className="w-3.5 h-3.5 text-amber-500" /> Arquivamento
            </span>
            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/20 px-2.5 py-1 rounded border border-slate-200/55 dark:border-slate-800">
              <GitFork className="w-3.5 h-3.5 text-amber-500" /> Desvios / Decisões
            </span>
          </div>
          <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wide">
            <Info className="w-3.5 h-3.5" />
            <span>Layout Padrão de Fluxo</span>
          </div>
        </div>

      </div>

      {/* Performance Indicators Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Activity className="w-4 h-4 text-emerald-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Indicadores de Desempenho e Metas Relacionadas
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pop.performanceIndicators.map((indicator, idx) => (
            <div 
              key={idx} 
              className="p-3 bg-emerald-500/5 dark:bg-emerald-500/2 border border-emerald-500/10 dark:border-emerald-500/10 rounded-lg flex items-start gap-2.5 hover:border-emerald-500/30 transition-colors"
            >
              <div className="w-5 h-5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs rounded-full flex items-center justify-center shrink-0">
                {idx + 1}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                {indicator}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
