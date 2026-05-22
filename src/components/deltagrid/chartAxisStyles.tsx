import type { ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'
import { useTheme } from '../../theme/ThemeContext'

export const CHART_AXIS_COLOR = '#999999'
export const CHART_AXIS_COLOR_DARK = '#6b7c93'

function useChartAxisFill() {
  const { theme } = useTheme()
  return theme === 'dark' ? CHART_AXIS_COLOR_DARK : CHART_AXIS_COLOR
}
export const CHART_AXIS_FONT_SIZE = 10
export const CHART_Y_AXIS_WIDTH = 44
export const CHART_Y_AXIS_RIGHT_WIDTH = 40
export const CHART_MARGIN_TOP = 16

export const chartAxisTickStyle = {
  fill: CHART_AXIS_COLOR,
  fontSize: CHART_AXIS_FONT_SIZE,
  fontStyle: 'italic' as const,
}

export const chartYAxisCommon = {
  axisLine: false as const,
  tickLine: false as const,
  width: CHART_Y_AXIS_WIDTH,
}

export const chartMargin = {
  top: CHART_MARGIN_TOP,
  right: 8,
  left: 0,
  bottom: 0,
} as const

export const chartMarginDualRight = {
  top: CHART_MARGIN_TOP,
  right: 48,
  left: 0,
  bottom: 0,
} as const

const unitClass =
  'pointer-events-none absolute z-10 text-[10px] italic leading-none text-[#999999] dark:text-[#6b7c93]'

interface AxisTickProps {
  x?: number | string
  y?: number | string
  payload?: { value: string | number }
  index?: number
}

function formatTickLabel(
  value: string | number,
  formatter?: (value: string | number, index: number) => string,
  index = 0,
) {
  return formatter ? formatter(value, index) : value
}

export function createChartYAxisTick(
  formatter?: (value: string | number, index: number) => string,
) {
  return function ChartYAxisTickItem(props: AxisTickProps) {
    const { x = 0, y = 0, payload, index = 0 } = props
    const label = formatTickLabel(payload?.value ?? '', formatter, index)
    const fill = useChartAxisFill()

    return (
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor="end"
        fill={fill}
        fontSize={CHART_AXIS_FONT_SIZE}
        fontStyle="italic"
      >
        {label}
      </text>
    )
  }
}

export function createChartYAxisRightTick(
  formatter?: (value: string | number, index: number) => string,
) {
  return function ChartYAxisRightTickItem(props: AxisTickProps) {
    const { x = 0, y = 0, payload, index = 0 } = props
    const label = formatTickLabel(payload?.value ?? '', formatter, index)
    const fill = useChartAxisFill()

    return (
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor="start"
        fill={fill}
        fontSize={CHART_AXIS_FONT_SIZE}
        fontStyle="italic"
      >
        {label}
      </text>
    )
  }
}

export const ChartYAxisTick = createChartYAxisTick()
export const ChartYAxisRightTick = createChartYAxisRightTick()

export function ChartXAxisTick({ x = 0, y = 0, payload }: AxisTickProps) {
  const fill = useChartAxisFill()

  return (
    <text
      x={x}
      y={y}
      dy={12}
      textAnchor="middle"
      fill={fill}
      fontSize={CHART_AXIS_FONT_SIZE}
      fontStyle="italic"
    >
      {payload?.value}
    </text>
  )
}

export const ChartAxisTick = ChartXAxisTick

interface ChartPlotProps {
  className?: string
  leftUnit?: string
  rightUnit?: string
  topUnit?: string
  children: ReactElement
  'data-detail-open'?: string
  'data-suppress-hover'?: string
}

/** 图表容器：单位固定显示在纵轴（或横向图数值轴）最上方 */
export function ChartPlot({
  className = 'h-52 w-full',
  leftUnit,
  rightUnit,
  topUnit,
  children,
  'data-detail-open': dataDetailOpen,
  'data-suppress-hover': dataSuppressHover,
}: ChartPlotProps) {
  return (
    <div
      className={`relative ${className}`}
      data-detail-open={dataDetailOpen}
      data-suppress-hover={dataSuppressHover}
    >
      {leftUnit && (
        <span
          className={unitClass}
          style={{
            top: 0,
            left: 0,
            width: CHART_Y_AXIS_WIDTH,
            textAlign: 'right',
            paddingRight: 4,
          }}
        >
          {leftUnit}
        </span>
      )}
      {rightUnit && (
        <span
          className={unitClass}
          style={{
            top: 0,
            right: 0,
            width: CHART_Y_AXIS_RIGHT_WIDTH,
            textAlign: 'left',
            paddingLeft: 4,
          }}
        >
          {rightUnit}
        </span>
      )}
      {topUnit && (
        <span
          className={unitClass}
          style={{
            top: 0,
            right: 8,
            textAlign: 'right',
          }}
        >
          {topUnit}
        </span>
      )}
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}
