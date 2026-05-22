import { Bot, X } from 'lucide-react'

interface SocCriticalAlertProps {
  visible: boolean
  soc: number
  onDismiss: () => void
}

export function SocCriticalAlert({
  visible,
  soc,
  onDismiss,
}: SocCriticalAlertProps) {
  if (!visible) return null

  return (
    <div
      role="alertdialog"
      aria-labelledby="soc-alert-title"
      className="animate-slide-in-right fixed right-4 top-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-xl border border-danger/40 bg-white p-4 shadow-xl shadow-danger/10 dark:bg-slate-800 dark:shadow-black/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-danger/10">
            <Bot className="h-5 w-5 text-danger" />
          </span>
          <div>
            <p
              id="soc-alert-title"
              className="text-sm font-semibold text-danger"
            >
              AI 紧急处置
            </p>
            <p className="text-xs text-muted">P0 · 低电量红线唤醒</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        检测到 SOC 已降至{' '}
        <span className="font-bold text-danger">{soc.toFixed(2)}%</span>
        （≤20% 红线），系统已<strong>自动切换为强制充电</strong>
        模式，正在从电网导入功率以防止电池过放受损。
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="flex-1 rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          确认已知晓
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          查看处置日志
        </button>
      </div>
    </div>
  )
}
