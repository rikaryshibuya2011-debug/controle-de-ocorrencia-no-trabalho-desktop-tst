import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  FileText,
  FileSpreadsheet,
  Calendar,
  Award,
  AlertTriangle,
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  TrendingDown,
  TrendingUp,
  Settings,
  Info,
  Layers,
  Sparkles,
  Printer,
  Sliders,
} from 'lucide-react';
import {
  IncidentRecord,
  SafetyHHTConfig,
  CalculatedSafetyKPIs,
} from '../types';
import {
  calculateSafetyKPIs,
  getMonthlyTrendData,
  getSectorDistribution,
  getBodyPartStats,
  getCauseCategoryStats,
  getLeaderDistribution,
  getWorkerSectorDistribution,
} from '../utils/kpiCalculator';
import { exportMonthlyReportToPDF, exportToExcel } from '../utils/exportUtils';

interface IndicatorsProps {
  incidents: IncidentRecord[];
  hhtConfigs: SafetyHHTConfig[];
  setHhtConfigs: (configs: SafetyHHTConfig[]) => void;
  selectedMonthYear: string;
  setSelectedMonthYear: (val: string) => void;
}

const COLORS = ['#0284c7', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

export const SafetyIndicatorsDashboard: React.FC<IndicatorsProps> = ({
  incidents,
  hhtConfigs,
  setHhtConfigs,
  selectedMonthYear,
  setSelectedMonthYear,
}) => {
  const [showHHTModal, setShowHHTModal] = useState(false);

  // Compute KPIs
  const kpis = calculateSafetyKPIs(incidents, hhtConfigs, selectedMonthYear || undefined);
  const monthlyTrend = getMonthlyTrendData(incidents, hhtConfigs);
  const sectorData = getSectorDistribution(incidents);
  const bodyPartData = getBodyPartStats(incidents);
  const causeData = getCauseCategoryStats(incidents);
  const leaderData = getLeaderDistribution(incidents);
  const workerSectorData = getWorkerSectorDistribution(incidents);

  // Active HHT config for selected month or average
  const currentMonthConfig =
    hhtConfigs.find((c) => c.monthYear === (selectedMonthYear || '2026-08')) || hhtConfigs[hhtConfigs.length - 1];

  const monthLabel = selectedMonthYear
    ? selectedMonthYear === '2026-08'
      ? 'Agosto / 2026'
      : selectedMonthYear === '2026-07'
      ? 'Julho / 2026'
      : selectedMonthYear === '2026-06'
      ? 'Junho / 2026'
      : selectedMonthYear === '2026-05'
      ? 'Maio / 2026'
      : selectedMonthYear === '2026-04'
      ? 'Abril / 2026'
      : 'Março / 2026'
    : 'Ano Consolidado 2026';

  const handleExportPDF = () => {
    exportMonthlyReportToPDF(
      selectedMonthYear ? incidents.filter((i) => i.eventDate.startsWith(selectedMonthYear)) : incidents,
      kpis,
      monthLabel,
      hhtConfigs
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      selectedMonthYear ? incidents.filter((i) => i.eventDate.startsWith(selectedMonthYear)) : incidents,
      kpis,
      monthLabel
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Export Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>Painel de Indicadores & Métricas Estatísticas SST</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {monthLabel}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Acompanhamento de Taxa de Frequência (TF), Gravidade (TG), Pirâmide de Bird e Eficácia de Ações (NBR 14280)
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setShowHHTModal(true)}
            className="flex items-center space-x-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg transition border border-slate-200 cursor-pointer font-medium"
            title="Configurar Horas Homem Trabalhadas (HHT) e Metas"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>Configurar HHT & Metas</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-sm cursor-pointer"
            title="Exportar Relatório Mensal Detalhado em PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Exportar Relatório em PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-sm cursor-pointer"
            title="Exportar Planilha Completa em Excel (.XLSX)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar em Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS - CATEGORIAS DE OCORRÊNCIA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Desvios */}
        <div className="bg-white rounded-xl shadow-sm border border-orange-200/80 p-4 relative overflow-hidden bg-gradient-to-br from-white to-orange-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-900 uppercase tracking-wider">
              Desvios
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-orange-950">{kpis.deviationCount}</div>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-orange-100/80 text-orange-800 border border-orange-200">
              Desvios
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-orange-100 pt-1.5">
            <span>Desvios de procedimentos</span>
            <span className="font-semibold text-orange-800">Preventivo</span>
          </div>
        </div>

        {/* Card 2: Incidentes */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-200/80 p-4 relative overflow-hidden bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
              Incidentes
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-amber-950">{kpis.nearMissCount}</div>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-100/80 text-amber-800 border border-amber-200">
              Near-Miss
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-amber-100 pt-1.5">
            <span>Sem lesão corporal, com ou sem dano material</span>
            <span className="font-semibold text-amber-800">Base Preventiva</span>
          </div>
        </div>

        {/* Card 3: Acidente sem Afastamento */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-200/80 p-4 relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
              Acidente s/ Afastamento
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-blue-950">{kpis.firstAidCount}</div>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100/80 text-blue-800 border border-blue-200">
              Primeiros Socorros
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-blue-100 pt-1.5">
            <span>Retorno na mesma jornada</span>
            <span className="font-semibold text-blue-800">Ambulatorial</span>
          </div>
        </div>

        {/* Card 4: Acidente com Afastamento */}
        <div className="bg-white rounded-xl shadow-sm border border-rose-200/80 p-4 relative overflow-hidden bg-gradient-to-br from-white to-rose-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
              Acidente c/ Afastamento
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-rose-950">{kpis.lostTimeCount}</div>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-rose-100/80 text-rose-800 border border-rose-200">
              {kpis.totalDaysLost} dias perdidos
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-rose-100 pt-1.5">
            <span>TF: {kpis.tfRate} | TG: {kpis.tgRate}</span>
            <span className="font-semibold text-rose-700">Incapacidade Temp.</span>
          </div>
        </div>

        {/* Card 5: Fatal */}
        <div className="bg-white rounded-xl shadow-sm border border-purple-200/80 p-4 relative overflow-hidden bg-gradient-to-br from-white to-purple-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-900 uppercase tracking-wider">
              Fatal
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-800">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-purple-950">{kpis.fatalCount}</div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
              kpis.fatalCount === 0 
                ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200' 
                : 'bg-purple-100/80 text-purple-800 border-purple-200'
            }`}>
              {kpis.fatalCount === 0 ? 'Zero Óbito' : `${kpis.fatalCount} Ocorrência(s)`}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-purple-100 pt-1.5">
            <span>Óbito / Incapacidade Total</span>
            <span className={`font-semibold ${kpis.fatalCount === 0 ? 'text-emerald-700' : 'text-purple-900'}`}>
              {kpis.fatalCount === 0 ? 'Meta Preservada' : 'Crítico'}
            </span>
          </div>
        </div>

        {/* Card 6: Acidente de Trajeto */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-200/80 p-4 relative overflow-hidden bg-gradient-to-br from-white to-indigo-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
              Acidente de Trajeto
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-indigo-950">{kpis.commuteCount}</div>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-100/80 text-indigo-800 border border-indigo-200">
              Trajeto
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-indigo-100 pt-1.5">
            <span>Deslocamento ao/de trabalho</span>
            <span className="font-semibold text-indigo-800">Trajeto</span>
          </div>
        </div>
      </div>

      {/* ACIDENTES X INCIDENTES - INDICADOR COMPARATIVO */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Acidentes x Incidentes</span>
            </h3>
            <p className="text-xs text-slate-500">Proporção entre acidentes (com/sem afastamento, fatais, trajeto) e incidentes/desvios</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Total Acidentes</div>
            <div className="text-3xl font-black text-rose-600">
              {kpis.firstAidCount + kpis.lostTimeCount + kpis.fatalCount + kpis.commuteCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">c/ afastamento + s/ afastamento + fatais + trajeto</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Total Incidentes + Desvios</div>
            <div className="text-3xl font-black text-amber-600">
              {kpis.nearMissCount + kpis.deviationCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">incidentes + desvios (base preventiva)</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Proporção</div>
            <div className="text-3xl font-black text-slate-900">
              {kpis.nearMissCount + kpis.deviationCount > 0 
                ? `1 : ${((kpis.nearMissCount + kpis.deviationCount) / Math.max(1, kpis.firstAidCount + kpis.lostTimeCount + kpis.fatalCount + kpis.commuteCount)).toFixed(1)}`
                : '-'
              }
            </div>
            <div className="text-[11px] text-slate-500 mt-1">acidente : incidente/desvio</div>
          </div>
        </div>
      </div>

      {/* PIRÂMIDE DE BIRD / FRANK HEINRICH INTERATIVA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Pirâmide de Riscos e Desvios de Frank Bird (Proporção Real vs Teórica)</span>
              <span className="text-[11px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Pirâmide 1 : 10 : 30 : 600
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              A identificação massiva e tratamento de quase-acidentes e desvios na base previne a ocorrência de acidentes graves no topo.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
            Total Ocorrências Registradas: <strong>{kpis.totalIncidents}</strong>
          </span>
        </div>

        {/* Visual Bird Pyramid */}
        <div className="max-w-2xl mx-auto space-y-2 py-2">
          {/* Level 1: Fatal / Incapacidade Permanente (Teórico: 1) */}
          <div className="w-1/4 mx-auto bg-slate-950 text-white rounded-lg p-2.5 text-center shadow border border-slate-800 transition hover:scale-105">
            <span className="text-[10px] font-bold text-rose-400 block uppercase">1. Fatal / Morte</span>
            <span className="text-lg font-black text-white">{kpis.fatalCount}</span>
            <span className="text-[10px] text-slate-400 block">
              {kpis.fatalCount === 0 ? 'Nenhum evento registrado' : `${kpis.fatalCount} caso(s)`}
            </span>
          </div>

          {/* Level 2: Com Afastamento (Teórico: 10) */}
          <div className="w-2/4 mx-auto bg-rose-600 text-white rounded-lg p-2.5 text-center shadow transition hover:scale-105">
            <span className="text-[10px] font-bold text-rose-100 block uppercase">2. Acidentes com Afastamento (ACAF)</span>
            <span className="text-lg font-black text-white">{kpis.lostTimeCount}</span>
            <span className="text-[10px] text-rose-100 block">
              {kpis.totalDaysLost} dias perdidos acumulados
            </span>
          </div>

          {/* Level 3: Sem Afastamento (Teórico: 30) */}
          <div className="w-3/4 mx-auto bg-blue-600 text-white rounded-lg p-2.5 text-center shadow transition hover:scale-105">
            <span className="text-[10px] font-bold text-blue-100 block uppercase">3. Acidentes sem Afastamento (ASAF)</span>
            <span className="text-lg font-black text-white">{kpis.firstAidCount}</span>
            <span className="text-[10px] text-blue-100 block">Primeiros socorros e retorno</span>
          </div>

          {/* Level 4: Incidentes e Desvios (Teórico: 600) */}
          <div className="w-full bg-amber-500 text-slate-950 rounded-lg p-3 text-center shadow transition hover:scale-105 border-2 border-amber-600">
            <span className="text-xs font-bold text-slate-900 block uppercase">
              4. Incidentes (Near-Miss) & Desvios Operacionais (Base Preventiva)
            </span>
            <div className="flex justify-center gap-8 mt-1">
              <div>
                <span className="text-[10px] font-bold text-slate-800 block">Incidentes</span>
                <span className="text-xl font-black text-slate-950">{kpis.nearMissCount}</span>
              </div>
              <div className="border-l-2 border-amber-600 pl-8">
                <span className="text-[10px] font-bold text-slate-800 block">Desvios</span>
                <span className="text-xl font-black text-slate-950">{kpis.deviationCount}</span>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-900 block mt-1">
              Tratados com Planos de Ação 5W2H antes de gerar lesão
            </span>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Evolução Mensal TF vs Meta */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase">
              Evolução Temporal da Taxa de Frequência (TF) vs Meta
            </h4>
            <span className="text-[11px] text-slate-500">Últimos 6 Meses</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line
                  type="monotone"
                  dataKey="tf"
                  name="TF Realizada"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="targetTF"
                  name="Meta de TF (Máx 2.0)"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Ocorrências Mensais por Tipo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase">
              Distribuição Mensal por Tipo de Ocorrência
            </h4>
            <span className="text-[11px] text-slate-500">Contagem de Eventos</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="desvio" name="Desvios" fill="#f97316" stackId="a" />
                <Bar dataKey="incidente" name="Incidentes" fill="#f59e0b" stackId="a" />
                <Bar dataKey="sem_afastamento" name="Acidente s/ Afastamento" fill="#0284c7" stackId="a" />
                <Bar dataKey="com_afastamento" name="Acidente c/ Afastamento" fill="#ef4444" stackId="a" />
                <Bar dataKey="trajeto" name="Trajeto" fill="#8b5cf6" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Incidentes por Setor */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase">
              Ocorrências por Setor / Área Operacional
            </h4>
            <span className="text-[11px] text-slate-500">Ranking de Incidência</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={sectorData.slice(0, 6)}
                margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} />
                <Tooltip />
                <Bar dataKey="total" name="Total Ocorrências" fill="#0f172a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Partes do Corpo Afetadas */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase">
              Partes do Corpo mais Atingidas nas Ocorrências
            </h4>
            <span className="text-[11px] text-slate-500">Anatomia de Lesões</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {bodyPartData.length === 0 ? (
              <p className="text-xs text-slate-400">Sem lesões corporais no período</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bodyPartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {bodyPartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* NOVOS GRÁFICOS: SETOR DO COLABORADOR E LÍDER RESPONSÁVEL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 5: Ocorrências por Setor do Colaborador */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase">
              Ocorrências por Setor do Colaborador
            </h4>
            <span className="text-[11px] text-slate-500">Indicadores por Setor</span>
          </div>
          <div className="h-64 w-full">
            {workerSectorData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center mt-8">Nenhum dado de setor do colaborador cadastrado</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={workerSectorData.slice(0, 8)}
                  margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={120} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="deviation" name="Desvios" fill="#f97316" stackId="a" />
                  <Bar dataKey="nearMiss" name="Incidentes" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="firstAid" name="s/ Afastamento" fill="#0284c7" stackId="a" />
                  <Bar dataKey="lostTime" name="c/ Afastamento" fill="#ef4444" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 6: Ocorrências por Líder Responsável */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase">
              Ocorrências por Líder Responsável
            </h4>
            <span className="text-[11px] text-slate-500">Indicadores por Liderança</span>
          </div>
          <div className="h-64 w-full">
            {leaderData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center mt-8">Nenhum dado de líder responsável cadastrado</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={leaderData.slice(0, 8)}
                  margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={140} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="deviation" name="Desvios" fill="#f97316" stackId="a" />
                  <Bar dataKey="nearMiss" name="Incidentes" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="firstAid" name="s/ Afastamento" fill="#0284c7" stackId="a" />
                  <Bar dataKey="lostTime" name="c/ Afastamento" fill="#ef4444" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* HHT / METAS MODAL */}
      {showHHTModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Configuração de Horas Homem Trabalhadas (HHT) & Metas
                </h3>
              </div>
              <button
                onClick={() => setShowHHTModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              O valor de Horas Homem Trabalhadas (HHT) é a base de cálculo para a Taxa de Frequência (TF) e Gravidade (TG) conforme NBR 14280.
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {hhtConfigs.map((cfg, idx) => (
                <div
                  key={cfg.monthYear}
                  className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-4 gap-2 text-xs items-center"
                >
                  <span className="font-bold text-slate-800">{cfg.monthYear}</span>

                  <div>
                    <label className="text-[10px] text-slate-500 block">HHT (Horas):</label>
                    <input
                      type="number"
                      value={cfg.hht}
                      onChange={(e) => {
                        const updated = [...hhtConfigs];
                        updated[idx].hht = parseInt(e.target.value) || 0;
                        setHhtConfigs(updated);
                      }}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Efetivo (Pessoas):</label>
                    <input
                      type="number"
                      value={cfg.headcount}
                      onChange={(e) => {
                        const updated = [...hhtConfigs];
                        updated[idx].headcount = parseInt(e.target.value) || 0;
                        setHhtConfigs(updated);
                      }}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Meta TF:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cfg.targetTF}
                      onChange={(e) => {
                        const updated = [...hhtConfigs];
                        updated[idx].targetTF = parseFloat(e.target.value) || 2.0;
                        setHhtConfigs(updated);
                      }}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-emerald-700"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowHHTModal(false)}
                className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Salvar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
