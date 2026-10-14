import React, { useState } from 'react';
import {
  FileText,
  Save,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  User,
  HelpCircle,
  Wrench,
  Clock,
  MapPin,
  CheckSquare,
  Shield,
  Layers,
  FileCheck,
  Send,
  FileSignature,
  ShieldCheck,
  Edit3,
  XCircle,
} from 'lucide-react';
import {
  IncidentRecord,
  OccurrenceType,
  ActionItem,
  ActionStatus,
  ActionCategory,
  CalculatedSafetyKPIs,
  WorkerData,
} from '../types';
import { SECTORS_LIST, BODY_PARTS_LIST, INJURY_TYPES_LIST } from '../utils/initialData';
import { exportIncidentSheetToPDF } from '../utils/exportUtils';
import { SignatureModal } from './SignatureModal';

interface FormProps {
  initialData?: IncidentRecord | null;
  currentIncident?: IncidentRecord | null;
  setCurrentIncident?: (incident: IncidentRecord) => void;
  kpis?: CalculatedSafetyKPIs;
  onSave: (incident: IncidentRecord) => void;
  onCancel?: () => void;
  onSaveAndNew?: () => void;
}

export const createEmptyIncident = (): IncidentRecord => {
  const currentYear = new Date().getFullYear();
  const randomNum = Math.floor(100 + Math.random() * 900);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().slice(0, 5);

  return {
    id: 'inc-' + Date.now(),
    fileNumber: `FICHA-${currentYear}-${randomNum}`,
    eventType: 'incidente',
    eventDate: dateStr,
    eventTime: timeStr,
    investigationDate: dateStr,
    exactLocation: '',
    sector: SECTORS_LIST[0] || 'Produção / Prensagem',
    shift: '1º Turno',
    companyUnit: 'Unidade Fabril Principal',
    severity: 'Média',
    workers: [
      {
        id: 'wk-' + Date.now(),
        hasWorker: true,
        fullName: '',
        jobTitle: '',
        timeInRole: '',
        gender: 'M',
        contractType: 'CLT',
      },
    ],
    occurrence: {
      detailedDescription: '',
      activityAtMoment: '',
      toolsUsed: '',
      sequenceOfEvents: '',
      hasWitnesses: false,
      witness1Name: '',
      injuredBodyPart: BODY_PARTS_LIST[0] || 'Mãos / Dedos',
      injuryType: INJURY_TYPES_LIST[0] || 'Corte / Laceração',
      daysLostEstimated: 0,
      daysLostActual: 0,
    },
    causeAnalysis: {
      identifiedProblem: '',
      why1: '',
      why2: '',
      why3: '',
      why4: '',
      why5_rootCause: '',
      causeCategory: 'Condição Insegura',
      summary: '',
    },
    actionPlans: [
      {
        id: 'act-' + Date.now(),
        what: '',
        how: '',
        who: '',
        deadline: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        status: 'Pendente',
        category: 'Engenharia / Eliminação',
      },
    ],
    investigationTeam: {
      investigatorName: '',
      investigatorRole: 'Técnico em Segurança do Trabalho',
      investigatorRegistration: '',
      investigatorSigned: false,
      cipaRepresentative: '',
      cipaSigned: false,
      areaManager: '',
      areaManagerSigned: false,
    },
    status: 'rascunho',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Migrate old format (single worker object) to new format (workers array)
const migrateToWorkersArray = (data: IncidentRecord): IncidentRecord => {
  if (data.workers && Array.isArray(data.workers)) {
    return data;
  }
  const oldData = data as any;
  const oldWorker = oldData.worker;
  if (oldWorker && typeof oldWorker === 'object') {
    const { worker: _old, ...rest } = oldData;
    return {
      ...rest,
      workers: [
        {
          id: 'wk-' + Date.now(),
          hasWorker: oldWorker.hasWorker ?? true,
          fullName: oldWorker.fullName ?? '',
          jobTitle: oldWorker.jobTitle ?? '',
          timeInRole: oldWorker.timeInRole ?? '',
          gender: oldWorker.gender ?? 'M',
          age: oldWorker.age,
          registrationNumber: oldWorker.registrationNumber,
          contractType: oldWorker.contractType ?? 'CLT',
          sector: '',
          leader: '',
        },
      ],
    };
  }
  return data;
};

export const InvestigationSheetForm: React.FC<FormProps> = ({
  initialData,
  currentIncident: propIncident,
  setCurrentIncident: propSetCurrentIncident,
  kpis,
  onSave,
  onCancel,
  onSaveAndNew,
}) => {
  const [internalIncident, setInternalIncident] = React.useState<IncidentRecord>(() => {
    const data = initialData || propIncident || createEmptyIncident();
    return migrateToWorkersArray(data);
  });

  React.useEffect(() => {
    if (initialData) {
      setInternalIncident(migrateToWorkersArray(initialData));
    } else if (propIncident) {
      setInternalIncident(migrateToWorkersArray(propIncident));
    } else {
      setInternalIncident(createEmptyIncident());
    }
  }, [initialData, propIncident]);

  const currentIncident = internalIncident;
  const setCurrentIncident = (updated: IncidentRecord | ((prev: IncidentRecord) => IncidentRecord)) => {
    setInternalIncident((prev) => {
      const next = typeof updated === 'function' ? updated(prev) : updated;
      if (propSetCurrentIncident) {
        propSetCurrentIncident(next);
      }
      return next;
    });
  };

  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'visual_tree'>('form');

  // Signature Modal state
  const [signatureModalState, setSignatureModalState] = useState<{
    isOpen: boolean;
    role: 'investigator' | 'cipa' | 'manager';
    roleTitle: string;
    defaultName: string;
    defaultRegistration?: string;
    existingSignature?: string;
  }>({
    isOpen: false,
    role: 'investigator',
    roleTitle: '',
    defaultName: '',
  });

  const openSignatureModal = (role: 'investigator' | 'cipa' | 'manager') => {
    if (role === 'investigator') {
      setSignatureModalState({
        isOpen: true,
        role: 'investigator',
        roleTitle: 'Investigador / Técnico de Segurança do Trabalho',
        defaultName: currentIncident.investigationTeam.investigatorName,
        defaultRegistration: currentIncident.investigationTeam.investigatorRegistration,
        existingSignature: currentIncident.investigationTeam.investigatorSignatureImage,
      });
    } else if (role === 'cipa') {
      setSignatureModalState({
        isOpen: true,
        role: 'cipa',
        roleTitle: 'Representante da CIPA (NR-05)',
        defaultName: currentIncident.investigationTeam.cipaRepresentative,
        existingSignature: currentIncident.investigationTeam.cipaSignatureImage,
      });
    } else if (role === 'manager') {
      setSignatureModalState({
        isOpen: true,
        role: 'manager',
        roleTitle: 'Gestor da Área / Supervisor Operacional',
        defaultName: currentIncident.investigationTeam.areaManager,
        existingSignature: currentIncident.investigationTeam.areaManagerSignatureImage,
      });
    }
  };

  const handleSignatureConfirm = (signatureDataUrl: string, signerName: string, registration?: string) => {
    const dateNow = new Date().toISOString();
    if (signatureModalState.role === 'investigator') {
      setCurrentIncident({
        ...currentIncident,
        investigationTeam: {
          ...currentIncident.investigationTeam,
          investigatorName: signerName,
          investigatorRegistration: registration || currentIncident.investigationTeam.investigatorRegistration,
          investigatorSigned: true,
          investigatorSignatureDate: dateNow,
          investigatorSignatureImage: signatureDataUrl,
        },
      });
    } else if (signatureModalState.role === 'cipa') {
      setCurrentIncident({
        ...currentIncident,
        investigationTeam: {
          ...currentIncident.investigationTeam,
          cipaRepresentative: signerName,
          cipaSigned: true,
          cipaSignatureDate: dateNow,
          cipaSignatureImage: signatureDataUrl,
        },
      });
    } else if (signatureModalState.role === 'manager') {
      setCurrentIncident({
        ...currentIncident,
        investigationTeam: {
          ...currentIncident.investigationTeam,
          areaManager: signerName,
          areaManagerSigned: true,
          areaManagerSignatureDate: dateNow,
          areaManagerSignatureImage: signatureDataUrl,
        },
      });
    }
  };

  const clearSignature = (role: 'investigator' | 'cipa' | 'manager') => {
    if (role === 'investigator') {
      setCurrentIncident({
        ...currentIncident,
        investigationTeam: {
          ...currentIncident.investigationTeam,
          investigatorSigned: false,
          investigatorSignatureDate: undefined,
          investigatorSignatureImage: undefined,
        },
      });
    } else if (role === 'cipa') {
      setCurrentIncident({
        ...currentIncident,
        investigationTeam: {
          ...currentIncident.investigationTeam,
          cipaSigned: false,
          cipaSignatureDate: undefined,
          cipaSignatureImage: undefined,
        },
      });
    } else if (role === 'manager') {
      setCurrentIncident({
        ...currentIncident,
        investigationTeam: {
          ...currentIncident.investigationTeam,
          areaManagerSigned: false,
          areaManagerSignatureDate: undefined,
          areaManagerSignatureImage: undefined,
        },
      });
    }
  };

  const updateWorker = (workerId: string, field: string, value: any) => {
    setCurrentIncident({
      ...currentIncident,
      workers: currentIncident.workers.map((w) =>
        w.id === workerId ? { ...w, [field]: value } : w
      ),
    });
  };

  const addWorker = () => {
    const newWorker: WorkerData = {
      id: 'wk-' + Date.now(),
      hasWorker: true,
      fullName: '',
      jobTitle: '',
      timeInRole: '',
      gender: 'M',
      contractType: 'CLT',
    };
    setCurrentIncident({
      ...currentIncident,
      workers: [...currentIncident.workers, newWorker],
    });
  };

  const removeWorker = (workerId: string) => {
    setCurrentIncident({
      ...currentIncident,
      workers: currentIncident.workers.filter((w) => w.id !== workerId),
    });
  };

  const updateOccurrence = (field: string, value: any) => {
    setCurrentIncident({
      ...currentIncident,
      occurrence: { ...currentIncident.occurrence, [field]: value },
    });
  };

  const updateCause = (field: string, value: any) => {
    setCurrentIncident({
      ...currentIncident,
      causeAnalysis: { ...currentIncident.causeAnalysis, [field]: value },
    });
  };

  const updateTeam = (field: string, value: any) => {
    setCurrentIncident({
      ...currentIncident,
      investigationTeam: { ...currentIncident.investigationTeam, [field]: value },
    });
  };

  // Action plan management
  const addActionItem = () => {
    const newItem: ActionItem = {
      id: 'act-' + Date.now(),
      what: '',
      how: '',
      who: '',
      deadline: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      status: 'Pendente',
      category: 'Engenharia / Eliminação',
      estimatedCost: '',
    };
    setCurrentIncident({
      ...currentIncident,
      actionPlans: [...currentIncident.actionPlans, newItem],
    });
  };

  const updateActionItem = (id: string, field: keyof ActionItem, value: any) => {
    setCurrentIncident({
      ...currentIncident,
      actionPlans: currentIncident.actionPlans.map((act) =>
        act.id === id ? { ...act, [field]: value } : act
      ),
    });
  };

  const removeActionItem = (id: string) => {
    setCurrentIncident({
      ...currentIncident,
      actionPlans: currentIncident.actionPlans.filter((act) => act.id !== id),
    });
  };

  // Handle Save
  const handleSaveClick = () => {
    onSave(currentIncident);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Action & Template Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Ficha de Investigação: {currentIncident.fileNumber}</span>
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleSaveClick}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Ficha</span>
          </button>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Ficha de Investigação salva com sucesso no sistema!</span>
          </div>
          <span className="text-[11px] text-emerald-700">Atualizado no banco de dados</span>
        </div>
      )}

      {/* SECTION 1: IDENTIFICAÇÃO DO EVENTO */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              1
            </div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide">
              IDENTIFICAÇÃO DO EVENTO
            </h3>
          </div>
          <span className="text-[11px] text-slate-300">Dados Gerais da Ocorrência</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Occurrence Type radio group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Tipo de Ocorrência <span className="text-rose-500">*</span>:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[
                {
                  type: 'desvio',
                  label: 'Desvios',
                  desc: 'Desvios de procedimentos e normas de segurança',
                  count: kpis?.deviationCount,
                  color: 'border-orange-400 bg-orange-50/50 text-orange-900',
                  badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
                },
                {
                  type: 'incidente',
                  label: 'Incidentes',
                  desc: 'Sem lesão corporal, com ou sem dano material',
                  count: kpis?.nearMissCount,
                  color: 'border-amber-400 bg-amber-50/50 text-amber-900',
                  badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
                },
                {
                  type: 'sem_afastamento',
                  label: 'Acidente sem Afastamento',
                  desc: 'Atendimento ambulatorial / primeiros socorros',
                  count: kpis?.firstAidCount,
                  color: 'border-blue-400 bg-blue-50/50 text-blue-900',
                  badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
                },
                {
                  type: 'com_afastamento',
                  label: 'Acidente com Afastamento',
                  desc: 'Incapacidade temporária / dias perdidos',
                  count: kpis?.lostTimeCount,
                  color: 'border-rose-400 bg-rose-50/50 text-rose-900',
                  badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
                },
                {
                  type: 'fatal',
                  label: 'Fatal',
                  desc: 'Óbito decorrente de ocorrência de trabalho',
                  count: kpis?.fatalCount,
                  color: 'border-purple-500 bg-purple-50/50 text-purple-950',
                  badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
                },
                {
                  type: 'trajeto',
                  label: 'Acidente de Trajeto',
                  desc: 'Acidente em deslocamento ao/de trabalho',
                  count: kpis?.commuteCount,
                  color: 'border-indigo-400 bg-indigo-50/50 text-indigo-900',
                  badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                },
              ].map((item) => (
                <label
                  key={item.type}
                  className={`flex flex-col justify-between p-3 rounded-lg border-2 cursor-pointer transition ${
                    currentIncident.eventType === item.type
                      ? `${item.color} ring-2 ring-slate-900/10 shadow-sm`
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    <input
                      type="radio"
                      name="eventType"
                      value={item.type}
                      checked={currentIncident.eventType === item.type}
                      onChange={(e) =>
                        setCurrentIncident({
                          ...currentIncident,
                          eventType: e.target.value as OccurrenceType,
                        })
                      }
                      className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold block truncate">{item.label}</span>
                        {item.count !== undefined && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${item.badgeColor}`}
                          >
                            {item.count} reg.
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-1">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Grid fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nº da Ficha:
              </label>
              <input
                type="text"
                value={currentIncident.fileNumber}
                onChange={(e) =>
                  setCurrentIncident({ ...currentIncident, fileNumber: e.target.value })
                }
                className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                placeholder="Ex: FICHA-2026-001"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Fato: <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={currentIncident.eventDate}
                onChange={(e) =>
                  setCurrentIncident({ ...currentIncident, eventDate: e.target.value })
                }
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horário do Fato:
              </label>
              <input
                type="time"
                value={currentIncident.eventTime}
                onChange={(e) =>
                  setCurrentIncident({ ...currentIncident, eventTime: e.target.value })
                }
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data da Investigação:
              </label>
              <input
                type="date"
                value={currentIncident.investigationDate}
                onChange={(e) =>
                  setCurrentIncident({ ...currentIncident, investigationDate: e.target.value })
                }
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Local Exato do Fato: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={currentIncident.exactLocation}
                onChange={(e) =>
                  setCurrentIncident({ ...currentIncident, exactLocation: e.target.value })
                }
                placeholder="Ex: Linha de Prensagem 03 - Galpão B, próximo ao painel principal"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Setor / Área: <span className="text-rose-500">*</span>
              </label>
              <select
                value={currentIncident.sector}
                onChange={(e) =>
                  setCurrentIncident({ ...currentIncident, sector: e.target.value })
                }
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              >
                {SECTORS_LIST.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Turno de Trabalho:
              </label>
              <select
                value={currentIncident.shift}
                onChange={(e) =>
                  setCurrentIncident({ ...currentIncident, shift: e.target.value as any })
                }
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              >
                <option value="1º Turno">1º Turno (Manhã)</option>
                <option value="2º Turno">2º Turno (Tarde)</option>
                <option value="3º Turno">3º Turno (Noite)</option>
                <option value="Administrativo">Administrativo (Comercial)</option>
                <option value="Turno de Revezamento">Turno de Revezamento 12x36</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: DADOS DOS TRABALHADORES ENVOLVIDOS */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              2
            </div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide">
              DADOS DOS TRABALHADORES ENVOLVIDOS
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-[11px] text-slate-300">{currentIncident.workers.length} colaborador(es)</span>
            <button
              onClick={addWorker}
              className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Colaborador</span>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {currentIncident.workers.map((worker, idx) => (
            <div
              key={worker.id}
              className={`border rounded-xl p-4 space-y-4 ${
                idx % 2 === 0 ? 'bg-slate-50/50 border-slate-200' : 'bg-amber-50/30 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Colaborador {idx + 1}
                  </span>
                  <label className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={worker.hasWorker}
                      onChange={(e) => updateWorker(worker.id, 'hasWorker', e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Vítima Envolvida</span>
                  </label>
                </div>
                {currentIncident.workers.length > 1 && (
                  <button
                    onClick={() => removeWorker(worker.id)}
                    className="flex items-center space-x-1 text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                )}
              </div>

              {worker.hasWorker && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome Completo: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={worker.fullName}
                      onChange={(e) => updateWorker(worker.id, 'fullName', e.target.value)}
                      placeholder="Ex: Carlos Eduardo Silveira"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Função / Cargo:
                    </label>
                    <input
                      type="text"
                      value={worker.jobTitle}
                      onChange={(e) => updateWorker(worker.id, 'jobTitle', e.target.value)}
                      placeholder="Ex: Operador de Prensa II"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tempo na Função:
                    </label>
                    <input
                      type="text"
                      value={worker.timeInRole}
                      onChange={(e) => updateWorker(worker.id, 'timeInRole', e.target.value)}
                      placeholder="Ex: 2 anos e 3 meses"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Setor do Colaborador:
                    </label>
                    <input
                      type="text"
                      value={worker.sector || ''}
                      onChange={(e) => updateWorker(worker.id, 'sector', e.target.value)}
                      placeholder="Ex: Produção / Prensagem"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Líder Responsável:
                    </label>
                    <input
                      type="text"
                      value={worker.leader || ''}
                      onChange={(e) => updateWorker(worker.id, 'leader', e.target.value)}
                      placeholder="Ex: João Silva (Supervisor)"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gênero:
                    </label>
                    <div className="flex items-center space-x-3 text-xs text-slate-700 py-1.5">
                      {[
                        { value: 'M', label: '( ) M' },
                        { value: 'F', label: '( ) F' },
                        { value: 'Outro', label: '( ) Outro' },
                      ].map((g) => (
                        <label key={g.value} className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`gender-${worker.id}`}
                            value={g.value}
                            checked={worker.gender === g.value}
                            onChange={(e) => updateWorker(worker.id, 'gender', e.target.value)}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <span className="font-medium">{g.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Idade (Anos):
                    </label>
                    <input
                      type="number"
                      value={worker.age || ''}
                      onChange={(e) => updateWorker(worker.id, 'age', parseInt(e.target.value) || undefined)}
                      placeholder="Ex: 34"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Matrícula / ID:
                    </label>
                    <input
                      type="text"
                      value={worker.registrationNumber || ''}
                      onChange={(e) => updateWorker(worker.id, 'registrationNumber', e.target.value)}
                      placeholder="Ex: MAT-4482"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tipo de Vínculo:
                    </label>
                    <select
                      value={worker.contractType || 'CLT'}
                      onChange={(e) => updateWorker(worker.id, 'contractType', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                    >
                      <option value="CLT">CLT (Efetivo)</option>
                      <option value="Terceiro">Prestador Terceirizado</option>
                      <option value="Temporário">Trabalho Temporário</option>
                      <option value="Estagiário">Estagiário / Jovem Aprendiz</option>
                      <option value="PJ">PJ / Autônomo</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: DESCRIÇÃO DA OCORRÊNCIA */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              3
            </div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide">
              DESCRIÇÃO DA OCORRÊNCIA
            </h3>
          </div>
          <span className="text-[11px] text-slate-300">Fatos, Ferramentas, Lesão e Testemunhas</span>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descreva detalhadamente o que aconteceu, a atividade exercida no momento, ferramentas utilizadas e a sequência dos fatos: <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={currentIncident.occurrence.detailedDescription}
              onChange={(e) => updateOccurrence('detailedDescription', e.target.value)}
              placeholder="Descreva de forma clara e cronológica todos os acontecimentos, intervenções manuais, condições do ambiente..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:bg-white focus:border-amber-500 outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Atividade exercida no momento exato:
              </label>
              <input
                type="text"
                value={currentIncident.occurrence.activityAtMoment}
                onChange={(e) => updateOccurrence('activityAtMoment', e.target.value)}
                placeholder="Ex: Alimentação de chapas metálicas na prensa"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ferramentas / Máquinas utilizadas:
              </label>
              <input
                type="text"
                value={currentIncident.occurrence.toolsUsed}
                onChange={(e) => updateOccurrence('toolsUsed', e.target.value)}
                placeholder="Ex: Prensa hidráulica 40T, pinça manual, chave 19mm"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sequência dos Fatos (Passo a passo):
            </label>
            <textarea
              rows={2}
              value={currentIncident.occurrence.sequenceOfEvents}
              onChange={(e) => updateOccurrence('sequenceOfEvents', e.target.value)}
              placeholder="1. Colaborador iniciou tarefa... 2. Houve travamento... 3. Intervenção sem bloqueio..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
            />
          </div>

          {/* Lesão / Corpo / Afastamento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parte do Corpo Atingida:
              </label>
              <select
                value={currentIncident.occurrence.injuredBodyPart}
                onChange={(e) => updateOccurrence('injuredBodyPart', e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              >
                {BODY_PARTS_LIST.map((part) => (
                  <option key={part} value={part}>
                    {part}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Lesão:
              </label>
              <select
                value={currentIncident.occurrence.injuryType}
                onChange={(e) => updateOccurrence('injuryType', e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              >
                {INJURY_TYPES_LIST.map((inj) => (
                  <option key={inj} value={inj}>
                    {inj}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dias de Afastamento (Perdidos):
              </label>
              <input
                type="number"
                min={0}
                value={currentIncident.occurrence.daysLostActual}
                onChange={(e) =>
                  updateOccurrence('daysLostActual', parseInt(e.target.value) || 0)
                }
                placeholder="Ex: 12 dias"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none font-bold"
              />
            </div>
          </div>

          {/* Testemunhas */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Houve Testemunhas?
              </label>
              <div className="flex items-center space-x-3 text-xs">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="hasWitnesses"
                    checked={currentIncident.occurrence.hasWitnesses === true}
                    onChange={() => updateOccurrence('hasWitnesses', true)}
                    className="text-amber-600"
                  />
                  <span>( ) Sim</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="hasWitnesses"
                    checked={currentIncident.occurrence.hasWitnesses === false}
                    onChange={() => updateOccurrence('hasWitnesses', false)}
                    className="text-amber-600"
                  />
                  <span>( ) Não</span>
                </label>
              </div>
            </div>

            {currentIncident.occurrence.hasWitnesses && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Nome da Testemunha 1:
                  </label>
                  <input
                    type="text"
                    value={currentIncident.occurrence.witness1Name}
                    onChange={(e) => updateOccurrence('witness1Name', e.target.value)}
                    placeholder="Nome completo e cargo da testemunha"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Contato / Telefone Testemunha:
                  </label>
                  <input
                    type="text"
                    value={currentIncident.occurrence.witness1Contact || ''}
                    onChange={(e) => updateOccurrence('witness1Contact', e.target.value)}
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 4: ANÁLISE DE CAUSAS (METODOLOGIA DOS 5 PORQUÊS) */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-4 py-2.5 flex flex-wrap items-center justify-between text-white gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              4
            </div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide">
              ANÁLISE DE CAUSAS (Metodologia dos 5 Porquês)
            </h3>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Problema Identificado */}
          <div className="bg-amber-50/60 p-3.5 rounded-lg border border-amber-200">
            <label className="block text-xs font-bold text-amber-950 mb-1">
              Problema identificado: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={currentIncident.causeAnalysis.identifiedProblem}
              onChange={(e) => updateCause('identifiedProblem', e.target.value)}
              placeholder="Ex: Esmagamento de falange por contato em prensa mecânica em ciclo automático"
              className="w-full text-xs font-semibold bg-white border border-amber-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* 5 Whys Chain */}
          <div className="space-y-3 pl-2 border-l-2 border-amber-400">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="text-xs font-bold text-slate-700 sm:w-56 sm:min-w-[220px] shrink-0">
                1º Porquê (Causa Imediata):
              </label>
              <input
                type="text"
                value={currentIncident.causeAnalysis.why1}
                onChange={(e) => updateCause('why1', e.target.value)}
                placeholder="Qual evento ou falha física direta provocou a ocorrência?"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="text-xs font-bold text-slate-700 sm:w-56 sm:min-w-[220px] shrink-0">
                2º Porquê:
              </label>
              <input
                type="text"
                value={currentIncident.causeAnalysis.why2}
                onChange={(e) => updateCause('why2', e.target.value)}
                placeholder="Por que a causa imediata ocorreu?"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="text-xs font-bold text-slate-700 sm:w-56 sm:min-w-[220px] shrink-0">
                3º Porquê:
              </label>
              <input
                type="text"
                value={currentIncident.causeAnalysis.why3}
                onChange={(e) => updateCause('why3', e.target.value)}
                placeholder="Por que a condição insegura ou o desvio existia no local?"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="text-xs font-bold text-slate-700 sm:w-56 sm:min-w-[220px] shrink-0">
                4º Porquê:
              </label>
              <input
                type="text"
                value={currentIncident.causeAnalysis.why4}
                onChange={(e) => updateCause('why4', e.target.value)}
                placeholder="Por que as barreiras de controle, rotinas ou manutenção falharam?"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 bg-rose-50/80 p-3 rounded-lg border border-rose-200">
              <label className="text-xs font-bold text-rose-900 sm:w-56 sm:min-w-[220px] shrink-0">
                5º Porquê (Causa Raiz):
              </label>
              <input
                type="text"
                value={currentIncident.causeAnalysis.why5_rootCause}
                onChange={(e) => updateCause('why5_rootCause', e.target.value)}
                placeholder="Qual a causa raiz sistêmica e definitiva (engenharia/gestão)?"
                className="w-full text-xs font-bold bg-white border border-rose-300 rounded-lg px-3 py-2 text-rose-950 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Classificação da Causa Principal:
              </label>
              <select
                value={currentIncident.causeAnalysis.causeCategory}
                onChange={(e) => updateCause('causeCategory', e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              >
                <option value="Condição Insegura">Condição Insegura / Ambiente</option>
                <option value="Ato Inseguro / Desvio">Ato Inseguro / Comportamento</option>
                <option value="Falha de Processo">Falha de Processo Operacional</option>
                <option value="Equipamento / Proteção">Equipamento / Falha de Proteção / EPI</option>
                <option value="Fator Humano / Treinamento">Fator Humano / Falta de Treinamento</option>
                <option value="Gestão e Procedimentos">Gestão, Liderança e Procedimentos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resumo Causal Executivo:
              </label>
              <input
                type="text"
                value={currentIncident.causeAnalysis.summary || ''}
                onChange={(e) => updateCause('summary', e.target.value)}
                placeholder="Breve resumo da conclusão da investigação"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: PLANO DE AÇÃO (MEDIDAS CORRETIVAS E PREVENTIVAS) */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-4 py-2.5 flex flex-wrap items-center justify-between text-white gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              5
            </div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide">
              PLANO DE AÇÃO (Medidas Corretivas e Preventivas - 5W2H)
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={addActionItem}
              className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Ação</span>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-600 italic">
            Defina as ações para que a causa raiz identificada acima <strong>nunca mais volte a acontecer</strong>.
          </p>

          {currentIncident.actionPlans.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-slate-700">Nenhuma ação preventiva cadastrada para esta ficha.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Clique em "Adicionar Ação" ou use o botão de IA acima.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 min-w-[200px]">O que fazer? (Ação)</th>
                    <th className="p-2.5 min-w-[200px]">Como fazer? (Método)</th>
                    <th className="p-2.5 min-w-[140px]">Quem fará? (Responsável)</th>
                    <th className="p-2.5 min-w-[110px]">Até quando? (Prazo)</th>
                    <th className="p-2.5 min-w-[120px]">Status</th>
                    <th className="p-2.5 w-10 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentIncident.actionPlans.map((action, idx) => (
                    <tr key={action.id} className="hover:bg-slate-50/60">
                      <td className="p-2 align-top">
                        <textarea
                          rows={2}
                          value={action.what}
                          onChange={(e) => updateActionItem(action.id, 'what', e.target.value)}
                          placeholder="Ex: Instalação de intertravamento de segurança Categoria 4"
                          className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 focus:border-amber-500 outline-none"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <textarea
                          rows={2}
                          value={action.how}
                          onChange={(e) => updateActionItem(action.id, 'how', e.target.value)}
                          placeholder="Ex: Adequação com empresa credenciada e teste de validação"
                          className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 focus:border-amber-500 outline-none"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <input
                          type="text"
                          value={action.who}
                          onChange={(e) => updateActionItem(action.id, 'who', e.target.value)}
                          placeholder="Ex: Roberto (Manutenção)"
                          className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 focus:border-amber-500 outline-none"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <input
                          type="date"
                          value={action.deadline}
                          onChange={(e) => updateActionItem(action.id, 'deadline', e.target.value)}
                          className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 focus:border-amber-500 outline-none"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <select
                          value={action.status}
                          onChange={(e) =>
                            updateActionItem(action.id, 'status', e.target.value as ActionStatus)
                          }
                          className={`w-full text-xs font-semibold rounded p-1.5 border outline-none ${
                            action.status === 'Concluído'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : action.status === 'Em Andamento'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : action.status === 'Cancelado'
                              ? 'bg-slate-100 text-slate-500 border-slate-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Em Andamento">Em Andamento</option>
                          <option value="Concluído">Concluído</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td className="p-2 align-top text-center">
                        <button
                          onClick={() => removeActionItem(action.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                          title="Remover ação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 6: RESPONSÁVEIS PELA INVESTIGAÇÃO */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              6
            </div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide">
              RESPONSÁVEIS PELA INVESTIGAÇÃO & ASSINATURA DIGITAL
            </h3>
          </div>
          <span className="text-[11px] text-slate-300">Validação Técnica e Assinaturas Eletrônicas</span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Investigador / Técnico SST */}
          <div className={`p-4 rounded-xl border transition-all ${
            currentIncident.investigationTeam.investigatorSigned
              ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/30'
              : 'bg-slate-50 border-slate-200'
          } space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                1. Investigador / Técnico SST:
              </span>
              {currentIncident.investigationTeam.investigatorSigned ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Assinado</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-medium">Pendente</span>
              )}
            </div>

            <input
              type="text"
              value={currentIncident.investigationTeam.investigatorName}
              onChange={(e) => updateTeam('investigatorName', e.target.value)}
              placeholder="Nome do Investigador / Técnico"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-amber-500 outline-none"
            />
            <input
              type="text"
              value={currentIncident.investigationTeam.investigatorRegistration || ''}
              onChange={(e) => updateTeam('investigatorRegistration', e.target.value)}
              placeholder="Nº Reg. MTE / CREA (Ex: MTE/SP 0089421)"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-amber-500 outline-none"
            />

            {/* Signature Box / Trigger */}
            {currentIncident.investigationTeam.investigatorSigned ? (
              <div className="space-y-2 pt-1 border-t border-emerald-200">
                <div className="bg-white rounded-lg p-2.5 border border-emerald-200 shadow-sm flex flex-col items-center justify-center min-h-[70px]">
                  {currentIncident.investigationTeam.investigatorSignatureImage ? (
                    <img
                      src={currentIncident.investigationTeam.investigatorSignatureImage}
                      alt="Assinatura Investigador"
                      className="max-h-12 object-contain"
                    />
                  ) : (
                    <div className="text-xs font-serif italic text-slate-800">
                      {currentIncident.investigationTeam.investigatorName || 'Assinado Digitalmente'}
                    </div>
                  )}
                  {currentIncident.investigationTeam.investigatorSignatureDate && (
                    <span className="text-[10px] text-slate-400 mt-1">
                      Validado em {new Date(currentIncident.investigationTeam.investigatorSignatureDate).toLocaleDateString('pt-BR')} às {new Date(currentIncident.investigationTeam.investigatorSignatureDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => openSignatureModal('investigator')}
                    className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Alterar Assinatura</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => clearSignature('investigator')}
                    className="flex items-center space-x-1 text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Remover</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-1 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => openSignatureModal('investigator')}
                  className="w-full flex items-center justify-center space-x-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-400 hover:border-emerald-500 text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition cursor-pointer"
                >
                  <FileSignature className="w-4 h-4 text-emerald-600" />
                  <span>Incluir Assinatura Digital</span>
                </button>
              </div>
            )}
          </div>

          {/* Representante CIPA */}
          <div className={`p-4 rounded-xl border transition-all ${
            currentIncident.investigationTeam.cipaSigned
              ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/30'
              : 'bg-slate-50 border-slate-200'
          } space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                2. Representante da CIPA:
              </span>
              {currentIncident.investigationTeam.cipaSigned ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Assinado</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-medium">Pendente</span>
              )}
            </div>

            <input
              type="text"
              value={currentIncident.investigationTeam.cipaRepresentative}
              onChange={(e) => updateTeam('cipaRepresentative', e.target.value)}
              placeholder="Nome do Representante da CIPA"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-amber-500 outline-none"
            />
            <div className="text-[11px] text-slate-500 italic">
              Participação obrigatória na análise conforme NR-05
            </div>

            {/* Signature Box / Trigger */}
            {currentIncident.investigationTeam.cipaSigned ? (
              <div className="space-y-2 pt-1 border-t border-emerald-200">
                <div className="bg-white rounded-lg p-2.5 border border-emerald-200 shadow-sm flex flex-col items-center justify-center min-h-[70px]">
                  {currentIncident.investigationTeam.cipaSignatureImage ? (
                    <img
                      src={currentIncident.investigationTeam.cipaSignatureImage}
                      alt="Assinatura CIPA"
                      className="max-h-12 object-contain"
                    />
                  ) : (
                    <div className="text-xs font-serif italic text-slate-800">
                      {currentIncident.investigationTeam.cipaRepresentative || 'Assinado Digitalmente'}
                    </div>
                  )}
                  {currentIncident.investigationTeam.cipaSignatureDate && (
                    <span className="text-[10px] text-slate-400 mt-1">
                      Validado em {new Date(currentIncident.investigationTeam.cipaSignatureDate).toLocaleDateString('pt-BR')} às {new Date(currentIncident.investigationTeam.cipaSignatureDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => openSignatureModal('cipa')}
                    className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Alterar Assinatura</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => clearSignature('cipa')}
                    className="flex items-center space-x-1 text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Remover</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-1 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => openSignatureModal('cipa')}
                  className="w-full flex items-center justify-center space-x-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-400 hover:border-emerald-500 text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition cursor-pointer"
                >
                  <FileSignature className="w-4 h-4 text-emerald-600" />
                  <span>Incluir Assinatura CIPA</span>
                </button>
              </div>
            )}
          </div>

          {/* Gestor da Área / Liderança */}
          <div className={`p-4 rounded-xl border transition-all ${
            currentIncident.investigationTeam.areaManagerSigned
              ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/30'
              : 'bg-slate-50 border-slate-200'
          } space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                3. Gestor da Área / Supervisor:
              </span>
              {currentIncident.investigationTeam.areaManagerSigned ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Aprovado</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-medium">Pendente</span>
              )}
            </div>

            <input
              type="text"
              value={currentIncident.investigationTeam.areaManager}
              onChange={(e) => updateTeam('areaManager', e.target.value)}
              placeholder="Nome do Gestor do Setor"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:border-amber-500 outline-none"
            />

            <div className="flex items-center space-x-2">
              <label className="text-[11px] font-semibold text-slate-600">Status Geral:</label>
              <select
                value={currentIncident.status}
                onChange={(e) =>
                  setCurrentIncident({ ...currentIncident, status: e.target.value as any })
                }
                className="text-xs font-bold bg-white border border-slate-300 rounded px-2 py-1 outline-none text-slate-900 w-full"
              >
                <option value="rascunho">Rascunho</option>
                <option value="em_investigacao">Em Investigação</option>
                <option value="acoes_em_andamento">Ações em Andamento</option>
                <option value="concluido">Concluído e Aprovado</option>
              </select>
            </div>

            {/* Signature Box / Trigger */}
            {currentIncident.investigationTeam.areaManagerSigned ? (
              <div className="space-y-2 pt-1 border-t border-emerald-200">
                <div className="bg-white rounded-lg p-2.5 border border-emerald-200 shadow-sm flex flex-col items-center justify-center min-h-[70px]">
                  {currentIncident.investigationTeam.areaManagerSignatureImage ? (
                    <img
                      src={currentIncident.investigationTeam.areaManagerSignatureImage}
                      alt="Assinatura Gestor"
                      className="max-h-12 object-contain"
                    />
                  ) : (
                    <div className="text-xs font-serif italic text-slate-800">
                      {currentIncident.investigationTeam.areaManager || 'Aprovado Digitalmente'}
                    </div>
                  )}
                  {currentIncident.investigationTeam.areaManagerSignatureDate && (
                    <span className="text-[10px] text-slate-400 mt-1">
                      Aprovado em {new Date(currentIncident.investigationTeam.areaManagerSignatureDate).toLocaleDateString('pt-BR')} às {new Date(currentIncident.investigationTeam.areaManagerSignatureDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => openSignatureModal('manager')}
                    className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Alterar Assinatura</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => clearSignature('manager')}
                    className="flex items-center space-x-1 text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Remover</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-1 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => openSignatureModal('manager')}
                  className="w-full flex items-center justify-center space-x-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-400 hover:border-emerald-500 text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition cursor-pointer"
                >
                  <FileSignature className="w-4 h-4 text-emerald-600" />
                  <span>Aprovar com Assinatura</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom Sticky Action Bar */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-lg border border-slate-800">
        <div className="flex items-center space-x-3">
          <FileCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <span className="text-xs font-bold block">
              {currentIncident.fileNumber} - Status: {currentIncident.status.toUpperCase()}
            </span>
            <span className="text-[11px] text-slate-400">
              {currentIncident.actionPlans.length} ações corretivas/preventivas cadastradas
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onSaveAndNew}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg transition border border-slate-700 cursor-pointer"
          >
            Limpar / Nova Ficha
          </button>

          <button
            onClick={() => exportIncidentSheetToPDF(currentIncident)}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-rose-400" />
            <span>PDF da Ficha</span>
          </button>

          <button
            onClick={handleSaveClick}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition flex items-center space-x-1.5 shadow cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Ocorrência</span>
          </button>
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={signatureModalState.isOpen}
        onClose={() => setSignatureModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleSignatureConfirm}
        roleTitle={signatureModalState.roleTitle}
        defaultName={signatureModalState.defaultName}
        defaultRegistration={signatureModalState.defaultRegistration}
        existingSignature={signatureModalState.existingSignature}
      />
    </div>
  );
};
