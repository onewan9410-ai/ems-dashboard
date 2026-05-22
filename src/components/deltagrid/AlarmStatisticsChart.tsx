import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
  type MouseHandlerDataParam,
} from 'recharts'
import { X } from 'lucide-react'
import { ChartPeriodToolbar } from './ChartPeriodToolbar'
import type { DailyAlarmStatByDevice } from './types'
import {
  formatAlarmChartDate,
  getAlarmsForChartKey,
} from './alarmDailyDetails'
import {
  alarmChartYAxisWidth,
  formatAlarmPeriodRangeLabel,
  getAlarmChartData,
  isAlarmPeriodAtLatest,
  shiftAlarmPeriodAnchor,
  type AlarmPeriodGranularity,
} from './alarmStatisticsData'
import { getDemoToday } from './storageVolumeData'
import {
  bodyMuted,
  cardSection,
  cardTitle,
  hintText,
} from '../../theme/dashboardClasses'
import { useChartTheme } from '../../theme/useChartTheme'
import {
  CHART_AXIS_COLOR,
  CHART_AXIS_FONT_SIZE,
  ChartAxisTick,
  ChartPlot,
  chartMargin,
} from './chartAxisStyles'

const GRANULARITY_OPTIONS: { value: AlarmPeriodGranularity; label: string }[] = [
  { value: 'day', label: '日' },
  { value: 'month', label: '月' },
  { value: 'year', label: '年' },
]

/** 运维告警色：红/橙/黄/蓝；各色值拉开对比，避免近邻混淆 */
const ALARM_DEVICE_COLORS = {
  pcs01: '#FF3B30',
  pcs02: '#F97316',
  bms01: '#2563EB',
  bms02: '#6366F1',
  hvac: '#FACC15',
  ems: '#14B8A6',
} as const

/** 按设备分色堆叠，每段为当日该设备告警总次数 */
const DEVICE_SERIES = [
  { key: 'pcs01', label: 'PCS-01', fill: ALARM_DEVICE_COLORS.pcs01 },
  { key: 'pcs02', label: 'PCS-02', fill: ALARM_DEVICE_COLORS.pcs02 },
  { key: 'bms01', label: 'BMS-01', fill: ALARM_DEVICE_COLORS.bms01 },
  { key: 'bms02', label: 'BMS-02', fill: ALARM_DEVICE_COLORS.bms02 },
  { key: 'hvac', label: 'HVAC', fill: ALARM_DEVICE_COLORS.hvac },
  { key: 'ems', label: 'EMS', fill: ALARM_DEVICE_COLORS.ems },
] as const

type DeviceSeriesKey = (typeof DEVICE_SERIES)[number]['key']

/** Recharts 用 null 跳过零值分段，避免无告警日出现色块 */
type AlarmChartDisplayRow = {
  date: string
  total: number
} & Record<DeviceSeriesKey, number | null>

function createClickableDateTick(
  selectedDate: string | null,
  onSelectDate: (date: string) => void,
) {
  return function ClickableDateTick(props: {
    x?: number | string
    y?: number | string
    payload?: { value: string }
  }) {
    const { x = 0, y = 0, payload } = props
    const date = payload?.value ?? ''
    const selected = date === selectedDate

    return (
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor="end"
        fill={selected ? '#3b82f6' : CHART_AXIS_COLOR}
        fontSize={CHART_AXIS_FONT_SIZE}
        fontStyle="italic"
        fontWeight={selected ? 600 : 400}
        className="cursor-pointer select-none"
        onClick={() => onSelectDate(date)}
      >
        {date}
      </text>
    )
  }
}

function AlarmDateDetailPanel({
  date,
  granularity,
  alarmCount,
  displayYear,
  onClose,
}: {
  date: string
  granularity: AlarmPeriodGranularity
  alarmCount: number
  displayYear: number
  onClose: () => void
}) {
  const alarms = useMemo(
    () => getAlarmsForChartKey(date, granularity),
    [date, granularity],
  )

  const emptyLabel =
    alarmCount === 0
      ? granularity === 'day'
        ? '该日无告警记录'
        : '该时段无告警记录'
      : '暂无告警记录'

  return (
    <aside
      className="relative z-10 flex h-full min-h-[200px] max-h-[min(470px,100%)] w-72 shrink-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800 xl:w-80"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-slate-700">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            {formatAlarmChartDate(date, granularity, displayYear)}
          </p>
          <p className="mt-0.5 text-[10px] text-muted">
            告警明细 · 共 {alarmCount} 次
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          aria-label="关闭告警详情"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="flex-1 space-y-1.5 overflow-y-auto p-2">
        {alarms.length === 0 ? (
          <li className="py-10 text-center text-xs text-muted">{emptyLabel}</li>
        ) : (
          alarms.map((alarm) => (
              <li
                key={alarm.id}
                className="rounded-md border border-slate-200/80 bg-slate-50/60 px-2.5 py-2 text-xs dark:border-slate-600/80 dark:bg-slate-900/40"
              >
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {alarm.title}
                </p>
                <p className="mt-1 truncate text-[10px] text-muted">
                  {alarm.device}
                </p>
                <p className="mt-0.5 text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
                  {alarm.timestamp}
                </p>
              </li>
            ))
        )}
      </ul>
    </aside>
  )
}

function sumDeviceAlarms(row: DailyAlarmStatByDevice) {
  return DEVICE_SERIES.reduce(
    (sum, device) =>
      sum + (row[device.key as DeviceSeriesKey] as number),
    0,
  )
}

function buildChartRows(data: DailyAlarmStatByDevice[]): AlarmChartDisplayRow[] {
  return [...data]
    .map((row) => {
      const total = sumDeviceAlarms(row)
      const display = { date: row.date, total } as AlarmChartDisplayRow
      for (const device of DEVICE_SERIES) {
        display[device.key] = null
      }

      if (total === 0) return display

      for (const device of DEVICE_SERIES) {
        const count = row[device.key as DeviceSeriesKey] as number
        display[device.key] = count > 0 ? count : null
      }

      return display
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

function applyDeviceVisibility(
  row: AlarmChartDisplayRow,
  hiddenDevices: ReadonlySet<DeviceSeriesKey>,
): AlarmChartDisplayRow {
  if (hiddenDevices.size === 0) return row

  const next: AlarmChartDisplayRow = { ...row }
  let total = 0

  for (const device of DEVICE_SERIES) {
    const key = device.key
    if (hiddenDevices.has(key)) {
      next[key] = null
      continue
    }
    const value = next[key]
    if (typeof value === 'number' && value > 0) {
      total += value
    }
  }

  next.total = total
  return next
}

type AlarmTooltipPayloadItem = {
  dataKey?: string | number
  name?: string
  value?: number
  color?: string
}

function AlarmStackTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: AlarmTooltipPayloadItem[]
  label?: string
}) {
  const chartTheme = useChartTheme()
  if (!active || !payload?.length) return null

  const segments = payload
    .filter((item) => typeof item.value === 'number' && item.value > 0)
    .sort(
      (a, b) =>
        DEVICE_SERIES.findIndex((d) => d.key === a.dataKey) -
        DEVICE_SERIES.findIndex((d) => d.key === b.dataKey),
    )

  const total = segments.reduce((sum, item) => sum + (item.value as number), 0)

  return (
    <div className={`relative z-[60] ${chartTheme.tooltipPanel}`}>
      <p className={chartTheme.tooltipTitle}>{label}</p>
      {total === 0 ? (
        <p className="text-muted">无告警</p>
      ) : (
        <>
          <ul className="space-y-1">
            {segments.map((item) => (
              <li
                key={String(item.dataKey)}
                className="flex items-center justify-between gap-4"
              >
                <span className={`inline-flex items-center gap-1.5 ${bodyMuted}`}>
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-medium tabular-nums text-slate-800 dark:text-slate-100">
                  {item.value} 次
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-slate-100 pt-2 font-medium text-slate-800 dark:border-slate-700 dark:text-slate-100">
            总计 {total} 次
          </p>
        </>
      )}
    </div>
  )
}

function DeviceLegendSwitch({
  id,
  label,
  fill,
  enabled,
  onChange,
}: {
  id: string
  label: string
  fill: string
  enabled: boolean
  onChange: (enabled: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className={`relative z-0 inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-1 transition-opacity ${
        enabled ? 'opacity-100' : 'opacity-45 hover:opacity-70'
      }`}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: fill }}
      />
      <span className={`whitespace-nowrap text-[11px] leading-none ${bodyMuted}`}>
        {label}
      </span>
      <span className="relative inline-block h-3.5 w-6 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={enabled}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full transition-colors duration-200"
          style={{
            backgroundColor: enabled ? `${fill}40` : '#e2e8f0',
          }}
        />
        <span
          aria-hidden
          className="absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all duration-200"
          style={{
            left: enabled ? 13 : 2,
            boxShadow: enabled
              ? `0 0 0 1px ${fill}66, 0 1px 2px rgba(15,23,42,0.1)`
              : '0 1px 2px rgba(15,23,42,0.08)',
          }}
        />
      </span>
    </label>
  )
}

function BarTotalLabel(props: {
  x?: number | string
  y?: number | string
  width?: number | string
  height?: number | string
  payload?: AlarmChartDisplayRow
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props
  const total = payload?.total ?? 0
  if (total === 0) return null

  const labelX = Number(x) + Number(width) + 8
  const labelY = Number(y) + Number(height) / 2

  return (
    <text
      x={labelX}
      y={labelY}
      dy={4}
      fill="#64748b"
      fontSize={10}
      fontWeight={500}
    >
      共 {total} 次
    </text>
  )
}

export function AlarmStatisticsChart() {
  const chartTheme = useChartTheme()
  const [granularity, setGranularity] = useState<AlarmPeriodGranularity>('day')
  const [anchorDate, setAnchorDate] = useState(() => getDemoToday())
  const [hiddenDevices, setHiddenDevices] = useState<Set<DeviceSeriesKey>>(
    () => new Set(),
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [tooltipSuppressed, setTooltipSuppressed] = useState(false)
  const chartAreaRef = useRef<HTMLDivElement>(null)
  const detailPanelRef = useRef<HTMLDivElement>(null)

  const periodNavLabel = useMemo(
    () => formatAlarmPeriodRangeLabel(anchorDate, granularity),
    [anchorDate, granularity],
  )
  const isLatest = isAlarmPeriodAtLatest(anchorDate, granularity)
  const yAxisWidth = alarmChartYAxisWidth(granularity)

  const chartData = useMemo(
    () => buildChartRows(getAlarmChartData(anchorDate, granularity)),
    [anchorDate, granularity],
  )

  const visibleChartData = useMemo(
    () =>
      chartData.map((row) => applyDeviceVisibility(row, hiddenDevices)),
    [chartData, hiddenDevices],
  )

  const renderedDeviceSeries = useMemo(
    () => DEVICE_SERIES.filter((device) => !hiddenDevices.has(device.key)),
    [hiddenDevices],
  )

  const xAxisMax = useMemo(() => {
    const peak = Math.max(...visibleChartData.map((row) => row.total), 1)
    return Math.ceil(peak * 1.15)
  }, [visibleChartData])

  const selectedVisibleRow = useMemo(
    () => visibleChartData.find((row) => row.date === selectedDate),
    [visibleChartData, selectedDate],
  )

  const displayYear = anchorDate.getFullYear()

  const handleSelectDate = useCallback((date: string) => {
    setTooltipSuppressed(true)
    setSelectedDate(date)
  }, [])

  const closeDetail = useCallback(() => {
    setSelectedDate(null)
    setTooltipSuppressed(false)
  }, [])

  const resolveClickDate = useCallback((state: MouseHandlerDataParam) => {
      const label = state?.activeLabel
      if (label != null && label !== '') {
        const date = String(label)
        if (visibleChartData.some((row) => row.date === date)) return date
      }

      const rawIndex = state?.activeTooltipIndex ?? state?.activeIndex
      if (rawIndex != null) {
        const index = Number(rawIndex)
        if (
          Number.isFinite(index) &&
          index >= 0 &&
          index < visibleChartData.length
        ) {
          return visibleChartData[index].date
        }
      }

      return null
    },
    [visibleChartData],
  )

  const handleBarClick = useCallback(
    (
      item: { payload?: AlarmChartDisplayRow },
      _index: number,
      event: ReactMouseEvent<SVGPathElement>,
    ) => {
      event.stopPropagation()
      const date = item?.payload?.date
      if (date) handleSelectDate(date)
    },
    [handleSelectDate],
  )

  const handleChartClick = useCallback(
    (state: MouseHandlerDataParam) => {
      const date = resolveClickDate(state)
      if (date) handleSelectDate(date)
    },
    [handleSelectDate, resolveClickDate],
  )

  const clearTooltipCursor = useCallback(() => {
    chartAreaRef.current
      ?.querySelectorAll('.recharts-tooltip-cursor')
      .forEach((node) => node.remove())
  }, [])

  useEffect(() => {
    if (!selectedDate) return

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (detailPanelRef.current?.contains(target)) return
      if (chartAreaRef.current?.contains(target)) return
      closeDetail()
    }

    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [selectedDate, closeDetail])

  const setDeviceVisible = (key: DeviceSeriesKey, visible: boolean) => {
    setHiddenDevices((prev) => {
      const next = new Set(prev)
      if (visible) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const DateAxisTick = useMemo(
    () => createClickableDateTick(selectedDate, handleSelectDate),
    [selectedDate, handleSelectDate],
  )

  useEffect(() => {
    setSelectedDate(null)
    setTooltipSuppressed(false)
  }, [anchorDate, granularity])

  useEffect(() => {
    if (!selectedDate) return
    const dateKey = String(selectedDate)
    const visible = visibleChartData.some((row) => row.date === dateKey)
    if (!visible) setSelectedDate(null)
  }, [selectedDate, visibleChartData])

  const chartHeight = Math.max(visibleChartData.length * 36 + 32, 120)
  const lastSeriesKey =
    renderedDeviceSeries[renderedDeviceSeries.length - 1]?.key
  const detailOpen = selectedDate != null
  const suppressChartHover = detailOpen || tooltipSuppressed

  useLayoutEffect(() => {
    if (suppressChartHover) clearTooltipCursor()
  }, [suppressChartHover, selectedDate, clearTooltipCursor])

  return (
    <section id="alarms" className={`flex h-full min-h-0 flex-col ${cardSection}`}>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className={cardTitle}>设备告警统计</h2>
          <p className={`mt-0.5 ${hintText}`}>
            按设备统计各日告警次数，点击柱状条查看明细
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <ChartPeriodToolbar
            granularity={granularity}
            granularityOptions={GRANULARITY_OPTIONS}
            onGranularityChange={setGranularity}
            periodLabel={periodNavLabel}
            nextDisabled={isLatest}
            onPrev={() =>
              setAnchorDate((current) =>
                shiftAlarmPeriodAnchor(current, granularity, -1),
              )
            }
            onNext={() =>
              setAnchorDate((current) =>
                shiftAlarmPeriodAnchor(current, granularity, 1),
              )
            }
          />
        </div>
      </div>

      <div className="relative isolate">
        <div
          ref={chartAreaRef}
          className="alarm-stats-chart relative z-10 overflow-visible outline-none focus:outline-none"
          style={{ height: chartHeight }}
          data-detail-open={detailOpen ? '' : undefined}
          data-suppress-hover={suppressChartHover ? '' : undefined}
          onMouseLeave={() => {
            if (!detailOpen) setTooltipSuppressed(false)
          }}
        >
          <ChartPlot className="h-full w-full cursor-pointer" topUnit="次">
            <BarChart
              data={visibleChartData}
              layout="vertical"
              margin={{ ...chartMargin, right: 56 }}
              barCategoryGap="28%"
              onClick={handleChartClick}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartTheme.gridStroke}
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, xAxisMax]}
                allowDecimals={false}
                tick={<ChartAxisTick />}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="date"
                tick={<DateAxisTick />}
                width={yAxisWidth}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={
                  suppressChartHover ? false : chartTheme.barHoverCursor
                }
                active={suppressChartHover ? false : undefined}
                isAnimationActive={false}
                wrapperStyle={{ zIndex: 60, pointerEvents: 'none' }}
                content={<AlarmStackTooltip />}
              />
              {renderedDeviceSeries.map((device) => (
                <Bar
                  key={device.key}
                  dataKey={device.key}
                  stackId="device"
                  fill={device.fill}
                  stroke="none"
                  name={device.label}
                  barSize={16}
                  minPointSize={0}
                  activeBar={false}
                  onClick={handleBarClick}
                  radius={
                    device.key === lastSeriesKey ? [0, 3, 3, 0] : [0, 0, 0, 0]
                  }
                >
                  {device.key === lastSeriesKey && (
                    <LabelList content={<BarTotalLabel />} />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ChartPlot>
        </div>

        <div className="relative z-0 mt-2 flex flex-wrap items-center gap-2">
          {DEVICE_SERIES.map((device) => (
              <DeviceLegendSwitch
                key={device.key}
                id={`alarm-legend-${device.key}`}
                label={device.label}
                fill={device.fill}
                enabled={!hiddenDevices.has(device.key)}
                onChange={(enabled) => setDeviceVisible(device.key, enabled)}
              />
            ))}
        </div>

        {selectedDate && (
            <div className="pointer-events-none absolute inset-y-0 right-0 z-40 flex items-stretch py-2 pr-2">
              <div
                ref={detailPanelRef}
                className="pointer-events-auto relative z-0 flex h-full min-h-0 flex-col"
              >
                <div
                  aria-hidden
                  className="alarm-detail-mask pointer-events-none absolute -inset-x-4 -inset-y-3 -z-10"
                />
                <AlarmDateDetailPanel
                  date={selectedDate}
                  granularity={granularity}
                  alarmCount={selectedVisibleRow?.total ?? 0}
                  displayYear={displayYear}
                  onClose={closeDetail}
                />
              </div>
            </div>
        )}
      </div>
    </section>
  )
}
