const RING_SIZE = '25pt'
const RING_GAP = '2pt'
const RING_R = 11
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R

import { metricLabel } from '../../theme/dashboardClasses'

interface PercentRingMetricProps {
  label: string
  value: number
  displayValue: string
  color: string
}

export function PercentRingMetric({
  label,
  value,
  displayValue,
  color,
}: PercentRingMetricProps) {
  const offset = RING_CIRCUMFERENCE - (value / 100) * RING_CIRCUMFERENCE

  return (
    <div>
      <p className={metricLabel}>{label}</p>
      <div className="mt-1 flex items-center" style={{ gap: RING_GAP }}>
        <div
          className="relative shrink-0"
          style={{ width: RING_SIZE, height: RING_SIZE }}
        >
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 36 36"
            aria-hidden
          >
            <circle
              cx="18"
              cy="18"
              r={RING_R}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r={RING_R}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
        </div>
        <span className="kpi-tier-1 leading-none" style={{ color }}>
          {displayValue}
        </span>
      </div>
    </div>
  )
}
