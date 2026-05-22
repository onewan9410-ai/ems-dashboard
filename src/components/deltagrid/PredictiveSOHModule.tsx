import { Activity, Gauge, Thermometer } from 'lucide-react'

export function PredictiveSOHModule() {
  return (
    <section className="rounded-xl border border-slate-800 bg-card p-4 transition-all duration-300 hover:border-slate-700">
      <h2 className="mb-3 text-sm font-semibold text-white">
        Predictive SOH Forecasting
      </h2>
      <p className="mb-4 text-[10px] text-slate-500">P2 · Real-time cell health snapshot</p>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-info" />
            <span className="text-xs text-slate-400">Cell Voltage Variance</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-white">9 mV</span>
            <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium text-success bg-success/10">
              Normal
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-warning" />
            <span className="text-xs text-slate-400">Cell Temperature Variance</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-white">4°C</span>
            <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium text-success bg-success/10">
              Normal
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3">
        <div className="flex items-start gap-2">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-xs leading-relaxed text-slate-300">
            <span className="font-semibold text-warning">AI Prognostics:</span>{' '}
            Pack RACK-A2 voltage variance predicted to breach limit in{' '}
            <span className="text-white">90 days</span>. Recommended maintenance
            window before <span className="text-white">June 2026</span>.
          </p>
        </div>
      </div>
    </section>
  )
}
