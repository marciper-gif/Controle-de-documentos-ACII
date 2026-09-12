import { BookOpen, Briefcase, FileText, Archive, ShieldCheck, Building2, Users, CheckCircle2, Mail, Layers, AlertTriangle, Search, MessageCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// Fase 4 (rebranding) — página pública de apresentação do produto.
// ─────────────────────────────────────────────────────────────────────
// Standalone de propósito: não importa nada de src/config/firebase.ts
// nem faz login — carrega instantaneamente pra qualquer visitante, sem
// nenhuma chamada ao banco. Servida na rota /produto (ver src/main.tsx),
// fora do fluxo normal do app (que continua abrindo direto na tela de
// login em qualquer outro caminho). Sem formulário com backend próprio
// nesta fase (regra 5 do prompt: simplicidade de manutenção; um
// formulário de verdade precisaria de uma Cloud Function só pra receber
// submissões) — os CTAs são um link wa.me (WhatsApp, canal principal —
// é assim que o público local negocia de verdade) com e-mail como
// alternativa secundária, menor.
const CONTACT_EMAIL = 'marciper@gmail.com';
// Formato E.164 sem símbolos: 55 (Brasil) + DDD + número.
const WHATSAPP_NUMBER = '5599999010979';
const WHATSAPP_MESSAGE = 'Olá! Vim pelo site do Normatiza e quero saber mais.';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
const MAILTO_URL = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Quero conhecer o Normatiza')}`;

const FEATURES = [
  {
    icon: Briefcase,
    title: 'ATRs',
    desc: 'Documente as atribuições de cada cargo — tarefas, liderança, formação e competências exigidas.'
  },
  {
    icon: BookOpen,
    title: 'POPs',
    desc: 'Padronize processos operacionais em etapas claras, com entradas, saídas e indicadores de desempenho.'
  },
  {
    icon: FileText,
    title: 'Instruções de Trabalho',
    desc: 'Registre o passo a passo de tarefas específicas, direto e sem complicação.'
  },
  {
    icon: Archive,
    title: 'Documentos Digitalizados',
    desc: 'Organize contratos, notas e arquivos por setor, com controle de prazo de guarda e versionamento.'
  }
];

const BENEFITS = [
  'Cada empresa com seus próprios setores, usuários e permissões — dados completamente isolados entre clientes',
  'Papéis de acesso prontos: administrador, gestor de setor e colaborador',
  'Histórico de revisões e log de auditoria em cada documento',
  'Sua identidade visual: nome e logo da sua empresa em todo o sistema'
];


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              N
            </div>
            <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white font-display">Normatiza</span>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Fale Conosco
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-14 text-center">
        <span className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          Controle de documentos e processos
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-display leading-tight">
          Documentos e processos organizados, <span className="text-emerald-600 dark:text-emerald-450">por setor</span>, sem planilha nenhuma.
        </h1>
        <p className="mt-5 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Normatiza é o sistema que sua empresa usa para controlar ATRs, POPs, Instruções de Trabalho e
          documentos digitalizados — cada um no seu setor, com histórico de revisão e permissões por
          papel de acesso.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-md transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Falar com um especialista
          </a>
          <a
            href={MAILTO_URL}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            ou envie um e-mail
          </a>
        </div>
      </section>

      {/* Preview do sistema — Fase 5 (aparência): quem decide contratar
          nunca via uma tela sequer do produto, só ícones genéricos e
          texto. Reconstrução fiel do visual real do dashboard (mesmas
          classes/cores dos componentes de verdade — src/App.tsx), com uma
          empresa e dados FICTÍCIOS ("Empresa Modelo"), pra nunca expor
          documentos/dados reais de um cliente numa página pública. */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          {/* Barra de topo simulando o cabeçalho do sistema */}
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-black text-xs shrink-0">EM</div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight truncate">Empresa Modelo Ltda</p>
              <p className="text-[9px] text-emerald-600 dark:text-emerald-450 font-black uppercase tracking-widest leading-none">Normatiza • Controle de Documentos e Processos</p>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Cards de estatística — mesmo padrão visual do dashboard real.
                Classes de cor escritas por extenso (não montadas com
                template string) de propósito: o Tailwind só gera CSS pras
                classes que consegue achar como texto literal no código —
                uma classe montada em runtime (`text-${cor}-600`) nunca
                aparece no CSS final. */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total POPs', value: 24, icon: Layers, valueClass: 'text-sky-600 dark:text-sky-400', badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
                { label: 'Total ATRs', value: 18, icon: Briefcase, valueClass: 'text-indigo-600 dark:text-indigo-400', badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
                { label: 'Setores Ativos', value: 6, icon: Building2, valueClass: 'text-amber-600 dark:text-amber-400', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                { label: 'Revisões Pendentes', value: 2, icon: AlertTriangle, valueClass: 'text-rose-600 dark:text-rose-400', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' }
              ].map(card => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.label}</span>
                      <h4 className={`text-xl font-black font-display mt-0.5 ${card.valueClass}`}>{card.value}</h4>
                    </div>
                    <div className={`p-1.5 rounded-lg ${card.badgeClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Busca simulada */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-xs">
              <Search className="w-3.5 h-3.5" />
              Pesquisar por título, código, palavra-chave, tarefas...
            </div>

            {/* Documento de exemplo */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-sky-500/5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Procedimento Operacional Padrão</span>
                  <h5 className="text-sm font-black text-slate-900 dark:text-white">POP-014 · Recebimento de Mercadorias</h5>
                </div>
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-1 rounded-lg shrink-0">Setor: Produção</span>
              </div>
              <div className="p-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <p><span className="font-bold text-slate-800 dark:text-slate-200">Objetivo: </span>Padronizar o recebimento de mercadorias no setor de Produção, garantindo conferência e registro adequados.</p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  <li>Conferência da nota fiscal com o pedido de compra</li>
                  <li>Inspeção visual do lote recebido</li>
                  <li>Registro da entrada no sistema de estoque</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight font-display mb-1.5">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-450" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight font-display">
              Feito para várias empresas, não só uma
            </h2>
          </div>
          <ul className="space-y-3.5">
            {BENEFITS.map(b => (
              <li key={b} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <Users className="w-9 h-9 text-sky-500 mx-auto mb-4" />
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display">
          Quer ver o Normatiza funcionando na sua empresa?
        </h2>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Fale com a gente e configuramos sua empresa com seus setores, usuários e identidade visual.
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-md transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Falar no WhatsApp
        </a>
        <div className="mt-3">
          <a
            href={MAILTO_URL}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            ou envie um e-mail para {CONTACT_EMAIL}
          </a>
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-[11px] text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} Normatiza — Sistema de Controle de Documentos e Processos
      </footer>
    </div>
  );
}
