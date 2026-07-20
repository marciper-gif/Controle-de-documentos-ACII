import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
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
      const batch = writeBatch(db);
      initialSectors.forEach((sector) => {
        const docRef = doc(db, 'sectors', sector.id);
        batch.set(docRef, sector);
      });
      await batch.commit();
    }

    // Check if employees are empty
    const employeesSnap = await getDocs(collection(db, 'employees'));
    if (employeesSnap.empty) {
      console.log('Seeding employees...');
      const batch = writeBatch(db);
      initialEmployees.forEach((emp) => {
        const docRef = doc(db, 'employees', emp.id);
        batch.set(docRef, emp);
      });
      await batch.commit();
    }

    // Check if ATRs are empty
    const atrsSnap = await getDocs(collection(db, 'atrs'));
    if (atrsSnap.empty) {
      console.log('Seeding ATRs...');
      const batch = writeBatch(db);
      initialATRs.forEach((atr) => {
        const docRef = doc(db, 'atrs', atr.id);
        batch.set(docRef, atr);
      });
      await batch.commit();
    }

    // Check if POPs are empty
    const popsSnap = await getDocs(collection(db, 'pops'));
    if (popsSnap.empty) {
      console.log('Seeding POPs...');
      const batch = writeBatch(db);
      initialPOPs.forEach((pop) => {
        const docRef = doc(db, 'pops', pop.id);
        batch.set(docRef, pop);
      });
      await batch.commit();
    }

    // Check if ITs are empty
    const itsSnap = await getDocs(collection(db, 'its'));
    if (itsSnap.empty) {
      console.log('Seeding ITs...');
      const batch = writeBatch(db);
      initialITs.forEach((it) => {
        const docRef = doc(db, 'its', it.id);
        batch.set(docRef, it);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error seeding initial data: ', error);
  }
}

// --- SECORS CRUD ---
export async function dbSaveSector(sector: SectorData) {
  const path = `sectors/${sector.id}`;
  try {
    await setDoc(doc(db, 'sectors', sector.id), sector);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteSector(id: string) {
  const path = `sectors/${id}`;
  try {
    await deleteDoc(doc(db, 'sectors', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- EMPLOYEES CRUD ---
export async function dbSaveEmployee(employee: Employee) {
  const path = `employees/${employee.id}`;
  try {
    await setDoc(doc(db, 'employees', employee.id), employee);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteEmployee(id: string) {
  const path = `employees/${id}`;
  try {
    await deleteDoc(doc(db, 'employees', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- ATR CRUD ---
export async function dbSaveATR(atr: ATR) {
  const path = `atrs/${atr.id}`;
  try {
    await setDoc(doc(db, 'atrs', atr.id), atr);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteATR(id: string) {
  const path = `atrs/${id}`;
  try {
    await deleteDoc(doc(db, 'atrs', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- POP CRUD ---
export async function dbSavePOP(pop: POP) {
  const path = `pops/${pop.id}`;
  try {
    await setDoc(doc(db, 'pops', pop.id), pop);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeletePOP(id: string) {
  const path = `pops/${id}`;
  try {
    await deleteDoc(doc(db, 'pops', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- IT CRUD ---
export async function dbSaveIT(it: IT) {
  const path = `its/${it.id}`;
  try {
    await setDoc(doc(db, 'its', it.id), it);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteIT(id: string) {
  const path = `its/${id}`;
  try {
    await deleteDoc(doc(db, 'its', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- USERS CRUD ---
export async function dbSaveUserAccount(user: UserAccount) {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteUserAccount(id: string) {
  const path = `users/${id}`;
  try {
    await deleteDoc(doc(db, 'users', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- PERMISSIONS CRUD ---
export async function dbSavePermissions(perms: ProfilePermissions) {
  const path = 'permissions/default';
  try {
    await setDoc(doc(db, 'permissions', 'default'), perms);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
