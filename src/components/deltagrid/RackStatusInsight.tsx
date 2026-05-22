import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Bot } from 'lucide-react'
import type { BatteryRackSnapshot } from './types'
import {
  getRackAiPrediction,
  getRackAnalysisAndSolution,
} from './batteryRackData'
import { useChartTheme } from '../../theme/useChartTheme'
import {
  ChartAxisTick,
  ChartPlot,
  ChartYAxisTick,
  chartMargin,
  chartYAxisCommon,
} from './chartAxisStyles'

interface RackStatusInsightProps {
  rack: BatteryRackSnapshot
  className?: string
}

export function RackStatusInsight({ rack, className = '' }: RackStatusInsightProps) {
  const chartTheme = useChartTheme()
  const analysisAndSolution = getRackAnalysisAndSolution(rack)
  const aiPrediction = getRackAiPrediction(rack)

  const detailText = 'leading-relaxed text-slate-800 dark:text-slate-100'

  if (!analysisAndSolution && !aiPrediction) return null

  return (
    <div className={`space-y-2 text-xs ${className}`}>
      {analysisAndSolution && (
        <div>
          <p className={detailText}>
            <span className="font-medium">问题分析&解决建议：</span>
            {analysisAndSolution}
          </p>
        </div>
      )}

      {aiPrediction && (
        <div>
          <span className="inline-flex items-center gap-1 font-medium text-info">
            <Bot className="h-3.5 w-3.5 shrink-0" />
            AI 预测
          </span>
          <p className={`mt-1 ${detailText}`}>
            {aiPrediction.replace(/^⚠️\s*AI\s*预警[：:]\s*/u, '')}
          </p>

          <div className="mt-2 rounded-md border border-info/25 bg-info/5 p-2">
            <ChartPlot className="h-32 w-full" leftUnit="mV">
              <LineChart
                key={rack.id}
                data={rack.trendData}
                margin={chartMargin}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartTheme.gridStroke}
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={<ChartAxisTick />}
                  tickFormatter={(d) => `${d}天`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 20]}
                  {...chartYAxisCommon}
                  tick={<ChartYAxisTick />}
                />
                <ReferenceLine
                  y={15}
                  stroke="#ff3b30"
                  strokeDasharray="4 4"
                  label={{
                    value: '临界 15mV',
                    position: 'insideTopRight',
                    fill: '#ff3b30',
                    fontSize: 9,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '11px',
                  }}
                  formatter={(value) => [`${value} mV`, '压差预测']}
                  labelFormatter={(d) => `第 ${d} 天`}
                />
                <Line
                  type="monotone"
                  dataKey="voltageMv"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#3b82f6' }}
                  name="压差"
                />
                <Line
                  type="monotone"
                  dataKey="threshold"
                  stroke="#ff3b30"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  name="临界值"
                />
              </LineChart>
            </ChartPlot>
          </div>
        </div>
      )}
    </div>
  )
}
