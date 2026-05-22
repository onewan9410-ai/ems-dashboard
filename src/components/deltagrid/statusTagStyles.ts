export type StatusTagKind = '告警' | '需关注' | '正常'

export const STATUS_TAG_BASE =
  'relative inline-flex items-center gap-1 rounded-full px-2.5 py-1 kpi-meta font-medium'

export const STATUS_TAG_PILL: Record<StatusTagKind, string> = {
  告警: 'bg-danger/5 text-danger',
  需关注: 'bg-warning/5 text-warning',
  正常: 'bg-success/5 text-success',
}

export const AI_PREDICTION_TAG_PILL =
  'rounded-full bg-info/5 px-1.5 py-0.5 kpi-meta font-medium text-info'

/** 设备状态 / 一致性分析中的 AI 预测正文块 */
export const AI_PREDICTION_PANEL =
  'rounded-md border-l-4 border-info bg-slate-50/90 px-3 py-2.5 dark:bg-slate-800/60'

export const AI_PREDICTION_TEXT =
  'text-xs leading-relaxed text-slate-600 dark:text-slate-300'

export function aiPredictionTagClass(options?: { selected?: boolean }) {
  return [
    STATUS_TAG_BASE,
    options?.selected
      ? 'status-tag-halo status-tag-halo-info bg-info/10 text-info font-semibold'
      : 'bg-info/5 text-info',
  ].join(' ')
}

export const STATUS_TAG_PILL_SELECTED: Record<StatusTagKind, string> = {
  告警:
    'status-tag-halo status-tag-halo-danger bg-danger/10 text-danger font-semibold',
  需关注:
    'status-tag-halo status-tag-halo-warning bg-warning/10 text-warning font-semibold',
  正常:
    'status-tag-halo status-tag-halo-success bg-success/10 text-success font-semibold',
}

export function statusTagClass(
  kind: StatusTagKind,
  options?: { selected?: boolean },
) {
  return [
    STATUS_TAG_BASE,
    options?.selected ? STATUS_TAG_PILL_SELECTED[kind] : STATUS_TAG_PILL[kind],
  ].join(' ')
}
