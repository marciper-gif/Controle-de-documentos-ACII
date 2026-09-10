import { UserAccount } from "../types";
import { loginCallable, setPasswordCallable } from "./functions";
import { ensureAnonymousAuth } from "./firebase";

/**
 * Funçao para gerar a senha inicial padrão:
 * [Primeiro Nome]123 ou [CPF]123 (ex: John123 ou 12345678900123)
 */
export function getDefaultInitialPassword(name?: string, cpf?: string): string {
  const firstName = (name || '').trim().split(' ')[0];
  if (firstName && firstName.length > 0) {
    const formatted = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    return `${formatted}123`;
  }
  const cleanCpf = (cpf || '').replace(/\D/g, '');
  if (cleanCpf.length > 0) {
    return `${cleanCpf}123`;
  }
  return '123';
}

/**
 * Funçao para gerar hash SHA-256 no navegador usando crypto.subtle.
 * Mesmo algoritmo usado pela Cloud Function `login` (functions/index.js,
 * sha256Hex) para validar a senha no servidor — mantidos idênticos de
 * propósito. Ainda usado pelas telas de gestão (AdminUsersModal,
 * EmployeeManager) para gerar o hash ao criar/editar uma conta; a
 * VERIFICAÇÃO de senha no login não usa mais isto (é 100% servidor).
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn("Navegador sem suporte a crypto.subtle, mantendo texto/hash:", e);
  }
  return password;
}

/**
 * PASSO 3 — LOGIN
 *
 * HISTÓRICO: até aqui, esta função lia a coleção `users` inteira do
 * Firestore no navegador e comparava a senha em JavaScript — o que
 * exigia que `users` fosse legível por qualquer sessão autenticada
 * (inclusive a sessão anônima criada automaticamente pra todo
 * visitante), e ainda tinha um atalho fixo no código pra "admin"/"admin"
 * sempre entrar, não importa o que estivesse salvo no banco. Ambos eram
 * falhas de segurança reais — ver o comentário grande em
 * functions/index.js. Agora a validação inteira acontece na Cloud
 * Function `login` (Admin SDK, servidor); esta função só chama ela e
 * traduz o resultado/erro pro formato que a tela de login já espera.
 */
export async function fazerLogin(username: string, passwordInput: string) {
  try {
    const cleanUsername = username.trim();
    const cleanPassword = passwordInput.trim();

    // A Cloud Function `login` exige uma sessão do Firebase Auth já
    // aberta (mesmo anônima) pra saber a quem vincular auth_links depois
    // de validar a senha. Normalmente essa sessão-ponte já existe (o app
    // cria uma no carregamento da página), mas garantimos aqui também
    // para não depender de timing entre telas.
    await ensureAnonymousAuth();

    const result = await loginCallable({ username: cleanUsername, password: cleanPassword });
    return result.data as {
      success: boolean;
      userId: string;
      userData: UserAccount;
      precisaTrocarSenha: boolean;
    };
  } catch (error: any) {
    console.error("❌ Erro no login:", error);
    // error.message já vem em português (ver HttpsError na Cloud Function).
    throw new Error(error?.message || "Falha ao efetuar login. Verifique sua conexão e tente novamente.");
  }
}

/**
 * PASSO 4 — TROCAR A PRÓPRIA SENHA (primeiro acesso / troca voluntária)
 */
export async function trocarSenha(userId: string, novaSenha: string) {
  try {
    const result = await setPasswordCallable({ targetUserId: userId, newPassword: novaSenha });
    const data = result.data as { success: boolean; userId: string; lastPasswordChange: string };
    return {
      success: true,
      userId,
      newPassword: novaSenha,
      lastPasswordChange: data.lastPasswordChange
    };
  } catch (error: any) {
    console.error("❌ Erro ao trocar senha:", error);
    throw new Error(error?.message || "Falha ao alterar a senha. Tente novamente.");
  }
}

/**
 * PASSO 5 — RESETAR SENHA PARA O PADRÃO [PrimeiroNome]123 / [CPF]123
 * (ação de admin/gestor sobre a conta de outra pessoa)
 */
export async function resetarSenha(userId: string, name?: string, cpf?: string) {
  try {
    const senhaPadrao = getDefaultInitialPassword(name, cpf);
    await setPasswordCallable({ targetUserId: userId, newPassword: senhaPadrao });
    return {
      success: true,
      userId,
      senhaPadrao
    };
  } catch (error: any) {
    console.error("❌ Erro ao resetar senha:", error);
    throw new Error(error?.message || "Falha ao resetar a senha. Tente novamente.");
  }
}
