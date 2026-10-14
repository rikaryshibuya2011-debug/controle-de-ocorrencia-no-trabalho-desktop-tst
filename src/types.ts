export type OccurrenceType =
  | 'desvio' // Desvios
  | 'incidente' // Incidentes
  | 'sem_afastamento' // Acidente sem Afastamento
  | 'com_afastamento' // Acidente com Afastamento
  | 'fatal' // Fatal
  | 'trajeto'; // Acidente de Trajeto

export type InvestigationStatus =
  | 'rascunho'
  | 'em_investigacao'
  | 'acoes_em_andamento'
  | 'concluido';

export type ActionStatus = 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado';

export type ActionCategory =
  | 'Engenharia / Eliminação'
  | 'Administrativa'
  | 'Treinamento'
  | 'EPI / Proteção'
  | 'Manutenção';

export interface ActionItem {
  id: string;
  what: string; // O que fazer? (Ação)
  how: string; // Como fazer? (Método)
  who: string; // Quem fará? (Responsável)
  deadline: string; // Até quando? (Prazo YYYY-MM-DD)
  status: ActionStatus;
  category?: ActionCategory;
  estimatedCost?: string;
  completedAt?: string;
  notes?: string;
}

export interface WorkerData {
  id: string;
  hasWorker: boolean;
  fullName: string;
  jobTitle: string;
  timeInRole: string; // ex: "1 ano e 6 meses"
  gender: 'M' | 'F' | 'Outro' | 'Não informado';
  age?: number;
  registrationNumber?: string; // Matrícula
  contractType?: 'CLT' | 'Terceiro' | 'Temporário' | 'Estagiário' | 'PJ';
  sector?: string; // Setor do colaborador (para indicadores)
  leader?: string; // Líder responsável pelo funcionário (para indicadores)
}

export interface OccurrenceDetails {
  detailedDescription: string;
  activityAtMoment: string;
  toolsUsed: string;
  sequenceOfEvents: string;
  hasWitnesses: boolean;
  witness1Name: string;
  witness1Contact?: string;
  witness2Name?: string;
  injuredBodyPart: string;
  injuryType: string;
  daysLostEstimated: number;
  daysLostActual: number;
  photos?: { id: string; url: string; caption: string; uploadedAt: string }[];
}

export interface CauseAnalysis {
  identifiedProblem: string;
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5_rootCause: string;
  causeCategory:
    | 'Condição Insegura'
    | 'Ato Inseguro / Desvio'
    | 'Falha de Processo'
    | 'Equipamento / Proteção'
    | 'Fator Humano / Treinamento'
    | 'Gestão e Procedimentos';
  summary?: string;
  ishikawa?: {
    method?: string;
    machine?: string;
    material?: string;
    manpower?: string;
    measurement?: string;
    milieu?: string;
  };
}

export interface InvestigationTeam {
  investigatorName: string;
  investigatorRole: string;
  investigatorRegistration?: string; // Reg. MTE ou CREA/CFT
  investigatorSigned: boolean;
  investigatorSignatureDate?: string;
  investigatorSignatureImage?: string; // Data URL (PNG/SVG) ou assinatura digital
  
  cipaRepresentative: string;
  cipaSigned: boolean;
  cipaSignatureDate?: string;
  cipaSignatureImage?: string;

  areaManager: string;
  areaManagerSigned: boolean;
  areaManagerSignatureDate?: string;
  areaManagerSignatureImage?: string;
}

export interface IncidentRecord {
  id: string;
  fileNumber: string; // ex: "FICH-2026-001"
  eventType: OccurrenceType;
  eventDate: string; // YYYY-MM-DD
  eventTime: string; // HH:MM
  investigationDate: string; // YYYY-MM-DD
  exactLocation: string;
  sector: string;
  shift: '1º Turno' | '2º Turno' | '3º Turno' | 'Administrativo' | 'Turno de Revezamento';
  companyUnit?: string;
  severity: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  
  workers: WorkerData[];
  occurrence: OccurrenceDetails;
  causeAnalysis: CauseAnalysis;
  actionPlans: ActionItem[];
  investigationTeam: InvestigationTeam;

  status: InvestigationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SafetyHHTConfig {
  monthYear: string; // "2026-08"
  hht: number; // Horas Homem Trabalhadas no mês
  headcount: number; // Nº total de colaboradores
  targetTF: number; // Meta Taxa de Frequência (ex: 2.0)
  targetTG: number; // Meta Taxa de Gravidade (ex: 20.0)
}

export interface CalculatedSafetyKPIs {
  totalIncidents: number;
  deviationCount: number; // Desvios
  nearMissCount: number; // Incidentes
  firstAidCount: number; // Sem afastamento
  lostTimeCount: number; // Com afastamento
  fatalCount: number; // Fatal
  commuteCount: number; // Trajeto
  
  totalDaysLost: number;
  totalHHT: number;
  
  // Taxa de Frequência = (Nº Acidentes c/ Afastamento * 1.000.000) / HHT
  tfRate: number;
  // Taxa de Gravidade = (Dias Perdidos * 1.000.000) / HHT
  tgRate: number;
  
  daysWithoutLostTimeAccident: number;
  actionsTotal: number;
  actionsCompleted: number;
  actionsPending: number;
  actionsOverdue: number;
  actionEffectivenessRate: number; // % concluídas
}

export type ActiveTab = 'ficha' | 'ocorrencias' | 'indicadores' | 'apresentacao';
export type NavigationTab = ActiveTab;

export interface DatabaseStatusInfo {
  status: 'connected' | 'error' | 'syncing';
  mode: string;
  engine: string;
  databaseName: string;
  charset: string;
  lastSaved?: string;
  counts: {
    incidents: number;
    hhtConfigs: number;
    slideCustomElements: number;
    auditLogs: number;
  };
}

