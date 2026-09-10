import {
  collection,
  doc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { salvarDocumento, deletarDocumento } from '../config/firebase';
import { logSystemEvent } from '../utils/logger';
import { SectorData, Employee, ATR, POP, IT, UserAccount, ProfilePermissions, GuardedDocument, DocumentTypeSettings } from '../types';

import { syncLoginIndex } from './userManagement';

// NOTA: cadastrar uma empresa (tenant) nova NÃO pode ser feito por aqui —
// firestore.rules fecha `companies` para escrita via cliente de propósito
// (allow write: if false), então nem um admin logado no app consegue criar
// uma empresa pelo SDK cliente. Isso é intencional: hoje o cadastro é
// feito por mim, fora do app, via script com o Admin SDK (que ignora as
// regras) — ver functions/create-company.js, seguindo o mesmo padrão do
// script de manutenção já existente (functions/backfill-title-lower.js).
// A Fase 3 decide se isso vira uma tela dentro do produto.

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
// Mantém login_index (src/lib/userManagement.ts) em sincronia sempre que
// uma conta é criada/editada por aqui (AdminUsersModal, EmployeeManager)
// — é esse espelho, não mais a coleção `users` inteira, que o login
// consulta antes de existir um vínculo de empresa (ver firestore.rules).
export async function dbSaveUserAccount(user: UserAccount, currentUser?: any) {
  const res = await salvarDocumento('users', user, user.id, currentUser);
  try {
    if (user.companyId && user.username && user.passwordHash) {
      await syncLoginIndex(
        user.companyId,
        user.id,
        user.username,
        user.passwordHash,
        (user.accountStatus || user.status || 'ativo').toLowerCase()
      );
    }
  } catch (e) {
    console.warn('Falha ao sincronizar login_index:', e);
  }
  return res;
}

export async function dbDeleteUserAccount(id: string, currentUser?: any) {
  return await deletarDocumento('users', id);
}

// --- PERMISSIONS CRUD ---
// Um documento por empresa (ID = companyId) — ver firestore.rules,
// match /permissions/{permCompanyId}.
export async function dbSavePermissions(companyId: string, perms: ProfilePermissions, currentUser?: any) {
  return await salvarDocumento('permissions', perms, companyId, currentUser);
}

// --- TIPOS DE DOCUMENTO (Fase 2) ---
// Um documento por empresa (ID = companyId) — ver firestore.rules,
// match /document_type_settings/{dtCompanyId}.
export async function dbSaveDocumentTypeSettings(companyId: string, settings: DocumentTypeSettings, currentUser?: any) {
  return await salvarDocumento('document_type_settings', settings, companyId, currentUser);
}

// --- GUARDED DOCUMENTS CRUD (Módulo de Guarda de Documentos) ---
export async function dbSaveGuardedDocument(doc: GuardedDocument, currentUser?: any) {
  return await salvarDocumento('guarded_documents', doc, doc.id, currentUser);
}

export async function dbDeleteGuardedDocument(id: string, currentUser?: any) {
  return await deletarDocumento('guarded_documents', id);
}
