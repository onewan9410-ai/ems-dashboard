import { ChartDateNav } from './ChartDateNav'

const segmentedShell =
  'inline-flex h-6 overflow-hidden rounded border border-slate-200 bg-slate-50/80 dark:border-slate-600 dark:bg-slate-900/40'

function segmentButtonClass(active: boolean, withDivider: boolean) {
  return [
    'px-2.5 text-[11px] font-medium leading-none transition-colors',
    withDivider
      ? 'border-l border-slate-200 dark:border-slate-600'
      : '',
    active
      ? 'bg-white text-slate-800 dark:bg-slate-600 dark:text-slate-100'
      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
  ].join(' ')
}

interface GranularityOption<T extends string> {
  value: T
  label: string
}

interface ChartPeriodToolbarProps<T extends string> {
  granularity: T
  granularityOptions: GranularityOption<T>[]
  onGranularityChange: (value: T) => void
  periodLabel: string
  onPrev: () => void
  onNext: () => void
  nextDisabled?: boolean
}

export function ChartPeriodToolbar<T extends string>({
  granularity,
  granularityOptions,
  onGranularityChange,
  periodLabel,
  onPrev,
  onNext,
  nextDisabled = false,
}: ChartPeriodToolbarProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className={segmentedShell} role="group" aria-label="时间粒度">
        {granularityOptions.map((option, index) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onGranularityChange(option.value)}
            className={segmentButtonClass(
              granularity === option.value,
              index > 0,
            )}
            aria-pressed={granularity === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      <ChartDateNav
        periodLabel={periodLabel}
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={nextDisabled}
      />
    </div>
  )
}
