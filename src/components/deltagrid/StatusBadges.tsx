import {
  aiPredictionTagClass,
  statusTagClass,
  type StatusTagKind,
} from './statusTagStyles'

/** 设备状态行内：数量 + 告警/需关注/正常 */
export function StatusCountBadge({
  kind,
  count,
}: {
  kind: StatusTagKind
  count: number
}) {
  return (
    <span className={statusTagClass(kind)}>
      <span className="font-semibold tabular-nums">{count}</span> {kind}
    </span>
  )
}

/** 列表行内 AI 预警标志 */
export function AiPredictionBadge() {
  return (
    <span className={aiPredictionTagClass()} aria-label="AI预警">
      AI预警
    </span>
  )
}
