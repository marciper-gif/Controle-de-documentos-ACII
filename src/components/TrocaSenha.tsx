import React, { useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { UserAccount } from '../types';
import { trocarSenha } from '../lib/userManagement';

interface TrocaSenhaProps {
  key?: string;
  userId: string;
  userAccount: UserAccount;
  onSuccess: (updatedUser: UserAccount) => void;
  onCancel?: () => void;
}

export default function TrocaSenha({ userId, userAccount, onSuccess, onCancel }: TrocaSenhaProps) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Requisitos de validação
  const hasMinLength = novaSenha.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(novaSenha);
  const hasNumber = /[0-9]/.test(novaSenha);
  const matchesConfirm = novaSenha.length > 0 && novaSenha === confirmarSenha;

  const isValid = hasMinLength && hasLetter && hasNumber && matchesConfirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!hasMinLength) {
      setErrorMsg('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (!hasLetter) {
      setErrorMsg('A senha deve conter pelo menos uma letra.');
      return;
    }
    if (!hasNumber) {
      setErrorMsg('A senha deve conter pelo menos um número.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const res = await trocarSenha(userId, novaSenha);

      // Não guardamos a senha (nem em texto puro, nem um "hash" falso)
      // no estado local — a Cloud Function `setPassword` já gravou o
      // hash de verdade no Firestore. O objeto local só precisa refletir
      // que o primeiro acesso foi concluído.
      const { password: _oldPassword, passwordHash: _oldHash, ...userAccountWithoutPassword } = userAccount;
      const updatedUser: UserAccount = {
        ...userAccountWithoutPassword,
        firstAccess: false,
        primeiro_acesso: false,
        accountStatus: 'ativo',
        status: 'Ativo',
        lastPasswordChange: res.lastPasswordChange || new Date().toLocaleDateString('pt-BR')
      };

      onSuccess(updatedUser);
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      setErrorMsg(err.message || 'Falha ao alterar a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <KeyRound className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Primeiro Acesso ao Sistema
          </h2>
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-left text-[11px]">
              Por segurança, crie uma nova senha para continuar acessando o Portal de Documentos.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-3xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showNovaSenha ? 'text' : 'password'}
                required
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite sua nova senha"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowNovaSenha(!showNovaSenha)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-3xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmarSenha ? 'text' : 'password'}
                required
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Indicadores de Requisitos */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1.5 text-[11px]">
            <span className="block text-3xs font-bold uppercase tracking-wider text-slate-400">
              Requisitos da Senha:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-medium">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'opacity-100' : 'opacity-30'}`} />
                <span>Mínimo 8 caracteres</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasLetter ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasLetter ? 'opacity-100' : 'opacity-30'}`} />
                <span>Pelo menos 1 letra</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasNumber ? 'opacity-100' : 'opacity-30'}`} />
                <span>Pelo menos 1 número</span>
              </div>
              <div className={`flex items-center gap-1.5 ${matchesConfirm ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${matchesConfirm ? 'opacity-100' : 'opacity-30'}`} />
                <span>Senhas coincidem</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Voltar
              </button>
            )}
            <button
              type="submit"
              disabled={!isValid || loading}
              className={`w-full py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                isValid && !loading
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Nova Senha e Acessar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
