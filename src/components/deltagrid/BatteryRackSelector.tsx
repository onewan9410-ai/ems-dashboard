import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { BatteryRackSnapshot } from './types'
import {
  getRackAiPrediction,
  resolveRackOverallStatus,
} from './batteryRackData'
import { statusTagClass } from './statusTagStyles'

function rackSelectorBorderClass(rack: BatteryRackSnapshot) {
  const status = resolveRackOverallStatus(rack)
  if (status === '告警') {
    return 'border-danger/50 ring-1 ring-white/15 dark:ring-white/10'
  }
  if (status === '需关注') {
    return 'border-warning/50 ring-1 ring-white/15 dark:ring-white/10'
  }
  if (getRackAiPrediction(rack) != null) {
    return 'border-info/40 ring-1 ring-white/15 dark:ring-white/10'
  }
  return 'border-slate-300 ring-1 ring-white/20 dark:border-slate-500 dark:ring-white/10'
}

interface BatteryRackSelectorProps {
  racks: BatteryRackSnapshot[]
  selectedId: string
  onSelect: (rackId: string) => void
}

export function BatteryRackSelector({
  racks,
  selectedId,
  onSelect,
}: BatteryRackSelectorProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected =
    racks.find((rack) => rack.id === selectedId) ?? racks[0] ?? null

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const root = rootRef.current
      if (!root || root.contains(event.target as Node)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  if (!selected) {
    return (
      <p className="text-xs text-muted">当前筛选下暂无可用电池簇</p>
    )
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`选择电池簇，当前 ${selected.shortName}`}
        className={`inline-flex min-w-[7.5rem] max-w-full items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 transition-colors hover:border-info/40 hover:bg-slate-50 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:border-info/50 dark:hover:bg-slate-700/60 ${rackSelectorBorderClass(selected)}`}
      >
        <span className="truncate">{selected.shortName}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="电池簇列表"
          className="absolute left-0 top-full z-30 mt-1 max-h-56 min-w-[13rem] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
        >
          {racks.map((rack) => {
            const isSelected = rack.id === selected.id
            const status = resolveRackOverallStatus(rack)
            return (
              <li key={rack.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(rack.id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/60 ${
                    isSelected
                      ? 'bg-info/5 dark:bg-info/15'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span
                    className={`shrink-0 ${statusTagClass(status, { selected: false })} px-1.5 py-0.5 text-[10px]`}
                  >
                    {status}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium">
                      {rack.shortName}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-muted">
                      {rack.fullName}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
