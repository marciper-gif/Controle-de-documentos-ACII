import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building, Users, FileText, ArrowRight, CheckCircle2, Circle, X, Sparkles } from 'lucide-react';

interface OnboardingChecklistProps {
  companyId: string;
  hasSectors: boolean;
  hasEmployees: boolean;
  hasDocuments: boolean;
  onGoToSectors: () => void;
  onGoToEmployees: () => void;
  onCreateDocument: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// Fase 5 (aparência) — empresa nova nasce vazia de propósito (decisão
// revista na Fase 1: sem catálogo de exemplo da ACII, ver comentário
// grande em seedDatabaseIfEmptyForCompany, src/lib/firebaseSync.ts), mas
// "vazia" sem nenhuma orientação passa a impressão de sistema quebrado
// pro primeiro acesso de um cliente pagante, não de produto novo esperando
// configuração. Este painel resolve isso com um checklist de 3 passos —
// só aparece enquanto pelo menos um deles não foi feito, e cada item
// já leva direto pra tela certa (nada de "descubra sozinho onde clicar").
//
// "Ocultar" é por navegador/empresa (localStorage, chave com companyId),
// não estado do servidor — decisão de simplicidade (regra 5 do prompt):
// é só uma dica de onboarding, não uma preferência que precise
// acompanhar o usuário entre dispositivos. Mesmo oculto, reaparece
// sozinho se a empresa ainda estiver vazia numa sessão nova de outro
// navegador/dispositivo, o que é o comportamento certo aqui.
export default function OnboardingChecklist({
  companyId,
  hasSectors,
  hasEmployees,
  hasDocuments,
  onGoToSectors,
  onGoToEmployees,
  onCreateDocument
}: OnboardingChecklistProps) {
  const dismissKey = `ms-onboarding-dismissed-${companyId}`;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(dismissKey) === '1';
    } catch {
      return false;
    }
  });

  const allDone = hasSectors && hasEmployees && hasDocuments;
  if (allDone || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(dismissKey, '1');
    } catch {
      // localStorage indisponível (modo privado etc.) — só não persiste, sem quebrar a tela.
    }
  };

  const steps = [
    {
      done: hasSectors,
      icon: Building,
      title: 'Crie seu primeiro setor',
      desc: 'Setores organizam quem vê o quê (ex.: Financeiro, RH, Operações).',
      action: onGoToSectors,
      cta: 'Criar Setor'
    },
    {
      done: hasEmployees,
      icon: Users,
      title: 'Cadastre um funcionário',
      desc: 'Vincule pessoas aos setores pra depois dar acesso ao sistema.',
      action: onGoToEmployees,
      cta: 'Cadastrar Funcionário'
    },
    {
      done: hasDocuments,
      icon: FileText,
      title: 'Crie seu primeiro documento',
      desc: 'Um POP, ATR ou Instrução de Trabalho — o conteúdo real do sistema.',
      action: onCreateDocument,
      cta: 'Criar Documento'
    }
  ];

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="no-print relative bg-gradient-to-br from-[var(--brand-primary)]/10 via-white to-white dark:from-[var(--brand-primary)]/10 dark:via-slate-900/40 dark:to-slate-900/40 border border-[var(--brand-primary)]/25 rounded-2xl p-5 mb-8 shadow-sm"
      >
        <button
          onClick={handleDismiss}
          title="Ocultar (você pode voltar a ver isso mais tarde só se a empresa continuar vazia)"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight font-display">
            Primeiros Passos
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Sua empresa começa vazia de propósito — monte do seu jeito. Siga os passos abaixo pra colocar o sistema pra funcionar.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {steps.map(step => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className={`p-4 rounded-xl border flex flex-col gap-2 ${
                  step.done
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-white/70 dark:bg-slate-950/30 border-slate-200/80 dark:border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                  <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className={`text-xs font-bold ${step.done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                    {step.title}
                  </span>
                </div>
                <p className="text-2xs text-slate-450 dark:text-slate-500 leading-relaxed flex-1">{step.desc}</p>
                {!step.done && (
                  <button
                    onClick={step.action}
                    className="mt-1 self-start flex items-center gap-1 text-2xs font-black uppercase tracking-wider text-[var(--brand-primary)] hover:brightness-110 cursor-pointer"
                  >
                    {step.cta}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
