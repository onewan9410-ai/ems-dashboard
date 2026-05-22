import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import {
  cardSection,
  cardTitle,
  listItemRow,
  metricLabel,
  panelBody,
  panelModuleScroll,
} from '../../theme/dashboardClasses'
import {
  BATTERY_RACKS,
  compareBatteryRackPriority,
  getRackInsightExpandLabel,
  getRackMetricChips,
  rackHasAiPrediction,
  rackHasExpandableInsight,
  resolveRackOverallStatus,
} from './batteryRackData'
import type { StatusTagKind } from './statusTagStyles'
import { RackStatusInsight } from './RackStatusInsight'
import type { BatteryRackSnapshot } from './types'
import { AiPredictionBadge } from './StatusBadges'
import {
  aiPredictionTagClass,
  STATUS_TAG_BASE,
  statusTagClass,
} from './statusTagStyles'

const STATUS_TONE: Record<StatusTagKind, string> = {
  正常: 'text-success',
  需关注: 'text-warning',
  告警: 'text-danger',
}

const METRIC_CHIP =
  'rounded border border-slate-200/80 bg-slate-50/60 px-1.5 py-0.5 text-[10px] text-muted dark:border-slate-600/60 dark:bg-slate-800/40'

const METRIC_DIVIDER = (
  <span className="mx-2 text-slate-300 dark:text-slate-600" aria-hidden>
    ｜
  </span>
)

const RACK_SEARCH_INPUT =
  'w-full rounded-md border border-slate-200 bg-slate-50/80 py-1 pl-6 pr-2 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-info/50 focus:outline-none focus:ring-1 focus:ring-info/30 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200 dark:placeholder:text-slate-500'

const RACK_EXPAND_BTN =
  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-info/5 hover:text-info dark:text-slate-400 dark:hover:bg-info/10 dark:hover:text-info'

type RackFilterTab = 'all' | 'alarms' | 'needsAttention' | 'ai'

const RACK_FILTER_TABS: {
  key: RackFilterTab
  label: string
  matches: (rack: BatteryRackSnapshot) => boolean
}[] = [
  { key: 'all', label: '全部', matches: () => true },
  {
    key: 'alarms',
    label: '告警',
    matches: (rack) => resolveRackOverallStatus(rack) === '告警',
  },
  {
    key: 'needsAttention',
    label: '需关注',
    matches: (rack) => resolveRackOverallStatus(rack) === '需关注',
  },
  {
    key: 'ai',
    label: 'AI预警',
    matches: (rack) => rackHasAiPrediction(rack),
  },
]

function filterTabClass(tab: RackFilterTab, selected: boolean) {
  switch (tab) {
    case 'alarms':
      return statusTagClass('告警', { selected })
    case 'needsAttention':
      return statusTagClass('需关注', { selected })
    case 'ai':
      return aiPredictionTagClass({ selected })
    case 'all':
      return [
        STATUS_TAG_BASE,
        selected
          ? 'bg-slate-100 font-semibold text-slate-800 dark:bg-slate-700 dark:text-slate-100'
          : 'bg-white text-slate-600 dark:bg-slate-800/50 dark:text-slate-300',
      ].join(' ')
  }
}

function countRacksForTab(tab: (typeof RACK_FILTER_TABS)[number]) {
  return BATTERY_RACKS.filter((rack) => tab.matches(rack)).length
}

function matchesRackSearch(rack: BatteryRackSnapshot, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return (
    rack.shortName.toLowerCase().includes(normalized) ||
    rack.fullName.toLowerCase().includes(normalized)
  )
}

function RackMetricChips({ rack }: { rack: BatteryRackSnapshot }) {
  const status = resolveRackOverallStatus(rack)
  const tone = STATUS_TONE[status]

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
      {getRackMetricChips(rack).map((chip) => (
        <span key={chip.label} className={METRIC_CHIP}>
          {chip.label}：
          <span className={`font-medium tabular-nums ${tone}`}>
            {chip.value}
          </span>
        </span>
      ))}
    </div>
  )
}

function RackStatusBadge({ rack }: { rack: BatteryRackSnapshot }) {
  if (rackHasAiPrediction(rack)) {
    return <AiPredictionBadge />
  }
  const status = resolveRackOverallStatus(rack)
  return (
    <span className={statusTagClass(status)} aria-label={status}>
      {status}
    </span>
  )
}

function RackSearchField({
  racks,
  value,
  onChange,
}: {
  racks: BatteryRackSnapshot[]
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => {
    const pool = [...racks].sort(compareBatteryRackPriority)
    if (!value.trim()) return pool
    return pool.filter((rack) => matchesRackSearch(rack, value))
  }, [racks, value])

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

  return (
    <div ref={rootRef} className="relative w-[6.75rem] shrink-0 sm:w-[7.25rem]">
      <Search
        className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        role="combobox"
        aria-expanded={open}
        aria-controls="rack-search-listbox"
        aria-autocomplete="list"
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
        placeholder="搜索"
        aria-label="搜索电池名"
        className={RACK_SEARCH_INPUT}
      />

      {open && (
        <ul
          id="rack-search-listbox"
          role="listbox"
          aria-label="电池簇列表"
          className="absolute right-0 top-full z-30 mt-1 max-h-48 min-w-[10.5rem] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
        >
          {suggestions.length === 0 ? (
            <li className="px-3 py-2 text-[11px] text-muted">无匹配电池</li>
          ) : (
            suggestions.map((rack) => {
              const status = resolveRackOverallStatus(rack)
              const selected =
                value.trim().toLowerCase() === rack.shortName.toLowerCase()
              return (
                <li
                  key={rack.id}
                  role="option"
                  aria-selected={selected}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChange(rack.shortName)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/60 ${
                      selected
                        ? 'bg-info/5 dark:bg-info/15'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span
                      className={`shrink-0 ${statusTagClass(status)} px-1.5 py-0.5 text-[10px]`}
                    >
                      {status}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                      {rack.shortName}
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}

function BatteryRackRow({ rack }: { rack: BatteryRackSnapshot }) {
  const [detailExpanded, setDetailExpanded] = useState(false)
  const hasInsight = rackHasExpandableInsight(rack)
  const expandLabel = hasInsight
    ? getRackInsightExpandLabel(rack)
    : '电池详情'

  useEffect(() => {
    setDetailExpanded(false)
  }, [rack.id])

  return (
    <div className={listItemRow}>
      <div className="flex items-center gap-2">
        <span className="w-20 shrink-0 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
          {rack.shortName}
        </span>
        <RackStatusBadge rack={rack} />
        <RackMetricChips rack={rack} />
        <button
          type="button"
          onClick={() => setDetailExpanded((open) => !open)}
          aria-label={
            detailExpanded ? `收起${expandLabel}` : `展开${expandLabel}`
          }
          aria-expanded={detailExpanded}
          className={RACK_EXPAND_BTN}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${
              detailExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {detailExpanded && (
        <div className="mt-2 space-y-2 border-t border-slate-200 pt-2 dark:border-slate-700">
          <p className={panelBody}>
            <span className={metricLabel}>电芯电压一致性：</span>
            <span className={`font-semibold ${STATUS_TONE[rack.voltageStatus]}`}>
              {rack.voltageStatus}
            </span>
            {METRIC_DIVIDER}
            <span className={metricLabel}>电芯温度一致性：</span>
            <span className={`font-semibold ${STATUS_TONE[rack.tempStatus]}`}>
              {rack.tempStatus}
            </span>
          </p>
          {hasInsight ? <RackStatusInsight rack={rack} /> : null}
        </div>
      )}
    </div>
  )
}

export function BatteryConsistencyPanel() {
  const [activeTab, setActiveTab] = useState<RackFilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const visibleTabs = useMemo(
    () =>
      RACK_FILTER_TABS.filter(
        (tab) => tab.key === 'all' || countRacksForTab(tab) > 0,
      ),
    [],
  )

  const tabFilteredRacks = useMemo(() => {
    const tab = RACK_FILTER_TABS.find((item) => item.key === activeTab)
    return [...BATTERY_RACKS.filter((rack) => tab?.matches(rack) ?? true)].sort(
      compareBatteryRackPriority,
    )
  }, [activeTab])

  const filteredRacks = useMemo(
    () => tabFilteredRacks.filter((rack) => matchesRackSearch(rack, searchQuery)),
    [tabFilteredRacks, searchQuery],
  )

  const emptyMessage =
    searchQuery.trim().length > 0
      ? '未找到匹配的电池簇'
      : '暂无匹配电池簇'

  return (
    <section className={`${panelModuleScroll} ${cardSection}`}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h2 className={`min-w-0 shrink truncate ${cardTitle}`}>
          电池一致性分析
        </h2>
        <RackSearchField
          racks={tabFilteredRacks}
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2">
        {visibleTabs.map((tab) => {
          const count = countRacksForTab(tab)
          const selected = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`${filterTabClass(tab.key, selected)} transition-colors hover:opacity-90`}
            >
              {tab.key !== 'all' && (
                <span className="font-semibold tabular-nums">{count}</span>
              )}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        {filteredRacks.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-muted dark:border-slate-600">
            {emptyMessage}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {filteredRacks.map((rack) => (
              <li key={rack.id}>
                <BatteryRackRow rack={rack} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
