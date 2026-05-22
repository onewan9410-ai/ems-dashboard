import { ChevronLeft, ChevronRight } from 'lucide-react'

const periodNavShell =
  'inline-flex h-6 items-stretch overflow-hidden rounded border border-slate-200 bg-slate-50/80 dark:border-slate-600 dark:bg-slate-900/40'

const navArrowBtn =
  'inline-flex w-6 shrink-0 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-100'

const navDateLabel =
  'flex min-w-[11.5rem] items-center justify-center gap-1 border-x border-slate-200 px-2 text-[11px] font-medium leading-none tabular-nums text-slate-700 dark:border-slate-600 dark:text-slate-200'

interface ChartDateNavProps {
  periodLabel: string
  onPrev: () => void
  onNext: () => void
  nextDisabled?: boolean
  prevAriaLabel?: string
  nextAriaLabel?: string
}

export function ChartDateNav({
  periodLabel,
  onPrev,
  onNext,
  nextDisabled = false,
  prevAriaLabel = '上一周期',
  nextAriaLabel = '下一周期',
}: ChartDateNavProps) {
  return (
    <div className={periodNavShell} aria-label="日期导航">
      <button
        type="button"
        onClick={onPrev}
        className={navArrowBtn}
        aria-label={prevAriaLabel}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className={navDateLabel}>{periodLabel}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className={navArrowBtn}
        aria-label={nextAriaLabel}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
