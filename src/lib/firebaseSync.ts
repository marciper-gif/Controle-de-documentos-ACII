import {
  collection,
  doc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { salvarDocumento, deletarDocumento } from '../config/firebase';
import { logSystemEvent } from '../utils/logger';
import { SectorData, Employee, ATR, POP, IT, UserAccount, ProfilePermissions, GuardedDocument } from '../types';

// Initial Data imports for seeding
import { initialSectors } from '../data/sectors';
import { initialATRs } from '../data/atrs';
import { initialPOPs } from '../data/pops';
import { initialITs } from '../data/its';

import { hashPassword } from './userManagement';

/**
 * Seeds the database if the collections are empty.
 * Ensures the first-time Firebase user has the default ACII workspace.
 */
export async function seedDatabaseIfEmpty() {
  try {
    // Check if sectors are empty or missing any default sector
    const sectorsSnap = await getDocs(collection(db, 'sectors'));
    if (sectorsSnap.empty) {
      console.log('Seeding sectors...');
      for (const sector of initialSectors) {
        await salvarDocumento('sectors', sector, sector.id);
      }
    } else {
      const existingDocIds = new Set(sectorsSnap.docs.map(d => d.id));
      for (const sector of initialSectors) {
        if (!existingDocIds.has(sector.id)) {
          await salvarDocumento('sectors', sector, sector.id);
        }
      }
    }

    // Employees collection is populated solely by user creation in the system

    // Check if ATRs are missing any default ATR
    const atrsSnap = await getDocs(collection(db, 'atrs'));
    const existingAtrIds = new Set(atrsSnap.docs.map(d => d.id));
    for (const atr of initialATRs) {
      if (!existingAtrIds.has(atr.id)) {
        await salvarDocumento('atrs', atr, atr.id);
      }
    }

    // Check if POPs are missing any default POP
    const popsSnap = await getDocs(collection(db, 'pops'));
    const existingPopIds = new Set(popsSnap.docs.map(d => d.id));
    for (const pop of initialPOPs) {
      if (!existingPopIds.has(pop.id)) {
        await salvarDocumento('pops', pop, pop.id);
      }
    }

    // Check if ITs are missing any default IT
    const itsSnap = await getDocs(collection(db, 'its'));
    const existingItIds = new Set(itsSnap.docs.map(d => d.id));
    for (const it of initialITs) {
      if (!existingItIds.has(it.id)) {
        await salvarDocumento('its', it, it.id);
      }
    }

    // Check if users are empty
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      console.log('Seeding default users...');
      // Nunca gravar o campo `password` em texto puro — só o hash (ver
      // comentário grande em functions/index.js sobre por que isso
      // importa). Estas são só as credenciais INICIAIS de instalação;
      // o admin deve trocar a senha no primeiro acesso.
      const adminHash = await hashPassword('admin');
      const collabHash = await hashPassword('Colaborador123');
      const defaultUsers: UserAccount[] = [
        { id: '1', username: 'admin', name: 'Administrador Geral', passwordHash: adminHash, role: 'admin', status: 'Ativo', primeiro_acesso: false, firstAccess: false },
        { id: '2', username: 'colaborador', name: 'Colaborador Padrão', passwordHash: collabHash, role: 'colaborador', status: 'Ativo', primeiro_acesso: true, firstAccess: true }
      ];
      for (const user of defaultUsers) {
        await salvarDocumento('users', user, user.id);
      }
    }
  } catch (error) {
    console.error('Error seeding initial data: ', error);
  }
}

// --- SECORS CRUD ---
export async function dbSaveSector(sector: SectorData, currentUser?: any) {
  return await salvarDocumento('sectors', sector, sector.id, currentUser);
}

export async function dbDeleteSector(id: string, currentUser?: any) {
  return await deletarDocumento('sectors', id);
}

// --- EMPLOYEES CRUD ---
export async function dbSaveEmployee(employee: Employee, currentUser?: any) {
  return await salvarDocumento('employees', employee, employee.id, currentUser);
}

export async function dbDeleteEmployee(id: string, currentUser?: any) {
  return await deletarDocumento('employees', id);
}

// --- ATR CRUD ---
export async function dbSaveATR(atr: ATR, currentUser?: any) {
  return await salvarDocumento('atrs', atr, atr.id, currentUser);
}

export async function dbDeleteATR(id: string, currentUser?: any) {
  return await deletarDocumento('atrs', id);
}

// --- POP CRUD ---
export async function dbSavePOP(pop: POP, currentUser?: any) {
  return await salvarDocumento('pops', pop, pop.id, currentUser);
}

export async function dbDeletePOP(id: string, currentUser?: any) {
  return await deletarDocumento('pops', id);
}

// --- IT CRUD ---
export async function dbSaveIT(it: IT, currentUser?: any) {
  return await salvarDocumento('its', it, it.id, currentUser);
}

export async function dbDeleteIT(id: string, currentUser?: any) {
  return await deletarDocumento('its', id);
}

// --- USERS CRUD ---
export async function dbSaveUserAccount(user: UserAccount, currentUser?: any) {
  return await salvarDocumento('users', user, user.id, currentUser);
}

export async function dbDeleteUserAccount(id: string, currentUser?: any) {
  return await deletarDocumento('users', id);
}

// --- PERMISSIONS CRUD ---
export async function dbSavePermissions(perms: ProfilePermissions, currentUser?: any) {
  return await salvarDocumento('permissions', perms, 'default', currentUser);
}

// --- GUARDED DOCUMENTS CRUD (Módulo de Guarda de Documentos) ---
export async function dbSaveGuardedDocument(doc: GuardedDocument, currentUser?: any) {
  return await salvarDocumento('guarded_documents', doc, doc.id, currentUser);
}

export async function dbDeleteGuardedDocument(id: string, currentUser?: any) {
  return await deletarDocumento('guarded_documents', id);
}
