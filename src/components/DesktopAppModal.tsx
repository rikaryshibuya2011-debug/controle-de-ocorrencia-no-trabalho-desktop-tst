import React, { useState } from 'react';
import {
  Monitor,
  Download,
  Terminal,
  CheckCircle2,
  Copy,
  FolderArchive,
  Layers,
  X,
  ExternalLink,
  Laptop,
  Shield,
} from 'lucide-react';
import { downloadFile } from '../utils/mysqlGenerator';

interface DesktopAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const DesktopAppModal: React.FC<DesktopAppModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    onShowToast('Comando copiado para a área de transferência!');
    setTimeout(() => setCopiedStep(null), 2500);
  };

  const handleDownloadBatchInstaller = () => {
    const batchContent = `@echo off
chcp 65001 > nul
title SST Gestao de Seguranca do Trabalho - Gerador .EXE

echo ============================================================================
echo   GERADOR DE EXECUTAVEL WINDOWS (.EXE) - SST GESTAO
echo ============================================================================
echo.
echo [1/4] Verificando instalacao do Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org/
    pause
    exit /b
)

echo [2/4] Instalando modulos e Electron...
call npm install
call npm install -D electron electron-builder

echo.
echo [3/4] Compilando aplicacao...
call npm run build

echo.
echo [4/4] Empacotando executavel Windows (.EXE)...
call npx electron-builder --win portable

echo.
echo ============================================================================
echo   CONCLUIDO COM SUCESSO! O .exe esta pronto na pasta: dist/
echo ============================================================================
pause
`;
    downloadFile(batchContent, 'gerar-executavel-sst.bat', 'application/x-bat');
    onShowToast('Arquivo batch gerador (.bat) baixado com sucesso!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center space-x-2">
                <span>Transformar em Aplicativo Executável (.EXE)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Windows Desktop
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute o sistema direto da sua Área de Trabalho sem abrir abas ou depender de internet
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Option A: Quick Batch Generator */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                  Método 1: Gerador Automático com 1 Clique
                </span>
                <h4 className="text-sm font-bold text-slate-100 mt-0.5">
                  Baixar Script Gerador (.BAT)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Baixe este arquivo para a pasta do projeto e dê dois cliques para gerar o <strong>.EXE</strong> instantaneamente no Windows.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadBatchInstaller}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar gerar-executavel-sst.bat</span>
            </button>
          </div>

          {/* Option B: Manual Command Instructions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Método 2: Comandos Rápidos no Prompt / Terminal</span>
            </h4>

            <div className="space-y-2.5 text-xs">
              {/* Step 1 */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">1. Baixar o código do projeto</span>
                  <span className="text-[10px] text-slate-500 font-mono">Menu Exportar ZIP</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  No menu do Google AI Studio, clique em <strong>Exportar para ZIP</strong> e descompacte a pasta no seu computador.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">2. Instalar o empacotador Electron</span>
                  <button
                    onClick={() => copyToClipboard('npm install -D electron electron-builder', 2)}
                    className="flex items-center space-x-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    {copiedStep === 2 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedStep === 2 ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <code className="block bg-slate-900 px-3 py-2 rounded-lg text-amber-300 font-mono text-[11px] select-all">
                  npm install -D electron electron-builder
                </code>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">3. Gerar o arquivo .EXE Portable</span>
                  <button
                    onClick={() => copyToClipboard('npm run dist:exe', 3)}
                    className="flex items-center space-x-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    {copiedStep === 3 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedStep === 3 ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <code className="block bg-slate-900 px-3 py-2 rounded-lg text-emerald-400 font-mono text-[11px] select-all">
                  npm run dist:exe
                </code>
                <p className="text-[11px] text-slate-400">
                  O executável final ficará disponível na pasta <code>dist/SST-Gestao-Portable.exe</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits Info Box */}
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-4 text-emerald-300 text-xs flex items-start space-x-3">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-emerald-200">Vantagens do Aplicativo .EXE Desktop:</strong>
              <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                • Funciona 100% offline, sem necessidade de internet.<br />
                • Todos os acidentes, 5 porquês e gráficos ficam salvos no seu computador.<br />
                • Pode ser colocado em um Pen Drive ou distribuído na rede da empresa.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
