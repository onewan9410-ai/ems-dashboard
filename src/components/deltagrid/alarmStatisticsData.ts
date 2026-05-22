import type { DailyAlarmStatByDevice } from './types'
import { DAILY_ALARM_STATS_BY_DEVICE } from './constants'

export type {
  VolumeGranularity as AlarmPeriodGranularity,
} from './storageVolumeData'

export {
  formatVolumePeriodLabel as formatAlarmPeriodLabel,
  formatChartPeriodNavLabel as formatAlarmPeriodNavLabel,
  formatChartPeriodRangeLabel as formatAlarmPeriodRangeLabel,
  shiftVolumeAnchor as shiftAlarmPeriodAnchor,
  isVolumePeriodAtLatest as isAlarmPeriodAtLatest,
} from './storageVolumeData'

import type { VolumeGranularity } from './storageVolumeData'

const ALARM_LOOKUP = new Map(
  DAILY_ALARM_STATS_BY_DEVICE.map((row) => [row.date, row]),
)

export const ALARM_DEVICE_KEYS = [
  'pcs01',
  'pcs02',
  'bms01',
  'bms02',
  'hvac',
  'ems',
] as const

export type AlarmDeviceKey = (typeof ALARM_DEVICE_KEYS)[number]

function emptyDeviceCounts(): Omit<DailyAlarmStatByDevice, 'date'> {
  return {
    pcs01: 0,
    pcs02: 0,
    bms01: 0,
    bms02: 0,
    hvac: 0,
    ems: 0,
  }
}

function mockAlarmDay(mmdd: string): DailyAlarmStatByDevice {
  let hash = 0
  for (const char of mmdd) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000
  }

  return {
    date: mmdd,
    pcs01: hash % 11 === 0 ? 1 : hash % 23 === 0 ? 2 : 0,
    pcs02: hash % 13 === 0 ? 1 : 0,
    bms01: hash % 17 === 0 ? 1 : hash % 29 === 0 ? 2 : 0,
    bms02: hash % 19 === 0 ? 1 : 0,
    hvac: hash % 31 === 0 ? 1 : 0,
    ems: hash % 9 === 0 ? 1 : hash % 21 === 0 ? 2 : 0,
  }
}

function resolveAlarmDay(mmdd: string): DailyAlarmStatByDevice {
  return ALARM_LOOKUP.get(mmdd) ?? mockAlarmDay(mmdd)
}

/** 某日各设备告警总次数（与堆叠图一致，含 mock 日） */
export function getAlarmStatForDay(mmdd: string): DailyAlarmStatByDevice {
  return resolveAlarmDay(mmdd)
}

function formatMmDd(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function sumDeviceCounts(
  rows: DailyAlarmStatByDevice[],
): Omit<DailyAlarmStatByDevice, 'date'> {
  const totals = emptyDeviceCounts()

  for (const row of rows) {
    for (const key of ALARM_DEVICE_KEYS) {
      totals[key] += row[key]
    }
  }

  return totals
}

function aggregateAlarmMonth(year: number, month: number): DailyAlarmStatByDevice {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const rows: DailyAlarmStatByDevice[] = []

  for (let day = 1; day <= daysInMonth; day += 1) {
    const mmdd = `${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`
    rows.push(resolveAlarmDay(mmdd))
  }

  return {
    date: `${String(year).slice(-2)}/${String(month + 1).padStart(2, '0')}`,
    ...sumDeviceCounts(rows),
  }
}

function aggregateAlarmYear(year: number): DailyAlarmStatByDevice {
  const rows: DailyAlarmStatByDevice[] = []

  for (let month = 0; month < 12; month += 1) {
    rows.push(aggregateAlarmMonth(year, month))
  }

  return {
    date: `${year}`,
    ...sumDeviceCounts(rows),
  }
}

export function getAlarmChartData(
  anchor: Date,
  granularity: VolumeGranularity,
): DailyAlarmStatByDevice[] {
  if (granularity === 'day') {
    const end = startOfDay(anchor)
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(end)
      date.setDate(end.getDate() - (6 - index))
      return resolveAlarmDay(formatMmDd(date))
    })
  }

  if (granularity === 'month') {
    const end = new Date(anchor.getFullYear(), anchor.getMonth(), 1)

    return Array.from({ length: 8 }, (_, index) => {
      const date = new Date(end)
      date.setMonth(end.getMonth() - (7 - index))
      return aggregateAlarmMonth(date.getFullYear(), date.getMonth())
    })
  }

  const year = anchor.getFullYear()
  return Array.from({ length: 4 }, (_, index) =>
    aggregateAlarmYear(year - (3 - index)),
  )
}

export function alarmChartYAxisWidth(granularity: VolumeGranularity) {
  if (granularity === 'year') return 40
  if (granularity === 'month') return 48
  return 44
}
