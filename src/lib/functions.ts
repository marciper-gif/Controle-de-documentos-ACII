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
