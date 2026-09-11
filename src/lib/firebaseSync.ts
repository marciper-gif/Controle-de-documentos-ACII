import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { salvarDocumento, deletarDocumento } from '../config/firebase';
import { logSystemEvent } from '../utils/logger';
import { SectorData, Employee, ATR, POP, IT, UserAccount, ProfilePermissions, GuardedDocument } from '../types';
import { getCurrentCompanyId } from './tenant';

// Initial Data imports for seeding
import { initialSectors } from '../data/sectors';
import { initialATRs } from '../data/atrs';
import { initialPOPs } from '../data/pops';
import { initialITs } from '../data/its';

import { hashPassword } from './userManagement';

/**
 * Seeds the database if the collections are empty — SÓ para o tenant da
 * empresa atual (getCurrentCompanyId(), ver src/lib/tenant.ts).
 *
 * LIMITAÇÃO CONHECIDA (documentando em vez de esconder): os IDs de seed
 * abaixo (SEC-001, Atr-001, POP-001, IT-001, users '1'/'2') continuam
 * sem prefixo de empresa, iguais a antes da Fase 1 — são os mesmos IDs
 * fixos usados em ~15 lugares do app (ex.: App.tsx decide o tipo de um
 * documento pelo prefixo do ID, `id.startsWith('POP-')`). Como hoje só a
 * ACII (DEFAULT_COMPANY_ID) roda de fato este caminho — a Fase 3 (onboarding)
 * ainda não existe, então nenhuma segunda empresa chega a ser seedada —
 * isso não colide na prática ainda. MAS: no dia em que a Fase 3 permitir
 * criar uma segunda empresa, seedar essa empresa com estes MESMOS IDs vai
 * colidir com os documentos da ACII na mesma coleção (Firestore exige ID
 * único por coleção, companyId sendo só um campo, não muda isso). Resolver
 * isso é pré-requisito da Fase 3, não desta fase — sinalizando aqui para
 * não esquecer.
 */
export async function seedDatabaseIfEmpty() {
  try {
    const companyId = getCurrentCompanyId();
    const scoped = (col: string) => query(collection(db, col), where('companyId', '==', companyId));

    // Check if sectors are empty or missing any default sector
    const sectorsSnap = await getDocs(scoped('sectors'));
    if (sectorsSnap.empty) {
      console.log(`Seeding sectors for company ${companyId}...`);
      for (const sector of initialSectors) {
        await salvarDocumento('sectors', { ...sector, companyId }, sector.id);
      }
    }

    // Employees collection is populated solely by user creation in the system

    // Check if ATRs are missing any default ATR
    const atrsSnap = await getDocs(scoped('atrs'));
    if (atrsSnap.empty) {
      for (const atr of initialATRs) {
        await salvarDocumento('atrs', { ...atr, companyId }, atr.id);
      }
    }

    // Check if POPs are missing any default POP
    const popsSnap = await getDocs(scoped('pops'));
    if (popsSnap.empty) {
      for (const pop of initialPOPs) {
        await salvarDocumento('pops', { ...pop, companyId }, pop.id);
      }
    }

    // Check if ITs are missing any default IT
    const itsSnap = await getDocs(scoped('its'));
    if (itsSnap.empty) {
      for (const it of initialITs) {
        await salvarDocumento('its', { ...it, companyId }, it.id);
      }
    }

    // Check if users are empty
    const usersSnap = await getDocs(scoped('users'));
    if (usersSnap.empty) {
      console.log(`Seeding default users for company ${companyId}...`);
      // Nunca gravar o campo `password` em texto puro — só o hash (ver
      // comentário grande em functions/index.js sobre por que isso
      // importa). Estas são só as credenciais INICIAIS de instalação;
      // o admin deve trocar a senha no primeiro acesso.
      const adminHash = await hashPassword('admin');
      const collabHash = await hashPassword('Colaborador123');
      const defaultUsers: UserAccount[] = [
        { id: '1', companyId, username: 'admin', name: 'Administrador Geral', passwordHash: adminHash, role: 'admin', status: 'Ativo', primeiro_acesso: false, firstAccess: false },
        { id: '2', companyId, username: 'colaborador', name: 'Colaborador Padrão', passwordHash: collabHash, role: 'colaborador', status: 'Ativo', primeiro_acesso: true, firstAccess: true }
      ];
      for (const user of defaultUsers) {
        await salvarDocumento('users', user, user.id);
      }
    }
  } catch (error) {
    console.error('Error seeding initial data: ', error);
  }
}

// Carimba companyId da sessão atual (src/lib/tenant.ts) em todo registro
// tenant-scoped antes de gravar — centralizado aqui, num único lugar fácil
// de auditar, em vez de espalhado pelos ~15 pontos do app que chamam
// dbSaveX. Isso é o que impede um bug em outro lugar do código de gravar
// um documento sem dono (ou com o companyId errado).
function withCompanyId<T extends { companyId?: string }>(data: T): T & { companyId: string } {
  return { ...data, companyId: data.companyId || getCurrentCompanyId() };
}

// --- SECORS CRUD ---
export async function dbSaveSector(sector: SectorData, currentUser?: any) {
  return await salvarDocumento('sectors', withCompanyId(sector), sector.id, currentUser);
}

export async function dbDeleteSector(id: string, currentUser?: any) {
  return await deletarDocumento('sectors', id);
}

// --- EMPLOYEES CRUD ---
export async function dbSaveEmployee(employee: Employee, currentUser?: any) {
  return await salvarDocumento('employees', withCompanyId(employee), employee.id, currentUser);
}

export async function dbDeleteEmployee(id: string, currentUser?: any) {
  return await deletarDocumento('employees', id);
}

// --- ATR CRUD ---
export async function dbSaveATR(atr: ATR, currentUser?: any) {
  return await salvarDocumento('atrs', withCompanyId(atr), atr.id, currentUser);
}

export async function dbDeleteATR(id: string, currentUser?: any) {
  return await deletarDocumento('atrs', id);
}

// --- POP CRUD ---
export async function dbSavePOP(pop: POP, currentUser?: any) {
  return await salvarDocumento('pops', withCompanyId(pop), pop.id, currentUser);
}

export async function dbDeletePOP(id: string, currentUser?: any) {
  return await deletarDocumento('pops', id);
}

// --- IT CRUD ---
export async function dbSaveIT(it: IT, currentUser?: any) {
  return await salvarDocumento('its', withCompanyId(it), it.id, currentUser);
}

export async function dbDeleteIT(id: string, currentUser?: any) {
  return await deletarDocumento('its', id);
}

// --- USERS CRUD ---
export async function dbSaveUserAccount(user: UserAccount, currentUser?: any) {
  return await salvarDocumento('users', withCompanyId(user), user.id, currentUser);
}

export async function dbDeleteUserAccount(id: string, currentUser?: any) {
  return await deletarDocumento('users', id);
}

// --- PERMISSIONS CRUD ---
// Um documento de permissões por empresa (era um único `permissions/default`
// global antes da Fase 1 — cada empresa configura os papéis do jeito dela).
export async function dbSavePermissions(perms: ProfilePermissions, currentUser?: any) {
  return await salvarDocumento('permissions', { ...perms, companyId: getCurrentCompanyId() }, getCurrentCompanyId(), currentUser);
}

// --- GUARDED DOCUMENTS CRUD (Módulo de Guarda de Documentos) ---
export async function dbSaveGuardedDocument(doc: GuardedDocument, currentUser?: any) {
  return await salvarDocumento('guarded_documents', withCompanyId(doc), doc.id, currentUser);
}

export async function dbDeleteGuardedDocument(id: string, currentUser?: any) {
  return await deletarDocumento('guarded_documents', id);
}
