import {
  useCallback,
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
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  cardSection,
  cardTitle,
  chartLegend,
} from '../../theme/dashboardClasses'
import { ChartPeriodToolbar } from './ChartPeriodToolbar'
import { useChartTheme } from '../../theme/useChartTheme'
import {
  ChartAxisTick,
  ChartPlot,
  ChartYAxisTick,
  chartMargin,
  chartYAxisCommon,
} from './chartAxisStyles'
import {
  formatChartPeriodRangeLabel,
  formatVolumeSummaryValue,
  getDemoToday,
  getVolumeChartData,
  isVolumePeriodAtLatest,
  shiftVolumeAnchor,
  summarizeVolumeChartData,
  type VolumeGranularity,
} from './storageVolumeData'
import {
  STORAGE_CHARGE_COLOR,
  STORAGE_DISCHARGE_COLOR,
  STORAGE_ENERGY_SERIES,
} from './storageEnergyColors'

const GRANULARITY_OPTIONS: { value: VolumeGranularity; label: string }[] = [
  { value: 'day', label: '日' },
  { value: 'month', label: '月' },
  { value: 'year', label: '年' },
]

const VOLUME_UNIT = 'kWh'

export function StorageVolumeChart() {
  const chartTheme = useChartTheme()
  const chartAreaRef = useRef<HTMLDivElement>(null)
  const [granularity, setGranularity] = useState<VolumeGranularity>('day')
  const [anchorDate, setAnchorDate] = useState(() => getDemoToday())
  const [hoverSuppressed, setHoverSuppressed] = useState(false)

  const clearTooltipCursor = useCallback(() => {
    chartAreaRef.current
      ?.querySelectorAll('.recharts-tooltip-cursor')
      .forEach((node) => node.remove())
  }, [])

  const handleBarClick = useCallback(
    (_item: unknown, _index: number, event: ReactMouseEvent<SVGPathElement>) => {
      event.stopPropagation()
      setHoverSuppressed(true)
    },
    [],
  )

  useLayoutEffect(() => {
    if (hoverSuppressed) clearTooltipCursor()
  }, [hoverSuppressed, clearTooltipCursor])

  const periodNavLabel = useMemo(
    () => formatChartPeriodRangeLabel(anchorDate, granularity),
    [anchorDate, granularity],
  )
  const chartData = useMemo(
    () => getVolumeChartData(anchorDate, granularity),
    [anchorDate, granularity],
  )
  const summary = useMemo(
    () => summarizeVolumeChartData(chartData),
    [chartData],
  )
  const isLatest = isVolumePeriodAtLatest(anchorDate, granularity)

  return (
    <section className={`flex h-full min-h-0 flex-col ${cardSection}`}>
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className={cardTitle}>储能充放电量</h2>

        <ChartPeriodToolbar
          granularity={granularity}
          granularityOptions={GRANULARITY_OPTIONS}
          onGranularityChange={setGranularity}
          periodLabel={periodNavLabel}
          nextDisabled={isLatest}
          onPrev={() =>
            setAnchorDate((current) =>
              shiftVolumeAnchor(current, granularity, -1),
            )
          }
          onNext={() =>
            setAnchorDate((current) =>
              shiftVolumeAnchor(current, granularity, 1),
            )
          }
        />
      </div>

      <div
        className="mb-1.5 flex divide-x divide-slate-200/80 overflow-hidden rounded-md border border-slate-200/80 bg-slate-50/60 dark:divide-slate-700/50 dark:border-slate-700/50 dark:bg-slate-800/30"
        aria-label="当前时间范围充放电量汇总"
      >
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1.5 px-2 py-1">
          <span className="shrink-0 text-[10px] text-muted">总充电</span>
          <span className="whitespace-nowrap text-sm font-semibold leading-none tabular-nums text-charge">
            {formatVolumeSummaryValue(summary.charge)}
            <span className="ml-0.5 text-[10px] font-medium text-charge/70">
              {VOLUME_UNIT}
            </span>
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1.5 px-2 py-1">
          <span className="shrink-0 text-[10px] text-muted">总放电</span>
          <span className="whitespace-nowrap text-sm font-semibold leading-none tabular-nums text-discharge">
            {formatVolumeSummaryValue(summary.discharge)}
            <span className="ml-0.5 text-[10px] font-medium text-discharge/70">
              {VOLUME_UNIT}
            </span>
          </span>
        </div>
      </div>

      <div
        ref={chartAreaRef}
        className="storage-volume-chart outline-none focus:outline-none"
        data-suppress-hover={hoverSuppressed ? '' : undefined}
        onMouseDownCapture={() => setHoverSuppressed(true)}
        onMouseLeave={() => setHoverSuppressed(false)}
      >
        <ChartPlot leftUnit={VOLUME_UNIT}>
          <BarChart data={chartData} margin={chartMargin}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartTheme.gridStroke}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={<ChartAxisTick />}
              axisLine={{ stroke: chartTheme.axisLineStroke }}
              tickLine={false}
            />
            <YAxis
              {...chartYAxisCommon}
              tick={<ChartYAxisTick />}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              cursor={hoverSuppressed ? false : chartTheme.barHoverCursor}
              active={hoverSuppressed ? false : undefined}
              isAnimationActive={false}
              wrapperStyle={{ pointerEvents: 'none' }}
              contentStyle={{
                backgroundColor: chartTheme.isDark ? '#1e293b' : '#fff',
                border: chartTheme.isDark
                  ? '1px solid #475569'
                  : '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
                color: chartTheme.isDark ? '#e2e8f0' : '#334155',
              }}
              formatter={(value, name) => {
                const numeric =
                  typeof value === 'number' ? value : Number(value ?? 0)
                const label =
                  name === STORAGE_ENERGY_SERIES.charge.label ||
                  name === STORAGE_ENERGY_SERIES.charge.key
                    ? STORAGE_ENERGY_SERIES.charge.label
                    : STORAGE_ENERGY_SERIES.discharge.label
                return [`${numeric.toFixed(2)} ${VOLUME_UNIT}`, label]
              }}
            />
            <Bar
              dataKey={STORAGE_ENERGY_SERIES.charge.key}
              fill={STORAGE_CHARGE_COLOR}
              stroke="none"
              activeBar={false}
              radius={[2, 2, 0, 0]}
              name={STORAGE_ENERGY_SERIES.charge.label}
              onClick={handleBarClick}
            />
            <Bar
              dataKey={STORAGE_ENERGY_SERIES.discharge.key}
              fill={STORAGE_DISCHARGE_COLOR}
              stroke="none"
              activeBar={false}
              radius={[2, 2, 0, 0]}
              name={STORAGE_ENERGY_SERIES.discharge.label}
              onClick={handleBarClick}
            />
          </BarChart>
        </ChartPlot>
      </div>

      <div className={`mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 ${chartLegend}`}>
        <span className="flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-sm"
            style={{ backgroundColor: STORAGE_CHARGE_COLOR }}
          />
          {STORAGE_ENERGY_SERIES.charge.label}
        </span>
        <span className="flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-sm"
            style={{ backgroundColor: STORAGE_DISCHARGE_COLOR }}
          />
          {STORAGE_ENERGY_SERIES.discharge.label}
        </span>
      </div>
    </section>
  )
}
