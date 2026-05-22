import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react'
import type { DeviceAiPrediction, DeviceStatusGroup } from './types'
import { DEVICE_GROUPS } from './constants'

/** 设备状态卡片仅展示前两个设备 */
const DEVICE_STATUS_GROUPS = DEVICE_GROUPS.slice(0, 2)

import {
  cardSection,
  cardTitle,
  listItemRow,
  bodyMuted,
  panelModuleFill,
} from '../../theme/dashboardClasses'
import { AiPredictionBadge, StatusCountBadge } from './StatusBadges'
import {
  AI_PREDICTION_PANEL,
  AI_PREDICTION_TEXT,
  aiPredictionTagClass,
  STATUS_TAG_BASE,
  statusTagClass,
} from './statusTagStyles'

type StatusFilterTab = 'all' | 'alarms' | 'needsAttention' | 'normal' | 'ai'

const STATUS_FILTER_TABS: {
  key: StatusFilterTab
  label: string
  matches: (group: DeviceStatusGroup) => boolean
}[] = [
  {
    key: 'all',
    label: '全部',
    matches: () => true,
  },
  {
    key: 'alarms',
    label: '告警',
    matches: (group) =>
      (group.alarms ?? 0) > 0 || (group.alarmDetails?.length ?? 0) > 0,
  },
  {
    key: 'needsAttention',
    label: '需关注',
    matches: (group) =>
      (group.needsAttention ?? 0) > 0 ||
      (group.attentionDetails?.length ?? 0) > 0,
  },
  {
    key: 'normal',
    label: '正常',
    matches: (group) =>
      group.normal > 0 &&
      (group.alarms ?? 0) === 0 &&
      (group.needsAttention ?? 0) === 0 &&
      (group.alarmDetails?.length ?? 0) === 0 &&
      (group.attentionDetails?.length ?? 0) === 0,
  },
  {
    key: 'ai',
    label: 'AI预警',
    matches: (group) => (group.aiPredictions?.length ?? 0) > 0,
  },
]

function filterTabClass(tab: StatusFilterTab, selected: boolean) {
  switch (tab) {
    case 'alarms':
      return statusTagClass('告警', { selected })
    case 'needsAttention':
      return statusTagClass('需关注', { selected })
    case 'normal':
      return statusTagClass('正常', { selected })
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

/** 排序：1 告警 → 2 需关注 → 3 正常 */
const STATUS_BADGE_ORDER = [
  {
    key: 'alarms',
    label: '告警' as const,
    sort: 1,
    getCount: (g: DeviceStatusGroup) => g.alarms ?? 0,
    alwaysShow: false,
  },
  {
    key: 'needsAttention',
    label: '需关注' as const,
    sort: 2,
    getCount: (g: DeviceStatusGroup) => g.needsAttention ?? 0,
    alwaysShow: false,
  },
  {
    key: 'normal',
    label: '正常' as const,
    sort: 3,
    getCount: (g: DeviceStatusGroup) => g.normal,
    alwaysShow: true,
  },
] as const

type DeviceIssueRow = {
  kind: 'alarm' | 'attention'
  title: string
  description: string
  time: string
}

function buildDeviceIssueRows(group: DeviceStatusGroup): DeviceIssueRow[] {
  const alarms = (group.alarmDetails ?? []).map((issue) => ({
    kind: 'alarm' as const,
    title: issue.title,
    description: issue.description,
    time: issue.time,
  }))
  const attentions = (group.attentionDetails ?? []).map((issue) => ({
    kind: 'attention' as const,
    title: issue.title,
    description: issue.description,
    time: issue.time,
  }))

  return [...alarms, ...attentions]
}

const ISSUE_DETAIL_TEXT =
  'text-slate-800 dark:text-slate-100'

function DeviceIssueTitleLine({ item }: { item: DeviceIssueRow }) {
  return (
    <span className="min-w-0">
      <span className={`font-medium ${ISSUE_DETAIL_TEXT}`}>{item.title}</span>
      <span className="ml-1.5 tabular-nums text-muted">{item.time}</span>
    </span>
  )
}

function DeviceIssueItem({ item }: { item: DeviceIssueRow }) {
  return (
    <div className="text-xs">
      <DeviceIssueTitleLine item={item} />
      <p className={`mt-1 leading-relaxed ${ISSUE_DETAIL_TEXT}`}>
        {item.description}
      </p>
    </div>
  )
}

function DeviceAiPredictionItem({
  prediction,
}: {
  prediction: DeviceAiPrediction
}) {
  return (
    <div className={AI_PREDICTION_PANEL}>
      <p className={AI_PREDICTION_TEXT}>
        <span className="font-medium text-info">AI预警：</span>
        {prediction.description}
      </p>
    </div>
  )
}

function DeviceDetailsExpandButton({
  expanded,
  extraCount,
  onClick,
}: {
  expanded: boolean
  extraCount: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-0.5 rounded text-xs font-medium outline-none transition-colors hover:text-slate-800 focus:outline-none focus-visible:outline-none dark:hover:text-slate-100 ${bodyMuted}`}
    >
      {expanded ? (
        <>
          收起
          <ChevronUp className="h-3 w-3" />
        </>
      ) : (
        <>
          展开 ({extraCount})
          <ChevronDown className="h-3 w-3" />
        </>
      )}
    </button>
  )
}

function DeviceStatusRow({ group }: { group: DeviceStatusGroup }) {
  const issues = buildDeviceIssueRows(group)
  const aiPredictions = group.aiPredictions ?? []
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  const hasIssueSection = issues.length > 0
  const hasAiSection = aiPredictions.length > 0
  const firstIssue = issues[0]
  const showAiSection = detailsExpanded && hasAiSection
  const firstIssueHasDescription = (firstIssue?.description?.length ?? 0) > 0
  const expandableExtraCount =
    Math.max(0, issues.length - 1) +
    aiPredictions.length +
    (!detailsExpanded && firstIssueHasDescription ? 1 : 0)
  const canExpandDetails = expandableExtraCount > 0

  return (
    <li className={listItemRow}>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="inline-flex min-w-0 items-center gap-1 text-sm font-medium text-slate-800 transition-colors hover:text-info dark:text-slate-100"
        >
          <span className="truncate">{group.name}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {STATUS_BADGE_ORDER.map((badge) => {
            const count = badge.getCount(group)
            if (!badge.alwaysShow && count <= 0) return null
            return (
              <StatusCountBadge
                key={badge.key}
                kind={badge.label}
                count={count}
              />
            )
          })}
          {hasAiSection && <AiPredictionBadge />}
        </div>
      </div>

      {(hasIssueSection || hasAiSection) && (
        <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
          <div className="space-y-2">
            {hasIssueSection && firstIssue && (
              <>
                <div className="flex items-start justify-between gap-2 text-xs">
                  <DeviceIssueTitleLine item={firstIssue} />
                  {canExpandDetails && (
                    <DeviceDetailsExpandButton
                      expanded={detailsExpanded}
                      extraCount={expandableExtraCount}
                      onClick={() => setDetailsExpanded((open) => !open)}
                    />
                  )}
                </div>

                {detailsExpanded && firstIssueHasDescription && (
                  <p className={`text-xs leading-relaxed ${ISSUE_DETAIL_TEXT}`}>
                    {firstIssue.description}
                  </p>
                )}

                {detailsExpanded &&
                  issues.slice(1).map((item, idx) => (
                    <DeviceIssueItem
                      key={`${item.kind}-${item.title}-${item.time}-${idx}`}
                      item={item}
                    />
                  ))}
              </>
            )}

            {showAiSection &&
              aiPredictions.map((prediction, idx) => (
                <DeviceAiPredictionItem
                  key={`${prediction.title}-${prediction.time}-${idx}`}
                  prediction={prediction}
                />
              ))}
          </div>
        </div>
      )}
    </li>
  )
}

function countDevicesForTab(tab: (typeof STATUS_FILTER_TABS)[number]) {
  return DEVICE_STATUS_GROUPS.filter((group) => tab.matches(group)).length
}

export function DeviceStatusCard() {
  const [activeTab, setActiveTab] = useState<StatusFilterTab>('all')

  const visibleTabs = useMemo(
    () =>
      STATUS_FILTER_TABS.filter(
        (tab) => tab.key === 'all' || countDevicesForTab(tab) > 0,
      ),
    [],
  )

  const filteredGroups = useMemo(
    () =>
      DEVICE_STATUS_GROUPS.filter((group) => {
        const tab = STATUS_FILTER_TABS.find((item) => item.key === activeTab)
        return tab?.matches(group) ?? true
      }),
    [activeTab],
  )

  return (
    <section className={`${panelModuleFill} ${cardSection}`}>
      <h2 className={`mb-3 shrink-0 ${cardTitle}`}>
        设备状态
      </h2>

      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2">
        {visibleTabs.map((tab) => {
          const count = countDevicesForTab(tab)
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

      {filteredGroups.length > 0 ? (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
          {filteredGroups.map((group) => (
            <DeviceStatusRow key={group.name} group={group} />
          ))}
        </ul>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-muted dark:border-slate-600">
          暂无匹配设备
        </div>
      )}
    </section>
  )
}
