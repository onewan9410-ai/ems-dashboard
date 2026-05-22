import { useMemo, useState } from 'react'
import { Lightbulb } from 'lucide-react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TARIFF_PERIODS, WAVEFORM_DATA } from './constants'
import type { WaveformPoint } from './types'
import { ChartDateNav } from './ChartDateNav'
import {
  formatChartPeriodNavLabel,
  getDemoToday,
  isDemoToday,
} from './storageVolumeData'
import {
  STORAGE_DISCHARGE_COLOR,
  STORAGE_POWER_SERIES,
} from './storageEnergyColors'
import {
  bodyMuted,
  cardSection,
  cardTitle,
  chartLegend,
} from '../../theme/dashboardClasses'
import { useChartTheme } from '../../theme/useChartTheme'
import {
  ChartAxisTick,
  ChartPlot,
  createChartYAxisRightTick,
  createChartYAxisTick,
  chartMarginDualRight,
  chartYAxisCommon,
} from './chartAxisStyles'

const formatPowerTick = createChartYAxisTick((value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toFixed(1) : `${value}`
})
const formatSocTick = createChartYAxisRightTick((value) => `${value}%`)
const SOC_AXIS_TICKS = [0, 25, 50, 75, 100]
const POWER_AXIS_TICKS = [-1.8, -1.2, -0.6, 0, 0.4]
const POWER_FILL_OPACITY = 0.12

type WaveformChartPoint = WaveformPoint & {
  chargePower: number | null
  dischargePower: number | null
}

function interpolateZeroCrossTime(
  t1: string,
  p1: number,
  t2: string,
  p2: number,
) {
  const [h1, m1] = t1.split(':').map(Number)
  const [h2, m2] = t2.split(':').map(Number)
  const mins1 = h1 * 60 + m1
  const mins2 = h2 * 60 + m2
  const ratio = Math.abs(p1) / (Math.abs(p1) + Math.abs(p2))
  const mins = Math.round(mins1 + ratio * (mins2 - mins1))
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

function splitPowerWaveform(data: WaveformPoint[]): WaveformChartPoint[] {
  const result: WaveformChartPoint[] = []

  for (let i = 0; i < data.length; i++) {
    const point = data[i]
    const prev = i > 0 ? data[i - 1] : null

    if (prev && prev.power * point.power < 0) {
      result.push({
        time: interpolateZeroCrossTime(
          prev.time,
          prev.power,
          point.time,
          point.power,
        ),
        power: 0,
        soc: point.soc,
        chargePower: 0,
        dischargePower: 0,
      })
    }

    result.push({
      ...point,
      chargePower: point.power > 0 ? point.power : point.power === 0 ? 0 : null,
      dischargePower:
        point.power < 0 ? point.power : point.power === 0 ? 0 : null,
    })
  }

  return result
}

function powerColor(power: number) {
  if (power > 0) return STORAGE_POWER_SERIES.charge.color
  if (power < 0) return STORAGE_POWER_SERIES.discharge.color
  return STORAGE_DISCHARGE_COLOR
}

function shiftDate(d: Date, days: number) {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

function formatPowerTooltipValue(power: number) {
  const tag =
    power > 0 ? '充电' : power < 0 ? '放电' : ''
  return tag ? `${power.toFixed(2)} kW ${tag}` : `${power.toFixed(2)} kW`
}

type WaveformTooltipProps = {
  active?: boolean
  label?: string
  chartData: WaveformChartPoint[]
  powerLabel: string
}

function WaveformTooltip({
  active,
  label,
  chartData,
  powerLabel,
  tooltipPanel,
  tooltipTitle,
}: WaveformTooltipProps & {
  tooltipPanel: string
  tooltipTitle: string
}) {
  if (!active || !label) return null

  const row = chartData.find((point) => point.time === label)
  if (!row) return null

  const { power, soc } = row

  return (
    <div className={tooltipPanel}>
      <p className={tooltipTitle}>{label}</p>
      <p className="text-success">SOC (%) : {soc.toFixed(1)}%</p>
      <p style={{ color: powerColor(power) }}>
        {powerLabel} : {formatPowerTooltipValue(power)}
      </p>
    </div>
  )
}

export function PowerWaveformChart() {
  const chartTheme = useChartTheme()
  const [selectedDate, setSelectedDate] = useState(() => getDemoToday())

  const dateNavLabel = useMemo(
    () => formatChartPeriodNavLabel(selectedDate, 'day'),
    [selectedDate],
  )
  const isToday = isDemoToday(selectedDate)

  const powerSeries = STORAGE_POWER_SERIES.combined
  const chargeSeries = STORAGE_POWER_SERIES.charge
  const dischargeSeries = STORAGE_POWER_SERIES.discharge
  const chartData = useMemo(() => splitPowerWaveform(WAVEFORM_DATA), [])

  return (
    <section className={cardSection}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className={cardTitle}>储能充放电曲线</h2>

        <ChartDateNav
          periodLabel={dateNavLabel}
          nextDisabled={isToday}
          prevAriaLabel="前一天"
          nextAriaLabel="后一天"
          onPrev={() => setSelectedDate((d) => shiftDate(d, -1))}
          onNext={() => setSelectedDate((d) => shiftDate(d, 1))}
        />
      </div>

      <ChartPlot className="h-56 w-full md:h-64" leftUnit="kW">
        <ComposedChart data={chartData} margin={chartMarginDualRight}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme.gridStroke}
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={<ChartAxisTick />}
            axisLine={{ stroke: chartTheme.axisLineStroke }}
            tickLine={false}
            interval={2}
          />
          <YAxis
            yAxisId="power"
            domain={[-1.9, 0.45]}
            ticks={POWER_AXIS_TICKS}
            {...chartYAxisCommon}
            tick={formatPowerTick}
          />
          <YAxis
            yAxisId="soc"
            orientation="right"
            domain={[0, 100]}
            ticks={SOC_AXIS_TICKS}
            axisLine={false}
            tickLine={false}
            width={48}
            tick={formatSocTick}
          />

          {TARIFF_PERIODS.map((period) => (
            <ReferenceArea
              key={`${period.start}-${period.end}-${period.type}`}
              x1={period.start}
              x2={period.end}
              yAxisId="power"
              fill={period.fill}
              fillOpacity={period.fillOpacity}
              strokeOpacity={0}
              label={{
                value: period.label,
                position: 'insideTop',
                fill: period.labelFill,
                fontSize: 11,
                fontWeight: 500,
              }}
            />
          ))}

          <ReferenceLine
            yAxisId="power"
            y={0}
            stroke={chartTheme.refLineStroke}
            strokeDasharray="4 4"
          />
          <Tooltip
            content={
              <WaveformTooltip
                powerLabel={powerSeries.label}
                chartData={chartData}
                tooltipPanel={chartTheme.tooltipPanel}
                tooltipTitle={chartTheme.tooltipTitle}
              />
            }
          />
          <Area
            yAxisId="power"
            type="monotone"
            dataKey="dischargePower"
            stroke="none"
            fill={dischargeSeries.color}
            fillOpacity={POWER_FILL_OPACITY}
            baseValue={0}
            connectNulls
            isAnimationActive={false}
            tooltipType="none"
          />
          <Area
            yAxisId="power"
            type="monotone"
            dataKey="chargePower"
            stroke="none"
            fill={chargeSeries.color}
            fillOpacity={POWER_FILL_OPACITY}
            baseValue={0}
            connectNulls
            isAnimationActive={false}
            tooltipType="none"
          />
          <Line
            yAxisId="power"
            type="monotone"
            dataKey="dischargePower"
            stroke={dischargeSeries.color}
            strokeWidth={2}
            dot={false}
            connectNulls
            tooltipType="none"
          />
          <Line
            yAxisId="power"
            type="monotone"
            dataKey="chargePower"
            stroke={chargeSeries.color}
            strokeWidth={2}
            dot={false}
            connectNulls
            tooltipType="none"
          />
          <Line
            yAxisId="soc"
            type="monotone"
            dataKey="soc"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            name="SOC (%)"
          />
        </ComposedChart>
      </ChartPlot>

      <div className={`mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 ${chartLegend}`}>
        <span className="flex items-center gap-1">
          <span
            className="h-0.5 w-4"
            style={{ backgroundColor: dischargeSeries.color }}
          />
          放电 (kW)
        </span>
        <span className="flex items-center gap-1">
          <span
            className="h-0.5 w-4"
            style={{ backgroundColor: chargeSeries.color }}
          />
          充电 (kW)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-4 bg-success" />
          SOC (%)
        </span>
      </div>

      <div className="mt-3 rounded-md border border-info/20 bg-info/5 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
          <div className="min-w-0">
            <p className={`text-xs font-semibold ${cardTitle}`}>优化方案建议</p>
            <p className={`mt-1 text-xs leading-relaxed ${bodyMuted}`}>
              谷期（00:00-06:00）未见逻辑清晰的批量充电行为，导致白天峰期无法放电，资产处于闲置和亏损状态。
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
