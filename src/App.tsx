import React, { useState, useEffect } from 'react';
import { IncidentRecord, SafetyHHTConfig, ActiveTab, InvestigationStatus } from './types';
import { INITIAL_INCIDENTS, DEFAULT_HHT_CONFIGS } from './utils/initialData';
import { calculateSafetyKPIs } from './utils/kpiCalculator';
import { exportMonthlyReportToPDF, exportToExcel } from './utils/exportUtils';
import { Header } from './components/Header';
import { InvestigationSheetForm } from './components/InvestigationSheetForm';
import { IncidentManagementTable } from './components/IncidentManagementTable';
import { SafetyIndicatorsDashboard } from './components/SafetyIndicatorsDashboard';
import { ExecutivePresentationView } from './components/ExecutivePresentationView';

// Migrate old format (single worker object) to new format (workers array)
const migrateIncidents = (list: any[]): IncidentRecord[] => {
  return list.map((inc) => {
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
};

export default function App() {
  // Persistence via localStorage
  const [incidents, setIncidents] = useState<IncidentRecord[]>(() => {
    const saved = localStorage.getItem('sst_incidents_db_v2');
    if (saved) {
      try {
        return migrateIncidents(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse local storage incidents', e);
      }
    }
    return INITIAL_INCIDENTS;
  });

  const [hhtConfigs, setHhtConfigs] = useState<SafetyHHTConfig[]>(() => {
    const saved = localStorage.getItem('sst_hht_configs_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse local storage HHT configs', e);
      }
    }
    return DEFAULT_HHT_CONFIGS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('ficha');
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('2026-08');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with Server-Side Local Database file on initial load
  useEffect(() => {
    const syncWithServerDb = async () => {
      try {
        const res = await fetch('/api/db/sync');
        if (res.ok) {
          const body = await res.json();
          if (body.data?.incidents && Array.isArray(body.data.incidents) && body.data.incidents.length > 0) {
            const migrated = migrateIncidents(body.data.incidents);
            setIncidents(migrated);
            localStorage.setItem('sst_incidents_db_v2', JSON.stringify(migrated));
          } else {
            // First time seeding server DB from initial data
            await fetch('/api/db/save-all', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                incidents,
                hhtConfigs,
              }),
            });
          }

          if (body.data?.hhtConfigs && Array.isArray(body.data.hhtConfigs) && body.data.hhtConfigs.length > 0) {
            setHhtConfigs(body.data.hhtConfigs);
            localStorage.setItem('sst_hht_configs_v2', JSON.stringify(body.data.hhtConfigs));
          }
        }
      } catch (e) {
        console.warn('Operando com armazenamento local integrado');
      }
    };
    syncWithServerDb();
  }, []);

  // Sync to localStorage & server disk
  useEffect(() => {
    localStorage.setItem('sst_incidents_db_v2', JSON.stringify(incidents));
    // Background sync to server disk
    fetch('/api/db/save-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidents, hhtConfigs }),
    }).catch(() => {});
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('sst_hht_configs_v2', JSON.stringify(hhtConfigs));
    fetch('/api/db/save-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidents, hhtConfigs }),
    }).catch(() => {});
  }, [hhtConfigs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSaveIncident = (incident: IncidentRecord) => {
    setIncidents((prev) => {
      const existsIndex = prev.findIndex((i) => i.id === incident.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = incident;
        return updated;
      }
      return [incident, ...prev];
    });
    setSelectedIncident(incident);
    showToast(`Ficha ${incident.fileNumber} salva com sucesso!`);
  };

  const handleSelectIncident = (incident: IncidentRecord) => {
    setSelectedIncident(incident);
    setActiveTab('ficha');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewIncident = () => {
    setSelectedIncident(null);
    setActiveTab('ficha');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteIncident = (id: string) => {
    setIncidents((prev) => prev.filter((i) => i.id !== id));
    if (selectedIncident?.id === id) {
      setSelectedIncident(null);
    }
    showToast('Ocorrência excluída com sucesso.');
  };

  const handleUpdateIncidentStatus = (id: string, status: InvestigationStatus) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
  };

  const kpis = calculateSafetyKPIs(incidents, hhtConfigs, selectedMonthYear || undefined);

  const getMonthYearLabel = () => {
    if (!selectedMonthYear) return 'Ano Completo 2026';
    const parts = selectedMonthYear.split('-');
    const monthNames: Record<string, string> = {
      '01': 'Janeiro',
      '02': 'Fevereiro',
      '03': 'Março',
      '04': 'Abril',
      '05': 'Maio',
      '06': 'Junho',
      '07': 'Julho',
      '08': 'Agosto',
      '09': 'Setembro',
      '10': 'Outubro',
      '11': 'Novembro',
      '12': 'Dezembro',
    };
    return `${monthNames[parts[1]] || parts[1]} / ${parts[0]}`;
  };

  const handleExportPDF = () => {
    exportMonthlyReportToPDF(incidents, kpis, getMonthYearLabel(), hhtConfigs);
  };

  const handleExportExcel = () => {
    exportToExcel(incidents, kpis, getMonthYearLabel());
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        kpis={kpis}
        onNewIncident={handleNewIncident}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full mx-auto transition-all duration-300 ${
          activeTab === 'apresentacao'
            ? 'max-w-[1600px] px-2 sm:px-6 py-4'
            : 'max-w-7xl px-4 sm:px-6 py-6'
        }`}
      >
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* TAB 1: FICHA DE INVESTIGAÇÃO */}
        {activeTab === 'ficha' && (
          <div className="animate-in fade-in duration-150">
            <InvestigationSheetForm
              initialData={selectedIncident}
              kpis={kpis}
              onSave={handleSaveIncident}
              onCancel={() => setActiveTab('ocorrencias')}
              onSaveAndNew={handleNewIncident}
            />
          </div>
        )}

        {/* TAB 2: GERENCIAMENTO & HISTÓRICO */}
        {activeTab === 'ocorrencias' && (
          <div className="animate-in fade-in duration-150">
            <IncidentManagementTable
              incidents={incidents}
              selectedMonthYear={selectedMonthYear}
              setSelectedMonthYear={setSelectedMonthYear}
              onSelectIncident={handleSelectIncident}
              onNewIncident={handleNewIncident}
              onDeleteIncident={handleDeleteIncident}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
            />
          </div>
        )}

        {/* TAB 3: INDICADORES SST */}
        {activeTab === 'indicadores' && (
          <div className="animate-in fade-in duration-150">
            <SafetyIndicatorsDashboard
              incidents={incidents}
              hhtConfigs={hhtConfigs}
              setHhtConfigs={setHhtConfigs}
              selectedMonthYear={selectedMonthYear}
              setSelectedMonthYear={setSelectedMonthYear}
            />
          </div>
        )}

        {/* TAB 4: APRESENTAÇÃO GERENCIAL */}
        {activeTab === 'apresentacao' && (
          <div className="animate-in fade-in duration-150">
            <ExecutivePresentationView
              incidents={incidents}
              hhtConfigs={hhtConfigs}
              selectedMonthYear={selectedMonthYear}
            />
          </div>
        )}
      </main>
    </div>
  );
}
