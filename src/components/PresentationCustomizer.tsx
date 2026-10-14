import React from 'react';
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
} from 'lucide-react';

export type ShapeType =
  | 'sticky_note'
  | 'kpi_card'
  | 'callout'
  | 'directive_box'
  | 'badge_pill'
  | 'quote_banner';

export type ShapeColor = 'amber' | 'emerald' | 'blue' | 'rose' | 'purple' | 'slate';

export interface CustomSlideElement {
  id: string;
  slideNumber: number;
  type: ShapeType;
  title: string;
  content: string;
  value?: string;
  color: ShapeColor;
  icon?: 'alert' | 'check' | 'lightbulb' | 'target' | 'shield' | 'zap' | 'star';
}

export interface SlideTextOverrides {
  // Slide 1
  slide1Title?: string;
  slide1Subtitle?: string;
  slide1PlacarTitle?: string;
  slide1PlacarSub?: string;

  // Slide 2
  slide2Title?: string;
  slide2Subtitle?: string;
  slide2PyramidConclusion?: string;

  // Slide 3
  slide3Title?: string;
  slide3Subtitle?: string;
  slide3AuditingTitle?: string;
  slide3SectorNote1Title?: string;
  slide3SectorNote1Desc?: string;
  slide3SectorNote2Title?: string;
  slide3SectorNote2Desc?: string;
  slide3SectorNote3Title?: string;
  slide3SectorNote3Desc?: string;

  // Slide 4
  slide4Title?: string;
  slide4Subtitle?: string;
  slide4EffectivenessNote?: string;

  // Slide 5
  slide5Title?: string;
  slide5Subtitle?: string;
  slide5Dir1Title?: string;
  slide5Dir1Desc?: string;
  slide5Dir2Title?: string;
  slide5Dir2Desc?: string;
  slide5Dir3Title?: string;
  slide5Dir3Desc?: string;
  slide5QuoteText?: string;
  slide5QuoteAuthor?: string;
}

export const DEFAULT_TEXT_OVERRIDES: SlideTextOverrides = {
  slide1Title: 'Painel de Desempenho e Indicadores Chave (KPIs)',
  slide1Subtitle: 'Visão Geral Executiva & Placar de Segurança',
  slide1PlacarTitle: 'Placar de Segurança sem Acidente c/ Afastamento',
  slide1PlacarSub: 'dias consecutivos de trabalho seguro',

  slide2Title: 'Pirâmide de Riscos e Relação de Frequência/Gravidade',
  slide2Subtitle: 'Modelo Preventivo NBR 14280 & Bird/Heinrich',
  slide2PyramidConclusion:
    'A concentração dos reportes na base da pirâmide (Incidentes e Desvios) comprova a atuação preventiva da organização. Ao sanar desvios preliminares, evita-se a escalada para acidentes incapacitantes ou fatais.',

  slide3Title: 'Mapeamento de Ocorrências por Setor de Trabalho',
  slide3Subtitle: 'Mapeamento de Risco Operacional & Exposição',
  slide3AuditingTitle: 'Recomendações e Foco de Auditoria por Setor:',
  slide3SectorNote1Title: 'Setor Produtivo / Máquinas',
  slide3SectorNote1Desc: 'Auditoria de conformidade NR-12, verificação de sensores ópticos e bloqueio LOTO.',
  slide3SectorNote2Title: 'Logística & Armazenagem',
  slide3SectorNote2Desc: 'Inspeção do plano de trânsito NR-11, velocidade de empilhadeiras e segregação de pedestres.',
  slide3SectorNote3Title: 'Oficinas & Manutenção',
  slide3SectorNote3Desc: 'Checagem de EPIs de alta proteção ocular/facial e permissões de trabalho a quente (PT).',

  slide4Title: 'Causas Raízes Identificadas e Eficácia dos Planos de Ação',
  slide4Subtitle: 'Metodologia dos 5 Porquês & Ações 5W2H',
  slide4EffectivenessNote:
    'das ações foram implantadas e auditadas dentro do prazo acordado com a gerência.',

  slide5Title: 'Diretrizes e Prioridades Estratégicas para o Próximo Ciclo',
  slide5Subtitle: 'Tomada de Decisão & Liderança',
  slide5Dir1Title: 'Bloqueio LOTO & Proteções NR-12',
  slide5Dir1Desc:
    'Garantir auditoria quinzenal em todos os dispositivos de intertravamento de segurança e fiscalizar o uso obrigatório de cadeados e garras LOTO em qualquer intervenção mecânica.',
  slide5Dir2Title: 'Cultura de Reporte de Incidentes e Desvios',
  slide5Dir2Desc:
    'Incentivar os operadores de chão de fábrica a registrar 100% dos desvios operacionais sem punitivismo, premiando setores com maior índice de resolução proativa.',
  slide5Dir3Title: 'Engajamento da Alta Liderança',
  slide5Dir3Desc:
    'Realização de Caminhadas de Segurança (Safety Walks) mensais com gerentes e diretores nos postos operacionais para reforço da segurança como valor inegociável.',
  slide5QuoteText:
    '"Nenhum trabalho é tão urgente ou importante que não possa ser realizado com total segurança e respeito à vida."',
  slide5QuoteAuthor: 'Comitê Integrado de Segurança, Saúde & Meio Ambiente',
};

export const COLOR_CONFIGS: Record<
  ShapeColor,
  {
    bgDark: string;
    bgLight: string;
    borderDark: string;
    borderLight: string;
    textDark: string;
    textLight: string;
    accent: string;
  }
> = {
  amber: {
    bgDark: 'bg-amber-950/40',
    bgLight: 'bg-amber-50',
    borderDark: 'border-amber-500/40',
    borderLight: 'border-amber-300',
    textDark: 'text-amber-300',
    textLight: 'text-amber-950',
    accent: 'bg-amber-500 text-slate-950',
  },
  emerald: {
    bgDark: 'bg-emerald-950/40',
    bgLight: 'bg-emerald-50',
    borderDark: 'border-emerald-500/40',
    borderLight: 'border-emerald-300',
    textDark: 'text-emerald-300',
    textLight: 'text-emerald-950',
    accent: 'bg-emerald-500 text-white',
  },
  blue: {
    bgDark: 'bg-blue-950/40',
    bgLight: 'bg-blue-50',
    borderDark: 'border-blue-500/40',
    borderLight: 'border-blue-300',
    textDark: 'text-blue-300',
    textLight: 'text-blue-950',
    accent: 'bg-blue-500 text-white',
  },
  rose: {
    bgDark: 'bg-rose-950/40',
    bgLight: 'bg-rose-50',
    borderDark: 'border-rose-500/40',
    borderLight: 'border-rose-300',
    textDark: 'text-rose-300',
    textLight: 'text-rose-950',
    accent: 'bg-rose-500 text-white',
  },
  purple: {
    bgDark: 'bg-purple-950/40',
    bgLight: 'bg-purple-50',
    borderDark: 'border-purple-500/40',
    borderLight: 'border-purple-300',
    textDark: 'text-purple-300',
    textLight: 'text-purple-950',
    accent: 'bg-purple-500 text-white',
  },
  slate: {
    bgDark: 'bg-slate-900/90',
    bgLight: 'bg-slate-100',
    borderDark: 'border-slate-700',
    borderLight: 'border-slate-300',
    textDark: 'text-slate-200',
    textLight: 'text-slate-800',
    accent: 'bg-slate-700 text-white',
  },
};
