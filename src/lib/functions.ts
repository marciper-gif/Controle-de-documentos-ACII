import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

// Região precisa bater com a das Cloud Functions (functions/index.js) —
// 'us-central1', mesma região já usada por syncAuthLinkClaims.
export const functions = getFunctions(app, 'us-central1');

// Verifica usuário/senha no servidor (Admin SDK) e vincula a sessão atual
// via auth_links/{uid}. Ver comentário grande em functions/index.js sobre
// por que isso deixou de ser validado no navegador.
export const loginCallable = httpsCallable(functions, 'login');

// Chamado logo após "Entrar com o Google" ter sucesso — resolve o papel
// (admin/gestor/colaborador) no servidor e vincula auth_links/{uid}.
export const linkGoogleUserCallable = httpsCallable(functions, 'linkGoogleUser');

// Define uma nova senha (troca própria ou reset por admin/gestor) sem
// nunca gravar texto puro — só o hash.
export const setPasswordCallable = httpsCallable(functions, 'setPassword');

// Cadastra uma empresa nova (tenant) + sua primeira conta admin — Fase 3
// (onboarding). Só aceita quando quem chama está logado com o e-mail
// Google do dono da plataforma (ver RUNTIME_ADMIN_EMAIL em
// functions/index.js); qualquer outro chamador recebe permission-denied.
export const createCompanyCallable = httpsCallable(functions, 'createCompany');

// Reseta a senha do admin de qualquer empresa, mesmo sem o dono da
// plataforma ter uma conta lá — recuperação pra quando a senha inicial de
// uma empresa (ex.: empresa de teste) se perde e não há mais nenhuma
// forma de acessá-la. Mesma restrição de acesso de createCompany:
// permission-denied pra qualquer chamador que não seja RUNTIME_ADMIN_EMAIL.
export const platformResetPasswordCallable = httpsCallable(functions, 'platformResetPassword');

// "Esqueci minha senha" self-service — a conta precisa ter e-mail
// cadastrado (users/{id}.email, editável em Painel Admin → Usuários).
// Sem login/sessão nenhuma: é exatamente o cenário de "não consigo
// entrar". requestPassword manda o e-mail com o link; confirmPassword
// (chamado pela página /resetar-senha) efetiva a nova senha com o token
// daquele link.
export const requestPasswordResetCallable = httpsCallable(functions, 'requestPasswordReset');
export const confirmPasswordResetCallable = httpsCallable(functions, 'confirmPasswordReset');
