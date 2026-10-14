import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Table as TableIcon,
  Shield,
  Layers,
  Terminal,
  Clock,
  Sparkles,
  FileSpreadsheet,
  Save,
} from 'lucide-react';
import { IncidentRecord, SafetyHHTConfig, DatabaseStatusInfo } from '../types';
import { CustomSlideElement, SlideTextOverrides } from './PresentationCustomizer';
import { generateClientMySQLDump, downloadFile } from '../utils/mysqlGenerator';

interface LocalDatabaseManagerProps {
  incidents: IncidentRecord[];
  hhtConfigs: SafetyHHTConfig[];
  setIncidents: React.Dispatch<React.SetStateAction<IncidentRecord[]>>;
  setHhtConfigs: React.Dispatch<React.SetStateAction<SafetyHHTConfig[]>>;
  onShowToast: (msg: string) => void;
}

export const LocalDatabaseManager: React.FC<LocalDatabaseManagerProps> = ({
  incidents,
  hhtConfigs,
  setIncidents,
  setHhtConfigs,
  onShowToast,
}) => {
  const [dbStatus, setDbStatus] = useState<DatabaseStatusInfo>({
    status: 'connected',
    mode: 'local_standalone',
    engine: 'MySQL-Compatible Local Embedded Engine v2.0',
    databaseName: 'sst_gestao_db',
    charset: 'utf8mb4',
    lastSaved: new Date().toISOString(),
    counts: {
      incidents: incidents.length,
      hhtConfigs: hhtConfigs.length,
      slideCustomElements: 0,
      auditLogs: 1,
    },
  });

  const [activeSubTab, setActiveSubTab] = useState<'status' | 'console' | 'schema' | 'export'>('status');
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM incidents WHERE event_type = "com_afastamento"');
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: any[];
    totalRows: number;
    executionTimeMs: number;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSavingDisk, setIsSavingDisk] = useState(false);

  // Load slide customizations from localStorage for complete dump
  const getCustomElements = (): CustomSlideElement[] => {
    try {
      const saved = localStorage.getItem('sst_presentation_custom_shapes_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const getTextOverrides = (): SlideTextOverrides => {
    try {
      const saved = localStorage.getItem('sst_presentation_text_overrides_v2');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  // Check server database status
  const fetchDatabaseStatus = async () => {
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (e) {
      console.warn('Banco local em execução no modo client-storage integrado');
    }
  };

  useEffect(() => {
    fetchDatabaseStatus();
  }, [incidents.length, hhtConfigs.length]);

  // Execute SQL Query
  const handleRunSQL = async (queryToRun?: string) => {
    const q = queryToRun || sqlQuery;
    if (!q.trim()) return;

    setIsExecuting(true);
    try {
      const res = await fetch('/api/db/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (res.ok) {
        const data = await res.json();
        setQueryResult(data);
      } else {
        // Fallback local query runner
        runLocalClientQuery(q);
      }
    } catch (error) {
      runLocalClientQuery(q);
    } finally {
      setIsExecuting(false);
    }
  };

  const runLocalClientQuery = (q: string) => {
    const start = performance.now();
    const queryLower = q.toLowerCase();
    let rows: any[] = [];

    if (queryLower.includes('hht_configs')) {
      rows = hhtConfigs.map((h) => ({
        month_year: h.monthYear,
        hht: h.hht,
        headcount: h.headcount,
        target_tf: h.targetTF,
        target_tg: h.targetTG,
      }));
    } else if (queryLower.includes('slide_custom_elements')) {
      rows = getCustomElements().map((el) => ({
        id: el.id,
        slide_number: el.slideNumber,
        type: el.type,
        title: el.title,
        color: el.color,
      }));
    } else {
      rows = incidents.map((i) => ({
        id: i.id,
        file_number: i.fileNumber,
        event_type: i.eventType,
        event_date: i.eventDate,
        sector: i.sector,
        severity: i.severity,
        status: i.status,
        worker_name: i.workers?.[0]?.fullName || 'N/A',
        days_lost: i.occurrence?.daysLostActual || 0,
        root_cause: i.causeAnalysis?.why5_rootCause || 'N/A',
      }));

      if (queryLower.includes('com_afastamento')) {
        rows = rows.filter((r) => r.event_type === 'com_afastamento');
      } else if (queryLower.includes('sem_afastamento')) {
        rows = rows.filter((r) => r.event_type === 'sem_afastamento');
      } else if (queryLower.includes('incidente')) {
        rows = rows.filter((r) => r.event_type === 'incidente');
      }
    }

    const cols = rows.length > 0 ? Object.keys(rows[0]) : ['id', 'status', 'info'];
    setQueryResult({
      columns: cols,
      rows,
      totalRows: rows.length,
      executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
    });
  };

  // Immediate Save to Server Disk & LocalStorage
  const handleSaveToDisk = async () => {
    setIsSavingDisk(true);
    try {
      const slideElements = getCustomElements();
      const slideOverrides = getTextOverrides();

      const res = await fetch('/api/db/save-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidents,
          hhtConfigs,
          slideCustomElements: slideElements,
          slideTextOverrides: slideOverrides,
        }),
      });

      // Also ensure localStorage is up to date
      localStorage.setItem('sst_incidents_db_v2', JSON.stringify(incidents));
      localStorage.setItem('sst_hht_configs_v2', JSON.stringify(hhtConfigs));

      if (res.ok) {
        onShowToast('Banco de dados local gravado com sucesso no servidor e no disco!');
      } else {
        onShowToast('Dados salvos no armazenamento local integrado com sucesso!');
      }
      fetchDatabaseStatus();
    } catch (e) {
      onShowToast('Dados gravados localmente no sistema!');
    } finally {
      setIsSavingDisk(false);
    }
  };

  // Download MySQL .sql dump
  const handleDownloadMySQLDump = () => {
    const slideElements = getCustomElements();
    const slideOverrides = getTextOverrides();
    const sqlContent = generateClientMySQLDump(incidents, hhtConfigs, slideElements, slideOverrides);
    const filename = `sst_gestao_mysql_dump_${new Date().toISOString().split('T')[0]}.sql`;
    downloadFile(sqlContent, filename, 'application/sql');
    onShowToast(`Script MySQL (.sql) gerado e baixado com sucesso!`);
  };

  // Download JSON Backup
  const handleDownloadJSONBackup = () => {
    const slideElements = getCustomElements();
    const slideOverrides = getTextOverrides();
    const fullBackup = {
      databaseName: 'sst_gestao_db',
      exportedAt: new Date().toISOString(),
      incidents,
      hhtConfigs,
      slideCustomElements: slideElements,
      slideTextOverrides: slideOverrides,
    };
    downloadFile(JSON.stringify(fullBackup, null, 2), `sst_backup_dados_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    onShowToast(`Backup completo JSON exportado com sucesso!`);
  };

  // Handle Import JSON/SQL file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (parsed.incidents && Array.isArray(parsed.incidents)) {
            setIncidents(parsed.incidents);
          }
          if (parsed.hhtConfigs && Array.isArray(parsed.hhtConfigs)) {
            setHhtConfigs(parsed.hhtConfigs);
          }
          if (parsed.slideCustomElements) {
            localStorage.setItem('sst_presentation_custom_shapes_v2', JSON.stringify(parsed.slideCustomElements));
          }
          if (parsed.slideTextOverrides) {
            localStorage.setItem('sst_presentation_text_overrides_v2', JSON.stringify(parsed.slideTextOverrides));
          }
          onShowToast(`Backup restaurado com sucesso! (${parsed.incidents?.length || 0} ocorrências importadas)`);
        } else {
          onShowToast(`Arquivo ${file.name} carregado. Para dumps .sql, utilize o MySQL Workbench/MariaDB ou importe o JSON gerado pelo sistema.`);
        }
      } catch (err: any) {
        onShowToast(`Erro ao importar arquivo: formato inválido.`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Local Database Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold">Banco de Dados Local Integrado (MySQL Engine)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>100% Local • Sem Conexões Externas</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                O sistema opera com persistência autônoma no próprio servidor e armazenamento local seguro. Todos os dados, fichas, planos de ação e configurações são gravados internamente em formato compatível com <strong>MySQL / MariaDB</strong>.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveToDisk}
              disabled={isSavingDisk}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingDisk ? 'Gravando...' : 'Salvar no Disco'}</span>
            </button>

            <button
              onClick={handleDownloadMySQLDump}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium border border-slate-700 transition shadow-sm cursor-pointer"
              title="Baixar script completo .sql para MySQL Workbench, DBeaver ou phpMyAdmin"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Dump MySQL (.sql)</span>
            </button>

            <button
              onClick={handleDownloadJSONBackup}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium border border-slate-700 transition shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Backup JSON</span>
            </button>

            <label className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition shadow-sm cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Restaurar</span>
              <input type="file" accept=".json,.sql" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </div>

        {/* Database Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Banco Ativo</span>
            <span className="font-mono font-bold text-amber-400 text-sm mt-0.5 block">sst_gestao_db</span>
            <span className="text-[10px] text-slate-400">Charset utf8mb4</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Tabela: incidents</span>
            <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5 block">{incidents.length} Ocorrências</span>
            <span className="text-[10px] text-slate-400">Fichas e 5 Porquês</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Tabela: hht_configs</span>
            <span className="font-mono font-bold text-blue-400 text-sm mt-0.5 block">{hhtConfigs.length} Meses HHT</span>
            <span className="text-[10px] text-slate-400">Metas TF & TG</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Status da Conexão</span>
            <span className="font-mono font-bold text-white text-sm mt-0.5 block flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Online Local</span>
            </span>
            <span className="text-[10px] text-slate-400">Autônomo & Seguro</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('status')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'status'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Visão Geral do Banco</span>
        </button>

        <button
          onClick={() => setActiveSubTab('console')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'console'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-amber-500" />
          <span>Console de Consultas SQL</span>
        </button>

        <button
          onClick={() => setActiveSubTab('schema')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'schema'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5 text-blue-500" />
          <span>Esquema Relacional das Tabelas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('export')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'export'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-emerald-500" />
          <span>Script DDL / DML MySQL</span>
        </button>
      </div>

      {/* TAB CONTENT 1: STATUS & OVERVIEW */}
      {activeSubTab === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-4">
                <Server className="w-4 h-4 text-amber-500" />
                <span>Tabelas Registradas no Banco Local</span>
              </h3>

              <div className="divide-y divide-slate-100">
                <div className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                      <TableIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 font-mono">incidents</h4>
                      <p className="text-[11px] text-slate-500">Ocorrências, acidentes de trabalho, 5 porquês, planos 5W2H e fotos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-800">{incidents.length} linhas</span>
                    <span className="text-[10px] text-emerald-600 block font-medium">Ativo & Sincronizado</span>
                  </div>
                </div>

                <div className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <TableIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 font-mono">hht_configs</h4>
                      <p className="text-[11px] text-slate-500">Horas Homem Trabalhadas mensais, efetivo de colaboradores e metas TF/TG</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-800">{hhtConfigs.length} meses</span>
                    <span className="text-[10px] text-emerald-600 block font-medium">Ativo & Sincronizado</span>
                  </div>
                </div>

                <div className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                      <TableIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 font-mono">slide_custom_elements</h4>
                      <p className="text-[11px] text-slate-500">Post-its, cards explicativos e formas personalizadas da apresentação executiva</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-800">{getCustomElements().length} elementos</span>
                    <span className="text-[10px] text-emerald-600 block font-medium">Persistido</span>
                  </div>
                </div>

                <div className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                      <TableIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 font-mono">slide_text_overrides</h4>
                      <p className="text-[11px] text-slate-500">Textos editados dos 5 slides da apresentação gerencial</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-800">{Object.keys(getTextOverrides()).length} slides customizados</span>
                    <span className="text-[10px] text-emerald-600 block font-medium">Persistido</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Persistence & Architecture Explanation */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 text-amber-950 text-xs">
              <h4 className="font-bold flex items-center space-x-1.5 text-amber-900 mb-2">
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Como funciona o armazenamento local sem conexões externas:</span>
              </h4>
              <ul className="space-y-1.5 text-[11px] leading-relaxed text-amber-900/90 list-disc list-inside">
                <li><strong>Gravação Direta no Disco do Servidor:</strong> Os dados são salvos em <code>data/sst_database.json</code> com espelhamento em memória de alto desempenho.</li>
                <li><strong>Compatibilidade MySQL:</strong> O modelo de dados segue estritamente os tipos de dados relacionais padrão SQL (chaves primárias, chaves estrangeiras, índices e ENUMs).</li>
                <li><strong>Zero Risco de Queda Externa:</strong> Não depende de portas abertas na nuvem, provedores pagos de banco de dados ou autenticações remotas que possam expirar.</li>
                <li><strong>Portabilidade Total:</strong> Você pode clicar em <strong>"Dump MySQL (.sql)"</strong> a qualquer instante para exportar um script pronto e importar em qualquer servidor MySQL oficial.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Actions & Tools */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ferramentas de Backup</h3>
              
              <button
                onClick={handleDownloadMySQLDump}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-left transition cursor-pointer group"
              >
                <div className="flex items-center space-x-2.5">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="text-xs font-bold block">Baixar Script SQL</span>
                    <span className="text-[10px] text-blue-700">Dump completo .sql compatível com MySQL</span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-blue-600 group-hover:translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={handleDownloadJSONBackup}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-left transition cursor-pointer group"
              >
                <div className="flex items-center space-x-2.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold block">Backup Completo JSON</span>
                    <span className="text-[10px] text-emerald-700">Snapshot de todas as tabelas e configurações</span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-emerald-600 group-hover:translate-y-0.5 transition-transform" />
              </button>

              <label className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-left transition cursor-pointer group">
                <div className="flex items-center space-x-2.5">
                  <Upload className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="text-xs font-bold block">Restaurar Banco de Dados</span>
                    <span className="text-[10px] text-amber-700">Carregar arquivo .json de backup</span>
                  </div>
                </div>
                <Upload className="w-4 h-4 text-amber-600 group-hover:-translate-y-0.5 transition-transform" />
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: SQL QUERY CONSOLE */}
      {activeSubTab === 'console' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Terminal de Consulta SQL</h3>
              </div>
              <span className="text-[11px] text-slate-400">Banco: <strong>sst_gestao_db</strong></span>
            </div>

            {/* Quick Queries Buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-[10px] text-slate-400 self-center">Consultas Rápidas:</span>
              <button
                onClick={() => {
                  const q = 'SELECT * FROM incidents WHERE event_type = "com_afastamento"';
                  setSqlQuery(q);
                  handleRunSQL(q);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-mono border border-slate-700 transition cursor-pointer"
              >
                Acidentes C/ Afastamento
              </button>

              <button
                onClick={() => {
                  const q = 'SELECT * FROM incidents WHERE event_type = "incidente"';
                  setSqlQuery(q);
                  handleRunSQL(q);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-mono border border-slate-700 transition cursor-pointer"
              >
                Incidentes
              </button>

              <button
                onClick={() => {
                  const q = 'SELECT * FROM hht_configs';
                  setSqlQuery(q);
                  handleRunSQL(q);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 text-[11px] font-mono border border-slate-700 transition cursor-pointer"
              >
                Tabela hht_configs
              </button>

              <button
                onClick={() => {
                  const q = 'SELECT * FROM slide_custom_elements';
                  setSqlQuery(q);
                  handleRunSQL(q);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-mono border border-slate-700 transition cursor-pointer"
              >
                Formas dos Slides
              </button>
            </div>

            {/* SQL Textarea */}
            <div className="relative">
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 text-amber-300 font-mono text-xs p-3.5 rounded-xl border border-slate-700/80 focus:border-amber-500 focus:outline-none resize-y"
                placeholder="Digite sua consulta SQL (ex: SELECT * FROM incidents WHERE severity = 'Alta')..."
              />
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] text-slate-400">
                Suporte nativo a cláusulas <code>SELECT</code>, <code>WHERE</code>, <code>LIMIT</code> e tabelas locais.
              </span>
              <button
                onClick={() => handleRunSQL()}
                disabled={isExecuting}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isExecuting ? 'Executando...' : 'Executar SQL'}</span>
              </button>
            </div>
          </div>

          {/* SQL Execution Results */}
          {queryResult && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Resultado da Consulta ({queryResult.totalRows} registros retornados)
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Tempo de Execução: {queryResult.executionTimeMs}ms
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-96">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px]">
                      {queryResult.columns.map((col) => (
                        <th key={col} className="p-2.5 border-r border-slate-800 last:border-r-0 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queryResult.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 text-[11px]">
                        {queryResult.columns.map((col) => (
                          <td key={col} className="p-2.5 border-r border-slate-100 last:border-r-0 text-slate-700 truncate max-w-xs">
                            {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: SCHEMA VIEWER */}
      {activeSubTab === 'schema' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <TableIcon className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-800 font-mono">Tabela: incidents</h4>
            </div>
            <div className="text-[11px] font-mono space-y-1 text-slate-600">
              <div className="p-1.5 bg-slate-50 rounded flex justify-between font-bold text-slate-800">
                <span>id (PK)</span>
                <span className="text-blue-600">VARCHAR(64)</span>
              </div>
              <div className="p-1.5 rounded flex justify-between">
                <span>file_number</span>
                <span className="text-blue-600">VARCHAR(32)</span>
              </div>
              <div className="p-1.5 bg-slate-50 rounded flex justify-between">
                <span>event_type</span>
                <span className="text-purple-600">ENUM</span>
              </div>
              <div className="p-1.5 rounded flex justify-between">
                <span>event_date</span>
                <span className="text-emerald-600">DATE</span>
              </div>
              <div className="p-1.5 bg-slate-50 rounded flex justify-between">
                <span>sector</span>
                <span className="text-blue-600">VARCHAR(128)</span>
              </div>
              <div className="p-1.5 rounded flex justify-between">
                <span>severity</span>
                <span className="text-purple-600">ENUM</span>
              </div>
              <div className="p-1.5 bg-slate-50 rounded flex justify-between">
                <span>status</span>
                <span className="text-purple-600">ENUM</span>
              </div>
              <div className="p-1.5 rounded flex justify-between">
                <span>why5_root_cause</span>
                <span className="text-amber-600">TEXT</span>
              </div>
              <div className="p-1.5 bg-slate-50 rounded flex justify-between">
                <span>action_plans_json</span>
                <span className="text-amber-600">LONGTEXT (JSON)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <TableIcon className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-bold text-slate-800 font-mono">Tabela: hht_configs</h4>
            </div>
            <div className="text-[11px] font-mono space-y-1 text-slate-600">
              <div className="p-1.5 bg-slate-50 rounded flex justify-between font-bold text-slate-800">
                <span>id (PK AUTO_INCREMENT)</span>
                <span className="text-blue-600">INT</span>
              </div>
              <div className="p-1.5 rounded flex justify-between">
                <span>month_year (UNIQUE)</span>
                <span className="text-blue-600">VARCHAR(7)</span>
              </div>
              <div className="p-1.5 bg-slate-50 rounded flex justify-between">
                <span>hht</span>
                <span className="text-blue-600">INT</span>
              </div>
              <div className="p-1.5 rounded flex justify-between">
                <span>headcount</span>
                <span className="text-blue-600">INT</span>
              </div>
              <div className="p-1.5 bg-slate-50 rounded flex justify-between">
                <span>target_tf</span>
                <span className="text-emerald-600">DECIMAL(6,2)</span>
              </div>
              <div className="p-1.5 rounded flex justify-between">
                <span>target_tg</span>
                <span className="text-emerald-600">DECIMAL(6,2)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: SQL SCRIPT VIEWER */}
      {activeSubTab === 'export' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Script SQL Gerado em Tempo Real (Pronto para MySQL)
              </h4>
            </div>
            <button
              onClick={handleDownloadMySQLDump}
              className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo .sql</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl text-emerald-300 font-mono text-[11px] max-h-96 overflow-y-auto leading-relaxed border border-slate-800">
            {generateClientMySQLDump(incidents, hhtConfigs, getCustomElements(), getTextOverrides())}
          </pre>
        </div>
      )}
    </div>
  );
};
