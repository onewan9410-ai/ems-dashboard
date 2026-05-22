import type { DailyVolumePoint } from './types'
import { DAILY_VOLUME_DATA, LIVE_TIMESTAMP } from './constants'

export type VolumeGranularity = 'day' | 'month' | 'year'

const VOLUME_LOOKUP = new Map(
  DAILY_VOLUME_DATA.map((point) => [point.date, point]),
)

export function getDemoToday(): Date {
  const [datePart] = LIVE_TIMESTAMP.split(' ')
  const [year, month, day] = datePart.split('/').map(Number)
  return new Date(year, month - 1, day)
}

export function getTodayVolume(): Pick<DailyVolumePoint, 'charge' | 'discharge'> {
  return resolveVolume(formatMmDd(getDemoToday()))
}

export function isDemoToday(date: Date) {
  return formatMmDd(date) === formatMmDd(getDemoToday())
}

function mockVolume(seed: string): Pick<DailyVolumePoint, 'charge' | 'discharge'> {
  let hash = 0
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000
  }
  return {
    charge: Number(((hash % 140) / 10 + 0.1).toFixed(2)),
    discharge: Number(((hash % 60) / 10).toFixed(2)),
  }
}

function resolveVolume(mmdd: string): Pick<DailyVolumePoint, 'charge' | 'discharge'> {
  return VOLUME_LOOKUP.get(mmdd) ?? mockVolume(mmdd)
}

function aggregateMonthVolume(year: number, month: number): DailyVolumePoint {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let charge = 0
  let discharge = 0

  for (let day = 1; day <= daysInMonth; day += 1) {
    const mmdd = `${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`
    const volume = resolveVolume(mmdd)
    charge += volume.charge
    discharge += volume.discharge
  }

  return {
    date: `${String(year).slice(-2)}/${String(month + 1).padStart(2, '0')}`,
    charge: Number(charge.toFixed(2)),
    discharge: Number(discharge.toFixed(2)),
  }
}

function aggregateYearVolume(year: number): DailyVolumePoint {
  let charge = 0
  let discharge = 0

  for (let month = 0; month < 12; month += 1) {
    const monthVolume = aggregateMonthVolume(year, month)
    charge += monthVolume.charge
    discharge += monthVolume.discharge
  }

  return {
    date: `${year}`,
    charge: Number(charge.toFixed(2)),
    discharge: Number(discharge.toFixed(2)),
  }
}

function formatMmDd(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function formatVolumePeriodLabel(
  anchor: Date,
  granularity: VolumeGranularity,
) {
  const year = anchor.getFullYear()
  const month = String(anchor.getMonth() + 1).padStart(2, '0')
  const day = String(anchor.getDate()).padStart(2, '0')

  if (granularity === 'day') return `${year}/${month}/${day}`
  if (granularity === 'month') return `${year}/${month}`
  return `${year}`
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatIsoMonth(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/** 当前粒度下图表可见区间的起止日期 */
export function getChartPeriodRange(
  anchor: Date,
  granularity: VolumeGranularity,
): { start: Date; end: Date } {
  if (granularity === 'day') {
    const end = startOfDay(anchor)
    const start = new Date(end)
    start.setDate(end.getDate() - 6)
    return { start, end }
  }

  if (granularity === 'month') {
    const end = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const start = new Date(end)
    start.setMonth(end.getMonth() - 7)
    return { start, end }
  }

  const endYear = anchor.getFullYear()
  return {
    start: new Date(endYear - 3, 0, 1),
    end: new Date(endYear, 0, 1),
  }
}

/** 周期导航条展示（单日，用于充放电曲线等） */
export function formatChartPeriodNavLabel(
  anchor: Date,
  granularity: VolumeGranularity,
) {
  if (granularity === 'day') return formatIsoDate(startOfDay(anchor))
  if (granularity === 'month') return formatIsoMonth(anchor)
  return `${anchor.getFullYear()}`
}

/** 周期导航条展示时间范围（充放电量 / 告警统计） */
export function formatChartPeriodRangeLabel(
  anchor: Date,
  granularity: VolumeGranularity,
) {
  const { start, end } = getChartPeriodRange(anchor, granularity)
  if (granularity === 'day') {
    return `${formatIsoDate(start)} ~ ${formatIsoDate(end)}`
  }
  if (granularity === 'month') {
    return `${formatIsoMonth(start)} ~ ${formatIsoMonth(end)}`
  }
  return `${start.getFullYear()} ~ ${end.getFullYear()}`
}

export function shiftVolumeAnchor(
  anchor: Date,
  granularity: VolumeGranularity,
  delta: number,
) {
  const next = new Date(anchor)
  if (granularity === 'day') {
    next.setDate(next.getDate() + delta)
  } else if (granularity === 'month') {
    next.setMonth(next.getMonth() + delta)
  } else {
    next.setFullYear(next.getFullYear() + delta)
  }
  return next
}

export function isVolumePeriodAtLatest(
  anchor: Date,
  granularity: VolumeGranularity,
  now = getDemoToday(),
) {
  if (granularity === 'day') {
    return startOfDay(anchor).getTime() >= startOfDay(now).getTime()
  }
  if (granularity === 'month') {
    return (
      anchor.getFullYear() > now.getFullYear() ||
      (anchor.getFullYear() === now.getFullYear() &&
        anchor.getMonth() >= now.getMonth())
    )
  }
  return anchor.getFullYear() >= now.getFullYear()
}

export interface VolumeChartSummary {
  charge: number
  discharge: number
  /** 充电 − 放电，正为净充电 */
  net: number
}

export function summarizeVolumeChartData(
  data: DailyVolumePoint[],
): VolumeChartSummary {
  let charge = 0
  let discharge = 0
  for (const row of data) {
    charge += row.charge
    discharge += row.discharge
  }
  return {
    charge: Number(charge.toFixed(2)),
    discharge: Number(discharge.toFixed(2)),
    net: Number((charge - discharge).toFixed(2)),
  }
}

/** 总览大数字：千分位，最多 2 位小数 */
export function formatVolumeSummaryValue(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function getVolumeChartData(
  anchor: Date,
  granularity: VolumeGranularity,
): DailyVolumePoint[] {
  if (granularity === 'day') {
    const end = startOfDay(anchor)
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(end)
      date.setDate(end.getDate() - (6 - index))
      const mmdd = formatMmDd(date)
      return { date: mmdd, ...resolveVolume(mmdd) }
    })
  }

  if (granularity === 'month') {
    const end = new Date(anchor.getFullYear(), anchor.getMonth(), 1)

    return Array.from({ length: 8 }, (_, index) => {
      const date = new Date(end)
      date.setMonth(end.getMonth() - (7 - index))
      return aggregateMonthVolume(date.getFullYear(), date.getMonth())
    })
  }

  const year = anchor.getFullYear()
  return Array.from({ length: 4 }, (_, index) =>
    aggregateYearVolume(year - (3 - index)),
  )
}
