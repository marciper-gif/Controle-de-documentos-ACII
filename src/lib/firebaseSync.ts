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
import { SectorData, Employee, ATR, POP, IT, UserAccount, ProfilePermissions, GuardedDocument, DocumentTypesSettings } from '../types';
import { getCurrentCompanyId, DEFAULT_COMPANY_ID } from './tenant';

// Initial Data imports for seeding
import { initialSectors } from '../data/sectors';
import { initialATRs } from '../data/atrs';
import { initialPOPs } from '../data/pops';
import { initialITs } from '../data/its';

import { hashPassword } from './userManagement';

// ─────────────────────────────────────────────────────────────────────
// seedDatabaseIfEmpty é chamada de DOIS lugares em App.tsx (logo após o
// login via Google, e de novo num useEffect separado que reage a
// authReady/companyId) — as duas podem disparar quase juntas depois de
// um login. Sem trava nenhuma, um "verifica se está vazio, se estiver,
// cria os padrões" clássico vira condição de corrida: as duas chamadas
// leem `sectorsSnap.empty`/`popsSnap.empty` (etc.) ANTES de qualquer uma
// ter terminado de escrever, então as duas veem "vazio" e as duas
// semeiam — encontrado na prática numa empresa de teste, com POP/ATR/IT
// duplicados (um jogo de documentos, dois seeds concorrentes). Este mapa
// garante que só existe UMA execução de verdade por empresa por vez:
// uma segunda chamada, enquanto a primeira ainda está rodando, recebe a
// MESMA promise em vez de começar tudo de novo.
// ─────────────────────────────────────────────────────────────────────
const seedingInFlight = new Map<string, Promise<void>>();

export function seedDatabaseIfEmpty(): Promise<void> {
  const companyId = getCurrentCompanyId();
  const existing = seedingInFlight.get(companyId);
  if (existing) return existing;

  const promise = seedDatabaseIfEmptyForCompany(companyId).finally(() => {
    seedingInFlight.delete(companyId);
  });
  seedingInFlight.set(companyId, promise);
  return promise;
}

/**
 * Seeds the database if the collections are empty — SÓ para a ACII
 * (DEFAULT_COMPANY_ID; ver guarda logo no início da função). Nenhuma
 * outra empresa é semeada — decisão revista depois de publicado: uma
 * empresa nova nasce vazia, sem herdar o catálogo de exemplo da ACII
 * nem usuários padrão extras (ver o comentário grande dentro da função).
 * Nunca relê getCurrentCompanyId() no meio da execução, pra não misturar
 * um companyId com outro se a sessão trocar de empresa enquanto uma seed
 * anterior ainda está em voo.
 */
async function seedDatabaseIfEmptyForCompany(companyId: string): Promise<void> {
  try {
    // ─────────────────────────────────────────────────────────────────
    // Decisão de produto (revista depois de publicado): empresa nova
    // nasce VAZIA — sem cópia do catálogo de exemplo da ACII (setores,
    // POPs, ATRs, ITs) nem usuários padrão extras. Antes desta correção,
    // TODA empresa criada pelo onboarding (exports.createCompany) recebia
    // automaticamente os mesmos setores/documentos internos da ACII, só
    // com o ID sufixado — fazia sentido quando só existia a ACII (era só
    // dado de exemplo pra popular um sistema vazio), mas não faz mais
    // sentido pra um cliente pagante novo: ele deve montar os próprios
    // setores e documentos do zero, não herdar o catálogo de outra
    // empresa. A seed de usuários padrão (admin/Colaborador123, senha
    // conhecida) também era redundante e um risco: createCompany já cria
    // o admin de verdade da empresa nova com a senha escolhida por quem
    // cadastrou — não deveria existir NENHUMA conta extra com senha
    // hard-coded pra um cliente real.
    //
    // A ACII continua sendo semeada normalmente (é o próprio tenant de
    // origem desses dados de exemplo — nada muda pra ela).
    // ─────────────────────────────────────────────────────────────────
    if (companyId !== DEFAULT_COMPANY_ID) return;

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

// --- CONFIGURAÇÃO DE TIPOS DE DOCUMENTO (Fase 2 — por empresa) ---
// Grava só o campo documentTypes dentro de companies/{companyId} (merge:
// true em salvarDocumento não toca em name/status/logoUrl/etc. já
// existentes no documento da empresa).
export async function dbSaveCompanyDocumentTypes(documentTypes: DocumentTypesSettings, currentUser?: any) {
  const companyId = getCurrentCompanyId();
  return await salvarDocumento('companies', { id: companyId, documentTypes }, companyId, currentUser);
}

// --- IDENTIDADE VISUAL (Fase 4 — logo e cor principal por empresa) ---
export async function dbSaveCompanyBranding(
  branding: { name?: string; logoUrl?: string; primaryColor?: string },
  currentUser?: any
) {
  const companyId = getCurrentCompanyId();
  return await salvarDocumento('companies', { id: companyId, ...branding }, companyId, currentUser);
}

// --- GUARDED DOCUMENTS CRUD (Módulo de Guarda de Documentos) ---
export async function dbSaveGuardedDocument(doc: GuardedDocument, currentUser?: any) {
  return await salvarDocumento('guarded_documents', withCompanyId(doc), doc.id, currentUser);
}

export async function dbDeleteGuardedDocument(id: string, currentUser?: any) {
  return await deletarDocumento('guarded_documents', id);
}
