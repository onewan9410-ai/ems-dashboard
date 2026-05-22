import type { DailyAlarmRecord, DailyAlarmStatByDevice } from './types'
import {
  ALARM_DEVICE_KEYS,
  type AlarmDeviceKey,
  getAlarmStatForDay,
} from './alarmStatisticsData'

/** 与 DAILY_ALARM_STATS_BY_DEVICE 各日计数对齐的告警明细 */
export const DAILY_ALARM_DETAILS: DailyAlarmRecord[] = [
  {
    id: 'd0819-1',
    date: '08/19',
    level: 'critical',
    title: '直流侧过温保护',
    device: 'PCS-01',
    timestamp: '14:22:08',
  },
  {
    id: 'd0819-2',
    date: '08/19',
    level: 'critical',
    title: '并网电流不平衡',
    device: 'PCS-02',
    timestamp: '13:05:33',
  },
  {
    id: 'd0819-3',
    date: '08/19',
    level: 'critical',
    title: '舱内湿度偏高',
    device: 'HVAC',
    timestamp: '08:42:15',
  },
  {
    id: 'd0819-4',
    date: '08/19',
    level: 'critical',
    title: '调度指令执行超时',
    device: 'EMS',
    timestamp: '11:18:41',
  },
  {
    id: 'd0817-1',
    date: '08/17',
    level: 'critical',
    title: 'MPPT 通道异常',
    device: 'PCS-01',
    timestamp: '16:30:02',
  },
  {
    id: 'd0816-1',
    date: '08/16',
    level: 'critical',
    title: '单体电压离散性偏高',
    device: 'BMS-01',
    timestamp: '13:11:27',
  },
  {
    id: 'd0816-2',
    date: '08/16',
    level: 'critical',
    title: 'SOC 估算偏差偏大',
    device: 'BMS-02',
    timestamp: '10:48:56',
  },
  {
    id: 'd0816-3',
    date: '08/16',
    level: 'critical',
    title: '出水温度接近上限',
    device: 'HVAC',
    timestamp: '09:22:33',
  },
  {
    id: 'd0816-4',
    date: '08/16',
    level: 'critical',
    title: '策略切换记录异常',
    device: 'EMS',
    timestamp: '07:55:10',
  },
  {
    id: 'd0815-1',
    date: '08/15',
    level: 'critical',
    title: '并网保护动作',
    device: 'PCS-01',
    timestamp: '18:04:51',
  },
  {
    id: 'd0815-2',
    date: '08/15',
    level: 'critical',
    title: '效率骤降',
    device: 'PCS-02',
    timestamp: '15:37:22',
  },
  {
    id: 'd0815-3',
    date: '08/15',
    level: 'critical',
    title: '绝缘检测告警',
    device: 'BMS-01',
    timestamp: '12:08:44',
  },
  {
    id: 'd0815-4',
    date: '08/15',
    level: 'critical',
    title: '均衡回路异常',
    device: 'BMS-02',
    timestamp: '06:12:09',
  },
  {
    id: 'd0815-5',
    date: '08/15',
    level: 'critical',
    title: '通信链路中断',
    device: 'EMS',
    timestamp: '03:41:18',
  },
]

const DEVICE_ALARM_SYNTH: {
  key: AlarmDeviceKey
  device: string
  titles: string[]
}[] = [
  {
    key: 'pcs01',
    device: 'PCS-01',
    titles: ['直流侧过温保护', 'MPPT 通道异常', '并网保护动作'],
  },
  {
    key: 'pcs02',
    device: 'PCS-02',
    titles: ['并网电流不平衡', '效率骤降', '辅助电源电压偏低'],
  },
  {
    key: 'bms01',
    device: 'BMS-01',
    titles: ['单体电压离散性偏高', '绝缘检测告警', 'SOC 估算偏差偏大'],
  },
  {
    key: 'bms02',
    device: 'BMS-02',
    titles: ['均衡回路异常', '内阻偏高', '温度采样异常'],
  },
  {
    key: 'hvac',
    device: 'HVAC',
    titles: ['出水温度接近上限', '舱内湿度偏高', '压缩机运行异常'],
  },
  {
    key: 'ems',
    device: 'EMS',
    titles: ['调度指令执行超时', '通信链路中断', '策略切换记录异常'],
  },
]

function sumDeviceAlarms(stat: Omit<DailyAlarmStatByDevice, 'date'>) {
  return ALARM_DEVICE_KEYS.reduce((sum, key) => sum + stat[key], 0)
}

function synthesizeTimestamp(date: string, deviceKey: string, index: number) {
  let hash = 0
  for (const char of `${date}-${deviceKey}-${index}`) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000
  }
  const hour = 6 + (hash % 14)
  const minute = hash % 60
  const second = Math.floor((hash * 7) % 60)
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

function synthesizeAlarmsForDay(
  date: string,
  stat: DailyAlarmStatByDevice,
): DailyAlarmRecord[] {
  const records: DailyAlarmRecord[] = []

  for (const meta of DEVICE_ALARM_SYNTH) {
    const count = stat[meta.key]
    for (let index = 0; index < count; index += 1) {
      records.push({
        id: `syn-${date}-${meta.key}-${index}`,
        date,
        level: 'critical',
        title: meta.titles[index % meta.titles.length],
        device: meta.device,
        timestamp: synthesizeTimestamp(date, meta.key, index),
      })
    }
  }

  return records.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

function listAlarmsForDateRaw(date: string): DailyAlarmRecord[] {
  const explicit = DAILY_ALARM_DETAILS.filter((item) => item.date === date)
  if (explicit.length > 0) return explicit

  const stat = getAlarmStatForDay(date)
  if (sumDeviceAlarms(stat) === 0) return []

  return synthesizeAlarmsForDay(date, stat)
}

function listAlarmsForMonthRaw(year: number, month: number): DailyAlarmRecord[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const mm = String(month + 1).padStart(2, '0')
  const rows: DailyAlarmRecord[] = []

  for (let day = 1; day <= daysInMonth; day += 1) {
    const mmdd = `${mm}/${String(day).padStart(2, '0')}`
    rows.push(...listAlarmsForDateRaw(mmdd))
  }

  return rows
}

export function getAlarmsForDate(date: string): DailyAlarmRecord[] {
  return listAlarmsForDateRaw(date).sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  )
}

export function getAlarmsForChartKey(
  key: string,
  granularity: 'day' | 'month' | 'year',
): DailyAlarmRecord[] {
  if (granularity === 'day') {
    return getAlarmsForDate(key)
  }

  if (granularity === 'month') {
    const [yy, mm] = key.split('/')
    const year = 2000 + Number(yy)
    const month = Number(mm) - 1
    const monthPart = mm

    const explicit = DAILY_ALARM_DETAILS.filter(
      (item) => item.date.slice(0, 2) === monthPart,
    )
    const rows =
      explicit.length > 0
        ? explicit
        : listAlarmsForMonthRaw(year, month)

    return rows.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }

  const year = Number(key)
  const rows = Array.from({ length: 12 }, (_, month) =>
    listAlarmsForMonthRaw(year, month),
  ).flat()

  return rows.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export function formatAlarmChartDate(
  key: string,
  granularity: 'day' | 'month' | 'year' = 'day',
  year = new Date().getFullYear(),
) {
  if (granularity === 'day') return `${year}/${key}`
  if (granularity === 'month') {
    const [yy, mm] = key.split('/')
    return `20${yy}/${mm}`
  }
  return key
}
