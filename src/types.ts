export type Sector = string;

// ─────────────────────────────────────────────────────────────────────
// Multiempresa (Fase 1 da transformação em SaaS)
// ─────────────────────────────────────────────────────────────────────
// `companyId` identifica a empresa (tenant) dona de cada registro — ver
// src/lib/tenant.ts (contexto da empresa da sessão atual) e
// firestore.rules (isolamento entre empresas). A ACII é o primeiro
// tenant, com companyId === DEFAULT_COMPANY_ID (ver tenant.ts).
//
// Opcional nos tipos abaixo (exceto GuardedDocument, onde é sempre
// preenchido explicitamente na criação) de propósito: os dados de exemplo
// (src/data/*.ts) e os objetos montados a partir de formulários em
// App.tsx/EmployeeManager.tsx/SectorManager.tsx não sabem a própria
// empresa — quem grava sempre sabe (src/lib/firebaseSync.ts, função
// withCompanyId, carimba a empresa da sessão atual antes de qualquer
// escrita real no Firestore). Ausente aqui NUNCA significa "sem
// isolamento" — as Firestore Rules exigem o campo de verdade no banco.
export type CompanyId = string;

export interface Company {
  id: CompanyId;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  status?: 'ativo' | 'inativo';
  createdAt?: string; // ISO
}

export interface SectorData {
  id: string;
  companyId?: CompanyId;
  name: string;
  description?: string;
  color?: string;
}

export interface Employee {
  id: string;
  companyId?: CompanyId;
  name: string;
  email: string;
  phone: string;
  sector: string;
  role: string; // Cargo
  admissionDate: string;
  status: 'Ativo' | 'Inativo';
  associatedPOPs: string[]; // POP IDs
  associatedATRs: string[]; // ATR IDs
  associatedITs?: string[]; // IT IDs
  cpf?: string;
  registrationNumber?: string; // Matricula
  notes?: string;
}

export interface RevisionHistoryEntry {
  revision: string; // e.g. "00", "01", "02"
  date: string;     // e.g. "30/06/2026"
  description: string; // o que foi mudado
  author: string;   // quem alterou (ex: Administrador)
}

export interface ATR {
  id: string; // e.g. "Atr-001"
  companyId?: CompanyId;
  title: string; // e.g. "Gerente Executiva"
  sector: Sector;
  directLeader: string;
  indirectLeader?: string;
  summary: string;
  detailedTasks: string[];
  requirements: {
    education: string;
    technicalCompetencies: string[];
    experience: string;
    skills: string[];
    attitudes: string[];
  };
  notes?: string;
  emissionDate: string;
  revision: string;
  revisionDate?: string;
  revisionHistory?: RevisionHistoryEntry[];
}

export interface POPStep {
  title: string;
  description: string;
  substeps?: string[];
}

export interface POP {
  id: string; // e.g. "POP-001"
  companyId?: CompanyId;
  title: string; // e.g. "Participação em Eventos e Reuniões de Patrocínio"
  process: string; // e.g. "ADMINISTRATIVO"
  sector: Sector;
  emissionDate: string;
  revision: string;
  revisionDate?: string;
  revisionHistory?: RevisionHistoryEntry[];
  pages: string;
  objective: string;
  applicationField: string[];
  responsiblePrimary: string;
  responsibleSupport: string[];
  inputs: string[];
  steps: POPStep[];
  outputs: string[];
  performanceIndicators: string[];
}

export interface IT {
  id: string; // e.g. "IT-001"
  companyId?: CompanyId;
  title: string;
  sector: Sector;
  objective: string;
  responsible: string;
  steps: string[];
  emissionDate: string;
  revision: string;
  revisionDate?: string;
  revisionHistory?: RevisionHistoryEntry[];
}

export interface UserAccount {
  id: string;
  companyId?: CompanyId; // opcional só pra não quebrar contas antigas ainda não migradas (ver migrate-add-company-id.js) — tratado como DEFAULT_COMPANY_ID onde lido
  username: string;
  name: string;
  password?: string;
  passwordHash?: string;
  role: 'admin' | 'gestor' | 'colaborador' | 'lider';
  employeeId?: string;
  status?: 'Ativo' | 'Inativo' | 'ativo' | 'inativo' | 'bloqueado';
  accountStatus?: 'ativo' | 'inativo' | 'bloqueado' | 'Ativo' | 'Inativo';
  primeiro_acesso?: boolean;
  firstAccess?: boolean;
  lastPasswordChange?: string;
}

export interface ProfilePermissionItem {
  canSeeAllDocs: boolean;
  canSeeEmployees: boolean;
  canSeeSectors: boolean;
  canEditEmployees: boolean;
  canEditDocs: boolean;
  // Módulo de guarda de documentos (item 6 da especificação). Opcionais
  // para não quebrar permissões já salvas no Firestore/localStorage
  // antes desta extensão — ausentes é tratado como false onde são lidos.
  canUploadDocuments?: boolean;    // enviar documento / nova versão
  canManageRetention?: boolean;    // renovar guarda vencendo/vencida
  canDeleteDocuments?: boolean;    // reservado para exclusão física futura — hoje só admin, sem UI própria
}

export interface ProfilePermissions {
  colaborador: ProfilePermissionItem;
  gestor: ProfilePermissionItem;
  lider?: ProfilePermissionItem;
}

// ─────────────────────────────────────────────────────────────────────
// Módulo de Guarda de Documentos
// ─────────────────────────────────────────────────────────────────────

export interface DocumentAuditEntry {
  action: 'upload' | 'view' | 'download' | 'update_metadata' | 'renew_retention' | 'mark_for_disposal' | 'delete';
  user: string; // nome do usuário
  date: string; // ISO
  notes?: string;
}

export interface DocumentVersion {
  version: number;
  fileUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string; // ISO
}

export interface GuardedDocument {
  id: string;
  companyId: CompanyId;
  title: string;
  titleLower?: string;     // title em minúsculas, sem acento simples — usado só para busca
                            // por prefixo no Firestore (where >= / <), que é case-sensitive.
                            // Opcional: documentos criados antes desse campo existir continuam
                            // funcionando normalmente (só não aparecem em resultado de busca
                            // por título até serem editados/reenviados uma vez).
  sectorId: string;        // referencia SectorData.id
  sectorName: string;      // desnormalizado para exibição rápida
  documentType: string;    // ex: "Contrato", "Nota Fiscal", "Ata de Reunião", "Política Interna", "Ficha de Funcionário"
  description?: string;

  // Arquivo atual (última versão)
  fileName: string;
  fileUrl: string;
  storagePath: string;
  fileSize: number;
  fileType: string; // mime type

  uploadedBy: string;
  uploadedByEmployeeId?: string;
  uploadedAt: string; // ISO

  // Guarda / temporalidade
  retentionYears: number;       // tempo de guarda em anos
  retentionUntil: string;       // ISO, calculado = uploadedAt + retentionYears
  status: 'ativo' | 'vencendo' | 'vencido' | 'eliminado';

  // Acesso
  extraViewerSectorIds?: string[]; // setores extras com permissão de ver, além do sectorId

  // Versionamento
  version: number;
  previousVersions?: DocumentVersion[];

  // Auditoria
  auditLog: DocumentAuditEntry[];
}
