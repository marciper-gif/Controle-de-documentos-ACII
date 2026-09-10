export type Sector = string;

// ─────────────────────────────────────────────────────────────────────
// Multiempresa (SaaS)
// ─────────────────────────────────────────────────────────────────────
// Todo documento de dado "de negócio" (setor, ATR, POP, IT, funcionário,
// usuário, documento digitalizado) carrega um companyId — o "crachá" que
// diz a qual empresa ele pertence. As Firestore Rules recusam qualquer
// leitura/escrita onde esse campo não bata com a empresa da sessão atual
// (ver firestore.rules, função currentCompanyId()). Nenhum desses campos
// deve ser opcional a partir desta fase — documento sem companyId é
// documento que as regras não conseguem proteger.

export interface Company {
  id: string;          // slug curto, ex: "acii" — também usado no login
  name: string;         // nome de exibição, ex: "ACII"
  status: 'ativo' | 'inativo';
  logoUrl?: string;
  primaryColor?: string; // cor de marca da empresa (Fase 4)
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Fase 2 — tipos de documento configuráveis por empresa
// ─────────────────────────────────────────────────────────────────────
// ATR, POP, IT e "Digitalizado" continuam sendo o diferencial do
// produto e continuam guardados exatamente como antes (coleções
// próprias `atrs`/`pops`/`its`, e `guarded_documents` para os
// digitalizados) — isto NÃO muda a estrutura de dados nem as
// permissões (ProfilePermissions continua igual, por papel, não por
// tipo). O que fica configurável por empresa é só a CAMADA DE
// APRESENTAÇÃO de cada um desses 4 tipos: se aparece no menu
// (`enabled`) e com qual nome (`label`) — por exemplo, uma empresa que
// não usa Instruções de Trabalho pode desativá-las, e uma empresa que
// chama "ATR" de outro jeito internamente pode renomear só o rótulo,
// sem afetar em nada os dados já cadastrados.
export type DocumentTypeKey = 'atr' | 'pop' | 'it' | 'digitalizado';

export interface DocumentTypeSetting {
  enabled: boolean;
  label: string;
}

export type DocumentTypeSettings = Record<DocumentTypeKey, DocumentTypeSetting>;

export interface SectorData {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  color?: string;
}

export interface Employee {
  id: string;
  companyId: string;
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
  companyId: string;
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
  companyId: string;
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
  companyId: string;
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
  companyId: string;
  username: string;
  name: string;
  /** @deprecated Não gravar mais em texto puro — mantido só de leitura para contas antigas ainda não migradas. Ver Fase 6. */
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
  companyId: string;
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
