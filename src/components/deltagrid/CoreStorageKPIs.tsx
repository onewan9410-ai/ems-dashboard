import { Battery, Zap } from 'lucide-react'
import { SOC_CRITICAL_THRESHOLD } from './constants'

const SOC = 10.0

export function CoreStorageKPIs() {
  const isSocCritical = SOC <= SOC_CRITICAL_THRESHOLD

  return (
    <section className="rounded-xl border border-slate-800 bg-card p-4 transition-all duration-300 hover:border-slate-700 md:p-5">
      <h2 className="mb-4 text-sm font-semibold text-white">
        Core Storage Metrics
      </h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* KPI 1: Current Power */}
        <div className="space-y-1">
          <p className="text-xs text-slate-500">Current Power</p>
          <p className="text-[32px] font-bold leading-none text-white">
            -1.30 <span className="text-lg font-semibold text-slate-400">kW</span>
          </p>
        </div>

        {/* KPI 2: SOC — critical state */}
        <div className="space-y-1">
          <p className="text-xs text-slate-500">State of Charge (SOC)</p>
          <div className="flex items-center gap-2">
            <Battery
              className={`h-7 w-7 shrink-0 ${
                isSocCritical
                  ? 'text-danger animate-pulse'
                  : 'text-success'
              }`}
              strokeWidth={2}
            />
            <p
              className={`text-[32px] font-bold leading-none ${
                isSocCritical ? 'text-danger animate-pulse' : 'text-success'
              }`}
            >
              {SOC.toFixed(2)}%
            </p>
          </div>
          {isSocCritical && (
            <p className="mt-2 rounded-md border border-warning/30 bg-warning/5 px-2 py-1.5 text-[11px] leading-snug text-warning">
              ⚠️ AI Action: Auto-switching to Force-Charge mode to prevent
              over-discharge.
            </p>
          )}
        </div>

        {/* KPI 3: Today's Charge/Discharge */}
        <div className="space-y-1">
          <p className="text-xs text-slate-500">Today&apos;s Charge / Discharge</p>
          <p className="text-lg font-medium text-white">
            7.51 <span className="text-slate-500">/</span> 0{' '}
            <span className="text-sm text-slate-400">kW</span>
          </p>
        </div>

        {/* KPI 4: Equivalent Cycle Count — empty / initializing */}
        <div className="space-y-1">
          <p className="text-xs text-slate-500">Equivalent Cycle Count</p>
          <p className="text-xs text-muted">--</p>
          <p className="text-[10px] text-muted">(Sensor initializing...)</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-600">
        <Zap className="h-3 w-3 text-info" />
        <span>Discharge detected — grid import compensating via closed-loop control</span>
      </div>
    </section>
  )
}
