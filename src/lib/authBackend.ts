import { signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';
import type { Employee, SectorData, UserAccount } from '../types';

/**
 * Resolve o SectorData.id do setor do usuário a partir do funcionário
 * vinculado. Employee.sector guarda hoje o *nome* do setor (ex: "RH"),
 * não o SectorData.id (ex: "SEC-002") — usado pelo módulo de guarda de
 * documentos — então fazemos a ponte aqui, comparando por nome (e, por
 * segurança, também por id, caso algum dado já esteja salvo com o id).
 * Usada também pela function /api/login.ts (versão espelhada em Node).
 */
export function resolveUserSectorId(
  user: Pick<UserAccount, 'employeeId'>,
  employees: Employee[],
  sectors: SectorData[]
): string | null {
  if (!user.employeeId) return null;
  const employee = employees.find(e => e.id === user.employeeId);
  if (!employee || !employee.sector) return null;

  const sector = sectors.find(
    s => s.name === employee.sector || s.id === employee.sector
  );
  return sector?.id || null;
}

/**
 * Troca CPF/senha por uma sessão REAL do Firebase Auth. A senha é
 * reconferida no servidor (função /api/login.ts, com Firebase Admin SDK)
 * — não confiamos só na validação client-side de fazerLogin() para isso.
 * O token já vem com claims (role, sectorId) embutidas, então as
 * Firestore/Storage Rules leem direto de request.auth.token, sem
 * precisar de nenhuma coleção auxiliar.
 */
export async function loginBackend(username: string, password: string): Promise<void> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Falha ao autenticar sessão segura.');
  }

  const { token } = await res.json();
  await signInWithCustomToken(auth, token);
}

/**
 * Login por Google já dá uma sessão real do Firebase Auth, mas sem as
 * claims de role/sectorId (essas só existem no token depois que o
 * Admin SDK as define). Este endpoint define as claims no usuário, e
 * então forçamos um refresh do token no cliente para elas passarem a
 * valer nas regras.
 */
export async function syncGoogleClaims(role: string, sectorId: string | null): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const idToken = await user.getIdToken();
  const res = await fetch('/api/set-claims', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, role, sectorId })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.warn('Falha ao sincronizar papel/setor da sessão Google:', body.error);
    return;
  }

  // Força buscar um token novo, já com as claims atualizadas.
  await user.getIdToken(true);
}
