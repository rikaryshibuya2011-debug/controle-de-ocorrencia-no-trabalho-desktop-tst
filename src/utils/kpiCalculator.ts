import { IncidentRecord, SafetyHHTConfig, CalculatedSafetyKPIs } from '../types';

export function calculateSafetyKPIs(
  incidents: IncidentRecord[],
  hhtConfigs: SafetyHHTConfig[],
  selectedMonthYear?: string
): CalculatedSafetyKPIs {
  // Filter incidents if specific month selected, otherwise aggregate current year
  const filtered = selectedMonthYear
    ? incidents.filter((inc) => inc && inc.eventDate && inc.eventDate.startsWith(selectedMonthYear))
    : incidents.filter(Boolean);

  const deviationCount = filtered.filter((i) => i.eventType === 'desvio').length;
  const nearMissCount = filtered.filter((i) => i.eventType === 'incidente').length;
  const firstAidCount = filtered.filter((i) => i.eventType === 'sem_afastamento').length;
  const lostTimeCount = filtered.filter((i) => i.eventType === 'com_afastamento').length;
  const fatalCount = filtered.filter((i) => i.eventType === 'fatal').length;
  const commuteCount = filtered.filter((i) => i.eventType === 'trajeto').length;

  const totalIncidents = filtered.length;
  const totalDaysLost = filtered.reduce(
    (acc, inc) => acc + (inc.occurrence?.daysLostActual || inc.occurrence?.daysLostEstimated || 0),
    0
  );

  // Total HHT
  let totalHHT = 0;
  if (selectedMonthYear) {
    const config = hhtConfigs.find((c) => c.monthYear === selectedMonthYear);
    totalHHT = config ? config.hht : 90000;
  } else {
    totalHHT = hhtConfigs.reduce((acc, c) => acc + (c?.hht || 0), 0) || 540000;
  }

  // Taxa de Frequência (TF) = (Acidentes com Afastamento * 1.000.000) / HHT
  const tfRate = totalHHT > 0 ? (lostTimeCount * 1000000) / totalHHT : 0;

  // Taxa de Gravidade (TG) = (Dias Perdidos * 1.000.000) / HHT
  const tgRate = totalHHT > 0 ? (totalDaysLost * 1000000) / totalHHT : 0;

  // Dias sem acidentes com afastamento
  const lostTimeIncidents = incidents
    .filter((i) => i && i.eventType === 'com_afastamento' && i.eventDate)
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  let daysWithoutLostTimeAccident = 0;
  const now = new Date();
  if (lostTimeIncidents.length > 0) {
    const lastDate = new Date(lostTimeIncidents[0].eventDate);
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    daysWithoutLostTimeAccident = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } else {
    daysWithoutLostTimeAccident = 365;
  }

  // Action plan stats
  const allActions = filtered.flatMap((i) => i.actionPlans || []);
  const actionsTotal = allActions.length;
  const actionsCompleted = allActions.filter((a) => a.status === 'Concluído').length;
  const actionsPending = allActions.filter((a) => a.status === 'Pendente' || a.status === 'Em Andamento').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const actionsOverdue = allActions.filter(
    (a) => a.status !== 'Concluído' && a.status !== 'Cancelado' && a.deadline < todayStr
  ).length;

  const actionEffectivenessRate =
    actionsTotal > 0 ? Math.round((actionsCompleted / actionsTotal) * 100) : 100;

  return {
    totalIncidents,
    deviationCount,
    nearMissCount,
    firstAidCount,
    lostTimeCount,
    fatalCount,
    commuteCount,
    totalDaysLost,
    totalHHT,
    tfRate: Number(tfRate.toFixed(2)),
    tgRate: Number(tgRate.toFixed(2)),
    daysWithoutLostTimeAccident,
    actionsTotal,
    actionsCompleted,
    actionsPending,
    actionsOverdue,
    actionEffectivenessRate,
  };
}

export function getMonthlyTrendData(incidents: IncidentRecord[], hhtConfigs: SafetyHHTConfig[]) {
  const months = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];
  const monthLabels: Record<string, string> = {
    '2026-03': 'Mar/26',
    '2026-04': 'Abr/26',
    '2026-05': 'Mai/26',
    '2026-06': 'Jun/26',
    '2026-07': 'Jul/26',
    '2026-08': 'Ago/26',
  };

  return months.map((m) => {
    const monthIncidents = incidents.filter((i) => i && i.eventDate && i.eventDate.startsWith(m));
    const hhtConfig = hhtConfigs.find((c) => c.monthYear === m);
    const hht = hhtConfig ? hhtConfig.hht : 90000;
    const targetTF = hhtConfig ? hhtConfig.targetTF : 2.0;

    const deviation = monthIncidents.filter((i) => i.eventType === 'desvio').length;
    const nearMiss = monthIncidents.filter((i) => i.eventType === 'incidente').length;
    const firstAid = monthIncidents.filter((i) => i.eventType === 'sem_afastamento').length;
    const lostTime = monthIncidents.filter((i) => i.eventType === 'com_afastamento').length;
    const commute = monthIncidents.filter((i) => i.eventType === 'trajeto').length;
    const daysLost = monthIncidents.reduce(
      (acc, inc) => acc + (inc.occurrence?.daysLostActual || inc.occurrence?.daysLostEstimated || 0),
      0
    );

    const tf = hht > 0 ? Number(((lostTime * 1000000) / hht).toFixed(2)) : 0;
    const tg = hht > 0 ? Number(((daysLost * 1000000) / hht).toFixed(2)) : 0;

    return {
      month: m,
      name: monthLabels[m] || m,
      desvio: deviation,
      incidente: nearMiss,
      sem_afastamento: firstAid,
      com_afastamento: lostTime,
      trajeto: commute,
      total: monthIncidents.length,
      daysLost,
      tf,
      tg,
      targetTF,
      hht,
    };
  });
}

export function getSectorDistribution(incidents: IncidentRecord[]) {
  const sectorCounts: Record<
    string,
    { total: number; lostTime: number; nearMiss: number; firstAid: number; fatal: number; deviation: number }
  > = {};

  incidents.forEach((inc) => {
    const sec = inc.sector || 'Outros';
    if (!sectorCounts[sec]) {
      sectorCounts[sec] = { total: 0, lostTime: 0, nearMiss: 0, firstAid: 0, fatal: 0, deviation: 0 };
    }
    sectorCounts[sec].total += 1;
    if (inc.eventType === 'desvio') sectorCounts[sec].deviation += 1;
    if (inc.eventType === 'com_afastamento') sectorCounts[sec].lostTime += 1;
    if (inc.eventType === 'sem_afastamento') sectorCounts[sec].firstAid += 1;
    if (inc.eventType === 'incidente') sectorCounts[sec].nearMiss += 1;
    if (inc.eventType === 'fatal') sectorCounts[sec].fatal += 1;
  });

  return Object.entries(sectorCounts)
    .map(([name, data]) => ({
      name,
      total: data.total,
      lostTime: data.lostTime,
      nearMiss: data.nearMiss,
      firstAid: data.firstAid,
      fatal: data.fatal,
      deviation: data.deviation,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getBodyPartStats(incidents: IncidentRecord[]) {
  const counts: Record<string, number> = {};
  incidents.forEach((inc) => {
    const part = inc.occurrence.injuredBodyPart || 'Não especificado';
    if (part !== 'Nenhum' && part !== 'Nenhum (Quase-Acidente / Dano Material)') {
      counts[part] = (counts[part] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getCauseCategoryStats(incidents: IncidentRecord[]) {
  const counts: Record<string, number> = {};
  incidents.forEach((inc) => {
    const cat = inc.causeAnalysis.causeCategory || 'Outros';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getLeaderDistribution(incidents: IncidentRecord[]) {
  const leaderCounts: Record<
    string,
    { total: number; lostTime: number; nearMiss: number; firstAid: number; fatal: number; deviation: number }
  > = {};

  incidents.forEach((inc) => {
    const workers = inc.workers || [];
    workers.forEach((w) => {
      if (w.leader) {
        const leader = w.leader;
        if (!leaderCounts[leader]) {
          leaderCounts[leader] = { total: 0, lostTime: 0, nearMiss: 0, firstAid: 0, fatal: 0, deviation: 0 };
        }
        leaderCounts[leader].total += 1;
        if (inc.eventType === 'desvio') leaderCounts[leader].deviation += 1;
        if (inc.eventType === 'com_afastamento') leaderCounts[leader].lostTime += 1;
        if (inc.eventType === 'sem_afastamento') leaderCounts[leader].firstAid += 1;
        if (inc.eventType === 'incidente') leaderCounts[leader].nearMiss += 1;
        if (inc.eventType === 'fatal') leaderCounts[leader].fatal += 1;
      }
    });
  });

  return Object.entries(leaderCounts)
    .map(([name, data]) => ({
      name,
      total: data.total,
      lostTime: data.lostTime,
      nearMiss: data.nearMiss,
      firstAid: data.firstAid,
      fatal: data.fatal,
      deviation: data.deviation,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getWorkerSectorDistribution(incidents: IncidentRecord[]) {
  const sectorCounts: Record<
    string,
    { total: number; lostTime: number; nearMiss: number; firstAid: number; fatal: number; deviation: number }
  > = {};

  incidents.forEach((inc) => {
    const workers = inc.workers || [];
    workers.forEach((w) => {
      if (w.sector) {
        const sector = w.sector;
        if (!sectorCounts[sector]) {
          sectorCounts[sector] = { total: 0, lostTime: 0, nearMiss: 0, firstAid: 0, fatal: 0, deviation: 0 };
        }
        sectorCounts[sector].total += 1;
        if (inc.eventType === 'desvio') sectorCounts[sector].deviation += 1;
        if (inc.eventType === 'com_afastamento') sectorCounts[sector].lostTime += 1;
        if (inc.eventType === 'sem_afastamento') sectorCounts[sector].firstAid += 1;
        if (inc.eventType === 'incidente') sectorCounts[sector].nearMiss += 1;
        if (inc.eventType === 'fatal') sectorCounts[sector].fatal += 1;
      }
    });
  });

  return Object.entries(sectorCounts)
    .map(([name, data]) => ({
      name,
      total: data.total,
      lostTime: data.lostTime,
      nearMiss: data.nearMiss,
      firstAid: data.firstAid,
      fatal: data.fatal,
      deviation: data.deviation,
    }))
    .sort((a, b) => b.total - a.total);
}
