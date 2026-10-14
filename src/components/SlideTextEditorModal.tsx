import React, { useState } from 'react';
import {
  Type,
  X,
  RotateCcw,
  CheckCircle2,
  Sliders,
  FileText,
  Sparkles,
} from 'lucide-react';
import { SlideTextOverrides, DEFAULT_TEXT_OVERRIDES } from './PresentationCustomizer';

interface SlideTextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlide: number;
  overrides: SlideTextOverrides;
  onSaveOverrides: (updated: SlideTextOverrides) => void;
  onResetSlideOverrides: (slideNum: number) => void;
}

export const SlideTextEditorModal: React.FC<SlideTextEditorModalProps> = ({
  isOpen,
  onClose,
  currentSlide,
  overrides,
  onSaveOverrides,
  onResetSlideOverrides,
}) => {
  const [formData, setFormData] = useState<SlideTextOverrides>(overrides);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveOverrides(formData);
    onClose();
  };

  const handleResetCurrent = () => {
    if (window.confirm(`Deseja restaurar todos os textos do Slide ${currentSlide} para o padrão original?`)) {
      onResetSlideOverrides(currentSlide);
      setFormData((prev) => ({
        ...prev,
        ...(currentSlide === 1 && {
          slide1Title: DEFAULT_TEXT_OVERRIDES.slide1Title,
          slide1Subtitle: DEFAULT_TEXT_OVERRIDES.slide1Subtitle,
          slide1PlacarTitle: DEFAULT_TEXT_OVERRIDES.slide1PlacarTitle,
          slide1PlacarSub: DEFAULT_TEXT_OVERRIDES.slide1PlacarSub,
        }),
        ...(currentSlide === 2 && {
          slide2Title: DEFAULT_TEXT_OVERRIDES.slide2Title,
          slide2Subtitle: DEFAULT_TEXT_OVERRIDES.slide2Subtitle,
          slide2PyramidConclusion: DEFAULT_TEXT_OVERRIDES.slide2PyramidConclusion,
        }),
        ...(currentSlide === 3 && {
          slide3Title: DEFAULT_TEXT_OVERRIDES.slide3Title,
          slide3Subtitle: DEFAULT_TEXT_OVERRIDES.slide3Subtitle,
          slide3AuditingTitle: DEFAULT_TEXT_OVERRIDES.slide3AuditingTitle,
          slide3SectorNote1Title: DEFAULT_TEXT_OVERRIDES.slide3SectorNote1Title,
          slide3SectorNote1Desc: DEFAULT_TEXT_OVERRIDES.slide3SectorNote1Desc,
          slide3SectorNote2Title: DEFAULT_TEXT_OVERRIDES.slide3SectorNote2Title,
          slide3SectorNote2Desc: DEFAULT_TEXT_OVERRIDES.slide3SectorNote2Desc,
          slide3SectorNote3Title: DEFAULT_TEXT_OVERRIDES.slide3SectorNote3Title,
          slide3SectorNote3Desc: DEFAULT_TEXT_OVERRIDES.slide3SectorNote3Desc,
        }),
        ...(currentSlide === 4 && {
          slide4Title: DEFAULT_TEXT_OVERRIDES.slide4Title,
          slide4Subtitle: DEFAULT_TEXT_OVERRIDES.slide4Subtitle,
          slide4EffectivenessNote: DEFAULT_TEXT_OVERRIDES.slide4EffectivenessNote,
        }),
        ...(currentSlide === 5 && {
          slide5Title: DEFAULT_TEXT_OVERRIDES.slide5Title,
          slide5Subtitle: DEFAULT_TEXT_OVERRIDES.slide5Subtitle,
          slide5Dir1Title: DEFAULT_TEXT_OVERRIDES.slide5Dir1Title,
          slide5Dir1Desc: DEFAULT_TEXT_OVERRIDES.slide5Dir1Desc,
          slide5Dir2Title: DEFAULT_TEXT_OVERRIDES.slide5Dir2Title,
          slide5Dir2Desc: DEFAULT_TEXT_OVERRIDES.slide5Dir2Desc,
          slide5Dir3Title: DEFAULT_TEXT_OVERRIDES.slide5Dir3Title,
          slide5Dir3Desc: DEFAULT_TEXT_OVERRIDES.slide5Dir3Desc,
          slide5QuoteText: DEFAULT_TEXT_OVERRIDES.slide5QuoteText,
          slide5QuoteAuthor: DEFAULT_TEXT_OVERRIDES.slide5QuoteAuthor,
        }),
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Personalizar Textos do Slide {currentSlide}</h4>
              <p className="text-[11px] text-slate-400">
                Edite títulos, descrições, conclusões e diretrizes apresentadas na tela
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body per Current Slide */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800">
          {/* SLIDE 1 TEXTS */}
          {currentSlide === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Título Principal:</label>
                <input
                  type="text"
                  value={formData.slide1Title ?? DEFAULT_TEXT_OVERRIDES.slide1Title}
                  onChange={(e) => setFormData({ ...formData, slide1Title: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subtítulo / Categoria:</label>
                <input
                  type="text"
                  value={formData.slide1Subtitle ?? DEFAULT_TEXT_OVERRIDES.slide1Subtitle}
                  onChange={(e) => setFormData({ ...formData, slide1Subtitle: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Título da Faixa do Placar:</label>
                <input
                  type="text"
                  value={formData.slide1PlacarTitle ?? DEFAULT_TEXT_OVERRIDES.slide1PlacarTitle}
                  onChange={(e) => setFormData({ ...formData, slide1PlacarTitle: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Texto de Apoio do Placar:</label>
                <input
                  type="text"
                  value={formData.slide1PlacarSub ?? DEFAULT_TEXT_OVERRIDES.slide1PlacarSub}
                  onChange={(e) => setFormData({ ...formData, slide1PlacarSub: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* SLIDE 2 TEXTS */}
          {currentSlide === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Título Principal:</label>
                <input
                  type="text"
                  value={formData.slide2Title ?? DEFAULT_TEXT_OVERRIDES.slide2Title}
                  onChange={(e) => setFormData({ ...formData, slide2Title: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subtítulo:</label>
                <input
                  type="text"
                  value={formData.slide2Subtitle ?? DEFAULT_TEXT_OVERRIDES.slide2Subtitle}
                  onChange={(e) => setFormData({ ...formData, slide2Subtitle: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Conclusão Técnica da Pirâmide:</label>
                <textarea
                  rows={3}
                  value={formData.slide2PyramidConclusion ?? DEFAULT_TEXT_OVERRIDES.slide2PyramidConclusion}
                  onChange={(e) => setFormData({ ...formData, slide2PyramidConclusion: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* SLIDE 3 TEXTS */}
          {currentSlide === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Título Principal:</label>
                <input
                  type="text"
                  value={formData.slide3Title ?? DEFAULT_TEXT_OVERRIDES.slide3Title}
                  onChange={(e) => setFormData({ ...formData, slide3Title: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subtítulo:</label>
                <input
                  type="text"
                  value={formData.slide3Subtitle ?? DEFAULT_TEXT_OVERRIDES.slide3Subtitle}
                  onChange={(e) => setFormData({ ...formData, slide3Subtitle: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Título do Bloco de Auditoria:</label>
                <input
                  type="text"
                  value={formData.slide3AuditingTitle ?? DEFAULT_TEXT_OVERRIDES.slide3AuditingTitle}
                  onChange={(e) => setFormData({ ...formData, slide3AuditingTitle: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-amber-600 block">Recomendação 1:</span>
                  <input
                    type="text"
                    value={formData.slide3SectorNote1Title ?? DEFAULT_TEXT_OVERRIDES.slide3SectorNote1Title}
                    onChange={(e) => setFormData({ ...formData, slide3SectorNote1Title: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-bold"
                  />
                  <textarea
                    rows={2}
                    value={formData.slide3SectorNote1Desc ?? DEFAULT_TEXT_OVERRIDES.slide3SectorNote1Desc}
                    onChange={(e) => setFormData({ ...formData, slide3SectorNote1Desc: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-1.5"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-blue-600 block">Recomendação 2:</span>
                  <input
                    type="text"
                    value={formData.slide3SectorNote2Title ?? DEFAULT_TEXT_OVERRIDES.slide3SectorNote2Title}
                    onChange={(e) => setFormData({ ...formData, slide3SectorNote2Title: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-bold"
                  />
                  <textarea
                    rows={2}
                    value={formData.slide3SectorNote2Desc ?? DEFAULT_TEXT_OVERRIDES.slide3SectorNote2Desc}
                    onChange={(e) => setFormData({ ...formData, slide3SectorNote2Desc: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-1.5"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-600 block">Recomendação 3:</span>
                  <input
                    type="text"
                    value={formData.slide3SectorNote3Title ?? DEFAULT_TEXT_OVERRIDES.slide3SectorNote3Title}
                    onChange={(e) => setFormData({ ...formData, slide3SectorNote3Title: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-bold"
                  />
                  <textarea
                    rows={2}
                    value={formData.slide3SectorNote3Desc ?? DEFAULT_TEXT_OVERRIDES.slide3SectorNote3Desc}
                    onChange={(e) => setFormData({ ...formData, slide3SectorNote3Desc: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-1.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 4 TEXTS */}
          {currentSlide === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Título Principal:</label>
                <input
                  type="text"
                  value={formData.slide4Title ?? DEFAULT_TEXT_OVERRIDES.slide4Title}
                  onChange={(e) => setFormData({ ...formData, slide4Title: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subtítulo:</label>
                <input
                  type="text"
                  value={formData.slide4Subtitle ?? DEFAULT_TEXT_OVERRIDES.slide4Subtitle}
                  onChange={(e) => setFormData({ ...formData, slide4Subtitle: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nota de Eficácia dos Planos:</label>
                <textarea
                  rows={2}
                  value={formData.slide4EffectivenessNote ?? DEFAULT_TEXT_OVERRIDES.slide4EffectivenessNote}
                  onChange={(e) => setFormData({ ...formData, slide4EffectivenessNote: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* SLIDE 5 TEXTS */}
          {currentSlide === 5 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Título Principal:</label>
                <input
                  type="text"
                  value={formData.slide5Title ?? DEFAULT_TEXT_OVERRIDES.slide5Title}
                  onChange={(e) => setFormData({ ...formData, slide5Title: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subtítulo:</label>
                <input
                  type="text"
                  value={formData.slide5Subtitle ?? DEFAULT_TEXT_OVERRIDES.slide5Subtitle}
                  onChange={(e) => setFormData({ ...formData, slide5Subtitle: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-amber-600 block">Diretriz 01:</span>
                  <input
                    type="text"
                    value={formData.slide5Dir1Title ?? DEFAULT_TEXT_OVERRIDES.slide5Dir1Title}
                    onChange={(e) => setFormData({ ...formData, slide5Dir1Title: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-bold"
                  />
                  <textarea
                    rows={2}
                    value={formData.slide5Dir1Desc ?? DEFAULT_TEXT_OVERRIDES.slide5Dir1Desc}
                    onChange={(e) => setFormData({ ...formData, slide5Dir1Desc: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-1.5"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-sky-600 block">Diretriz 02:</span>
                  <input
                    type="text"
                    value={formData.slide5Dir2Title ?? DEFAULT_TEXT_OVERRIDES.slide5Dir2Title}
                    onChange={(e) => setFormData({ ...formData, slide5Dir2Title: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-bold"
                  />
                  <textarea
                    rows={2}
                    value={formData.slide5Dir2Desc ?? DEFAULT_TEXT_OVERRIDES.slide5Dir2Desc}
                    onChange={(e) => setFormData({ ...formData, slide5Dir2Desc: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-1.5"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-600 block">Diretriz 03:</span>
                  <input
                    type="text"
                    value={formData.slide5Dir3Title ?? DEFAULT_TEXT_OVERRIDES.slide5Dir3Title}
                    onChange={(e) => setFormData({ ...formData, slide5Dir3Title: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-bold"
                  />
                  <textarea
                    rows={2}
                    value={formData.slide5Dir3Desc ?? DEFAULT_TEXT_OVERRIDES.slide5Dir3Desc}
                    onChange={(e) => setFormData({ ...formData, slide5Dir3Desc: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-300 rounded p-1.5"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2 pt-2">
                <span className="text-[11px] font-bold text-amber-900 block">Frase / Citação de Liderança:</span>
                <textarea
                  rows={2}
                  value={formData.slide5QuoteText ?? DEFAULT_TEXT_OVERRIDES.slide5QuoteText}
                  onChange={(e) => setFormData({ ...formData, slide5QuoteText: e.target.value })}
                  className="w-full text-xs bg-white border border-amber-300 rounded p-1.5"
                />
                <input
                  type="text"
                  value={formData.slide5QuoteAuthor ?? DEFAULT_TEXT_OVERRIDES.slide5QuoteAuthor}
                  onChange={(e) => setFormData({ ...formData, slide5QuoteAuthor: e.target.value })}
                  className="w-full text-xs bg-white border border-amber-300 rounded p-1.5 font-semibold text-amber-900"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetCurrent}
            className="flex items-center space-x-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl transition shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Textos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
