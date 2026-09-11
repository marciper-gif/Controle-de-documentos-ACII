import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, X, CheckCircle2, AlertCircle, Loader2, Copy } from 'lucide-react';
import { createCompanyCallable } from '../lib/functions';

interface CompanyOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreatedCompanyResult {
  companyId: string;
  companyName: string;
  adminUsername: string;
  adminPassword: string;
}

/**
 * Fase 3 (onboarding) — cadastro de uma nova empresa (tenant) + sua
 * primeira conta admin. Só visível/utilizável por quem está logado com o
 * e-mail Google do dono da plataforma (ver o botão que abre este modal em
 * App.tsx, e a checagem real — que vale de verdade, não só esconder o
 * botão — na Cloud Function `createCompany`, functions/index.js).
 *
 * Propositalmente simples (regra 5 do prompt): um formulário, uma
 * chamada, um resultado com as credenciais pra você repassar ao cliente.
 * Nada de fluxo self-service público — o próprio prompt pede isso só na
 * Fase 3; abrir cadastro público é decisão de produto pra mais adiante.
 */
export default function CompanyOnboardingModal({ isOpen, onClose }: CompanyOnboardingModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedCompanyResult | null>(null);

  const resetForm = () => {
    setCompanyName('');
    setAdminName('');
    setAdminUsername('');
    setAdminPassword('');
    setError(null);
    setResult(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await createCompanyCallable({
        companyName: companyName.trim(),
        adminName: adminName.trim(),
        adminUsername: adminUsername.trim(),
        adminPassword
      });
      const data = res.data as { companyId: string; companyName: string; adminUsername: string };
      setResult({
        companyId: data.companyId,
        companyName: data.companyName,
        adminUsername: data.adminUsername,
        adminPassword // guardado só localmente, pra você poder copiar — nunca volta do servidor
      });
    } catch (err: any) {
      setError(err?.message || 'Falha ao criar a empresa. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!result) return;
    const text = `Empresa: ${result.companyName}\nLogin: ${result.adminUsername}\nSenha inicial: ${result.adminPassword}`;
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase font-display flex items-center gap-2">
                  <Building2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-450" />
                  Cadastrar Nova Empresa
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Cria o tenant e a primeira conta admin dele.</p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {result ? (
              <div className="p-6 space-y-4 text-sm">
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl flex gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold mb-1">Empresa "{result.companyName}" criada.</p>
                    <p>Repasse estas credenciais pro cliente — a senha não fica salva em lugar nenhum além desta tela, copie agora:</p>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs">
                  <p><span className="text-slate-400">ID da empresa:</span> {result.companyId}</p>
                  <p><span className="text-slate-400">Login:</span> {result.adminUsername}</p>
                  <p><span className="text-slate-400">Senha inicial:</span> {result.adminPassword}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={copyCredentials}
                    className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2.5 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome da Empresa *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Ex: Comércio ABC Ltda"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome do Admin *</label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    placeholder="Nome de quem vai administrar a empresa"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Login do Admin *</label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={e => setAdminUsername(e.target.value)}
                    placeholder="Precisa ser único em todo o sistema"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Senha Inicial *</label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="O admin vai poder trocar no primeiro acesso"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors text-xs"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {submitting ? 'Criando...' : 'Criar Empresa'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
