/** 全局储能充 / 放电语义色（与 index.css @theme 保持一致） */
export const STORAGE_CHARGE_COLOR = '#3b82f6'
export const STORAGE_DISCHARGE_COLOR = '#f59e0b'

export const STORAGE_ENERGY_SERIES = {
  charge: {
    key: 'charge',
    label: '充电量 (kWh)',
    color: STORAGE_CHARGE_COLOR,
  },
  discharge: {
    key: 'discharge',
    label: '放电量 (kWh)',
    color: STORAGE_DISCHARGE_COLOR,
  },
} as const

export const STORAGE_POWER_SERIES = {
  combined: {
    label: '储能充放电功率',
    color: STORAGE_CHARGE_COLOR,
    fillOpacity: 0.12,
  },
  charge: {
    label: '充电功率 (kW)',
    color: STORAGE_CHARGE_COLOR,
  },
  discharge: {
    label: '放电功率 (kW)',
    color: STORAGE_DISCHARGE_COLOR,
  },
} as const
