import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, Eye, EyeOff, ShieldAlert, LogIn, Shield } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserAccount } from '../types';
import { fazerLogin } from '../lib/userManagement';
import TrocaSenha from './TrocaSenha';

interface LoginViewProps {
  onLogin: (user: UserAccount) => void;
  users: UserAccount[];
  onUpdateUsers?: (users: UserAccount[]) => void;
}

export default function LoginView({ onLogin, users, onUpdateUsers }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // First access password change state
  const [pendingUser, setPendingUser] = useState<UserAccount | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error(e);
      setError('Falha ao autenticar com o Google: ' + (e.message || String(e)));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha o usuário/CPF e a senha.');
      return;
    }

    setLoading(true);

    try {
      const res = await fazerLogin(username, password, users);

      if (res.precisaTrocarSenha) {
        setPendingUser(res.userData);
      } else {
        onLogin(res.userData);
      }
    } catch (err: any) {
      console.error('Erro no login:', err);
      setError(err.message || 'Falha ao efetuar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrocaSenhaSuccess = (updatedUser: UserAccount) => {
    const updatedList = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    if (onUpdateUsers) {
      onUpdateUsers(updatedList);
    } else {
      localStorage.setItem('ms-users', JSON.stringify(updatedList));
    }
    setPendingUser(null);
    onLogin(updatedUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 py-12 transition-colors duration-200">
      {/* Background ambient lighting */}
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
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e3a5f] dark:bg-[#2b5182] rounded-2xl shadow-xl text-white font-black text-2xl mb-3 border border-white/20">
            ACII
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-display">
            Controle de Processos
          </h2>
          <p className="text-xs text-[#1e3a5f] dark:text-sky-400 font-extrabold uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Associação Comercial de Imperatriz</span>
          </p>
        </div>

        <AnimatePresence mode="wait">
          {pendingUser ? (
            /* First Access Password Reset Modal / Card */
            <TrocaSenha
              key="troca-senha"
              userId={pendingUser.id}
              userAccount={pendingUser}
              onSuccess={handleTrocaSenhaSuccess}
              onCancel={() => setPendingUser(null)}
            />
          ) : (
            /* Standard Login Card */
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-1.5 bg-[#1e3a5f]/10 dark:bg-sky-500/10 text-[#1e3a5f] dark:text-sky-400 rounded-lg">
                  <LogIn className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                  Identificação do Usuário
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5 font-semibold leading-relaxed"
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 pl-1">
                    Login / CPF (Apenas Números)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="CPF do Funcionário ou Nome de Usuário"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f] transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 pl-1">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Sua senha de acesso (Inicial: 123)"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 bg-[#1e3a5f] hover:bg-[#2b5182] dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Verificando...' : 'Entrar no Portal'}</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-slate-400 dark:text-slate-500 text-2xs uppercase font-bold">ou</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-2.5 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Entrar com o Google</span>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer info */}
        <div className="text-center mt-6 text-2xs text-slate-400 dark:text-slate-500 font-mono">
          © {new Date().getFullYear()} ACII Imperatriz • Sistema de Controle de Processos
        </div>
      </motion.div>
    </div>
  );
}
