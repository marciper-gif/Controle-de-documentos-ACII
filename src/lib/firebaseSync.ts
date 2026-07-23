import {
  collection,
  doc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { salvarDocumento, deletarDocumento } from '../config/firebase';
import { logSystemEvent } from '../utils/logger';
import { SectorData, Employee, ATR, POP, IT, UserAccount, ProfilePermissions } from '../types';

// Initial Data imports for seeding
import { initialSectors } from '../data/sectors';
import { initialEmployees } from '../data/employees';
import { initialATRs } from '../data/atrs';
import { initialPOPs } from '../data/pops';
import { initialITs } from '../data/its';

/**
 * Seeds the database if the collections are empty.
 * Ensures the first-time Firebase user has the default ACII workspace.
 */
export async function seedDatabaseIfEmpty() {
  try {
    // Check if sectors are empty
    const sectorsSnap = await getDocs(collection(db, 'sectors'));
    if (sectorsSnap.empty) {
      console.log('Seeding sectors...');
      for (const sector of initialSectors) {
        await salvarDocumento('sectors', sector, sector.id);
      }
    }

    // Check if employees are empty
    const employeesSnap = await getDocs(collection(db, 'employees'));
    if (employeesSnap.empty) {
      console.log('Seeding employees...');
      for (const emp of initialEmployees) {
        await salvarDocumento('employees', emp, emp.id);
      }
    }

    // Check if ATRs are empty
    const atrsSnap = await getDocs(collection(db, 'atrs'));
    if (atrsSnap.empty) {
      console.log('Seeding ATRs...');
      for (const atr of initialATRs) {
        await salvarDocumento('atrs', atr, atr.id);
      }
    }

    // Check if POPs are empty
    const popsSnap = await getDocs(collection(db, 'pops'));
    if (popsSnap.empty) {
      console.log('Seeding POPs...');
      for (const pop of initialPOPs) {
        await salvarDocumento('pops', pop, pop.id);
      }
    }

    // Check if ITs are empty
    const itsSnap = await getDocs(collection(db, 'its'));
    if (itsSnap.empty) {
      console.log('Seeding ITs...');
      for (const it of initialITs) {
        await salvarDocumento('its', it, it.id);
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
