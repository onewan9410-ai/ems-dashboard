import type { BatteryRackSnapshot, SOHTrendPoint } from './types'
import { SOH_TREND_DATA } from './constants'
import type { StatusTagKind } from './statusTagStyles'

export function resolveRackOverallStatus(rack: BatteryRackSnapshot): StatusTagKind {
  if (rack.voltageStatus === '告警' || rack.tempStatus === '告警') return '告警'
  if (rack.voltageStatus === '需关注' || rack.tempStatus === '需关注') {
    return '需关注'
  }
  return '正常'
}

const AI_PREDICTION_HORIZON_DAYS = 120

function inferAiPredictionDays(rack: BatteryRackSnapshot): number | null {
  if (rack.aiPredictionDays != null) return rack.aiPredictionDays
  const match = rack.aiWarning?.match(/(\d+)\s*天/)
  return match ? Number(match[1]) : null
}

/** 告警 / 需关注：问题分析&解决建议 */
export function getRackAnalysisAndSolution(
  rack: BatteryRackSnapshot,
): string | null {
  const overallStatus = resolveRackOverallStatus(rack)
  if (overallStatus === '正常') return null

  if (rack.analysisAndSolution) return rack.analysisAndSolution

  const analysisParts: string[] = []
  if (rack.voltageStatus !== '正常') {
    const threshold = rack.voltageStatus === '告警' ? 15 : 10
    analysisParts.push(
      `电芯电压极差 ${rack.voltageRangeMv} mV 超过${rack.voltageStatus}阈值 ${threshold} mV`,
    )
  }
  if (rack.tempStatus !== '正常') {
    const threshold = rack.tempStatus === '告警' ? 8 : 5
    analysisParts.push(
      `电芯温度极差 ${rack.tempRangeC} °C 超过${rack.tempStatus}阈值 ${threshold} °C`,
    )
  }

  const analysis =
    analysisParts.length > 0
      ? `${analysisParts.join('；')}。`
      : ''
  const solution = rack.aiWarning?.trim()

  if (analysis && solution) return `${analysis}${solution}`
  if (solution) return solution
  if (analysis) return `${analysis}建议尽快复核并制定维护方案。`
  return null
}

/** 正常设备：仅 120 天内预测有风险时返回 AI 预警文案 */
export function getRackAiPrediction(rack: BatteryRackSnapshot): string | null {
  if (resolveRackOverallStatus(rack) !== '正常') return null
  if (!rack.aiWarning) return null

  const days = inferAiPredictionDays(rack)
  if (days == null || days > AI_PREDICTION_HORIZON_DAYS) return null

  return rack.aiWarning
}

/** @deprecated 使用 getRackAnalysisAndSolution */
export function getRackIssueDetail(rack: BatteryRackSnapshot): string | null {
  return getRackAnalysisAndSolution(rack)
}

/** 简单模式：列出具体出问题的指标维度（不含数值） */
export function getRackProblemParts(rack: BatteryRackSnapshot): string[] {
  const parts: string[] = []
  if (rack.voltageStatus !== '正常') {
    parts.push(`电芯电压一致性·${rack.voltageStatus}`)
  }
  if (rack.tempStatus !== '正常') {
    parts.push(`电芯温度一致性·${rack.tempStatus}`)
  }
  return parts
}

/** 简单模式：一行可扫读的问题摘要（AI 预警或兜底文案） */
export function getRackSimpleIssueSummary(rack: BatteryRackSnapshot): string {
  const ai = getRackAiPrediction(rack)
  if (ai) {
    return ai.length > 80 ? `${ai.slice(0, 80)}…` : ai
  }

  const parts = getRackProblemParts(rack)
  if (parts.length > 0) {
    return parts.join('；')
  }

  return '各项指标正常'
}

export function rackHasAiPrediction(rack: BatteryRackSnapshot): boolean {
  return getRackAiPrediction(rack) != null
}

export function rackHasExpandableInsight(rack: BatteryRackSnapshot): boolean {
  return (
    getRackAnalysisAndSolution(rack) != null ||
    getRackAiPrediction(rack) != null
  )
}

/** 行内指标胶囊（不展示单体低压） */
export function getRackMetricChips(rack: BatteryRackSnapshot) {
  return [
    { label: '压差', value: `${rack.voltageRangeMv} mV` },
    { label: '温差', value: `${rack.tempRangeC} °C` },
  ]
}

export function getRackInsightExpandLabel(rack: BatteryRackSnapshot): string {
  const hasAnalysis = getRackAnalysisAndSolution(rack) != null
  const hasAi = getRackAiPrediction(rack) != null
  if (hasAnalysis && hasAi) return '问题建议与 AI 预警'
  if (hasAi) return 'AI 预警'
  return '问题分析&解决建议'
}

function buildTrendData(startMv: number, endMv: number): SOHTrendPoint[] {
  const days = [0, 15, 30, 45, 60, 75, 90]
  return days.map((day, index) => ({
    day,
    voltageMv:
      index === days.length - 1
        ? endMv
        : Math.round(startMv + ((endMv - startMv) * index) / (days.length - 1)),
    threshold: 15,
  }))
}

function createRack(
  rack: Omit<BatteryRackSnapshot, 'trendData'> & {
    trendStartMv: number
    trendEndMv: number
  },
): BatteryRackSnapshot {
  const { trendStartMv, trendEndMv, ...rest } = rack
  return {
    ...rest,
    trendData: buildTrendData(trendStartMv, trendEndMv),
  }
}

/** Mock 17 个电池簇，用于验证多设备切换 */
const BATTERY_RACKS_RAW: BatteryRackSnapshot[] = [
  createRack({
    id: 'rack-a1',
    shortName: 'RACK-A1',
    fullName: 'RACK-40011CI024A10',
    voltageStatus: '正常',
    voltageRangeMv: 8,
    tempStatus: '正常',
    tempRangeC: 3,
    trendStartMv: 4,
    trendEndMv: 8,
  }),
  createRack({
    id: 'rack-a2',
    shortName: 'RACK-A2',
    fullName: 'RACK-40011CI024A20',
    voltageStatus: '正常',
    voltageRangeMv: 9,
    tempStatus: '正常',
    tempRangeC: 4,
    trendStartMv: 5,
    trendEndMv: 16,
    aiPredictionDays: 120,
    aiWarning:
      'RACK-A2 预测 120 天后压差将突破 15mV 临界值，建议于 6 月前安排计划性均衡维护，可延长全站电池资产寿命 3~5 年。',
  }),
  createRack({
    id: 'rack-a3',
    shortName: 'RACK-A3',
    fullName: 'RACK-40011CI024A30',
    voltageStatus: '正常',
    voltageRangeMv: 7,
    tempStatus: '正常',
    tempRangeC: 3,
    trendStartMv: 4,
    trendEndMv: 7,
  }),
  createRack({
    id: 'rack-a4',
    shortName: 'RACK-A4',
    fullName: 'RACK-40011CI024A40',
    voltageStatus: '正常',
    voltageRangeMv: 8,
    tempStatus: '正常',
    tempRangeC: 4,
    trendStartMv: 5,
    trendEndMv: 9,
  }),
  createRack({
    id: 'rack-a5',
    shortName: 'RACK-A5',
    fullName: 'RACK-40011CI024A50',
    voltageStatus: '正常',
    voltageRangeMv: 10,
    tempStatus: '正常',
    tempRangeC: 4,
    trendStartMv: 6,
    trendEndMv: 18,
    aiPredictionDays: 90,
    aiWarning:
      'RACK-A5 预测在 90 天后压差将突破 15mV 临界值，建议于 6 月前安排计划性均衡维护，可延长电池资产寿命 3~5 年。',
  }),
  createRack({
    id: 'rack-b1',
    shortName: 'RACK-B1',
    fullName: 'RACK-40011CI024B10',
    voltageStatus: '需关注',
    voltageRangeMv: 12,
    tempStatus: '正常',
    tempRangeC: 5,
    trendStartMv: 7,
    trendEndMv: 14,
    analysisAndSolution:
      '电芯电压极差 12mV 超过关注阈值 10mV，压差呈上升趋势。建议 30 天内安排均衡维护，并复核 BMS 采样点与主动均衡策略。',
  }),
  createRack({
    id: 'rack-b2',
    shortName: 'RACK-B2',
    fullName: 'RACK-40011CI024B20',
    voltageStatus: '正常',
    voltageRangeMv: 9,
    tempStatus: '正常',
    tempRangeC: 4,
    trendStartMv: 5,
    trendEndMv: 10,
  }),
  createRack({
    id: 'rack-b3',
    shortName: 'RACK-B3',
    fullName: 'RACK-40011CI024B30',
    voltageStatus: '正常',
    voltageRangeMv: 8,
    tempStatus: '正常',
    tempRangeC: 4,
    trendStartMv: 6,
    trendEndMv: 11,
  }),
  createRack({
    id: 'rack-c1',
    shortName: 'RACK-C1',
    fullName: 'RACK-40011CI024C10',
    voltageStatus: '告警',
    voltageRangeMv: 15,
    tempStatus: '正常',
    tempRangeC: 5,
    trendStartMv: 9,
    trendEndMv: 17,
    analysisAndSolution:
      '电芯电压极差 15mV 已达告警阈值，压差持续扩大，存在进一步恶化风险。建议 7 天内安排停机均衡，并复核 BMS 采样与主动均衡策略。',
  }),
  createRack({
    id: 'rack-c2',
    shortName: 'RACK-C2',
    fullName: 'RACK-40011CI024C20',
    voltageStatus: '正常',
    voltageRangeMv: 8,
    tempStatus: '正常',
    tempRangeC: 3,
    trendStartMv: 4,
    trendEndMv: 8,
  }),
  createRack({
    id: 'rack-c3',
    shortName: 'RACK-C3',
    fullName: 'RACK-40011CI024C30',
    voltageStatus: '正常',
    voltageRangeMv: 9,
    tempStatus: '正常',
    tempRangeC: 4,
    trendStartMv: 7,
    trendEndMv: 13,
  }),
  createRack({
    id: 'rack-d1',
    shortName: 'RACK-D1',
    fullName: 'RACK-40011CI024D10',
    voltageStatus: '正常',
    voltageRangeMv: 7,
    tempStatus: '正常',
    tempRangeC: 3,
    trendStartMv: 4,
    trendEndMv: 7,
  }),
  createRack({
    id: 'rack-d2',
    shortName: 'RACK-D2',
    fullName: 'RACK-40011CI024D20',
    voltageStatus: '正常',
    voltageRangeMv: 8,
    tempStatus: '正常',
    tempRangeC: 4,
    trendStartMv: 5,
    trendEndMv: 9,
  }),
  createRack({
    id: 'rack-d3',
    shortName: 'RACK-D3',
    fullName: 'RACK-40011CI024D30',
    voltageStatus: '正常',
    voltageRangeMv: 9,
    tempStatus: '正常',
    tempRangeC: 4,
    trendStartMv: 5,
    trendEndMv: 10,
  }),
  createRack({
    id: 'rack-e1',
    shortName: 'RACK-E1',
    fullName: 'RACK-40011CI024E10',
    voltageStatus: '正常',
    voltageRangeMv: 8,
    tempStatus: '正常',
    tempRangeC: 3,
    trendStartMv: 4,
    trendEndMv: 8,
  }),
  createRack({
    id: 'rack-e2',
    shortName: 'RACK-E2',
    fullName: 'RACK-40011CI024E20',
    voltageStatus: '正常',
    voltageRangeMv: 7,
    tempStatus: '正常',
    tempRangeC: 3,
    trendStartMv: 4,
    trendEndMv: 7,
  }),
  createRack({
    id: 'rack-e3',
    shortName: 'RACK-E3',
    fullName: 'RACK-40011CI024E30',
    voltageStatus: '正常',
    voltageRangeMv: 8,
    tempStatus: '正常',
    tempRangeC: 4,
    trendStartMv: 5,
    trendEndMv: 9,
  }),
]

const STATUS_SORT_ORDER: Record<BatteryRackSnapshot['voltageStatus'], number> = {
  告警: 0,
  需关注: 1,
  正常: 2,
}

function getRackSortRank(rack: BatteryRackSnapshot) {
  return Math.min(
    STATUS_SORT_ORDER[rack.voltageStatus],
    STATUS_SORT_ORDER[rack.tempStatus],
  )
}

export const BATTERY_RACKS = [...BATTERY_RACKS_RAW].sort(
  (a, b) => getRackSortRank(a) - getRackSortRank(b),
)

export function compareBatteryRackPriority(
  a: BatteryRackSnapshot,
  b: BatteryRackSnapshot,
) {
  return getRackSortRank(a) - getRackSortRank(b)
}

// 保留 A2 / A5 原始趋势曲线形态，便于演示 AI 预测临界突破
for (const rackId of ['rack-a2', 'rack-a5'] as const) {
  const rack = BATTERY_RACKS.find((r) => r.id === rackId)
  if (rack) rack.trendData = SOH_TREND_DATA
}
