/** Shared Tailwind fragments for light + dark dashboard surfaces */

export const cardSection =
  'rounded-lg border border-slate-200 bg-card p-4 shadow-sm dark:border-slate-700/80 dark:shadow-none'

export const cardTitle = 'text-sm font-semibold text-slate-800 dark:text-slate-100'

export const segmentedControl =
  'inline-flex rounded-md border border-slate-200 bg-slate-50/80 p-0.5 dark:border-slate-600 dark:bg-slate-800/60'

export const segmentedActive =
  'rounded bg-white text-info shadow-sm dark:bg-slate-600 dark:text-slate-100'

export const segmentedIdle =
  'rounded text-slate-600 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'

export const periodNavBtn =
  'inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-info/40 hover:bg-info/5 hover:text-info dark:border-slate-600 dark:text-slate-400 dark:hover:border-info/50 dark:hover:bg-info/10'

export const periodLabel = 'text-xs font-medium text-slate-700 dark:text-slate-200'

export const innerPanel =
  'rounded-md border border-slate-100 bg-slate-50/80 dark:border-slate-700/60 dark:bg-slate-800/40'

export const kpiValue = 'text-slate-900 dark:text-slate-50'

/** 指标标签（12px 次要色，与 SOC / 当前功率 等一致） */
export const metricLabel = 'kpi-tier-3 text-muted'

/** 卡片内正文行（12px） */
export const panelBody = 'kpi-tier-3 text-slate-700 dark:text-slate-200'

/** 卡片内数值（12px 加粗，用于次级指标） */
export const panelMetricValue =
  'kpi-tier-3 font-semibold text-slate-800 dark:text-slate-100'

/** 数值单位样式（kW / kWh / mV / % 等） */
export const kpiUnit = 'kpi-unit text-slate-500 dark:text-slate-400'

/** 图表底部自定义图例 */
export const chartLegend = 'kpi-tier-3 text-muted'

/** 极次要提示（图表轴单位、附注） */
export const hintText = 'text-[10px] leading-snug text-muted'

export const bodyMuted = 'text-slate-600 dark:text-slate-300'

export const listItemRow =
  'rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-700/50 dark:bg-slate-800/30'

/**
 * 右侧/同行模块卡片：固定高度与储能充放电曲线等模块对齐；
 * 内容少时不缩短，超出仅在卡片内滚动。
 */
export const panelModuleScroll =
  'flex h-[26rem] max-h-[26rem] flex-col overflow-hidden md:h-[27rem] md:max-h-[27rem]'

/**
 * 与左侧储能信息等同排时使用：高度不超过左列卡片，列表区在卡片内滚动。
 */
export const panelModuleFill =
  'flex h-full min-h-0 max-h-full w-full flex-col overflow-hidden'
