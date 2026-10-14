import React from 'react';
import {
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Presentation,
  PlusCircle,
  X,
} from 'lucide-react';
import { ActiveTab, CalculatedSafetyKPIs } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  kpis: CalculatedSafetyKPIs;
  onNewIncident: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  kpis,
  onNewIncident,
  onExportPDF,
  onExportExcel,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo and System Title */}
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center space-x-1.5">
                <span>Gestão SST</span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Investigação de Acidentes, Indicadores e Gestão de Planos de Ação
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <div className="relative flex items-center">
              <button
                onClick={() => setActiveTab('ficha')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === 'ficha'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ficha de Investigação</span>
              </button>
              {activeTab === 'ficha' && (
                <button
                  onClick={() => setActiveTab('ocorrencias')}
                  className="ml-1 flex items-center justify-center w-5 h-5 rounded-full bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                  title="Fechar aba"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setActiveTab('ocorrencias')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'ocorrencias'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Painel de Ocorrências ({kpis.totalIncidents})</span>
            </button>

            <button
              onClick={() => setActiveTab('indicadores')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'indicadores'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Indicadores & Estatísticas</span>
            </button>

            <button
              onClick={() => setActiveTab('apresentacao')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'apresentacao'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span className="relative flex items-center">
                Apresentação Executiva
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onNewIncident}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Ocorrência</span>
            </button>

            <div className="hidden md:flex items-center space-x-1 border-l border-slate-700/80 pl-2">
              <button
                onClick={onExportPDF}
                className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg transition border border-slate-700 cursor-pointer"
                title="Exportar Relatório Mensal em PDF"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden lg:inline">Relatório PDF</span>
              </button>

              <button
                onClick={onExportExcel}
                className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg transition border border-slate-700 cursor-pointer"
                title="Exportar Dados em Planilha Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">Excel</span>
              </button>
            </div>

            <button
              onClick={() => window.close()}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition border border-red-600/30 cursor-pointer"
              title="Fechar Aplicação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
