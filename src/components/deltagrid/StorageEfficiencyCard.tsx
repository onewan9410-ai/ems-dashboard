import { useState } from 'react'
import { Bot, Thermometer } from 'lucide-react'
import { EFFICIENCY_WARNING_THRESHOLD } from './constants'

const EFFICIENCY = 60.12
const TARGET_EFFICIENCY = 76.8

export function StorageEfficiencyCard() {
  const [showDiagnosis, setShowDiagnosis] = useState(false)
  const isLow = EFFICIENCY < EFFICIENCY_WARNING_THRESHOLD
  const accentColor = isLow ? '#FF9900' : '#00FF66'
  const circumference = 2 * Math.PI * 52
  const offset = circumference - (EFFICIENCY / 100) * circumference

  return (
    <section className="rounded-xl border border-slate-800 bg-card p-4 transition-all duration-300 hover:border-slate-700 md:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Storage Efficiency
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Closed-loop AI optimization · P2
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowDiagnosis((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-xs font-medium text-warning transition-all duration-300 hover:border-warning/60 hover:bg-warning/10"
        >
          <Bot className="h-4 w-4" />
          AI Efficiency Diagnosis
        </button>
      </div>

      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="relative h-32 w-32 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#1e293b"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={accentColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
              style={{
                filter: isLow
                  ? 'drop-shadow(0 0 6px rgba(255,153,0,0.5))'
                  : 'drop-shadow(0 0 6px rgba(0,255,102,0.5))',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-2xl font-bold"
              style={{ color: accentColor }}
            >
              {EFFICIENCY.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-500">System Efficiency</span>
          </div>
        </div>

        <div className="flex-1 space-y-2 text-xs text-slate-400">
          <p>
            Target threshold:{' '}
            <span className="text-white">{EFFICIENCY_WARNING_THRESHOLD}%</span>
          </p>
          <p>
            Status:{' '}
            <span className="font-medium text-warning">
              Below optimal — AI intervention recommended
            </span>
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${EFFICIENCY}%`,
                backgroundColor: accentColor,
              }}
            />
          </div>
        </div>
      </div>

      {showDiagnosis && (
        <div className="mt-4 rounded-lg border border-warning/30 bg-slate-900/80 p-4 transition-opacity duration-300">
          <div className="flex items-start gap-3">
            <Thermometer className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div className="flex-1 space-y-3">
              <p className="text-sm text-slate-300">
                HVAC auxiliary thermal losses account for{' '}
                <span className="font-semibold text-warning">24.5%</span> of
                total system inefficiency. Dynamic thermal control can recover
                significant round-trip efficiency.
              </p>
              <button
                type="button"
                className="w-full rounded-lg border border-success/40 bg-success/10 px-4 py-2.5 text-xs font-semibold text-success transition-all duration-300 hover:border-success/60 hover:bg-success/20 sm:w-auto"
              >
                Execute AI Dynamic Thermal Control — target{' '}
                {TARGET_EFFICIENCY.toFixed(1)}%
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
