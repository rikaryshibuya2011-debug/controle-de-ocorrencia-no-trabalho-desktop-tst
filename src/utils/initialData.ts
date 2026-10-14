import { IncidentRecord, SafetyHHTConfig } from '../types';

export const INITIAL_HHT_CONFIG: SafetyHHTConfig[] = [
  { monthYear: '2026-03', hht: 85000, headcount: 510, targetTF: 2.0, targetTG: 15.0 },
  { monthYear: '2026-04', hht: 88000, headcount: 520, targetTF: 2.0, targetTG: 15.0 },
  { monthYear: '2026-05', hht: 86500, headcount: 518, targetTF: 2.0, targetTG: 15.0 },
  { monthYear: '2026-06', hht: 89000, headcount: 525, targetTF: 2.0, targetTG: 15.0 },
  { monthYear: '2026-07', hht: 91000, headcount: 530, targetTF: 2.0, targetTG: 15.0 },
  { monthYear: '2026-08', hht: 92400, headcount: 535, targetTF: 2.0, targetTG: 15.0 },
];

export const DEFAULT_HHT_CONFIGS = INITIAL_HHT_CONFIG;

export const INITIAL_INCIDENTS: IncidentRecord[] = [];

export const SECTORS_LIST = [
  'Produção / Prensagem',
  'Usinagem e Corte',
  'Logística / Almoxarifado',
  'Manutenção Geral',
  'Montagem e Solda',
  'Embalagem e Expedição',
  'Pintura e Tratamento Térmico',
  'Administrativo / Financeiro',
  'Laboratório de Qualidade',
  'Utilidades e Caldeiras',
  'Acesso Externo / Portaria',
];

export const BODY_PARTS_LIST = [
  'Mãos / Dedos',
  'Olhos / Face',
  'Pés / Tornozelo',
  'Costas / Coluna Lombar',
  'Braços / Punho',
  'Pernas / Joelhos',
  'Cabeça / Crânio',
  'Tronco / Abdômen',
  'Nenhum (Quase-Acidente / Dano Material)',
];

export const INJURY_TYPES_LIST = [
  'Corte / Laceração',
  'Contusão / Pancada',
  'Fratura',
  'Queimadura Térmica / Química',
  'Entorse / Luxação',
  'Corpo Estranho Ocular',
  'Amputação Parcial / Total',
  'Choque Elétrico',
  'Inalação de Vapor / Gases',
  'DORT / Lesão Ergonômica',
  'Nenhum / Quase-Acidente',
];
