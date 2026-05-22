import { useMemo } from 'react'
import { Bell } from 'lucide-react'
import {
  groupTodayMessages,
  TODAY_MESSAGE_COUNTS,
  TODAY_MESSAGES,
  TODAY_MESSAGE_TOTAL,
} from './headerMessages'

const popoverPanelClass =
  'relative flex h-[450px] flex-col overflow-visible rounded-lg border border-slate-200 bg-white px-3 pb-2.5 pt-3 shadow-lg shadow-slate-200/60 dark:border-slate-600 dark:bg-slate-800 dark:shadow-black/40'

/** 面板在按钮下方：实心三角尖头朝上，与面板顶边衔接 */
const popoverCaretClass =
  'pointer-events-none absolute right-[11px] top-0 z-10 h-3 w-3 -translate-y-1/2 bg-white [clip-path:polygon(50%_0,0_100%,100%_100%)] dark:bg-slate-800'

export function HeaderMessageInbox() {
  const groups = useMemo(() => groupTodayMessages(TODAY_MESSAGES), [])

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={`报警日志 ${TODAY_MESSAGE_TOTAL} 条`}
        className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-info/40 hover:bg-info/5 hover:text-info dark:border-slate-600 dark:text-slate-300 dark:hover:bg-info/10"
      >
        <Bell className="h-4 w-4" />
        {TODAY_MESSAGE_TOTAL > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white">
            {TODAY_MESSAGE_TOTAL > 99 ? '99+' : TODAY_MESSAGE_TOTAL}
          </span>
        )}
      </button>

      <div
        className="absolute top-full right-0 z-50 hidden w-[min(22rem,calc(100vw-2rem))] pt-2 group-hover:block"
        role="region"
        aria-label="报警日志"
      >
        <div className={popoverPanelClass}>
          <span className={popoverCaretClass} aria-hidden />
          <div className="shrink-0 border-b border-slate-100 pb-2 dark:border-slate-700">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  报警日志
                </p>
                <p className="mt-0.5 text-[10px] text-muted">
                  共 {TODAY_MESSAGE_TOTAL} 条未处理
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1 text-[10px]">
                <span className="rounded-full border border-danger/25 bg-danger/5 px-1.5 py-0.5 font-medium text-danger">
                  告警 {TODAY_MESSAGE_COUNTS.critical}
                </span>
                <span className="rounded-full border border-warning/25 bg-warning/5 px-1.5 py-0.5 font-medium text-warning">
                  警告 {TODAY_MESSAGE_COUNTS.warning}
                </span>
                <span className="rounded-full border border-info/25 bg-info/5 px-1.5 py-0.5 font-medium text-info">
                  提示 {TODAY_MESSAGE_COUNTS.info}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-0.5">
          <ul className="space-y-2">
            {groups.map(({ level, meta, items }) => (
              <li key={level}>
                <p
                  className={`mb-1 inline-flex items-center gap-1 text-[10px] font-semibold ${meta.text}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                  <span className="font-normal text-muted">({items.length})</span>
                </p>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className={`rounded-md border px-2 py-1.5 text-xs ${meta.bg}`}
                    >
                      <p className={`font-medium leading-snug ${meta.text}`}>
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted">
                        {item.device} · {item.timestamp}
                      </p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
