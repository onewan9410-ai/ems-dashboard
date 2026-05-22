import { AlertTriangle, CheckCircle2, Server } from 'lucide-react'
import type { AlarmItem, AlarmTriageLevel } from './types'
import { DEVICE_GROUPS } from './constants'

interface DeviceAlarmsPanelProps {
  alarms: AlarmItem[]
  activeTriage: AlarmTriageLevel
}

const LEVEL_STYLES = {
  critical: {
    dot: 'bg-danger',
    text: 'text-danger',
    border: 'border-danger/20',
  },
  warning: {
    dot: 'bg-warning',
    text: 'text-warning',
    border: 'border-warning/20',
  },
  info: {
    dot: 'bg-info',
    text: 'text-info',
    border: 'border-info/20',
  },
}

export function DeviceAlarmsPanel({
  alarms,
  activeTriage,
}: DeviceAlarmsPanelProps) {
  const filtered =
    activeTriage === 'all'
      ? alarms
      : alarms.filter((a) => a.level === activeTriage)

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-800 bg-card p-4 transition-all duration-300 hover:border-slate-700">
        <h2 className="mb-3 text-sm font-semibold text-white">
          Device Breakdown
        </h2>
        <ul className="space-y-3">
          {DEVICE_GROUPS.map((group) => (
            <li
              key={group.name}
              className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/30 px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-white">{group.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Needs Attention: {group.needsAttention}
                </span>
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Normal: {group.normal}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-card p-4 transition-all duration-300 hover:border-slate-700">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Alarm Stream</h2>
          {activeTriage !== 'all' && (
            <span className="text-[10px] text-slate-500 capitalize">
              Filtered: {activeTriage}
            </span>
          )}
        </div>
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-xs text-slate-500">
              No alarms at this triage level.
            </li>
          ) : (
            filtered.map((alarm) => {
              const style = LEVEL_STYLES[alarm.level]
              return (
                <li
                  key={alarm.id}
                  className={`rounded-lg border px-3 py-2 transition-all duration-200 ${style.border} bg-slate-900/20 hover:bg-slate-900/40`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-medium ${style.text}`}>
                        {alarm.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        {alarm.device} · {alarm.timestamp}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      </section>
    </div>
  )
}
