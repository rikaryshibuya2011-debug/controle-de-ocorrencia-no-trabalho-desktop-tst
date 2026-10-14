import React, { useState } from 'react';
import {
  StickyNote,
  Award,
  AlertTriangle,
  Lightbulb,
  Target,
  ShieldCheck,
  Zap,
  Star,
  CheckCircle2,
  Trash2,
  Edit2,
  Plus,
  Palette,
  Flag,
  MessageSquare,
  Sparkles,
  X,
  PlusCircle,
  Quote,
  Check,
} from 'lucide-react';
import {
  CustomSlideElement,
  ShapeType,
  ShapeColor,
  COLOR_CONFIGS,
} from './PresentationCustomizer';

interface PresentationCustomShapesProps {
  elements: CustomSlideElement[];
  currentSlide: number;
  isEditMode: boolean;
  isDark: boolean;
  onAddElement: (element: Omit<CustomSlideElement, 'id'>) => void;
  onUpdateElement: (id: string, updated: Partial<CustomSlideElement>) => void;
  onDeleteElement: (id: string) => void;
}

export const PresentationCustomShapes: React.FC<PresentationCustomShapesProps> = ({
  elements,
  currentSlide,
  isEditMode,
  isDark,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  // Form states for creating/editing element
  const [formType, setFormType] = useState<ShapeType>('sticky_note');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formColor, setFormColor] = useState<ShapeColor>('amber');
  const [formIcon, setFormIcon] = useState<
    'alert' | 'check' | 'lightbulb' | 'target' | 'shield' | 'zap' | 'star'
  >('lightbulb');

  const currentSlideElements = elements.filter((el) => el.slideNumber === currentSlide);

  const openAddModal = (type: ShapeType = 'sticky_note') => {
    setEditingElementId(null);
    setFormType(type);
    setFormTitle(
      type === 'sticky_note'
        ? 'Anotação Importante'
        : type === 'kpi_card'
        ? 'Meta de Segurança'
        : type === 'callout'
        ? 'Ponto de Atenção da Auditoria'
        : type === 'directive_box'
        ? 'Ação Recomendada pela Diretoria'
        : type === 'badge_pill'
        ? 'Conformidade NR-01'
        : 'Compromisso Corporativo'
    );
    setFormContent(
      type === 'sticky_note'
        ? 'Lembrar de reforçar o uso obrigatório de EPIs no turno noturno durante a explanação.'
        : type === 'kpi_card'
        ? 'Zero acidentes com afastamento alcançado nos últimos 90 dias úteis.'
        : type === 'callout'
        ? 'Reforçar com os encarregados a fiscalização do checklist diário antes de ligar o maquinário.'
        : type === 'directive_box'
        ? 'Realizar treinamento de reciclagem para 100% da equipe operacional até o final do trimestre.'
        : type === 'badge_pill'
        ? 'Auditoria Concluída com Sucesso'
        : '"A segurança de hoje é a garantia de produtividade do amanhã."'
    );
    setFormValue(type === 'kpi_card' ? '100%' : '');
    setFormColor(type === 'sticky_note' ? 'amber' : type === 'kpi_card' ? 'emerald' : 'blue');
    setFormIcon(type === 'kpi_card' ? 'target' : type === 'callout' ? 'alert' : 'lightbulb');
    setIsModalOpen(true);
  };

  const openEditModal = (elem: CustomSlideElement) => {
    setEditingElementId(elem.id);
    setFormType(elem.type);
    setFormTitle(elem.title);
    setFormContent(elem.content);
    setFormValue(elem.value || '');
    setFormColor(elem.color);
    setFormIcon(elem.icon || 'lightbulb');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formTitle.trim() && !formContent.trim()) {
      alert('Por favor, preencha o título ou conteúdo do elemento.');
      return;
    }

    if (editingElementId) {
      onUpdateElement(editingElementId, {
        type: formType,
        title: formTitle.trim(),
        content: formContent.trim(),
        value: formValue.trim(),
        color: formColor,
        icon: formIcon,
      });
    } else {
      onAddElement({
        slideNumber: currentSlide,
        type: formType,
        title: formTitle.trim(),
        content: formContent.trim(),
        value: formValue.trim(),
        color: formColor,
        icon: formIcon,
      });
    }

    setIsModalOpen(false);
  };

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4" />;
      case 'check':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'target':
        return <Target className="w-4 h-4" />;
      case 'shield':
        return <ShieldCheck className="w-4 h-4" />;
      case 'zap':
        return <Zap className="w-4 h-4" />;
      case 'star':
        return <Star className="w-4 h-4" />;
      case 'lightbulb':
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Edit Mode Top Helper / Add Toolbar */}
      {isEditMode && (
        <div
          className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150 ${
            isDark
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              : 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-2 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Alocar Novas Formas no Slide {currentSlide}:</span>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => openAddModal('sticky_note')}
              className="flex items-center space-x-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <StickyNote className="w-3.5 h-3.5" />
              <span>+ Post-it</span>
            </button>

            <button
              type="button"
              onClick={() => openAddModal('kpi_card')}
              className="flex items-center space-x-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <Target className="w-3.5 h-3.5" />
              <span>+ Cartão Métrica</span>
            </button>

            <button
              type="button"
              onClick={() => openAddModal('callout')}
              className="flex items-center space-x-1 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>+ Balão Alerta</span>
            </button>

            <button
              type="button"
              onClick={() => openAddModal('directive_box')}
              className="flex items-center space-x-1 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>+ Caixa Diretriz</span>
            </button>

            <button
              type="button"
              onClick={() => openAddModal('badge_pill')}
              className="flex items-center space-x-1 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>+ Selo/Tag</span>
            </button>

            <button
              type="button"
              onClick={() => openAddModal('quote_banner')}
              className="flex items-center space-x-1 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <Quote className="w-3.5 h-3.5" />
              <span>+ Banner Citação</span>
            </button>
          </div>
        </div>
      )}

      {/* Render Slide Elements */}
      {currentSlideElements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {currentSlideElements.map((elem) => {
            const colors = COLOR_CONFIGS[elem.color] || COLOR_CONFIGS.amber;

            return (
              <div
                key={elem.id}
                className={`p-4 rounded-2xl border-2 transition-all relative group flex flex-col justify-between shadow-md ${
                  isDark ? `${colors.bgDark} ${colors.borderDark}` : `${colors.bgLight} ${colors.borderLight}`
                }`}
              >
                {/* Floating Edit Controls on Hover / Edit Mode */}
                {isEditMode && (
                  <div className="absolute top-2 right-2 flex items-center space-x-1 bg-slate-900/90 p-1 rounded-lg shadow-lg border border-slate-700 z-20">
                    <button
                      type="button"
                      onClick={() => openEditModal(elem)}
                      className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                      title="Editar forma/texto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Cycle Color */}
                    <button
                      type="button"
                      onClick={() => {
                        const colorList: ShapeColor[] = ['amber', 'emerald', 'blue', 'rose', 'purple', 'slate'];
                        const nextIdx = (colorList.indexOf(elem.color) + 1) % colorList.length;
                        onUpdateElement(elem.id, { color: colorList[nextIdx] });
                      }}
                      className="p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded transition cursor-pointer"
                      title="Trocar cor"
                    >
                      <Palette className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteElement(elem.id)}
                      className="p-1 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded transition cursor-pointer"
                      title="Excluir forma"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Content according to Shape Type */}
                {elem.type === 'sticky_note' && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5">
                      <StickyNote className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className={`text-xs font-black uppercase tracking-wider ${isDark ? colors.textDark : colors.textLight}`}>
                        {elem.title}
                      </span>
                    </div>
                    <p className={`text-xs sm:text-sm font-medium leading-relaxed italic ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      "{elem.content}"
                    </p>
                  </div>
                )}

                {elem.type === 'kpi_card' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black uppercase tracking-wider ${isDark ? colors.textDark : colors.textLight}`}>
                        {elem.title}
                      </span>
                      <div className={`p-1.5 rounded-lg ${colors.accent}`}>
                        {renderIcon(elem.icon)}
                      </div>
                    </div>
                    {elem.value && (
                      <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                        {elem.value}
                      </div>
                    )}
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {elem.content}
                    </p>
                  </div>
                )}

                {elem.type === 'callout' && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1 rounded-md ${colors.accent}`}>
                        {renderIcon(elem.icon)}
                      </div>
                      <span className={`text-xs font-black uppercase tracking-wide ${isDark ? colors.textDark : colors.textLight}`}>
                        {elem.title}
                      </span>
                    </div>
                    <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {elem.content}
                    </p>
                  </div>
                )}

                {elem.type === 'directive_box' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-[10px] ${colors.accent}`}>
                        DIRETRIZ DA DIRETORIA
                      </span>
                      {renderIcon(elem.icon)}
                    </div>
                    <h5 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-950'}`}>
                      {elem.title}
                    </h5>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {elem.content}
                    </p>
                  </div>
                )}

                {elem.type === 'badge_pill' && (
                  <div className="flex items-center space-x-3 py-1">
                    <div className={`p-2 rounded-xl ${colors.accent}`}>
                      {renderIcon(elem.icon)}
                    </div>
                    <div>
                      <h5 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                        {elem.title}
                      </h5>
                      <p className={`text-[11px] leading-tight ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {elem.content}
                      </p>
                    </div>
                  </div>
                )}

                {elem.type === 'quote_banner' && (
                  <div className="space-y-2 text-center py-2">
                    <Quote className="w-5 h-5 mx-auto text-amber-500 opacity-70" />
                    <p className={`text-xs sm:text-sm font-bold italic ${isDark ? colors.textDark : colors.textLight}`}>
                      {elem.content}
                    </p>
                    {elem.title && (
                      <span className="text-[10px] font-semibold opacity-75 block">
                        — {elem.title}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SHAPE CREATION & EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">
                    {editingElementId ? 'Editar Elemento do Slide' : 'Alocar Nova Forma no Slide'}
                  </h4>
                  <p className="text-[11px] text-slate-400">Slide {currentSlide} • Personalização do Quadro</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-800">
              {/* Type Picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Tipo de Forma / Bloco:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sticky_note', label: 'Post-it', icon: StickyNote },
                    { id: 'kpi_card', label: 'Métrica', icon: Target },
                    { id: 'callout', label: 'Balão Alerta', icon: AlertTriangle },
                    { id: 'directive_box', label: 'Diretriz', icon: Flag },
                    { id: 'badge_pill', label: 'Selo/Tag', icon: ShieldCheck },
                    { id: 'quote_banner', label: 'Citação', icon: Quote },
                  ].map((t) => {
                    const IconComp = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormType(t.id as ShapeType)}
                        className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                          formType === t.id
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Scheme */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Esquema de Cor:
                </label>
                <div className="flex items-center space-x-2">
                  {[
                    { id: 'amber', bg: 'bg-amber-500', name: 'Âmbar' },
                    { id: 'emerald', bg: 'bg-emerald-500', name: 'Verde' },
                    { id: 'blue', bg: 'bg-blue-500', name: 'Azul' },
                    { id: 'rose', bg: 'bg-rose-500', name: 'Rosa' },
                    { id: 'purple', bg: 'bg-purple-500', name: 'Roxo' },
                    { id: 'slate', bg: 'bg-slate-700', name: 'Neutro' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormColor(c.id as ShapeColor)}
                      className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition cursor-pointer ${
                        formColor === c.id ? 'ring-4 ring-amber-400/50 scale-110 shadow-md' : 'opacity-75 hover:opacity-100'
                      }`}
                      title={c.name}
                    >
                      {formColor === c.id && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Header */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Título ou Cabeçalho:
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Ação Imediata / Meta Q3"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              {/* Metric Value (if KPI card) */}
              {formType === 'kpi_card' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Valor de Destaque / Métrica (Opcional):
                  </label>
                  <input
                    type="text"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder="Ex: 100%, Zero, R$ 50.000, 180 dias"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:border-amber-500 outline-none font-bold"
                  />
                </div>
              )}

              {/* Content / Body */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Texto / Conteúdo Principal:
                </label>
                <textarea
                  rows={3}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Digite a mensagem, recomendação ou descrição..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 focus:bg-white focus:border-amber-500 outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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
                <span>{editingElementId ? 'Salvar Alterações' : 'Adicionar ao Quadro'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
