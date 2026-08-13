import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Employee, SectorData, UserAccount } from '../types';

/**
 * Resolve o SectorData.id do setor do usuário a partir do funcionário
 * vinculado. Employee.sector guarda hoje o *nome* do setor (ex: "RH"),
 * não o SectorData.id (ex: "SEC-002") — usado pelo módulo de guarda de
 * documentos — então fazemos a ponte aqui, comparando por nome (e, por
 * segurança, também por id, caso algum dado já esteja salvo com o id).
 */
export function resolveUserSectorId(
  user: UserAccount,
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
 * Espera os Custom Claims do Firebase Auth (role/sectorId) baterem com o
 * que acabamos de gravar em auth_links/{uid}, forçando refresh do ID
 * token a cada tentativa. Necessário porque quem grava os claims é a
 * Cloud Function syncAuthLinkClaims (functions/index.js), disparada de
 * forma assíncrona pelo próprio setDoc logo abaixo — sem esperar, o
 * Storage/Firestore ainda enxergariam o token antigo (sem claims, ou com
 * claims de uma sessão anterior) por alguns segundos.
 *
 * Não é garantido terminar rápido (a function pode demorar a disparar),
 * por isso tem timeout: na pior hipótese, o app segue com os claims que
 * tiver — e o retry automático do upload (uploadGuardedDocumentFile) cobre
 * esse caso residual.
 */
async function waitForClaimsSync(
  expectedRole: string,
  expectedSectorId: string | null,
  maxAttempts = 6,
  delayMs = 1500
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const result = await user.getIdTokenResult(true);
      const claimsMatch =
        result.claims.role === expectedRole && (result.claims.sectorId ?? null) === expectedSectorId;
      if (claimsMatch) return;
    } catch (e) {
      console.warn('Falha ao verificar custom claims após login:', e);
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  console.warn('Custom claims não sincronizaram a tempo — seguindo com o token disponível.');
}

/**
 * Grava (ou atualiza) o vínculo entre a sessão atual do Firebase Auth
 * (`firebaseUid` — anônima para login por CPF/senha, ou real para Google)
 * e o usuário/papel/setor do app, e então espera os Custom Claims (que a
 * Cloud Function syncAuthLinkClaims espelha a partir deste documento)
 * sincronizarem antes de retornar. As Firestore Rules leem este documento
 * diretamente (auth_links/{request.auth.uid}); as Storage Rules leem os
 * Custom Claims (request.auth.token.role/.sectorId) — ver storage.rules
 * para o porquê de não usar cross-service rules aqui.
 */
export async function linkFirebaseAuthToAppUser(
  firebaseUid: string,
  user: UserAccount,
  employees: Employee[],
  sectors: SectorData[]
): Promise<void> {
  try {
    const sectorId = resolveUserSectorId(user, employees, sectors);
    await setDoc(
      doc(db, 'auth_links', firebaseUid),
      {
        userId: user.id,
        role: user.role,
        sectorId,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    await waitForClaimsSync(user.role, sectorId);
  } catch (e) {
    // Não bloqueia o login do usuário por causa disso — só registra o aviso.
    // Sem o vínculo, as regras tratam a sessão como sem papel/setor (leitura
    // restrita), então o pior caso é acesso reduzido, não acesso indevido.
    console.warn('Falha ao vincular sessão de autenticação ao usuário:', e);
  }
}
