export type AlarmTriageLevel = 'critical' | 'warning' | 'info' | 'all'

export interface AlarmItem {
  id: string
  level: Exclude<AlarmTriageLevel, 'all'>
  title: string
  device: string
  timestamp: string
}

export interface DailyAlarmRecord extends AlarmItem {
  /** MM/DD，与告警统计图表日期一致 */
  date: string
}

export interface DeviceIssueDetail {
  title: string
  description: string
  time: string
}

/** @deprecated Use DeviceIssueDetail */
export type DeviceAttentionDetail = DeviceIssueDetail

export interface DeviceAiPrediction {
  title: string
  description: string
  time: string
}

export interface DeviceStatusGroup {
  name: string
  needsAttention?: number
  alarms?: number
  normal: number
  alarmDetails?: DeviceIssueDetail[]
  attentionDetails?: DeviceIssueDetail[]
  aiPredictions?: DeviceAiPrediction[]
}

/** 告警统计图：各设备在各日期的告警总次数（不区分告警/警告/提示） */
export interface DailyAlarmStatByDevice {
  date: string
  pcs01: number
  pcs02: number
  bms01: number
  bms02: number
  hvac: number
  ems: number
}

export interface WaveformPoint {
  time: string
  power: number
  soc: number
}

export interface TariffPeriod {
  type: 'peak' | 'valley' | 'flat'
  label: string
  start: string
  end: string
  fill: string
  fillOpacity: number
  labelFill: string
}

export interface DailyVolumePoint {
  date: string
  charge: number
  discharge: number
}

export interface DailyAlarmStat {
  date: string
  critical: number
  warning: number
  info: number
}

export interface SOHTrendPoint {
  day: number
  voltageMv: number
  threshold: number
}

export interface BatteryRackSnapshot {
  id: string
  shortName: string
  fullName: string
  voltageStatus: '正常' | '需关注' | '告警'
  voltageRangeMv: number
  tempStatus: '正常' | '需关注' | '告警'
  tempRangeC: number
  trendData: SOHTrendPoint[]
  /** 告警 / 需关注：问题分析&解决建议 */
  analysisAndSolution?: string
  /** 正常设备：AI 预测文案（仅 120 天内有风险时展示） */
  aiWarning?: string
  /** 预测风险出现的天数，默认从 aiWarning 文案解析 */
  aiPredictionDays?: number
}
