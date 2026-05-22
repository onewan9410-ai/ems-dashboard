import type { AlarmItem, AlarmTriageLevel } from './types'

interface AlarmStreamListProps {
  alarms: AlarmItem[]
  activeTriage: AlarmTriageLevel
}

const LEVEL_STYLES = {
  critical: { dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/5 border-danger/20' },
  warning: { dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/5 border-warning/20' },
  info: { dot: 'bg-info', text: 'text-info', bg: 'bg-info/5 border-info/20' },
}

export function AlarmStreamList({ alarms, activeTriage }: AlarmStreamListProps) {
  const filtered =
    activeTriage === 'all'
      ? alarms
      : alarms.filter((a) => a.level === activeTriage)

  return (
    <ul className="mt-3 max-h-36 space-y-1.5 overflow-y-auto">
      {filtered.length === 0 ? (
        <li className="py-4 text-center text-xs text-muted">
          该级别暂无告警
        </li>
      ) : (
        filtered.map((alarm) => {
          const style = LEVEL_STYLES[alarm.level]
          const isHighlighted =
            activeTriage === 'all' || activeTriage === alarm.level
          return (
            <li
              key={alarm.id}
              className={`flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs transition-all ${
                style.bg
              } ${isHighlighted ? 'opacity-100 ring-1 ring-inset ring-slate-200' : 'opacity-40'}`}
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`}
              />
              <div className="min-w-0 flex-1">
                <p className={`font-medium ${style.text}`}>{alarm.title}</p>
                <p className="mt-0.5 truncate text-[10px] text-muted">
                  {alarm.device} · {alarm.timestamp}
                </p>
              </div>
            </li>
          )
        })
      )}
    </ul>
  )
}
