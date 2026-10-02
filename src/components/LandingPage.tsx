import { Link } from 'react-router-dom';
import {
  FileText,
  Layers,
  Briefcase,
  Archive,
  ShieldCheck,
  Building2,
  Users,
  History,
  ArrowRight,
  Mail,
  CheckCircle2,
  Palette
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// Fase 4 — página pública de apresentação do Normatiza.
// ─────────────────────────────────────────────────────────────────────
// Genérica de propósito: vende a proposta de valor do produto para
// QUALQUER empresa (nenhuma referência à ACII ou a qualquer outro
// cliente específico). Roteada de forma independente do app logado —
// ver src/main.tsx — então funciona tanto pra quem nunca usou o
// sistema quanto pra quem já é cliente e só quer o link pra divulgar.

const CONTACT_EMAIL = 'marciper@gmail.com';

const FEATURES = [
  {
    icon: Briefcase,
    title: 'ATRs',
    desc: 'Atribuições e responsabilidades de cada cargo — liderança, formação, competências e tarefas, sempre com histórico de revisão.'
  },
  {
    icon: Layers,
    title: 'POPs',
    desc: 'Procedimentos Operacionais Padrão com etapas, entradas e saídas, responsáveis e indicadores de desempenho.'
  },
  {
    icon: FileText,
    title: 'Instruções de Trabalho',
    desc: 'O passo a passo simplificado de tarefas específicas, pronto para consulta rápida por quem executa no dia a dia.'
  },
  {
    icon: Archive,
    title: 'Documentos Digitalizados',
    desc: 'Guarda de documentos por setor, com prazo de retenção, versionamento de arquivo e log de auditoria completo.'
  }
];

const BENEFITS = [
  {
    icon: Building2,
    title: 'Sua empresa, com seus setores',
    desc: 'Cada empresa cadastra os próprios setores e decide quais tipos de documento usar — nada vem fixo de outra empresa.'
  },
  {
    icon: Users,
    title: 'Papéis e permissões',
    desc: 'Admin configura a empresa; gestor cuida dos documentos do próprio setor; colaborador consulta. Simples de entender, simples de manter.'
  },
  {
    icon: ShieldCheck,
    title: 'Isolamento de dados comprovado',
    desc: 'Os dados de cada empresa ficam isolados dos de qualquer outra — validado por testes automatizados, não só por boa vontade.'
  },
  {
    icon: History,
    title: 'Histórico e rastreabilidade',
    desc: 'Toda revisão de documento registra o quê mudou, quando e por quem — pronto para auditoria quando for preciso.'
  },
  {
    icon: Palette,
    title: 'Identidade própria',
    desc: 'Suba o logo e defina a cor da sua empresa — o sistema se adapta à sua marca, não o contrário.'
  },
  {
    icon: CheckCircle2,
    title: 'Pronto pra crescer',
    desc: 'Do primeiro funcionário a milhares de documentos digitalizados, a estrutura já foi pensada para escalar.'
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* Nav */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm shrink-0">
              N
            </div>
            <span className="font-black uppercase tracking-tight text-slate-900 dark:text-white font-display">
              Normatiza
            </span>
          </div>
          <Link
            to="/"
            className="px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-slate-900 hover:bg-slate-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-colors"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-16 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-extrabold uppercase tracking-widest mb-6">
          Controle de documentos corporativos
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-display leading-tight max-w-3xl mx-auto">
          ATRs, POPs, Instruções de Trabalho e documentos digitalizados — organizados por setor, para qualquer empresa.
        </h1>
        <p className="mt-5 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          O Normatiza é o sistema que sua empresa usa para manter processos, atribuições e documentos sempre
          atualizados, com histórico completo e acesso certo para cada papel — sem planilha perdida, sem pasta
          de rede desorganizada.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Quero conhecer o Normatiza')}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" /> Fale com a gente
          </a>
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
          >
            Já é cliente? Entrar <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Os 4 tipos de documento */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16">
        <h2 className="text-center text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-8">
          Os 4 tipos de documento que toda empresa precisa controlar
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1.5">{f.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefícios */}
      <section className="bg-white dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800 py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <h2 className="text-center text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display mb-10">
            Pensado para empresas de verdade, não só para a nossa
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map(b => (
              <div key={b.title} className="flex gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <b.icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{b.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">
          Quer ver o Normatiza funcionando na sua empresa?
        </h2>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Conte um pouco sobre seus setores e seus documentos hoje — a gente mostra como ficaria organizado no sistema.
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Quero conhecer o Normatiza')}`}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Mail className="w-4 h-4" /> {CONTACT_EMAIL}
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center text-[11px] text-slate-400 dark:text-slate-500 font-mono">
          © {new Date().getFullYear()} Normatiza • Controle de Documentos
        </div>
      </footer>
    </div>
  );
}
