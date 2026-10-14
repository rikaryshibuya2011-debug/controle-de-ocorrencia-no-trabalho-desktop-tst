import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { IncidentRecord, CalculatedSafetyKPIs, SafetyHHTConfig, OccurrenceType } from '../types';

export const EVENT_TYPE_LABELS: Record<OccurrenceType, string> = {
  desvio: 'Desvios',
  incidente: 'Incidentes',
  sem_afastamento: 'Acidente sem Afastamento',
  com_afastamento: 'Acidente com Afastamento',
  fatal: 'Fatal',
  trajeto: 'Acidente de Trajeto',
};

// Export individual Investigation Sheet to Official PDF
export function exportIncidentSheetToPDF(incident: IncidentRecord) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const headerBgColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const subBgColor: [number, number, number] = [241, 245, 249]; // Slate 100

  // Top Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(14, 10, 182, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('FICHA DE INVESTIGAÇÃO DE ACIDENTE E INCIDENTE', 105, 18, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestão de Segurança do Trabalho - NBR 14280 / NR-01', 105, 24, { align: 'center' });

  let currentY = 32;

  // 1. IDENTIFICAÇÃO DO EVENTO
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [
      [
        {
          content: '1. IDENTIFICAÇÃO DO EVENTO',
          colSpan: 4,
          styles: { fillColor: headerBgColor, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        },
      ],
    ],
    body: [
      [
        { content: `Tipo de Ocorrência:\n${EVENT_TYPE_LABELS[incident.eventType]}`, colSpan: 2, styles: { fontStyle: 'bold' } },
        { content: `Nº da Ficha:\n${incident.fileNumber}`, styles: { fontStyle: 'bold' } },
        { content: `Status:\n${incident.status.toUpperCase()}` },
      ],
      [
        `Data do Fato: ${incident.eventDate || '___/___/______'}`,
        `Horário: ${incident.eventTime || '__:__'} hs`,
        `Data Investigação: ${incident.investigationDate || '___/___/______'}`,
        `Gravidade: ${incident.severity || 'Média'}`,
      ],
      [
        { content: `Local Exato: ${incident.exactLocation || 'Não informado'}`, colSpan: 2 },
        { content: `Setor / Área: ${incident.sector || 'Geral'}`, colSpan: 2 },
      ],
      [
        { content: `Turno: ${incident.shift || 'Geral'}`, colSpan: 2 },
        { content: `Unidade: ${incident.companyUnit || 'Unidade Principal'}`, colSpan: 2 },
      ],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // 2. DADOS DOS TRABALHADORES ENVOLVIDOS
  const workers = incident.workers || [];
  const workersWithVictim = workers.filter((w) => w.hasWorker);
  const workerBody: any[][] = [];
  if (workersWithVictim.length > 0) {
    workersWithVictim.forEach((w, idx) => {
      workerBody.push([
        { content: `Colaborador ${idx + 1}: ${w.fullName || 'Não informado'}`, colSpan: 2, styles: { fontStyle: 'bold' as const } },
        { content: `Função: ${w.jobTitle || 'N/A'}`, colSpan: 2 },
      ]);
      workerBody.push([
        `Tempo na Função: ${w.timeInRole || '-'}`,
        `Gênero: ${w.gender || 'N/A'}`,
        `Setor: ${w.sector || '-'}`,
        `Líder: ${w.leader || '-'}`,
      ]);
    });
  } else {
    workerBody.push([
      { content: 'Não se aplica (Quase-Acidente / Sem Vítima)', colSpan: 4, styles: { fontStyle: 'italic' as const } },
    ]);
  }
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [
      [
        {
          content: '2. DADOS DOS TRABALHADORES ENVOLVIDOS (Se houver)',
          colSpan: 4,
          styles: { fillColor: headerBgColor, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        },
      ],
    ],
    body: workerBody,
    styles: { fontSize: 8, cellPadding: 2 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // 3. DESCRIÇÃO DA OCORRÊNCIA
  const occ = incident.occurrence;
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [
      [
        {
          content: '3. DESCRIÇÃO DA OCORRÊNCIA',
          colSpan: 2,
          styles: { fillColor: headerBgColor, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        },
      ],
    ],
    body: [
      [
        {
          content: `Descrição Detalhada dos Fatos:\n${occ.detailedDescription || 'Sem descrição detalhada.'}`,
          colSpan: 2,
        },
      ],
      [
        `Atividade Exercida: ${occ.activityAtMoment || 'Não especificada'}`,
        `Ferramentas / Máquinas: ${occ.toolsUsed || 'Não informado'}`,
      ],
      [
        {
          content: `Sequência dos Fatos:\n${occ.sequenceOfEvents || 'Não informada.'}`,
          colSpan: 2,
        },
      ],
      [
        `Parte do Corpo Afetada: ${occ.injuredBodyPart || 'Nenhuma'}`,
        `Tipo de Lesão: ${occ.injuryType || 'Nenhum'}`,
      ],
      [
        `Dias Perdidos (Afastamento): ${occ.daysLostActual || occ.daysLostEstimated || 0} dias`,
        `Houve Testemunhas? ${occ.hasWitnesses ? 'Sim' : 'Não'} | Testemunha: ${occ.witness1Name || 'Nenhuma'}`,
      ],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // 4. ANÁLISE DE CAUSAS (5 PORQUÊS)
  const c = incident.causeAnalysis;
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [
      [
        {
          content: '4. ANÁLISE DE CAUSAS (Metodologia dos 5 Porquês)',
          colSpan: 2,
          styles: { fillColor: headerBgColor, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        },
      ],
    ],
    body: [
      [{ content: `Problema Identificado:\n${c.identifiedProblem || 'Não definido'}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: subBgColor } }],
      [{ content: '1. Por que aconteceu?', styles: { fontStyle: 'bold', cellWidth: 45 } }, c.why1 || '-'],
      [{ content: '2. Por que [resposta anterior]?', styles: { fontStyle: 'bold' } }, c.why2 || '-'],
      [{ content: '3. Por que [resposta anterior]?', styles: { fontStyle: 'bold' } }, c.why3 || '-'],
      [{ content: '4. Por que [resposta anterior]?', styles: { fontStyle: 'bold' } }, c.why4 || '-'],
      [
        { content: '5. Causa Raiz (Definitiva):', styles: { fontStyle: 'bold', textColor: [185, 28, 28] as [number, number, number] } },
        { content: c.why5_rootCause || 'Não definida', styles: { fontStyle: 'bold', textColor: [185, 28, 28] as [number, number, number] } },
      ],
      [{ content: `Categoria da Causa: ${c.causeCategory || 'Geral'}`, colSpan: 2 }],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
  });

  // Page break check if needed
  if (doc.internal.pageSize.getHeight() - (doc as any).lastAutoTable.finalY < 65) {
    doc.addPage();
    currentY = 15;
  } else {
    currentY = (doc as any).lastAutoTable.finalY + 3;
  }

  // 5. PLANO DE AÇÃO
  const actionRows =
    incident.actionPlans.length > 0
      ? incident.actionPlans.map((a, idx) => [
          `${idx + 1}. ${a.what}`,
          a.how || '-',
          a.who || '-',
          a.deadline || '-',
          a.status || 'Pendente',
        ])
      : [['Nenhuma ação cadastrada', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [
      [
        {
          content: '5. PLANO DE AÇÃO (Medidas Corretivas e Preventivas - 5W2H)',
          colSpan: 5,
          styles: { fillColor: headerBgColor, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        },
      ],
      ['O que fazer? (Ação)', 'Como fazer? (Método)', 'Quem fará? (Responsável)', 'Até quando? (Prazo)', 'Status'],
    ],
    body: actionRows,
    headStyles: { fillColor: [51, 65, 85] as [number, number, number], textColor: 255, fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // 6. RESPONSÁVEIS PELA INVESTIGAÇÃO
  const team = incident.investigationTeam;
  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoStr;
    }
  };

  const invTxt = `Investigador / Técnico SST:\n${team.investigatorName || 'Não preenchido'}\n${team.investigatorRegistration ? 'Reg: ' + team.investigatorRegistration + '\n' : ''}Status: ${team.investigatorSigned ? 'VALIDADO / ASSINADO' : 'Pendente'}${team.investigatorSignatureDate ? '\nData: ' + formatDate(team.investigatorSignatureDate) : ''}`;
  const cipaTxt = `Representante CIPA:\n${team.cipaRepresentative || 'Não preenchido'}\nStatus: ${team.cipaSigned ? 'VALIDADO / ASSINADO' : 'Pendente'}${team.cipaSignatureDate ? '\nData: ' + formatDate(team.cipaSignatureDate) : ''}`;
  const mgrTxt = `Gestor da Área / Liderança:\n${team.areaManager || 'Não preenchido'}\nStatus: ${team.areaManagerSigned ? 'VALIDADO / ASSINADO' : 'Pendente'}${team.areaManagerSignatureDate ? '\nData: ' + formatDate(team.areaManagerSignatureDate) : ''}`;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [
      [
        {
          content: '6. RESPONSÁVEIS PELA INVESTIGAÇÃO E VALIDAÇÃO DIGITAL',
          colSpan: 3,
          styles: { fillColor: headerBgColor, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        },
      ],
    ],
    body: [
      [
        invTxt,
        cipaTxt,
        mgrTxt,
      ],
    ],
    styles: { fontSize: 7.5, cellPadding: 3, minCellHeight: 18 },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.row.index === 0) {
        let imgUrl: string | undefined;
        if (data.column.index === 0 && team.investigatorSigned && team.investigatorSignatureImage?.startsWith('data:image')) {
          imgUrl = team.investigatorSignatureImage;
        } else if (data.column.index === 1 && team.cipaSigned && team.cipaSignatureImage?.startsWith('data:image')) {
          imgUrl = team.cipaSignatureImage;
        } else if (data.column.index === 2 && team.areaManagerSigned && team.areaManagerSignatureImage?.startsWith('data:image')) {
          imgUrl = team.areaManagerSignatureImage;
        }

        if (imgUrl) {
          try {
            const cell = data.cell;
            // Draw thumbnail of signature in lower area of the cell
            const imgWidth = Math.min(32, cell.width - 6);
            const imgHeight = 10;
            const xPos = cell.x + (cell.width - imgWidth) / 2;
            const yPos = cell.y + cell.height - imgHeight - 1.5;
            doc.addImage(imgUrl, 'PNG', xPos, yPos, imgWidth, imgHeight);
          } catch (e) {
            // Ignore image draw failure
          }
        }
      }
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(
      `Ficha ${incident.fileNumber} - Gerado eletronicamente em ${new Date().toLocaleDateString('pt-BR')} | Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }

  doc.save(`${incident.fileNumber}_Investigacao_SST.pdf`);
}

// Export Complete Monthly / Management Report in PDF
export function exportMonthlyReportToPDF(
  incidents: IncidentRecord[],
  kpis: CalculatedSafetyKPIs,
  monthYearLabel: string,
  hhtConfigs: SafetyHHTConfig[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const headerBgColor: [number, number, number] = [15, 23, 42];

  // Title block
  doc.setFillColor(15, 23, 42);
  doc.rect(14, 12, 182, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO MENSAL DE SEGURANÇA DO TRABALHO (SST)', 105, 20, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Indicadores, Ocorrências e Planos de Ação - Período: ${monthYearLabel}`, 105, 26, { align: 'center' });

  let currentY = 35;

  // KPI Summary Table
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [
      [
        {
          content: 'PAINEL DE INDICADORES PRINCIPAIS DE SST (NBR 14280 / OSHA)',
          colSpan: 4,
          styles: { fillColor: headerBgColor, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        },
      ],
    ],
    body: [
      [
        { content: `Total de Ocorrências:\n${kpis.totalIncidents}`, styles: { fontStyle: 'bold' } },
        { content: `Desvios:\n${kpis.deviationCount}`, styles: { fontStyle: 'bold' } },
        { content: `Incidentes:\n${kpis.nearMissCount}`, styles: { fontStyle: 'bold' } },
        { content: `Acidentes:\n${kpis.firstAidCount + kpis.lostTimeCount + kpis.fatalCount + kpis.commuteCount}`, styles: { fontStyle: 'bold', textColor: [220, 38, 38] as [number, number, number] } },
      ],
      [
        { content: `Taxa Frequência (TF):\n${kpis.tfRate}`, styles: { fontStyle: 'bold' } },
        { content: `Taxa Gravidade (TG):\n${kpis.tgRate}`, styles: { fontStyle: 'bold' } },
        { content: `Dias Perdidos:\n${kpis.totalDaysLost} dias`, styles: { fontStyle: 'bold' } },
        { content: `Horas Trabalhadas (HHT):\n${kpis.totalHHT.toLocaleString('pt-BR')} h`, styles: { fontStyle: 'bold' } },
      ],
      [
        {
          content: `Dias sem Acidentes c/ Afastamento: ${kpis.daysWithoutLostTimeAccident} dias consecutivos`,
          colSpan: 2,
          styles: { fontStyle: 'bold', textColor: [22, 101, 52] as [number, number, number] },
        },
        {
          content: `Eficácia dos Planos de Ação: ${kpis.actionEffectivenessRate}% (${kpis.actionsCompleted}/${kpis.actionsTotal} concluídas)`,
          colSpan: 2,
          styles: { fontStyle: 'bold' },
        },
      ],
    ],
    styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // List of Incidents
  const incidentRows = incidents.map((i) => [
    i.fileNumber,
    i.eventDate,
    EVENT_TYPE_LABELS[i.eventType] || i.eventType,
    i.sector,
    i.workers?.some((w) => w.hasWorker) ? i.workers.filter((w) => w.hasWorker).map((w) => w.fullName).join(', ') : 'Sem vítima',
    i.occurrence.injuredBodyPart || '-',
    i.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [
      [
        {
          content: 'REGISTRO DE OCORRÊNCIAS DO PERÍODO',
          colSpan: 7,
          styles: { fillColor: headerBgColor, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        },
      ],
      ['Nº Ficha', 'Data', 'Tipo', 'Setor', 'Trabalhador', 'Parte do Corpo', 'Status'],
    ],
    body: incidentRows.length > 0 ? incidentRows : [['Nenhum registro no período selecionado', '', '', '', '', '', '']],
    headStyles: { fillColor: [51, 65, 85] as [number, number, number], textColor: 255, fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 2 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Consolidated Action Plans Table
  const allActions = incidents.flatMap((inc) =>
    inc.actionPlans.map((act) => ({
      ...act,
      fileNumber: inc.fileNumber,
    }))
  );

  const actionTableRows = allActions.map((a) => [
    a.fileNumber,
    a.what,
    a.who,
    a.deadline,
    a.status,
  ]);

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [
      [
        {
          content: 'PLANO DE AÇÃO CONSOLIDADO (5W2H)',
          colSpan: 5,
          styles: { fillColor: headerBgColor, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        },
      ],
      ['Origem', 'Ação Proposta (O que fazer)', 'Responsável', 'Prazo', 'Status'],
    ],
    body: actionTableRows.length > 0 ? actionTableRows : [['Sem ações no período', '', '', '', '']],
    headStyles: { fillColor: [51, 65, 85] as [number, number, number], textColor: 255, fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 2 },
  });

  // Page Numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(
      `Relatório Gerencial SST - Período: ${monthYearLabel} | Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }

  doc.save(`Relatorio_SST_${monthYearLabel.replace('/', '_')}.pdf`);
}

// Export All Incidents & Action Plans to Excel (.XLSX)
export function exportToExcel(
  incidents: IncidentRecord[],
  kpis: CalculatedSafetyKPIs,
  monthYearLabel: string
) {
  const wb = XLSX.utils.book_new();

  // 1. Ocorrências Sheet
  const incidentsData = incidents.map((i) => {
    const workersWithVictim = (i.workers || []).filter((w) => w.hasWorker);
    const mainWorker = workersWithVictim[0];
    return {
      'Nº Ficha': i.fileNumber,
      'Tipo de Ocorrência': EVENT_TYPE_LABELS[i.eventType] || i.eventType,
      'Data do Fato': i.eventDate,
      Horário: i.eventTime,
      'Data Investigação': i.investigationDate,
      'Local Exato': i.exactLocation,
      'Setor / Área': i.sector,
      Turno: i.shift,
      Gravidade: i.severity,
      'Trabalhador Envolvido': mainWorker ? workersWithVictim.map((w) => w.fullName).join(', ') : 'Não aplicável (Sem vítima)',
      Cargo: mainWorker ? mainWorker.jobTitle : '',
      'Tempo na Função': mainWorker ? mainWorker.timeInRole : '',
      Gênero: mainWorker ? mainWorker.gender : '',
      Matrícula: mainWorker ? mainWorker.registrationNumber : '',
      'Setor Colaborador': mainWorker ? mainWorker.sector || '' : '',
      'Líder Responsável': mainWorker ? mainWorker.leader || '' : '',
      'Descrição da Ocorrência': i.occurrence.detailedDescription,
      'Atividade no Momento': i.occurrence.activityAtMoment,
      'Ferramentas / Máquinas': i.occurrence.toolsUsed,
      'Parte do Corpo Atingida': i.occurrence.injuredBodyPart,
      'Tipo de Lesão': i.occurrence.injuryType,
      'Dias Perdidos': i.occurrence.daysLostActual || i.occurrence.daysLostEstimated || 0,
      'Houve Testemunhas?': i.occurrence.hasWitnesses ? 'Sim' : 'Não',
      'Nome Testemunha': i.occurrence.witness1Name || '',
      'Problema Identificado': i.causeAnalysis.identifiedProblem,
      'Por que 1': i.causeAnalysis.why1,
      'Por que 2': i.causeAnalysis.why2,
      'Por que 3': i.causeAnalysis.why3,
      'Por que 4': i.causeAnalysis.why4,
      'Causa Raiz': i.causeAnalysis.why5_rootCause,
      'Categoria Causa': i.causeAnalysis.causeCategory,
      'Investigador Responsável': i.investigationTeam.investigatorName,
      'Representante CIPA': i.investigationTeam.cipaRepresentative,
      'Gestor da Área': i.investigationTeam.areaManager,
      Status: i.status,
    };
  });

  const wsIncidents = XLSX.utils.json_to_sheet(incidentsData);
  XLSX.utils.book_append_sheet(wb, wsIncidents, 'Ocorrências_SST');

  // 2. Planos de Ação 5W2H Sheet
  const actionData = incidents.flatMap((inc) =>
    inc.actionPlans.map((act, idx) => ({
      'Nº Ficha': inc.fileNumber,
      'Tipo de Evento': EVENT_TYPE_LABELS[inc.eventType] || inc.eventType,
      Setor: inc.sector,
      'Item Nº': idx + 1,
      'O que Fazer? (Ação)': act.what,
      'Como Fazer? (Método)': act.how,
      'Quem Fará? (Responsável)': act.who,
      'Até Quando? (Prazo)': act.deadline,
      Status: act.status,
      Categoria: act.category || 'Geral',
      'Custo Estimado': act.estimatedCost || 'R$ 0,00',
      'Observações': act.notes || '',
    }))
  );

  const wsActions = XLSX.utils.json_to_sheet(actionData);
  XLSX.utils.book_append_sheet(wb, wsActions, 'Planos_Acao_5W2H');

  // 3. Indicadores & KPIs Sheet
  const kpisData = [
    { Indicador: 'Período do Relatório', Valor: monthYearLabel, Unidade: '-' },
    { Indicador: 'Total de Ocorrências Registradas', Valor: kpis.totalIncidents, Unidade: 'eventos' },
    { Indicador: 'Desvios', Valor: kpis.deviationCount, Unidade: 'eventos' },
    { Indicador: 'Incidentes (Near Miss)', Valor: kpis.nearMissCount, Unidade: 'eventos' },
    { Indicador: 'Acidentes sem Afastamento', Valor: kpis.firstAidCount, Unidade: 'eventos' },
    { Indicador: 'Acidentes com Afastamento', Valor: kpis.lostTimeCount, Unidade: 'eventos' },
    { Indicador: 'Acidentes Fatais', Valor: kpis.fatalCount, Unidade: 'eventos' },
    { Indicador: 'Acidentes de Trajeto', Valor: kpis.commuteCount, Unidade: 'eventos' },
    { Indicador: 'Total de Dias Perdidos / Debitados', Valor: kpis.totalDaysLost, Unidade: 'dias' },
    { Indicador: 'Total de Horas Homem Trabalhadas (HHT)', Valor: kpis.totalHHT, Unidade: 'horas' },
    { Indicador: 'Taxa de Frequência (TF - NBR 14280)', Valor: kpis.tfRate, Unidade: '(ACAF*10^6)/HHT' },
    { Indicador: 'Taxa de Gravidade (TG - NBR 14280)', Valor: kpis.tgRate, Unidade: '(Dias*10^6)/HHT' },
    { Indicador: 'Placar de Segurança (Dias sem Afastamento)', Valor: kpis.daysWithoutLostTimeAccident, Unidade: 'dias consecutivos' },
    { Indicador: 'Total de Ações Corretivas 5W2H', Valor: kpis.actionsTotal, Unidade: 'ações' },
    { Indicador: 'Ações Concluídas no Prazo', Valor: kpis.actionsCompleted, Unidade: 'ações' },
    { Indicador: 'Ações em Andamento / Pendentes', Valor: kpis.actionsPending, Unidade: 'ações' },
    { Indicador: 'Taxa de Eficácia dos Planos de Ação', Valor: `${kpis.actionEffectivenessRate}%`, Unidade: '%' },
  ];

  const wsKPIs = XLSX.utils.json_to_sheet(kpisData);
  XLSX.utils.book_append_sheet(wb, wsKPIs, 'Indicadores_KPIs_SST');

  // Download XLSX file
  XLSX.writeFile(wb, `SST_Relatorio_Consolidado_${monthYearLabel.replace('/', '_')}.xlsx`);
}
