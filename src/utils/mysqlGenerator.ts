import { IncidentRecord, SafetyHHTConfig } from '../types';
import { CustomSlideElement, SlideTextOverrides } from '../components/PresentationCustomizer';

export function generateClientMySQLDump(
  incidents: IncidentRecord[],
  hhtConfigs: SafetyHHTConfig[],
  slideElements: CustomSlideElement[],
  slideOverrides: SlideTextOverrides,
  dbName = 'sst_gestao_db'
): string {
  const dateStr = new Date().toISOString();

  let sql = `-- ============================================================================
-- BANCO DE DADOS LOCAL SST - SCRIPT DUMP SQL COMPATÍVEL COM MYSQL 5.7+ / 8.0+ / MARIADB
-- Gerado pelo Sistema de Gestão de Segurança do Trabalho
-- Data da Exportação: ${dateStr}
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- CRIAÇÃO DO BANCO DE DADOS LOCAL
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
  
  -- Colaborador
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
  
  -- Análise dos 5 Porquês
  \`identified_problem\` TEXT,
  \`why1\` TEXT,
  \`why2\` TEXT,
  \`why3\` TEXT,
  \`why4\` TEXT,
  \`why5_root_cause\` TEXT,
  \`cause_category\` VARCHAR(128) DEFAULT '',
  \`cause_summary\` TEXT,
  
  -- Dados JSON
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
-- TABELA 2: hht_configs (Horas Homem Trabalhadas)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`hht_configs\`;
CREATE TABLE \`hht_configs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`month_year\` VARCHAR(7) NOT NULL UNIQUE,
  \`hht\` INT NOT NULL DEFAULT 0,
  \`headcount\` INT NOT NULL DEFAULT 0,
  \`target_tf\` DECIMAL(6,2) NOT NULL DEFAULT 2.00,
  \`target_tg\` DECIMAL(6,2) NOT NULL DEFAULT 20.00,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABELA 3: slide_custom_elements (Formas da Apresentação)
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
-- TABELA 4: slide_text_overrides (Textos Personalizados)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS \`slide_text_overrides\`;
CREATE TABLE \`slide_text_overrides\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`config_json\` LONGTEXT NOT NULL,
  \`updated_at\` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

  const esc = (val: any) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number' || typeof val === 'boolean') return val;
    const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `'${str}'`;
  };

  // Populate incidents
  if (incidents && incidents.length > 0) {
    sql += `\n-- ----------------------------------------------------------------------------\n-- INSERÇÃO DE DADOS: incidents (${incidents.length} registros)\n-- ----------------------------------------------------------------------------\n`;
    for (const inc of incidents) {
      const workers = inc.workers || [];
      const mainWorker = workers[0] || ({} as any);
      const occ = inc.occurrence || ({} as any);
      const cause = inc.causeAnalysis || ({} as any);
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
  ${mainWorker.hasWorker ? 1 : 0}, ${esc(mainWorker.fullName)}, ${esc(mainWorker.jobTitle)}, ${esc(mainWorker.timeInRole)}, ${esc(mainWorker.gender)}, ${mainWorker.age || 'NULL'}, ${esc(mainWorker.registrationNumber)}, ${esc(mainWorker.contractType)},
  ${esc(occ.detailedDescription)}, ${esc(occ.activityAtMoment)}, ${esc(occ.toolsUsed)}, ${esc(occ.injuredBodyPart)}, ${esc(occ.injuryType)}, ${occ.daysLostEstimated || 0}, ${occ.daysLostActual || 0},
  ${esc(cause.identifiedProblem)}, ${esc(cause.why1)}, ${esc(cause.why2)}, ${esc(cause.why3)}, ${esc(cause.why4)}, ${esc(cause.why5_rootCause)}, ${esc(cause.causeCategory)}, ${esc(cause.summary)},
  ${esc(plansJson)}, ${esc(photosJson)}, ${esc(teamJson)}, ${esc(rawPayload)},
  ${esc(inc.createdAt || dateStr)}, ${esc(inc.updatedAt || dateStr)}
);\n`;
    }
  }

  // Populate HHT configs
  if (hhtConfigs && hhtConfigs.length > 0) {
    sql += `\n-- ----------------------------------------------------------------------------\n-- INSERÇÃO DE DADOS: hht_configs (${hhtConfigs.length} registros)\n-- ----------------------------------------------------------------------------\n`;
    for (const h of hhtConfigs) {
      sql += `INSERT INTO \`hht_configs\` (\`month_year\`, \`hht\`, \`headcount\`, \`target_tf\`, \`target_tg\`) VALUES (${esc(h.monthYear)}, ${h.hht || 0}, ${h.headcount || 0}, ${h.targetTF || 2.0}, ${h.targetTG || 20.0});\n`;
    }
  }

  // Populate custom slide elements
  if (slideElements && slideElements.length > 0) {
    sql += `\n-- ----------------------------------------------------------------------------\n-- INSERÇÃO DE DADOS: slide_custom_elements (${slideElements.length} registros)\n-- ----------------------------------------------------------------------------\n`;
    for (const el of slideElements) {
      sql += `INSERT INTO \`slide_custom_elements\` (\`id\`, \`slide_number\`, \`element_type\`, \`title\`, \`content\`, \`color\`, \`icon\`) VALUES (${esc(el.id)}, ${el.slideNumber}, ${esc(el.type)}, ${esc(el.title)}, ${esc(el.content)}, ${esc(el.color)}, ${esc(el.icon)});\n`;
    }
  }

  // Populate slide text overrides
  if (slideOverrides && Object.keys(slideOverrides).length > 0) {
    sql += `\n-- ----------------------------------------------------------------------------\n-- INSERÇÃO DE DADOS: slide_text_overrides\n-- ----------------------------------------------------------------------------\n`;
    sql += `INSERT INTO \`slide_text_overrides\` (\`config_json\`, \`updated_at\`) VALUES (${esc(JSON.stringify(slideOverrides))}, ${esc(dateStr)});\n`;
  }

  sql += `\nCOMMIT;\n-- FIM DO DUMP MYSQL SST\n`;
  return sql;
}

export function downloadFile(content: string, filename: string, mimeType = 'application/sql') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
