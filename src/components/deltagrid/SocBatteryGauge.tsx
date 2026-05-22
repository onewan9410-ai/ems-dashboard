import { AlertTriangle } from 'lucide-react'
import { SOC_VALUE } from './constants'
import { PercentRingMetric } from './PercentRingMetric'

const SOC_LOW_WARNING_THRESHOLD = 10

interface SocBatteryGaugeProps {
  soc?: number
}

export function SocBatteryGauge({ soc = SOC_VALUE }: SocBatteryGaugeProps) {
  const isLow = soc <= SOC_LOW_WARNING_THRESHOLD
  const isHealthy = soc > 20
  const progressColor = isHealthy ? '#22c55e' : isLow ? '#ff3b30' : '#f59e0b'

  return (
    <div className="min-w-0">
      <PercentRingMetric
        label="SOC"
        value={soc}
        displayValue={`${soc.toFixed(2)}%`}
        color={progressColor}
      />

      {isLow && (
        <div className="soc-warning-banner mt-2 flex min-h-10 items-start rounded-md px-2.5 py-2">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
            <p
              className="line-clamp-2 min-w-0 flex-1 text-xs leading-snug text-danger"
              title="低电量告警，建议立即充电以免损伤电池"
            >
              低电量告警，建议立即充电以免损伤电池
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
