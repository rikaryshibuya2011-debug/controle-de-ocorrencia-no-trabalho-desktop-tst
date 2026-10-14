import React, { useState, useEffect, useRef } from 'react';
import {
  Presentation,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Award,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  FileText,
  Sun,
  Moon,
  RotateCcw,
  Volume2,
  Eye,
  Sliders,
  Tv,
  Edit3,
  Sparkles,
  Type,
  PlusCircle,
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
  getCauseCategoryStats,
} from '../utils/kpiCalculator';
import { exportMonthlyReportToPDF } from '../utils/exportUtils';
import {
  CustomSlideElement,
  SlideTextOverrides,
  DEFAULT_TEXT_OVERRIDES,
} from './PresentationCustomizer';
import { PresentationCustomShapes } from './PresentationCustomShapes';
import { SlideTextEditorModal } from './SlideTextEditorModal';

interface PresentationProps {
  incidents: IncidentRecord[];
  hhtConfigs: SafetyHHTConfig[];
  selectedMonthYear: string;
}

export const ExecutivePresentationView: React.FC<PresentationProps> = ({
  incidents,
  hhtConfigs,
  selectedMonthYear,
}) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [meetingTimer, setMeetingTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });

  // Custom Shapes and Text Overrides states with LocalStorage persistence
  const [isEditMode, setIsEditMode] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);

  const [customElements, setCustomElements] = useState<CustomSlideElement[]>(() => {
    try {
      const saved = localStorage.getItem('sst_slide_custom_elements_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load custom slide elements', e);
    }
    return [
      {
        id: 'init-1',
        slideNumber: 1,
        type: 'sticky_note',
        title: 'Nota do Apresentador',
        content: 'Reforçar o compromisso de toda a liderança com a meta de Zero Acidente no próximo trimestre.',
        color: 'amber',
      },
      {
        id: 'init-2',
        slideNumber: 3,
        type: 'badge_pill',
        title: 'Auditoria de Máquinas NR-12',
        content: '100% dos botões de emergência e cortinas ópticas testados.',
        color: 'emerald',
        icon: 'shield',
      },
    ];
  });

  const [textOverrides, setTextOverrides] = useState<SlideTextOverrides>(() => {
    try {
      const saved = localStorage.getItem('sst_slide_text_overrides_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load text overrides', e);
    }
    return DEFAULT_TEXT_OVERRIDES;
  });

  // Persist custom elements
  useEffect(() => {
    try {
      localStorage.setItem('sst_slide_custom_elements_v1', JSON.stringify(customElements));
    } catch (e) {
      console.error('Failed to save custom slide elements', e);
    }
  }, [customElements]);

  // Persist text overrides
  useEffect(() => {
    try {
      localStorage.setItem('sst_slide_text_overrides_v1', JSON.stringify(textOverrides));
    } catch (e) {
      console.error('Failed to save text overrides', e);
    }
  }, [textOverrides]);

  const handleAddElement = (element: Omit<CustomSlideElement, 'id'>) => {
    const newEl: CustomSlideElement = {
      ...element,
      id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setCustomElements((prev) => [...prev, newEl]);
  };

  const handleUpdateElement = (id: string, updated: Partial<CustomSlideElement>) => {
    setCustomElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updated } : el))
    );
  };

  const handleDeleteElement = (id: string) => {
    setCustomElements((prev) => prev.filter((el) => el.id !== id));
  };

  const handleResetSlideOverrides = (slideNum: number) => {
    setTextOverrides((prev) => {
      const updated = { ...prev };
      if (slideNum === 1) {
        updated.slide1Title = DEFAULT_TEXT_OVERRIDES.slide1Title;
        updated.slide1Subtitle = DEFAULT_TEXT_OVERRIDES.slide1Subtitle;
        updated.slide1PlacarTitle = DEFAULT_TEXT_OVERRIDES.slide1PlacarTitle;
        updated.slide1PlacarSub = DEFAULT_TEXT_OVERRIDES.slide1PlacarSub;
      } else if (slideNum === 2) {
        updated.slide2Title = DEFAULT_TEXT_OVERRIDES.slide2Title;
        updated.slide2Subtitle = DEFAULT_TEXT_OVERRIDES.slide2Subtitle;
        updated.slide2PyramidConclusion = DEFAULT_TEXT_OVERRIDES.slide2PyramidConclusion;
      } else if (slideNum === 3) {
        updated.slide3Title = DEFAULT_TEXT_OVERRIDES.slide3Title;
        updated.slide3Subtitle = DEFAULT_TEXT_OVERRIDES.slide3Subtitle;
        updated.slide3AuditingTitle = DEFAULT_TEXT_OVERRIDES.slide3AuditingTitle;
        updated.slide3SectorNote1Title = DEFAULT_TEXT_OVERRIDES.slide3SectorNote1Title;
        updated.slide3SectorNote1Desc = DEFAULT_TEXT_OVERRIDES.slide3SectorNote1Desc;
        updated.slide3SectorNote2Title = DEFAULT_TEXT_OVERRIDES.slide3SectorNote2Title;
        updated.slide3SectorNote2Desc = DEFAULT_TEXT_OVERRIDES.slide3SectorNote2Desc;
        updated.slide3SectorNote3Title = DEFAULT_TEXT_OVERRIDES.slide3SectorNote3Title;
        updated.slide3SectorNote3Desc = DEFAULT_TEXT_OVERRIDES.slide3SectorNote3Desc;
      } else if (slideNum === 4) {
        updated.slide4Title = DEFAULT_TEXT_OVERRIDES.slide4Title;
        updated.slide4Subtitle = DEFAULT_TEXT_OVERRIDES.slide4Subtitle;
        updated.slide4EffectivenessNote = DEFAULT_TEXT_OVERRIDES.slide4EffectivenessNote;
      } else if (slideNum === 5) {
        updated.slide5Title = DEFAULT_TEXT_OVERRIDES.slide5Title;
        updated.slide5Subtitle = DEFAULT_TEXT_OVERRIDES.slide5Subtitle;
        updated.slide5Dir1Title = DEFAULT_TEXT_OVERRIDES.slide5Dir1Title;
        updated.slide5Dir1Desc = DEFAULT_TEXT_OVERRIDES.slide5Dir1Desc;
        updated.slide5Dir2Title = DEFAULT_TEXT_OVERRIDES.slide5Dir2Title;
        updated.slide5Dir2Desc = DEFAULT_TEXT_OVERRIDES.slide5Dir2Desc;
        updated.slide5Dir3Title = DEFAULT_TEXT_OVERRIDES.slide5Dir3Title;
        updated.slide5Dir3Desc = DEFAULT_TEXT_OVERRIDES.slide5Dir3Desc;
        updated.slide5QuoteText = DEFAULT_TEXT_OVERRIDES.slide5QuoteText;
        updated.slide5QuoteAuthor = DEFAULT_TEXT_OVERRIDES.slide5QuoteAuthor;
      }
      return updated;
    });
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const totalSlides = 5;

  const kpis = calculateSafetyKPIs(incidents, hhtConfigs, selectedMonthYear || undefined);
  const monthlyTrend = getMonthlyTrendData(incidents, hhtConfigs);
  const sectorData = getSectorDistribution(incidents);
  const causeData = getCauseCategoryStats(incidents);

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

  const slidesInfo = [
    { number: 1, title: 'Placar de Segurança & KPIs', subtitle: 'Visão Geral Executiva' },
    { number: 2, title: 'Pirâmide de Riscos NBR 14280', subtitle: 'Heinrich & Bird' },
    { number: 3, title: 'Mapeamento por Setores', subtitle: 'Exposição Operacional' },
    { number: 4, title: 'Causas Raízes & 5W2H', subtitle: 'Eficácia de Planos de Ação' },
    { number: 5, title: 'Diretrizes Estratégicas', subtitle: 'Tomada de Decisão Liderança' },
  ];

  // Presentation Meeting Stopwatch Timer
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setMeetingTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Auto-play slide advance timer (7 seconds per slide)
  useEffect(() => {
    let timer: any;
    if (isAutoPlay) {
      timer = setInterval(() => {
        setCurrentSlide((prev) => (prev >= totalSlides ? 1 : prev + 1));
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlay]);

  // Standard PowerPoint Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentSlide(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentSlide(totalSlides);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        setCurrentSlide(parseInt(e.key, 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
          document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
        });
      } else {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
      }
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLaserActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setLaserPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const isDark = themeMode === 'dark';

  return (
    <div
      ref={containerRef}
      className={`w-full transition-colors duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-8 flex flex-col justify-between overflow-y-auto'
          : 'space-y-4 pb-16'
      }`}
    >
      {/* POWERPOINT TOP TOOLBAR & PRESENTER CONTROLS */}
      <div
        className={`rounded-2xl shadow-xl p-3.5 flex flex-wrap items-center justify-between gap-3 border transition-colors ${
          isDark
            ? 'bg-slate-900/95 text-white border-slate-800 backdrop-blur-md'
            : 'bg-white text-slate-800 border-slate-200 shadow-slate-200/50'
        }`}
      >
        {/* Left: Branding & Status */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs sm:text-sm font-extrabold tracking-tight">
                Apresentação Executiva SST • Modo Projetor
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                16:9 Widescreen
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center space-x-2">
              <span>Período: <strong>{monthLabel}</strong></span>
              <span>•</span>
              <span className="text-emerald-500 font-medium">Pronto para Reunião de Diretoria e CIPA</span>
            </p>
          </div>
        </div>

        {/* Center: Slide Switcher & Presenter Timer */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Meeting Stopwatch */}
          <div
            className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Tempo decorrido na apresentação"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>{formatTimer(meetingTimer)}</span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="text-[10px] text-slate-400 hover:text-white ml-1 underline cursor-pointer"
            >
              {isTimerRunning ? 'Pausar' : 'Iniciar'}
            </button>
            <button
              onClick={() => setMeetingTimer(0)}
              className="text-[10px] text-slate-400 hover:text-white cursor-pointer ml-0.5"
              title="Zerar cronômetro"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Slide stepper */}
          <div
            className={`flex items-center px-2 py-1 rounded-xl border space-x-1 text-xs ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 1))}
              disabled={currentSlide === 1}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 disabled:opacity-25 transition cursor-pointer"
              title="Slide Anterior (Seta Esquerda / PageUp)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3 text-center min-w-[90px]">
              <span className="font-extrabold text-amber-500 block text-xs">
                Slide {currentSlide} / {totalSlides}
              </span>
              <span className="text-[9px] text-slate-400 font-medium block truncate max-w-[80px]">
                {slidesInfo[currentSlide - 1]?.title}
              </span>
            </div>

            <button
              onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides))}
              disabled={currentSlide === totalSlides}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 disabled:opacity-25 transition cursor-pointer"
              title="Próximo Slide (Seta Direita / PageDown / Espaço)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Controls (Edit Mode, Text Customizer, Auto-Play, Theme, Laser, Fullscreen, PDF) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Personalizar Quadro / Modo Edição */}
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center space-x-1.5 text-xs px-3 py-2 rounded-xl border font-bold transition-all cursor-pointer shadow-sm ${
              isEditMode
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 ring-2 ring-amber-400/40 scale-105'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Ativar modo de edição para alocar formas, post-its e alterar textos no quadro"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isEditMode ? 'text-slate-950 animate-spin' : 'text-amber-500'}`} />
            <span className="hidden md:inline">{isEditMode ? 'Modo Edição Ativo' : 'Personalizar Quadro'}</span>
            <span className="md:hidden">{isEditMode ? 'Editar' : 'Formas'}</span>
          </button>

          {/* Editar Textos do Slide */}
          <button
            type="button"
            onClick={() => setIsTextModalOpen(true)}
            className={`flex items-center space-x-1.5 text-xs px-3 py-2 rounded-xl border font-semibold transition cursor-pointer ${
              isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Editar textos, títulos, conclusões e diretrizes do slide atual"
          >
            <Type className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden lg:inline">Editar Textos</span>
          </button>

          {/* Theme switcher */}
          <button
            onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDark
                ? 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
            title={isDark ? 'Modo Sala Clara (Projetor)' : 'Modo Escuro (Cinema/Executivo)'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Auto play */}
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`flex items-center space-x-1.5 text-xs px-3 py-2 rounded-xl border font-bold transition cursor-pointer shadow-sm ${
              isAutoPlay
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Avançar slides automaticamente a cada 7 segundos"
          >
            {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{isAutoPlay ? 'Pausar Auto' : 'Auto Play'}</span>
          </button>

          {/* Laser pointer tool */}
          <button
            onClick={() => setIsLaserActive(!isLaserActive)}
            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isLaserActive
                ? 'bg-rose-600 text-white border-rose-500 ring-2 ring-rose-400/50'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title={isLaserActive ? 'Desativar Apontador Laser' : 'Ativar Apontador Laser na Tela'}
          >
            <div className="relative">
              <Eye className="w-4 h-4" />
              {isLaserActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
              )}
            </div>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center space-x-1.5 text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-2 rounded-xl transition shadow-md shadow-amber-500/20 cursor-pointer"
            title="Expandir em Tela Cheia (Atalho: tecla F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Sair' : 'Tela Cheia (F)'}</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={() => exportMonthlyReportToPDF(incidents, kpis, monthLabel, hhtConfigs)}
            className="flex items-center space-x-1 text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-2 rounded-xl transition shadow-md shadow-rose-600/20 cursor-pointer"
            title="Exportar apresentação e relatório mensal em PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* EXPANSIVE WIDESCREEN 16:9 SLIDE CANVAS (POWERPOINT STAGE) */}
      <div
        onMouseMove={handleMouseMove}
        className={`w-full rounded-3xl shadow-2xl border-2 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
          isFullscreen ? 'flex-1 my-2 min-h-[82vh]' : 'min-h-[660px]'
        } ${
          isDark
            ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white border-slate-800'
            : 'bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 border-slate-200 shadow-xl'
        }`}
      >
        {/* Subtle PowerPoint Slide Ambient Background */}
        <div
          className={`absolute inset-0 pointer-events-none ${
            isDark
              ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-30'
              : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-40'
          }`}
        ></div>

        {/* Laser pointer overlay element */}
        {isLaserActive && (
          <div
            className="absolute w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_15px_6px_rgba(244,63,94,0.9)] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-75 ease-out"
            style={{ left: `${laserPos.x}px`, top: `${laserPos.y}px` }}
          />
        )}

        {/* SLIDE TOP BANNER */}
        <div
          className={`relative z-10 p-6 sm:p-8 pb-4 flex flex-wrap items-center justify-between gap-4 border-b ${
            isDark ? 'border-slate-800/80 bg-slate-950/60' : 'border-slate-200 bg-white/70'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-extrabold bg-amber-500 text-slate-950 px-3 py-1 rounded-lg tracking-wider shadow-sm">
              DIRETORIA EXECUTIVA & CIPA
            </span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Relatório Mensal de Gestão de Riscos • <strong>{monthLabel}</strong>
            </span>
          </div>

          {/* Quick Slide Direct Jump Pills */}
          <div className="flex items-center space-x-1.5">
            {slidesInfo.map((s) => (
              <button
                key={s.number}
                onClick={() => setCurrentSlide(s.number)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  currentSlide === s.number
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105 ring-2 ring-amber-400/40'
                    : isDark
                    ? 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-900'
                }`}
                title={`${s.number}. ${s.title}`}
              >
                <span>0{s.number}</span>
                <span className="hidden xl:inline text-[11px] font-medium">{s.title.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* SLIDE MAIN STAGE CONTENT */}
        <div className="relative z-10 px-6 sm:px-10 lg:px-12 py-8 my-auto flex-1 flex flex-col justify-center">
          {/* ========================================================================= */}
          {/* SLIDE 1: PLACAR DE SEGURANÇA & VISÃO GERAL DOS 4 TIPOS DE OCORRÊNCIA */}
          {/* ========================================================================= */}
          {currentSlide === 1 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b pb-3 border-amber-500/20 flex items-start justify-between">
                <div>
                  <span className="text-amber-500 text-xs font-black uppercase tracking-widest block">
                    {textOverrides.slide1Subtitle || DEFAULT_TEXT_OVERRIDES.slide1Subtitle}
                  </span>
                  <h3
                    className={`text-2xl sm:text-4xl font-black tracking-tight mt-1 ${
                      isDark ? 'text-white' : 'text-slate-950'
                    }`}
                  >
                    {textOverrides.slide1Title || DEFAULT_TEXT_OVERRIDES.slide1Title}
                  </h3>
                </div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => setIsTextModalOpen(true)}
                    className="flex items-center space-x-1 text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-2.5 py-1.5 rounded-lg border border-amber-500/30 transition cursor-pointer font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Textos</span>
                  </button>
                )}
              </div>

              {/* 4 Core Category Cards (Desvios, Incidentes, Acidentes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Desvios */}
                <div
                  className={`p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] relative overflow-hidden ${
                    isDark
                      ? 'bg-gradient-to-br from-slate-900/90 to-orange-950/20 border-orange-500/30'
                      : 'bg-gradient-to-br from-white to-orange-50/50 border-orange-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-orange-500">
                    <span className="text-xs font-black uppercase tracking-wider">Desvios</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div className="text-4xl font-black text-orange-500">{kpis.deviationCount}</div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      Preventivo
                    </span>
                  </div>
                  <p className={`text-xs mt-2 pt-2 border-t ${isDark ? 'text-slate-400 border-slate-800' : 'text-slate-600 border-orange-100'}`}>
                    Desvios de procedimentos e normas de segurança.
                  </p>
                </div>

                {/* 2. Incidentes */}
                <div
                  className={`p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] relative overflow-hidden ${
                    isDark
                      ? 'bg-gradient-to-br from-slate-900/90 to-amber-950/20 border-amber-500/30'
                      : 'bg-gradient-to-br from-white to-amber-50/50 border-amber-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-amber-500">
                    <span className="text-xs font-black uppercase tracking-wider">Incidentes</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div className="text-4xl font-black text-amber-500">{kpis.nearMissCount}</div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Near-Miss
                    </span>
                  </div>
                  <p className={`text-xs mt-2 pt-2 border-t ${isDark ? 'text-slate-400 border-slate-800' : 'text-slate-600 border-amber-100'}`}>
                    Ocorrências sem lesão corporal imediata ou dano patrimonial severo.
                  </p>
                </div>

                {/* 3. Acidente sem Afastamento */}
                <div
                  className={`p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] relative overflow-hidden ${
                    isDark
                      ? 'bg-gradient-to-br from-slate-900/90 to-blue-950/20 border-blue-500/30'
                      : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-blue-500">
                    <span className="text-xs font-black uppercase tracking-wider">Acidente s/ Afastamento</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div className="text-4xl font-black text-blue-500">{kpis.firstAidCount}</div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      ASAF
                    </span>
                  </div>
                  <p className={`text-xs mt-2 pt-2 border-t ${isDark ? 'text-slate-400 border-slate-800' : 'text-slate-600 border-blue-100'}`}>
                    Atendimento ambulatorial / primeiros socorros c/ retorno na jornada.
                  </p>
                </div>

                {/* 4. Acidente com Afastamento */}
                <div
                  className={`p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] relative overflow-hidden ${
                    isDark
                      ? 'bg-gradient-to-br from-slate-900/90 to-rose-950/20 border-rose-500/30'
                      : 'bg-gradient-to-br from-white to-rose-50/50 border-rose-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-rose-500">
                    <span className="text-xs font-black uppercase tracking-wider">Acidente c/ Afastamento</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div className="text-4xl font-black text-rose-500">{kpis.lostTimeCount}</div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      {kpis.totalDaysLost} dias perdidos
                    </span>
                  </div>
                  <p className={`text-xs mt-2 pt-2 border-t ${isDark ? 'text-slate-400 border-slate-800' : 'text-slate-600 border-rose-100'}`}>
                    TF: {kpis.tfRate} | TG: {kpis.tgRate} (Impacto em incapacidade temporária).
                  </p>
                </div>

                {/* 5. Acidente Fatal */}
                <div
                  className={`p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] relative overflow-hidden ${
                    isDark
                      ? 'bg-gradient-to-br from-slate-900/90 to-purple-950/20 border-purple-500/30'
                      : 'bg-gradient-to-br from-white to-purple-50/50 border-purple-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-purple-500">
                    <span className="text-xs font-black uppercase tracking-wider">Fatal</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div className="text-4xl font-black text-purple-500">{kpis.fatalCount}</div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        kpis.fatalCount === 0
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}
                    >
                      {kpis.fatalCount === 0 ? 'Zero Óbito' : 'Crítico'}
                    </span>
                  </div>
                  <p className={`text-xs mt-2 pt-2 border-t ${isDark ? 'text-slate-400 border-slate-800' : 'text-slate-600 border-purple-100'}`}>
                    {kpis.fatalCount === 0 ? 'Meta absoluta de preservação da vida mantida.' : 'Ocorrência com perda de vida.'}
                  </p>
                </div>
              </div>

              {/* Bottom Big Placar & HHT Strip */}
              <div
                className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100/90 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 block">
                      {textOverrides.slide1PlacarTitle || DEFAULT_TEXT_OVERRIDES.slide1PlacarTitle}
                    </span>
                    <div className="text-2xl sm:text-3xl font-black tracking-tight flex items-baseline space-x-2">
                      <span className="text-emerald-400 font-mono">{kpis.daysWithoutLostTimeAccident}</span>
                      <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {textOverrides.slide1PlacarSub || DEFAULT_TEXT_OVERRIDES.slide1PlacarSub}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">HHT Acumulado</span>
                    <strong className="text-sm font-mono font-bold">
                      {kpis.totalHHT.toLocaleString('pt-BR')} horas
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Eficácia Planos 5W2H</span>
                    <strong className="text-sm font-mono font-bold text-sky-500">
                      {kpis.actionEffectivenessRate}% ({kpis.actionsCompleted}/{kpis.actionsTotal})
                    </strong>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-slate-400 block font-medium">Status Normativo</span>
                    <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      NR-01 / NBR 14280 Ativo
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Custom Shapes / Elements Container for Slide 1 */}
              <PresentationCustomShapes
                slideNumber={1}
                elements={customElements}
                onAddElement={handleAddElement}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                isEditMode={isEditMode}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 2: PIRÂMIDE DE RISCOS (NBR 14280 & BIRD/HEINRICH) */}
          {/* ========================================================================= */}
          {currentSlide === 2 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b pb-3 border-amber-500/20 flex items-start justify-between">
                <div>
                  <span className="text-amber-500 text-xs font-black uppercase tracking-widest block">
                    {textOverrides.slide2Subtitle || DEFAULT_TEXT_OVERRIDES.slide2Subtitle}
                  </span>
                  <h3
                    className={`text-2xl sm:text-4xl font-black tracking-tight mt-1 ${
                      isDark ? 'text-white' : 'text-slate-950'
                    }`}
                  >
                    {textOverrides.slide2Title || DEFAULT_TEXT_OVERRIDES.slide2Title}
                  </h3>
                </div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => setIsTextModalOpen(true)}
                    className="flex items-center space-x-1 text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-2.5 py-1.5 rounded-lg border border-amber-500/30 transition cursor-pointer font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Textos</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Visual Pyramid */}
                <div className="lg:col-span-6 space-y-2.5">
                  {/* Tier 1: Fatal */}
                  <div className="w-1/3 mx-auto bg-purple-950 text-purple-100 border-2 border-purple-500/60 p-2.5 rounded-xl text-center shadow-lg transform hover:scale-105 transition">
                    <span className="text-[10px] font-black uppercase text-purple-300 block">1. FATAL / MORTE</span>
                    <div className="text-2xl font-black">{kpis.fatalCount}</div>
                    <span className="text-[10px] text-purple-300/80">Ocorrência Crítica</span>
                  </div>

                  {/* Tier 2: Com Afastamento */}
                  <div className="w-2/3 mx-auto bg-rose-600 text-white p-3 rounded-xl text-center shadow-lg border border-rose-400 transform hover:scale-105 transition">
                    <span className="text-[11px] font-black uppercase block">10. ACIDENTES C/ AFASTAMENTO</span>
                    <div className="text-2xl font-black">{kpis.lostTimeCount}</div>
                    <span className="text-[10px] text-rose-100">{kpis.totalDaysLost} dias de jornada perdidos</span>
                  </div>

                  {/* Tier 3: Sem Afastamento */}
                  <div className="w-5/6 mx-auto bg-blue-600 text-white p-3 rounded-xl text-center shadow-lg border border-blue-400 transform hover:scale-105 transition">
                    <span className="text-[11px] font-black uppercase block">30. ACIDENTES S/ AFASTAMENTO</span>
                    <div className="text-2xl font-black">{kpis.firstAidCount}</div>
                    <span className="text-[10px] text-blue-100">Atendimento ambulatorial / Primeiros socorros</span>
                  </div>

                  {/* Tier 4: Incidentes e Desvios */}
                  <div className="w-full bg-amber-500 text-slate-950 p-4 rounded-xl text-center shadow-xl font-bold transform hover:scale-105 transition">
                    <span className="text-xs uppercase tracking-wider block">600. INCIDENTES & DESVIOS OPERACIONAIS</span>
                    <div className="flex justify-center gap-8 mt-1">
                      <div>
                        <span className="text-[10px] font-bold text-slate-800 block">Incidentes</span>
                        <div className="text-2xl font-black">{kpis.nearMissCount}</div>
                      </div>
                      <div className="border-l-2 border-slate-950 pl-8">
                        <span className="text-[10px] font-bold text-slate-800 block">Desvios</span>
                        <div className="text-2xl font-black">{kpis.deviationCount}</div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-900 font-semibold">Tratativas preventivas e desvios bloqueados</span>
                  </div>
                </div>

                {/* Analytical Narrative & Ratios */}
                <div className="lg:col-span-6 space-y-4">
                  <div
                    className={`p-5 rounded-2xl border space-y-2 ${
                      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <h4 className="text-sm font-extrabold text-amber-500 uppercase tracking-wide">
                      Conclusão Técnica da Pirâmide de Riscos:
                    </h4>
                    <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {textOverrides.slide2PyramidConclusion || DEFAULT_TEXT_OVERRIDES.slide2PyramidConclusion}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-2xl border ${
                        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <span className="text-[11px] font-semibold text-slate-400 block">TAXA DE FREQUÊNCIA (TF)</span>
                      <div className="text-2xl font-black text-amber-500 mt-1">{kpis.tfRate}</div>
                      <span className="text-[10px] text-slate-400 block mt-1">(Acidentes C/ Afastamento × 10⁶) / HHT</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl border ${
                        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <span className="text-[11px] font-semibold text-slate-400 block">TAXA DE GRAVIDADE (TG)</span>
                      <div className="text-2xl font-black text-amber-500 mt-1">{kpis.tgRate}</div>
                      <span className="text-[10px] text-slate-400 block mt-1">(Dias Perdidos × 10⁶) / HHT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Custom Shapes / Elements Container for Slide 2 */}
              <PresentationCustomShapes
                slideNumber={2}
                elements={customElements}
                onAddElement={handleAddElement}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                isEditMode={isEditMode}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 3: MAPEAMENTO DE RISCOS POR SETOR & EXPOSIÇÃO */}
          {/* ========================================================================= */}
          {currentSlide === 3 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b pb-3 border-amber-500/20 flex items-start justify-between">
                <div>
                  <span className="text-amber-500 text-xs font-black uppercase tracking-widest block">
                    {textOverrides.slide3Subtitle || DEFAULT_TEXT_OVERRIDES.slide3Subtitle}
                  </span>
                  <h3
                    className={`text-2xl sm:text-4xl font-black tracking-tight mt-1 ${
                      isDark ? 'text-white' : 'text-slate-950'
                    }`}
                  >
                    {textOverrides.slide3Title || DEFAULT_TEXT_OVERRIDES.slide3Title}
                  </h3>
                </div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => setIsTextModalOpen(true)}
                    className="flex items-center space-x-1 text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-2.5 py-1.5 rounded-lg border border-amber-500/30 transition cursor-pointer font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Textos</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {sectorData.length > 0 ? (
                  sectorData.slice(0, 3).map((sec, idx) => (
                    <div
                      key={sec.name}
                      className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] space-y-3 ${
                        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                          TOP {idx + 1} ÁREA
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-white">
                          {sec.total} evento(s)
                        </span>
                      </div>
                      <h4 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {sec.name}
                      </h4>
                      <div
                        className={`text-xs space-y-1.5 pt-2 border-t ${
                          isDark ? 'text-slate-300 border-slate-800' : 'text-slate-600 border-slate-100'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span>Com Afastamento:</span>
                          <strong className="text-rose-500">{sec.lostTime}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Sem Afastamento:</span>
                          <strong className="text-blue-500">{sec.firstAid}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Incidentes:</span>
                          <strong className="text-amber-500">{sec.nearMiss}</strong>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className={`col-span-3 p-8 rounded-2xl border text-center ${
                      isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    Nenhuma ocorrência registrada no período selecionado. Todos os setores operando com índice zero de acidentes.
                  </div>
                )}
              </div>

              {/* Action Directives by Sector */}
              <div
                className={`p-5 rounded-2xl border text-xs sm:text-sm space-y-2 ${
                  isDark ? 'bg-slate-900/70 border-slate-800 text-slate-300' : 'bg-white border-slate-200 shadow-sm text-slate-700'
                }`}
              >
                <span className="text-xs font-black text-amber-500 uppercase block tracking-wider">
                  {textOverrides.slide3AuditingTitle || DEFAULT_TEXT_OVERRIDES.slide3AuditingTitle}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <strong className="text-amber-500 block mb-1">
                      {textOverrides.slide3SectorNote1Title || DEFAULT_TEXT_OVERRIDES.slide3SectorNote1Title}
                    </strong>
                    <span>{textOverrides.slide3SectorNote1Desc || DEFAULT_TEXT_OVERRIDES.slide3SectorNote1Desc}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <strong className="text-blue-500 block mb-1">
                      {textOverrides.slide3SectorNote2Title || DEFAULT_TEXT_OVERRIDES.slide3SectorNote2Title}
                    </strong>
                    <span>{textOverrides.slide3SectorNote2Desc || DEFAULT_TEXT_OVERRIDES.slide3SectorNote2Desc}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <strong className="text-emerald-500 block mb-1">
                      {textOverrides.slide3SectorNote3Title || DEFAULT_TEXT_OVERRIDES.slide3SectorNote3Title}
                    </strong>
                    <span>{textOverrides.slide3SectorNote3Desc || DEFAULT_TEXT_OVERRIDES.slide3SectorNote3Desc}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Custom Shapes / Elements Container for Slide 3 */}
              <PresentationCustomShapes
                slideNumber={3}
                elements={customElements}
                onAddElement={handleAddElement}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                isEditMode={isEditMode}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 4: ANÁLISE DE CAUSAS RAÍZES & EFICÁCIA DOS PLANOS 5W2H */}
          {/* ========================================================================= */}
          {currentSlide === 4 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b pb-3 border-amber-500/20 flex items-start justify-between">
                <div>
                  <span className="text-amber-500 text-xs font-black uppercase tracking-widest block">
                    {textOverrides.slide4Subtitle || DEFAULT_TEXT_OVERRIDES.slide4Subtitle}
                  </span>
                  <h3
                    className={`text-2xl sm:text-4xl font-black tracking-tight mt-1 ${
                      isDark ? 'text-white' : 'text-slate-950'
                    }`}
                  >
                    {textOverrides.slide4Title || DEFAULT_TEXT_OVERRIDES.slide4Title}
                  </h3>
                </div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => setIsTextModalOpen(true)}
                    className="flex items-center space-x-1 text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-2.5 py-1.5 rounded-lg border border-amber-500/30 transition cursor-pointer font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Textos</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Root Causes Distribution */}
                <div
                  className={`lg:col-span-6 p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-md'
                  }`}
                >
                  <h4 className="text-xs font-extrabold text-amber-500 uppercase tracking-wider">
                    Distribuição de Causas Raízes (5 Porquês):
                  </h4>

                  <div className="space-y-3">
                    {causeData.length > 0 ? (
                      causeData.map((c) => (
                        <div key={c.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{c.name}</span>
                            <span className="text-amber-500 font-bold">{c.value} caso(s)</span>
                          </div>
                          <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                            <div
                              className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(c.value / (kpis.totalIncidents || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic py-4">Sem causas mapeadas no período.</p>
                    )}
                  </div>
                </div>

                {/* 5W2H Action Plan Status */}
                <div
                  className={`lg:col-span-6 p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-md'
                  }`}
                >
                  <h4 className="text-xs font-extrabold text-sky-500 uppercase tracking-wider">
                    Taxa de Resolução & Eficácia 5W2H:
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-xs font-bold text-emerald-500 block">AÇÕES CONCLUÍDAS</span>
                      <div className="text-3xl font-black text-emerald-500 mt-1">{kpis.actionsCompleted}</div>
                    </div>

                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-xs font-bold text-blue-500 block">EM ANDAMENTO</span>
                      <div className="text-3xl font-black text-blue-500 mt-1">{kpis.actionsPending}</div>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <strong>Índice de Eficácia:</strong> {textOverrides.slide4EffectivenessNote || `${kpis.actionEffectivenessRate}% das ações foram implantadas e auditadas dentro do prazo acordado com a gerência.`}
                  </div>
                </div>
              </div>

              {/* Dynamic Custom Shapes / Elements Container for Slide 4 */}
              <PresentationCustomShapes
                slideNumber={4}
                elements={customElements}
                onAddElement={handleAddElement}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                isEditMode={isEditMode}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 5: DIRETRIZES ESTRATÉGICAS & COMPROMISSOS DE LIDERANÇA */}
          {/* ========================================================================= */}
          {currentSlide === 5 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b pb-3 border-amber-500/20 flex items-start justify-between">
                <div>
                  <span className="text-amber-500 text-xs font-black uppercase tracking-widest block">
                    {textOverrides.slide5Subtitle || DEFAULT_TEXT_OVERRIDES.slide5Subtitle}
                  </span>
                  <h3
                    className={`text-2xl sm:text-4xl font-black tracking-tight mt-1 ${
                      isDark ? 'text-white' : 'text-slate-950'
                    }`}
                  >
                    {textOverrides.slide5Title || DEFAULT_TEXT_OVERRIDES.slide5Title}
                  </h3>
                </div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => setIsTextModalOpen(true)}
                    className="flex items-center space-x-1 text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-2.5 py-1.5 rounded-lg border border-amber-500/30 transition cursor-pointer font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Textos</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div
                  className={`p-5 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-md'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                    01
                  </div>
                  <h4 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {textOverrides.slide5Dir1Title || DEFAULT_TEXT_OVERRIDES.slide5Dir1Title}
                  </h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {textOverrides.slide5Dir1Desc || DEFAULT_TEXT_OVERRIDES.slide5Dir1Desc}
                  </p>
                </div>

                <div
                  className={`p-5 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-md'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
                    02
                  </div>
                  <h4 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {textOverrides.slide5Dir2Title || DEFAULT_TEXT_OVERRIDES.slide5Dir2Title}
                  </h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {textOverrides.slide5Dir2Desc || DEFAULT_TEXT_OVERRIDES.slide5Dir2Desc}
                  </p>
                </div>

                <div
                  className={`p-5 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-md'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                    03
                  </div>
                  <h4 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {textOverrides.slide5Dir3Title || DEFAULT_TEXT_OVERRIDES.slide5Dir3Title}
                  </h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {textOverrides.slide5Dir3Desc || DEFAULT_TEXT_OVERRIDES.slide5Dir3Desc}
                  </p>
                </div>
              </div>

              {/* Leadership Commitment Quote Banner */}
              <div
                className={`p-5 rounded-2xl border text-center ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-gradient-to-r from-amber-50 via-white to-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <p className="text-xs sm:text-sm font-bold italic">
                  "{textOverrides.slide5QuoteText || DEFAULT_TEXT_OVERRIDES.slide5QuoteText}"
                </p>
                <span className="text-[11px] opacity-75 block mt-1">
                  {textOverrides.slide5QuoteAuthor || DEFAULT_TEXT_OVERRIDES.slide5QuoteAuthor}
                </span>
              </div>

              {/* Dynamic Custom Shapes / Elements Container for Slide 5 */}
              <PresentationCustomShapes
                slideNumber={5}
                elements={customElements}
                onAddElement={handleAddElement}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                isEditMode={isEditMode}
              />
            </div>
          )}
        </div>

        {/* SLIDE BOTTOM FOOTER & PROGRESS BAR */}
        <div className="relative z-10">
          {/* PowerPoint Progress Strip */}
          <div className="w-full bg-slate-800/40 h-1 overflow-hidden">
            <div
              className="bg-amber-500 h-1 transition-all duration-300 ease-out"
              style={{ width: `${(currentSlide / totalSlides) * 100}%` }}
            ></div>
          </div>

          <div
            className={`p-4 sm:px-8 flex items-center justify-between text-[11px] ${
              isDark ? 'text-slate-500 bg-slate-950/80' : 'text-slate-500 bg-white/80'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-amber-500">SST Corporativo</span>
              <span>•</span>
              <span>Conforme NBR 14280 & NR-01</span>
            </div>

            <div className="flex items-center space-x-3">
              <span className="hidden sm:inline">Use as teclas ◄ ► ou Espaço para navegar</span>
              <span className="font-mono font-bold text-amber-500">
                {currentSlide} / {totalSlides}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Text Customization Modal */}
      <SlideTextEditorModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        currentSlide={currentSlide}
        overrides={textOverrides}
        onSaveOverrides={(updated) => setTextOverrides(updated)}
        onResetSlideOverrides={handleResetSlideOverrides}
      />
    </div>
  );
};

