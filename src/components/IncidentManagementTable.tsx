import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileText,
  Printer,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  Layers,
  Kanban,
  List,
  User,
  Calendar,
  Eye,
  CheckSquare,
} from 'lucide-react';
import { IncidentRecord, OccurrenceType, InvestigationStatus, ActionStatus } from '../types';
import { EVENT_TYPE_LABELS, exportIncidentSheetToPDF } from '../utils/exportUtils';
import { SECTORS_LIST } from '../utils/initialData';

interface ManagementTableProps {
  incidents: IncidentRecord[];
  onSelectIncident: (incident: IncidentRecord) => void;
  onNewIncident: () => void;
  onDeleteIncident: (id: string) => void;
  onUpdateIncidentStatus: (id: string, status: InvestigationStatus) => void;
  selectedMonthYear?: string;
  setSelectedMonthYear?: (val: string) => void;
}

export const IncidentManagementTable: React.FC<ManagementTableProps> = ({
  incidents,
  onSelectIncident,
  onNewIncident,
  onDeleteIncident,
  onUpdateIncidentStatus,
  selectedMonthYear = '',
  setSelectedMonthYear,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(selectedMonthYear || 'all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);

  // Filtered list
  const filteredIncidents = incidents.filter((inc) => {
    if (!inc) return false;
    const fileNum = (inc.fileNumber || '').toLowerCase();
    const location = (inc.exactLocation || '').toLowerCase();
    const sector = (inc.sector || '').toLowerCase();
    const workerName = (inc.workers?.[0]?.fullName || '').toLowerCase();
    const description = (inc.occurrence?.detailedDescription || '').toLowerCase();
    const problem = (inc.causeAnalysis?.identifiedProblem || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      fileNum.includes(term) ||
      location.includes(term) ||
      sector.includes(term) ||
      workerName.includes(term) ||
      description.includes(term) ||
      problem.includes(term);

    const matchesPeriod =
      selectedPeriod === 'all' || !selectedPeriod || (inc.eventDate && inc.eventDate.startsWith(selectedPeriod));
    const matchesType = selectedType === 'all' || inc.eventType === selectedType;
    const matchesSector = selectedSector === 'all' || inc.sector === selectedSector;
    const matchesStatus = selectedStatus === 'all' || inc.status === selectedStatus;

    return matchesSearch && matchesPeriod && matchesType && matchesSector && matchesStatus;
  });

  const getStatusBadge = (status: InvestigationStatus) => {
    switch (status) {
      case 'concluido':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Concluído
          </span>
        );
      case 'acoes_em_andamento':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 mr-1" /> Ações em Andamento
          </span>
        );
      case 'em_investigacao':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> Em Investigação
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Rascunho
          </span>
        );
    }
  };

  const getTypeBadge = (type: OccurrenceType) => {
    switch (type) {
      case 'desvio':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            Desvios
          </span>
        );
      case 'com_afastamento':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            Acidente com Afastamento
          </span>
        );
      case 'sem_afastamento':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Acidente sem Afastamento
          </span>
        );
      case 'incidente':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Incidentes
          </span>
        );
      case 'fatal':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
            Fatal
          </span>
        );
      case 'trajeto':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            Acidente de Trajeto
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Top Filter & Action Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Nº ficha, trabalhador, local, problema, causa raiz..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white shadow text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabela</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded transition cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-white shadow text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
            </div>

            <button
              onClick={onNewIncident}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Ocorrência</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Período / Mês:</span>
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedPeriod(val);
                if (setSelectedMonthYear) {
                  setSelectedMonthYear(val === 'all' ? '' : val);
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none cursor-pointer focus:bg-white focus:border-amber-500 font-medium"
            >
              <option value="all">Todos os Períodos ({incidents.length})</option>
              <option value="2026-08">Agosto / 2026</option>
              <option value="2026-07">Julho / 2026</option>
              <option value="2026-06">Junho / 2026</option>
              <option value="2026-05">Maio / 2026</option>
              <option value="2026-04">Abril / 2026</option>
              <option value="2026-03">Março / 2026</option>
              <option value="2026-02">Fevereiro / 2026</option>
              <option value="2026-01">Janeiro / 2026</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tipo de Ocorrência:
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none cursor-pointer focus:bg-white focus:border-amber-500"
            >
              <option value="all">Todos os Tipos</option>
              <option value="desvio">Desvios</option>
              <option value="incidente">Incidentes</option>
              <option value="sem_afastamento">Acidente sem Afastamento</option>
              <option value="com_afastamento">Acidente com Afastamento</option>
              <option value="fatal">Fatal</option>
              <option value="trajeto">Acidente de Trajeto</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Setor / Área:
            </label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none cursor-pointer focus:bg-white focus:border-amber-500"
            >
              <option value="all">Todos os Setores</option>
              {SECTORS_LIST.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Status da Investigação:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none cursor-pointer focus:bg-white focus:border-amber-500"
            >
              <option value="all">Todos os Status</option>
              <option value="rascunho">Rascunho</option>
              <option value="em_investigacao">Em Investigação</option>
              <option value="acoes_em_andamento">Ações em Andamento</option>
              <option value="concluido">Concluído / Fechado</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3">Nº Ficha</th>
                  <th className="p-3">Data / Turno</th>
                  <th className="p-3">Tipo & Gravidade</th>
                  <th className="p-3">Setor & Local</th>
                  <th className="p-3">Trabalhador Envolvido</th>
                  <th className="p-3">Causa Raiz & Ações</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Nenhuma ocorrência encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((incident) => {
                    const completedActions = incident.actionPlans.filter(
                      (a) => a.status === 'Concluído'
                    ).length;
                    const totalActions = incident.actionPlans.length;

                    return (
                      <React.Fragment key={incident.id}>
                        <tr className="hover:bg-slate-50/80 transition group">
                          {/* File number */}
                          <td className="p-3 font-mono font-bold text-slate-900 align-top">
                            <button
                              onClick={() => onSelectIncident(incident)}
                              className="text-slate-900 hover:text-amber-600 flex items-center space-x-1 cursor-pointer"
                            >
                              <span>{incident.fileNumber}</span>
                            </button>
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                              ID: {incident.id}
                            </span>
                          </td>

                          {/* Date & shift */}
                          <td className="p-3 align-top">
                            <span className="font-semibold text-slate-800 block">
                              {incident.eventDate}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {incident.eventTime} hs • {incident.shift}
                            </span>
                          </td>

                          {/* Type */}
                          <td className="p-3 align-top space-y-1">
                            <div>{getTypeBadge(incident.eventType)}</div>
                            {incident.occurrence.daysLostActual > 0 && (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 block w-fit">
                                {incident.occurrence.daysLostActual} dias perdidos
                              </span>
                            )}
                          </td>

                          {/* Sector & Location */}
                          <td className="p-3 align-top max-w-[200px]">
                            <span className="font-bold text-slate-900 block truncate">
                              {incident.sector}
                            </span>
                            <span className="text-[11px] text-slate-500 line-clamp-1">
                              {incident.exactLocation}
                            </span>
                          </td>

                          {/* Worker */}
                          <td className="p-3 align-top max-w-[180px]">
                            {incident.workers?.some((w) => w.hasWorker) ? (
                              <div>
                                {incident.workers
                                  .filter((w) => w.hasWorker)
                                  .map((w, idx) => (
                                    <div key={w.id} className={idx > 0 ? 'mt-1.5' : ''}>
                                      <span className="font-semibold text-slate-800 block truncate">
                                        {w.fullName}
                                      </span>
                                      <span className="text-[11px] text-slate-500 block truncate">
                                        {w.jobTitle || 'Cargo N/A'}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                Sem vítima
                              </span>
                            )}
                          </td>

                          {/* Root Cause & Actions */}
                          <td className="p-3 align-top max-w-[220px]">
                            <span className="text-[11px] text-slate-700 font-medium line-clamp-2">
                              {incident.causeAnalysis.why5_rootCause ||
                                incident.causeAnalysis.identifiedProblem ||
                                'Análise em andamento'}
                            </span>
                            <div className="flex items-center space-x-1.5 mt-1">
                              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {completedActions}/{totalActions} ações feitas
                              </span>
                              <button
                                onClick={() =>
                                  setExpandedIncidentId(
                                    expandedIncidentId === incident.id ? null : incident.id
                                  )
                                }
                                className="text-[10px] text-amber-600 hover:text-amber-700 underline font-medium cursor-pointer"
                              >
                                {expandedIncidentId === incident.id ? 'Fechar Ações' : 'Ver Ações'}
                              </button>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-3 align-top">
                            {getStatusBadge(incident.status)}
                          </td>

                          {/* Actions */}
                          <td className="p-3 align-top text-right space-x-1">
                            <button
                              onClick={() => onSelectIncident(incident)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                              title="Abrir e Editar Ficha"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => exportIncidentSheetToPDF(incident)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-700 rounded transition cursor-pointer"
                              title="Baixar Ficha em PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja realmente excluir a ficha ${incident.fileNumber}?`)) {
                                  onDeleteIncident(incident.id);
                                }
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-rose-200 text-slate-400 hover:text-rose-700 rounded transition cursor-pointer"
                              title="Excluir Ocorrência"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Action Plans Drawer */}
                        {expandedIncidentId === incident.id && (
                          <tr className="bg-slate-50/90 border-b border-slate-200">
                            <td colSpan={8} className="p-4">
                              <div className="bg-white p-3.5 rounded-lg border border-slate-300 space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                                    <CheckSquare className="w-4 h-4 text-amber-600" />
                                    <span>Planos de Ação 5W2H - Ficha {incident.fileNumber}</span>
                                  </h4>
                                  <button
                                    onClick={() => onSelectIncident(incident)}
                                    className="text-xs text-amber-600 hover:underline font-semibold"
                                  >
                                    Editar Ficha Completa →
                                  </button>
                                </div>

                                {incident.actionPlans.length === 0 ? (
                                  <p className="text-xs text-slate-500 italic">
                                    Nenhuma ação cadastrada para este incidente.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                                    {incident.actionPlans.map((act, idx) => (
                                      <div
                                        key={act.id}
                                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-slate-900">
                                            Ação {idx + 1}
                                          </span>
                                          <span
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                              act.status === 'Concluído'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : act.status === 'Em Andamento'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-amber-100 text-amber-800'
                                            }`}
                                          >
                                            {act.status}
                                          </span>
                                        </div>
                                        <p className="text-slate-800 font-medium">{act.what}</p>
                                        <p className="text-[11px] text-slate-600">
                                          <strong>Como:</strong> {act.how || '-'}
                                        </p>
                                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                                          <span>Resp: {act.who}</span>
                                          <span>Prazo: {act.deadline}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              status: 'rascunho' as InvestigationStatus,
              title: 'Rascunho',
              badgeColor: 'bg-slate-200 text-slate-800',
            },
            {
              status: 'em_investigacao' as InvestigationStatus,
              title: 'Em Investigação',
              badgeColor: 'bg-amber-200 text-amber-900',
            },
            {
              status: 'acoes_em_andamento' as InvestigationStatus,
              title: 'Ações em Andamento',
              badgeColor: 'bg-blue-200 text-blue-900',
            },
            {
              status: 'concluido' as InvestigationStatus,
              title: 'Concluído / Fechado',
              badgeColor: 'bg-emerald-200 text-emerald-900',
            },
          ].map((col) => {
            const columnIncidents = filteredIncidents.filter((i) => i.status === col.status);

            return (
              <div
                key={col.status}
                className="bg-slate-100/90 rounded-xl p-3.5 border border-slate-200 space-y-3 min-h-[450px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-900">{col.title}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                    {columnIncidents.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {columnIncidents.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 italic">
                      Nenhuma ocorrência nesta fase
                    </div>
                  ) : (
                    columnIncidents.map((incident) => (
                      <div
                        key={incident.id}
                        onClick={() => onSelectIncident(incident)}
                        className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:border-amber-400 transition cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {incident.fileNumber}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {incident.eventDate}
                          </span>
                        </div>

                        <div>{getTypeBadge(incident.eventType)}</div>

                        <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                          {incident.causeAnalysis.identifiedProblem ||
                            incident.occurrence.detailedDescription}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="truncate max-w-[120px]">{incident.sector}</span>
                          <span className="font-semibold text-slate-700">
                            {incident.actionPlans.filter((a) => a.status === 'Concluído').length}/
                            {incident.actionPlans.length} Ações
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
