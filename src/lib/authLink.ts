import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
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
 * Grava (ou atualiza) o vínculo entre a sessão atual do Firebase Auth
 * (`firebaseUid` — anônima para login por CPF/senha, ou real para Google)
 * e o usuário/papel/setor do app. É esse documento que as Firestore Rules
 * consultam (`auth_links/{request.auth.uid}`) para decidir o que a sessão
 * pode ler ou gravar — já que o app não usa Firebase Auth "de verdade"
 * para o login principal.
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
  } catch (e) {
    // Não bloqueia o login do usuário por causa disso — só registra o aviso.
    // Sem o vínculo, as regras tratam a sessão como sem papel/setor (leitura
    // restrita), então o pior caso é acesso reduzido, não acesso indevido.
    console.warn('Falha ao vincular sessão de autenticação ao usuário:', e);
  }
}
