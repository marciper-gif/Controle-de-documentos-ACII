export type Sector = string;

export interface SectorData {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface Employee {
  id: string;
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
  username: string;
  name: string;
  password?: string;
  role: 'admin' | 'gestor' | 'colaborador' | 'lider';
  employeeId?: string;
}

export interface ProfilePermissionItem {
  canSeeAllDocs: boolean;
  canSeeEmployees: boolean;
  canSeeSectors: boolean;
  canEditEmployees: boolean;
  canEditDocs: boolean;
}

export interface ProfilePermissions {
  colaborador: ProfilePermissionItem;
  gestor: ProfilePermissionItem;
  lider?: ProfilePermissionItem;
}
