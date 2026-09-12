import { useState, FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { confirmPasswordResetCallable } from '../lib/functions';

// ─────────────────────────────────────────────────────────────────────
// "Esqueci minha senha" self-service, parte 2 — página que o link do
// e-mail (requestPasswordReset, functions/index.js) abre. Standalone,
// igual LoginView/LandingPage: sem sessão nenhuma, o token da URL É a
// autenticação desse pedido específico (confirmPasswordReset valida ele
// no servidor — token inexistente/usado/expirado nunca troca a senha).
// Rota pública /resetar-senha (ver src/main.tsx).
export default function ResetPasswordView() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUsername, setSuccessUsername] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Link inválido — falta o código de redefinição. Peça um novo link na tela de login.');
      return;
    }
    if (newPassword.length < 4) {
      setError('A senha precisa ter pelo menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const res = await confirmPasswordResetCallable({ token, newPassword });
      const data = res.data as { success: boolean; username?: string };
      setSuccessUsername(data.username || null);
    } catch (err: any) {
      setError(err?.message || 'Falha ao redefinir a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 py-12 transition-colors duration-200">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-20">
        <div className="absolute -top-10 left-1/4 w-96 h-96 rounded-full bg-[#1e3a5f]/20 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e3a5f] dark:bg-[#2b5182] rounded-2xl shadow-xl text-white font-black text-2xl mb-3 border border-white/20">
            N
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-display">
            Normatiza
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-1.5 bg-[#1e3a5f]/10 dark:bg-sky-500/10 text-[#1e3a5f] dark:text-sky-400 rounded-lg">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight">
              Nova Senha
            </h3>
          </div>

          {successUsername !== null ? (
            <div className="space-y-5">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5 font-semibold leading-relaxed">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Senha redefinida com sucesso{successUsername ? ` para o login "${successUsername}"` : ''}!
                  Já pode entrar com a nova senha.
                </span>
              </div>
              <Link
                to="/"
                className="w-full py-3 bg-[#1e3a5f] hover:bg-[#2b5182] dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                Ir para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {!token && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5 font-semibold leading-relaxed">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Este link parece incompleto. Peça um novo link de redefinição na tela de login.</span>
                </div>
              )}
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5 font-semibold leading-relaxed">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 pl-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f] transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 pl-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f] transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1e3a5f] hover:bg-[#2b5182] dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>{loading ? 'Salvando...' : 'Redefinir Senha'}</span>
              </button>

              <Link
                to="/"
                className="block text-center text-2xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Voltar para o login
              </Link>
            </form>
          )}
        </motion.div>

        <div className="text-center mt-6 text-2xs text-slate-400 dark:text-slate-500 font-mono">
          © {new Date().getFullYear()} Normatiza • Sistema de Controle de Documentos e Processos
        </div>
      </motion.div>
    </div>
  );
}
