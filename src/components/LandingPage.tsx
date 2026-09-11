import { BookOpen, Briefcase, FileText, Archive, ShieldCheck, Building2, Users, CheckCircle2, Mail } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// Fase 4 (rebranding) — página pública de apresentação do produto.
// ─────────────────────────────────────────────────────────────────────
// Standalone de propósito: não importa nada de src/config/firebase.ts
// nem faz login — carrega instantaneamente pra qualquer visitante, sem
// nenhuma chamada ao banco. Servida na rota /produto (ver src/main.tsx),
// fora do fluxo normal do app (que continua abrindo direto na tela de
// login em qualquer outro caminho). O CTA "Fale conosco" é um link
// mailto: — sem formulário com backend próprio nesta fase (regra 5 do
// prompt: simplicidade de manutenção; um formulário de verdade
// precisaria de uma Cloud Function só pra receber submissões).
const CONTACT_EMAIL = 'marciper@gmail.com';

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
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Quero conhecer o Normatiza')}`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-colors"
          >
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
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Quero conhecer o Normatiza')}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-md transition-colors"
          >
            <Mail className="w-4 h-4" />
            Falar com um especialista
          </a>
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
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Quero conhecer o Normatiza')}`}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-md transition-colors"
        >
          <Mail className="w-4 h-4" />
          {CONTACT_EMAIL}
        </a>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-[11px] text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} Normatiza — Sistema de Controle de Documentos e Processos
      </footer>
    </div>
  );
}
