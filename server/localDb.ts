import fs from 'fs';
import path from 'path';

// Migrate old format (single worker object) to new format (workers array)
function migrateIncidents(incidents: any[]): any[] {
  return incidents.map((inc) => {
    if (inc.workers && Array.isArray(inc.workers)) return inc;
    if (inc.worker && typeof inc.worker === 'object') {
      const { worker: _old, ...rest } = inc;
      return {
        ...rest,
        workers: [
          {
            id: 'wk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            hasWorker: _old.hasWorker ?? true,
            fullName: _old.fullName ?? '',
            jobTitle: _old.jobTitle ?? '',
            timeInRole: _old.timeInRole ?? '',
            gender: _old.gender ?? 'M',
            age: _old.age,
            registrationNumber: _old.registrationNumber,
            contractType: _old.contractType ?? 'CLT',
            sector: _old.sector ?? '',
            leader: _old.leader ?? '',
          },
        ],
      };
    }
    return { ...inc, workers: [] };
  });
}

export interface LocalDatabaseSchema {
  incidents: any[];
  hhtConfigs: any[];
  slideCustomElements: any[];
  slideTextOverrides: Record<string, any>;
  auditLogs: {
    id: string;
    action: string;
    table: string;
    timestamp: string;
    details: string;
  }[];
  metadata: {
    engine: string;
    version: string;
    lastSaved: string;
    databaseName: string;
    charset: string;
  };
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'sst_database.json');

// Ensure data folder exists
function ensureDbDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

// Default initial state
const defaultDbData: LocalDatabaseSchema = {
  incidents: [],
  hhtConfigs: [],
  slideCustomElements: [],
  slideTextOverrides: {},
  auditLogs: [
    {
      id: 'init-log',
      action: 'INIT_DATABASE',
      table: 'SYSTEM',
      timestamp: new Date().toISOString(),
      details: 'Banco de dados local interno inicializado com sucesso no servidor.',
    },
  ],
  metadata: {
    engine: 'MySQL-Compatible Local Embedded Engine v2.0',
    version: '2.0.0',
    lastSaved: new Date().toISOString(),
    databaseName: 'sst_gestao_db',
    charset: 'utf8mb4',
  },
};

export function readLocalDatabase(): LocalDatabaseSchema {
  try {
    ensureDbDir();
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      // Migrate old format to new format
      if (data.incidents) {
        data.incidents = migrateIncidents(data.incidents);
      }
      return {
        ...defaultDbData,
        ...data,
      };
    }
  } catch (error) {
    console.error('Erro ao ler banco de dados local:', error);
  }
  return defaultDbData;
}

export function writeLocalDatabase(data: Partial<LocalDatabaseSchema>): LocalDatabaseSchema {
  try {
    ensureDbDir();
    const current = readLocalDatabase();
    const updated: LocalDatabaseSchema = {
      ...current,
      ...data,
      metadata: {
        ...current.metadata,
        lastSaved: new Date().toISOString(),
      },
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (error) {
    console.error('Erro ao gravar no banco de dados local:', error);
    throw error;
  }
}

export function logDatabaseAction(action: string, table: string, details: string) {
  try {
    const db = readLocalDatabase();
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      table,
      timestamp: new Date().toISOString(),
      details,
    };
    db.auditLogs = [newLog, ...db.auditLogs.slice(0, 99)]; // keep latest 100
    writeLocalDatabase({ auditLogs: db.auditLogs });
  } catch (e) {
    console.error('Erro ao registrar log de auditoria do banco', e);
  }
}

// Generate MySQL Dump File
export function generateMySQLDump(data: LocalDatabaseSchema): string {
  const dateStr = new Date().toISOString();
  const dbName = data.metadata.databaseName || 'sst_gestao_db';

  let sql = `-- ============================================================================
-- BANCO DE DADOS LOCAL SST - DUMP COMPATÍVEL COM MYSQL / MARIADB
-- Gerado automaticamente pelo Sistema de Gestão de Segurança do Trabalho
-- Data da Geração: ${dateStr}
-- Versão do Esquema: 2.0.0
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- CRIAÇÃO DO BANCO DE DADOS
-- ----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS \`${dbName}\` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE \`${dbName}\`;

-- ----------------------------------------------------------------------------
-- TABELA 1: incidents (Ocorrências, Acidentes e Quase-Acidentes)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`incidents\`;
CREATE TABLE \`incidents\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`file_number\` VARCHAR(32) NOT NULL,
  \`event_type\` ENUM('desvio', 'incidente', 'sem_afastamento', 'com_afastamento', 'fatal', 'trajeto') NOT NULL,
  \`event_date\` DATE NOT NULL,
  \`event_time\` TIME NOT NULL,
  \`investigation_date\` DATE NOT NULL,
  \`exact_location\` VARCHAR(255) NOT NULL,
  \`sector\` VARCHAR(128) NOT NULL,
  \`shift\` VARCHAR(64) NOT NULL,
  \`severity\` ENUM('Baixa', 'Média', 'Alta', 'Crítica') NOT NULL,
  \`status\` ENUM('rascunho', 'em_investigacao', 'acoes_em_andamento', 'concluido') NOT NULL,
  
  -- Dados do Colaborador
  \`has_worker\` BOOLEAN DEFAULT TRUE,
  \`worker_name\` VARCHAR(255) DEFAULT '',
  \`worker_job_title\` VARCHAR(128) DEFAULT '',
  \`worker_time_in_role\` VARCHAR(64) DEFAULT '',
  \`worker_gender\` VARCHAR(32) DEFAULT '',
  \`worker_age\` INT DEFAULT NULL,
  \`worker_registration\` VARCHAR(64) DEFAULT '',
  \`worker_contract_type\` VARCHAR(64) DEFAULT 'CLT',
  
  -- Detalhes da Ocorrência
  \`detailed_description\` TEXT,
  \`activity_at_moment\` TEXT,
  \`tools_used\` VARCHAR(255) DEFAULT '',
  \`injured_body_part\` VARCHAR(128) DEFAULT '',
  \`injury_type\` VARCHAR(128) DEFAULT '',
  \`days_lost_estimated\` INT DEFAULT 0,
  \`days_lost_actual\` INT DEFAULT 0,
  
  -- Análise dos 5 Porquês e Causa Raiz
  \`identified_problem\` TEXT,
  \`why1\` TEXT,
  \`why2\` TEXT,
  \`why3\` TEXT,
  \`why4\` TEXT,
  \`why5_root_cause\` TEXT,
  \`cause_category\` VARCHAR(128) DEFAULT '',
  \`cause_summary\` TEXT,
  
  -- Planos de Ação 5W2H e Equipe de Investigação (JSONs serializados)
  \`action_plans_json\` LONGTEXT,
  \`photos_json\` LONGTEXT,
  \`investigation_team_json\` LONGTEXT,
  \`raw_payload_json\` LONGTEXT,
  
  \`created_at\` DATETIME NOT NULL,
  \`updated_at\` DATETIME NOT NULL,
  
  INDEX \`idx_event_date\` (\`event_date\`),
  INDEX \`idx_event_type\` (\`event_type\`),
  INDEX \`idx_sector\` (\`sector\`),
  INDEX \`idx_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABELA 2: hht_configs (Horas Homem Trabalhadas e Metas de Segurança)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`hht_configs\`;
CREATE TABLE \`hht_configs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`month_year\` VARCHAR(7) NOT NULL UNIQUE, -- Formato: YYYY-MM
  \`hht\` INT NOT NULL DEFAULT 0,
  \`headcount\` INT NOT NULL DEFAULT 0,
  \`target_tf\` DECIMAL(6,2) NOT NULL DEFAULT 2.00,
  \`target_tg\` DECIMAL(6,2) NOT NULL DEFAULT 20.00,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABELA 3: slide_custom_elements (Formas e Post-its da Apresentação)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`slide_custom_elements\`;
CREATE TABLE \`slide_custom_elements\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`slide_number\` INT NOT NULL,
  \`element_type\` VARCHAR(64) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`content\` TEXT NOT NULL,
  \`color\` VARCHAR(32) NOT NULL DEFAULT 'amber',
  \`icon\` VARCHAR(64) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_slide\` (\`slide_number\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABELA 4: slide_text_overrides (Textos Personalizados dos Slides)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`slide_text_overrides\`;
CREATE TABLE \`slide_text_overrides\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`config_json\` LONGTEXT NOT NULL,
  \`updated_at\` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABELA 5: database_audit_logs (Logs de Auditoria e Operações)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`database_audit_logs\`;
CREATE TABLE \`database_audit_logs\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`action\` VARCHAR(64) NOT NULL,
  \`table_name\` VARCHAR(64) NOT NULL,
  \`details\` TEXT,
  \`created_at\` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  // Helper escape
  const esc = (val: any) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number' || typeof val === 'boolean') return val;
    const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `'${str}'`;
  };

  // INSERT INTO incidents
  if (data.incidents && data.incidents.length > 0) {
    sql += `\n-- ----------------------------------------------------------------------------\n-- INSERÇÃO DE DADOS: incidents (${data.incidents.length} registros)\n-- ----------------------------------------------------------------------------\n`;
    for (const inc of data.incidents) {
      const worker = inc.worker || {};
      const occ = inc.occurrence || {};
      const cause = inc.causeAnalysis || {};
      const plansJson = JSON.stringify(inc.actionPlans || []);
      const photosJson = JSON.stringify(occ.photos || []);
      const teamJson = JSON.stringify(inc.investigationTeam || {});
      const rawPayload = JSON.stringify(inc);

      sql += `INSERT INTO \`incidents\` (
  \`id\`, \`file_number\`, \`event_type\`, \`event_date\`, \`event_time\`, \`investigation_date\`,
  \`exact_location\`, \`sector\`, \`shift\`, \`severity\`, \`status\`,
  \`has_worker\`, \`worker_name\`, \`worker_job_title\`, \`worker_time_in_role\`, \`worker_gender\`, \`worker_age\`, \`worker_registration\`, \`worker_contract_type\`,
  \`detailed_description\`, \`activity_at_moment\`, \`tools_used\`, \`injured_body_part\`, \`injury_type\`, \`days_lost_estimated\`, \`days_lost_actual\`,
  \`identified_problem\`, \`why1\`, \`why2\`, \`why3\`, \`why4\`, \`why5_root_cause\`, \`cause_category\`, \`cause_summary\`,
  \`action_plans_json\`, \`photos_json\`, \`investigation_team_json\`, \`raw_payload_json\`,
  \`created_at\`, \`updated_at\`
) VALUES (
  ${esc(inc.id)}, ${esc(inc.fileNumber)}, ${esc(inc.eventType)}, ${esc(inc.eventDate)}, ${esc(inc.eventTime || '08:00:00')}, ${esc(inc.investigationDate || inc.eventDate)},
  ${esc(inc.exactLocation)}, ${esc(inc.sector)}, ${esc(inc.shift)}, ${esc(inc.severity)}, ${esc(inc.status)},
  ${worker.hasWorker ? 1 : 0}, ${esc(worker.fullName)}, ${esc(worker.jobTitle)}, ${esc(worker.timeInRole)}, ${esc(worker.gender)}, ${worker.age || 'NULL'}, ${esc(worker.registrationNumber)}, ${esc(worker.contractType)},
  ${esc(occ.detailedDescription)}, ${esc(occ.activityAtMoment)}, ${esc(occ.toolsUsed)}, ${esc(occ.injuredBodyPart)}, ${esc(occ.injuryType)}, ${occ.daysLostEstimated || 0}, ${occ.daysLostActual || 0},
  ${esc(cause.identifiedProblem)}, ${esc(cause.why1)}, ${esc(cause.why2)}, ${esc(cause.why3)}, ${esc(cause.why4)}, ${esc(cause.why5_rootCause)}, ${esc(cause.causeCategory)}, ${esc(cause.summary)},
  ${esc(plansJson)}, ${esc(photosJson)}, ${esc(teamJson)}, ${esc(rawPayload)},
  ${esc(inc.createdAt || dateStr)}, ${esc(inc.updatedAt || dateStr)}
);\n`;
    }
  }

  // INSERT INTO hht_configs
  if (data.hhtConfigs && data.hhtConfigs.length > 0) {
    sql += `\n-- ----------------------------------------------------------------------------\n-- INSERÇÃO DE DADOS: hht_configs (${data.hhtConfigs.length} registros)\n-- ----------------------------------------------------------------------------\n`;
    for (const h of data.hhtConfigs) {
      sql += `INSERT INTO \`hht_configs\` (\`month_year\`, \`hht\`, \`headcount\`, \`target_tf\`, \`target_tg\`) VALUES (${esc(h.monthYear)}, ${h.hht || 0}, ${h.headcount || 0}, ${h.targetTF || 2.0}, ${h.targetTG || 20.0});\n`;
    }
  }

  // INSERT INTO slide_custom_elements
  if (data.slideCustomElements && data.slideCustomElements.length > 0) {
    sql += `\n-- ----------------------------------------------------------------------------\n-- INSERÇÃO DE DADOS: slide_custom_elements (${data.slideCustomElements.length} registros)\n-- ----------------------------------------------------------------------------\n`;
    for (const el of data.slideCustomElements) {
      sql += `INSERT INTO \`slide_custom_elements\` (\`id\`, \`slide_number\`, \`element_type\`, \`title\`, \`content\`, \`color\`, \`icon\`) VALUES (${esc(el.id)}, ${el.slideNumber}, ${esc(el.type)}, ${esc(el.title)}, ${esc(el.content)}, ${esc(el.color)}, ${esc(el.icon)});\n`;
    }
  }

  // INSERT INTO slide_text_overrides
  if (data.slideTextOverrides && Object.keys(data.slideTextOverrides).length > 0) {
    sql += `\n-- ----------------------------------------------------------------------------\n-- INSERÇÃO DE DADOS: slide_text_overrides\n-- ----------------------------------------------------------------------------\n`;
    sql += `INSERT INTO \`slide_text_overrides\` (\`config_json\`, \`updated_at\`) VALUES (${esc(JSON.stringify(data.slideTextOverrides))}, ${esc(dateStr)});\n`;
  }

  // INSERT INTO database_audit_logs
  if (data.auditLogs && data.auditLogs.length > 0) {
    sql += `\n-- ----------------------------------------------------------------------------\n-- INSERÇÃO DE DADOS: database_audit_logs (${data.auditLogs.length} registros)\n-- ----------------------------------------------------------------------------\n`;
    for (const l of data.auditLogs.slice(0, 30)) {
      sql += `INSERT INTO \`database_audit_logs\` (\`id\`, \`action\`, \`table_name\`, \`details\`, \`created_at\`) VALUES (${esc(l.id)}, ${esc(l.action)}, ${esc(l.table)}, ${esc(l.details)}, ${esc(l.timestamp)});\n`;
    }
  }

  sql += `\nCOMMIT;\n-- FIM DO DUMP MYSQL SST\n`;
  return sql;
}

// Local SQL Query Evaluator for UI Console (Supports SELECT on incidents, hht_configs, slide_custom_elements, audit_logs)
export function executeLocalSQLQuery(queryStr: string, db: LocalDatabaseSchema): { columns: string[]; rows: any[]; totalRows: number; executionTimeMs: number } {
  const start = performance.now();
  const q = queryStr.trim().toLowerCase();

  let targetTable = 'incidents';
  if (q.includes('from hht_configs') || q.includes('from `hht_configs`')) {
    targetTable = 'hht_configs';
  } else if (q.includes('from slide_custom_elements') || q.includes('from `slide_custom_elements`')) {
    targetTable = 'slide_custom_elements';
  } else if (q.includes('from database_audit_logs') || q.includes('from audit_logs') || q.includes('from `database_audit_logs`')) {
    targetTable = 'audit_logs';
  }

  let sourceRows: any[] = [];
  if (targetTable === 'incidents') {
    sourceRows = (db.incidents || []).map((i) => ({
      id: i.id,
      file_number: i.fileNumber,
      event_type: i.eventType,
      event_date: i.eventDate,
      sector: i.sector,
      severity: i.severity,
      status: i.status,
      worker_name: i.worker?.fullName || 'N/A',
      injured_body_part: i.occurrence?.injuredBodyPart || 'N/A',
      days_lost: i.occurrence?.daysLostActual || 0,
      root_cause: i.causeAnalysis?.why5_rootCause || 'N/A',
      actions_count: (i.actionPlans || []).length,
    }));
  } else if (targetTable === 'hht_configs') {
    sourceRows = (db.hhtConfigs || []).map((h) => ({
      month_year: h.monthYear,
      hht: h.hht,
      headcount: h.headcount,
      target_tf: h.targetTF,
      target_tg: h.targetTG,
    }));
  } else if (targetTable === 'slide_custom_elements') {
    sourceRows = (db.slideCustomElements || []).map((el) => ({
      id: el.id,
      slide_number: el.slideNumber,
      type: el.type,
      title: el.title,
      content: el.content,
      color: el.color,
    }));
  } else if (targetTable === 'audit_logs') {
    sourceRows = (db.auditLogs || []).map((l) => ({
      id: l.id,
      action: l.action,
      table_name: l.table,
      timestamp: l.timestamp,
      details: l.details,
    }));
  }

  // Simple filter evaluator
  let filtered = [...sourceRows];
  if (q.includes('where')) {
    const wherePart = q.split('where')[1].split('order by')[0].split('limit')[0].trim();
    if (wherePart.includes('com_afastamento')) {
      filtered = filtered.filter((r) => r.event_type === 'com_afastamento');
    } else if (wherePart.includes('sem_afastamento')) {
      filtered = filtered.filter((r) => r.event_type === 'sem_afastamento');
    } else if (wherePart.includes('incidente') || wherePart.includes('quase')) {
      filtered = filtered.filter((r) => r.event_type === 'incidente');
    } else if (wherePart.includes('status')) {
      if (wherePart.includes('concluido')) filtered = filtered.filter((r) => r.status === 'concluido');
      if (wherePart.includes('em_investigacao')) filtered = filtered.filter((r) => r.status === 'em_investigacao');
      if (wherePart.includes('acoes_em_andamento')) filtered = filtered.filter((r) => r.status === 'acoes_em_andamento');
    }
  }

  // Simple limit
  if (q.includes('limit')) {
    const limitMatch = q.match(/limit\s+(\d+)/);
    if (limitMatch && limitMatch[1]) {
      const num = parseInt(limitMatch[1], 10);
      if (!isNaN(num)) filtered = filtered.slice(0, num);
    }
  }

  const columns = filtered.length > 0 ? Object.keys(filtered[0]) : ['id', 'status', 'info'];
  const executionTimeMs = Math.round((performance.now() - start) * 100) / 100;

  return {
    columns,
    rows: filtered,
    totalRows: filtered.length,
    executionTimeMs,
  };
}
