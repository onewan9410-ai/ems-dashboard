import type {
  AlarmItem,
  DailyAlarmStatByDevice,
  DailyVolumePoint,
  DeviceStatusGroup,
  SOHTrendPoint,
  TariffPeriod,
  WaveformPoint,
} from './types'

export const LIVE_TIMESTAMP = '2025/08/21 10:04:26'

/** Mock 虚拟电厂列表 */
export const VIRTUAL_POWER_PLANTS = [
  { id: 'vpp-001', name: '钱塘江源网荷储虚拟电厂', region: '浙江杭州' },
  { id: 'vpp-002', name: '华东绿能聚合虚拟电厂', region: '江苏苏州' },
  { id: 'vpp-003', name: '前海智慧能源虚拟电厂', region: '广东深圳' },
] as const

export const SOC_VALUE = 10.0
export const SOC_CRITICAL_THRESHOLD = 20
export const EFFICIENCY_VALUE = 60.12
export const EFFICIENCY_WARNING_THRESHOLD = 70
export const TARGET_EFFICIENCY = 76.8

export const TRIAGE_COUNTS = {
  critical: 2,
  warning: 5,
  info: 12,
} as const

export const MOCK_ALARMS: AlarmItem[] = [
  {
    id: '1',
    level: 'critical',
    title: 'SOC 低于紧急阈值，已触发强制充电',
    device: '储能一体柜',
    timestamp: '10:04:12',
  },
  {
    id: '2',
    level: 'critical',
    title: '电池过放保护联锁动作',
    device: 'ESS RACK-A1',
    timestamp: '10:03:58',
  },
  {
    id: '3',
    level: 'warning',
    title: '电芯压差趋势偏高',
    device: 'RACK-A2',
    timestamp: '09:58:44',
  },
  {
    id: '4',
    level: 'warning',
    title: '综合效率低于目标值',
    device: '暖通辅助系统',
    timestamp: '09:55:21',
  },
  {
    id: '5',
    level: 'warning',
    title: '智能终端采集延迟异常',
    device: '智能终端采集器',
    timestamp: '09:52:10',
  },
  {
    id: '6',
    level: 'info',
    title: '电网购电电价窗口已激活',
    device: '电网',
    timestamp: '09:30:00',
  },
  {
    id: '7',
    level: 'info',
    title: '光伏系统发电正常',
    device: '光伏逆变器',
    timestamp: '08:00:00',
  },
]

export const DEVICE_GROUPS: DeviceStatusGroup[] = [
  {
    name: '储能一体柜',
    alarms: 3,
    normal: 1,
    alarmDetails: [
      {
        title: 'BMS 通信中断',
        description: '与 BMS 主控失联超过 60s，已切换本地保护模式',
        time: '10:02:18',
      },
      {
        title: '直流母线过压',
        description: '母线电压 865V，超过上限 850V',
        time: '09:56:41',
      },
      {
        title: '舱内温度过高',
        description: '舱内温度 48°C，超过告警阈值 45°C',
        time: '09:51:03',
      },
    ],
    aiPredictions: [
      {
        title: 'AI 预测提醒',
        description: '子设备 RACK-D3，120 天后 SOH 可能低于 80%',
        time: '09:45:00',
      },
    ],
  },
  {
    name: '智能终端采集器',
    needsAttention: 1,
    normal: 1,
    attentionDetails: [
      {
        title: '通信延迟异常',
        description: '与主站心跳间隔超过 30s，最近一次上报延迟 4.2s',
        time: '09:52:10',
      },
    ],
    aiPredictions: [
      {
        title: 'AI 预测提醒',
        description: '采集器 #2，120 天后通信模块老化风险',
        time: '09:40:00',
      },
    ],
  },
]

/** 分时电价背景时段（峰/谷/平）— 淡雅时尚配色 */
export const TARIFF_PERIODS: TariffPeriod[] = [
  {
    type: 'valley',
    label: '谷',
    start: '00:00',
    end: '08:00',
    fill: '#A5B4FC',
    fillOpacity: 0.1,
    labelFill: '#818CF8',
  },
  {
    type: 'peak',
    label: '峰',
    start: '08:00',
    end: '11:00',
    fill: '#FDA4AF',
    fillOpacity: 0.1,
    labelFill: '#FB7185',
  },
  {
    type: 'flat',
    label: '平',
    start: '11:00',
    end: '17:00',
    fill: '#CBD5E1',
    fillOpacity: 0.1,
    labelFill: '#94A3B8',
  },
  {
    type: 'peak',
    label: '峰',
    start: '17:00',
    end: '22:00',
    fill: '#FDA4AF',
    fillOpacity: 0.1,
    labelFill: '#FB7185',
  },
  {
    type: 'valley',
    label: '谷',
    start: '22:00',
    end: '23:00',
    fill: '#A5B4FC',
    fillOpacity: 0.1,
    labelFill: '#818CF8',
  },
]

/** 参考运行曲线：单轴功率，正=充电、负=放电；00:00–09:00 放电波动约 -0.5 ~ -1.8 kW */
const WAVEFORM_POWER_BY_HOUR = [
  -0.82, -1.24, -0.95, -1.56, -1.08, -1.78, -1.32, -0.68, -1.15, -0.52,
  -1.28, -1.05, -0.88, -1.42, -1.18, -0.95, -1.35, -1.05, -0.72, -1.22,
  -0.58, -1.1, -0.85, 0.35,
]

export const WAVEFORM_DATA: WaveformPoint[] = WAVEFORM_POWER_BY_HOUR.map(
  (power, hour) => ({
    time: `${String(hour).padStart(2, '0')}:00`,
    power,
    soc: hour <= 9 ? 50 : Math.max(10, Number((50 - (hour - 9) * 4.2).toFixed(1))),
  }),
)

export const DAILY_VOLUME_DATA: DailyVolumePoint[] = [
  { date: '08/14', charge: 0.2, discharge: 0 },
  { date: '08/15', charge: 0.1, discharge: 0 },
  { date: '08/16', charge: 0.3, discharge: 0.1 },
  { date: '08/17', charge: 12.5, discharge: 2.1 },
  { date: '08/18', charge: 0.5, discharge: 0 },
  { date: '08/19', charge: 0.2, discharge: 0 },
  { date: '08/20', charge: 0.2, discharge: 0 },
  { date: '08/21', charge: 7.51, discharge: 0 },
]

/** 按设备分日的告警次数（堆叠条形图，不区分级别） */
export const DAILY_ALARM_STATS_BY_DEVICE: DailyAlarmStatByDevice[] = [
  {
    date: '08/19',
    pcs01: 1,
    pcs02: 1,
    bms01: 0,
    bms02: 0,
    hvac: 1,
    ems: 1,
  },
  {
    date: '08/18',
    pcs01: 0,
    pcs02: 0,
    bms01: 0,
    bms02: 0,
    hvac: 0,
    ems: 0,
  },
  {
    date: '08/17',
    pcs01: 1,
    pcs02: 0,
    bms01: 0,
    bms02: 0,
    hvac: 0,
    ems: 0,
  },
  {
    date: '08/16',
    pcs01: 0,
    pcs02: 0,
    bms01: 1,
    bms02: 1,
    hvac: 1,
    ems: 1,
  },
  {
    date: '08/15',
    pcs01: 1,
    pcs02: 1,
    bms01: 1,
    bms02: 1,
    hvac: 0,
    ems: 1,
  },
  {
    date: '08/14',
    pcs01: 0,
    pcs02: 0,
    bms01: 0,
    bms02: 0,
    hvac: 0,
    ems: 0,
  },
  {
    date: '08/13',
    pcs01: 0,
    pcs02: 0,
    bms01: 0,
    bms02: 0,
    hvac: 0,
    ems: 0,
  },
]

export const SOH_TREND_DATA: SOHTrendPoint[] = [
  { day: 0, voltageMv: 5, threshold: 15 },
  { day: 15, voltageMv: 6, threshold: 15 },
  { day: 30, voltageMv: 7, threshold: 15 },
  { day: 45, voltageMv: 8, threshold: 15 },
  { day: 60, voltageMv: 9, threshold: 15 },
  { day: 75, voltageMv: 11, threshold: 15 },
  { day: 90, voltageMv: 16, threshold: 15 },
]

export const MAIN_TABS = [
  '场站总览',
  '新能源收益',
  '运行',
  '台账',
  '功率因数',
  '储能测算',
  '能效',
] as const

export const OPERATION_SUB_TABS = [
  '光伏系统',
  '储能系统',
  '充电系统',
  '单线图',
] as const
