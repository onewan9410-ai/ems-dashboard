import { useCallback, useState, type CSSProperties, type ReactNode } from 'react'
import { cardSection } from '../../theme/dashboardClasses'
import { SOC_VALUE } from './constants'
import { STORAGE_CHARGE_COLOR } from './storageEnergyColors'

const SOLAR_KW = 0.0
const GRID_KW = 2.1
const ESS_KW = -1.3
const LOAD_KW = 0.8

type TopologyNodeId = 'solar' | 'load' | 'ess' | 'grid'

const NODE_DETAILS: Record<
  TopologyNodeId,
  { title: string; lines: string[] }
> = {
  solar: {
    title: '光伏',
    lines: [
      `当前发电 ${SOLAR_KW.toFixed(2)} kW`,
      '装机容量 120 kWp',
      '运行状态：待机（夜间/无辐照）',
    ],
  },
  load: {
    title: '负荷 · 换电站',
    lines: [
      `当前用电 ${LOAD_KW.toFixed(2)} kW`,
      '今日累计 5.2 kWh',
      '负载率 12%',
    ],
  },
  ess: {
    title: '储能 ESS',
    lines: [
      `充放电功率 ${ESS_KW.toFixed(2)} kW（充电）`,
      `SOC ${SOC_VALUE.toFixed(2)}%`,
      '策略：电网强制充电（低 SOC 保护）',
    ],
  },
  grid: {
    title: '电网',
    lines: [
      `当前 ${GRID_KW.toFixed(2)} kW（购电）`,
      '并网点：10 kV 接入',
      '功率因数 0.98',
    ],
  },
}

const ICON_SCALE = 1.38

/** 光伏与换电站图例之间的垂直间距 */
const SOLAR_LOAD_GAP = 34
/** 光伏整体上移补偿（px） */
const SOLAR_EXTRA_LIFT = 10
const TOPOLOGY_VIEW_W = 520
const TOPOLOGY_VIEW_H = 280
/** 嵌入储能信息卡片：收窄画布，避免挤压右侧 KPI */
const TOPOLOGY_EMBEDDED_VIEW_W = 392
const TOPOLOGY_EMBEDDED_VIEW_H = 260
/** 储能 / 电网图标纵向基线 */
const ESS_GRID_BASE_Y = 126
/** 储能 / 电网相对基线额外下移（pt） */
const ESS_GRID_DROP_PT = 20
const ESS_GRID_Y = ESS_GRID_BASE_Y + (ESS_GRID_DROP_PT * 96) / 72
const ptToPx = (pt: number) => (pt * 96) / 72

/** 电网图例相对默认位置的微调（向右、向下） */
const GRID_NUDGE = {
  embedded: { x: 12 + ptToPx(10), y: 10 + ptToPx(28) },
  standalone: { x: 16 + ptToPx(10), y: 12 + ptToPx(28) },
} as const

/** 电网塔图（72×58 局部坐标，与换电站/光伏一致）接线锚点 */
const GRID_ICON_LOCAL = { w: 72, h: 58 }
const GRID_LOCAL_ANCHOR = {
  bus: { x: 36, y: 12 },
  foot: { x: 36, y: 56 },
}
/** 图例与数值间距 4pt（≈5.33px，与 PercentRingMetric 等单位一致） */
const CAPTION_GAP = (4 * 96) / 72
/** 设备名距图标底边 2pt */
const DEVICE_LABEL_GAP = (2 * 96) / 72
/** 设备名字号 */
const DEVICE_LABEL_FONT_SIZE = 12
/** 拓扑图例数值字号 */
const CAPTION_FONT_SIZE = 15

const NODE_LABELS: Record<TopologyNodeId, string> = {
  solar: '光伏',
  load: '换电站',
  ess: '储能',
  grid: '电网',
}

const ICON_BOUNDS = {
  solar: { w: 80 * ICON_SCALE, h: 58 * ICON_SCALE },
  load: { w: 72 * ICON_SCALE, h: 58 * ICON_SCALE },
  ess: { w: 56 * ICON_SCALE, h: 52 * ICON_SCALE },
  grid: { w: GRID_ICON_LOCAL.w * ICON_SCALE, h: GRID_ICON_LOCAL.h * ICON_SCALE },
} as const

function getGridAnchors(grid: { x: number; y: number }) {
  return {
    bus: {
      x: grid.x + GRID_LOCAL_ANCHOR.bus.x * ICON_SCALE,
      y: grid.y + GRID_LOCAL_ANCHOR.bus.y * ICON_SCALE,
    },
    foot: {
      x: grid.x + GRID_LOCAL_ANCHOR.foot.x * ICON_SCALE,
      y: grid.y + GRID_LOCAL_ANCHOR.foot.y * ICON_SCALE,
    },
  }
}

/** 图例数值标注，字号与「当前功率」标签一致 */
function NodeCaption({
  x,
  y,
  children,
  textAnchor = 'middle',
  dominantBaseline = 'hanging',
  fontSize = CAPTION_FONT_SIZE,
  fontWeight = 400,
}: {
  x: number
  y: number
  children: ReactNode
  textAnchor?: 'start' | 'middle' | 'end'
  dominantBaseline?: 'auto' | 'middle' | 'hanging'
  fontSize?: number
  fontWeight?: number
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      dominantBaseline={dominantBaseline}
      className="fill-slate-600 dark:fill-slate-300"
      style={{ fontSize, fontWeight }}
    >
      {children}
    </text>
  )
}

function valueYBelowName(iconH: number) {
  return iconH + DEVICE_LABEL_GAP + DEVICE_LABEL_FONT_SIZE + CAPTION_GAP
}

function nodeTextBlockHeight(iconH: number, extraBelowValue = 0) {
  return valueYBelowName(iconH) + CAPTION_FONT_SIZE + extraBelowValue
}

/** 图标正下方设备名 */
function DeviceNameLabel({
  iconW,
  iconH,
  name,
}: {
  iconW: number
  iconH: number
  name: string
}) {
  return (
    <NodeCaption
      x={iconW / 2}
      y={iconH + DEVICE_LABEL_GAP}
      fontSize={DEVICE_LABEL_FONT_SIZE}
      fontWeight={500}
    >
      {name}
    </NodeCaption>
  )
}

/** 设备名下方居中数值 */
function DeviceValueLabel({
  iconW,
  iconH,
  value,
}: {
  iconW: number
  iconH: number
  value: string
}) {
  return (
    <NodeCaption
      x={iconW / 2}
      y={valueYBelowName(iconH)}
      fontWeight={600}
    >
      {value}
    </NodeCaption>
  )
}

const SYM_STROKE = 'stroke-slate-500 dark:stroke-slate-400'
const SYM_FILL = 'fill-slate-100 dark:fill-slate-800'
const SYM_FILL_PANEL = 'fill-slate-200/90 dark:fill-slate-700/90'

/** 光伏：等距组件阵列（工程示意） */
function SolarIsoIcon() {
  const panel = (x: number) => (
    <g key={x}>
      <path
        d={`M${x} 34 L${x + 16} 26 L${x + 32} 26 L${x + 16} 34 Z`}
        className={`${SYM_FILL_PANEL} ${SYM_STROKE}`}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d={`M${x} 34 L${x + 16} 42 L${x + 32} 34 L${x + 16} 34 Z`}
        className={`${SYM_FILL} ${SYM_STROKE}`}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {[8, 16, 24].map((dx) => (
        <line
          key={dx}
          x1={x + dx}
          y1="28"
          x2={x + dx}
          y2="40"
          className={SYM_STROKE}
          strokeWidth="0.5"
          opacity="0.7"
        />
      ))}
    </g>
  )
  return (
    <g transform={`scale(${ICON_SCALE})`}>
      <line x1="4" y1="46" x2="76" y2="46" className={SYM_STROKE} strokeWidth="1" />
      {[4, 28, 52].map(panel)}
      <rect
        x="32"
        y="44"
        width="16"
        height="8"
        className={`${SYM_FILL} ${SYM_STROKE}`}
        strokeWidth="1"
      />
      <line x1="36" y1="44" x2="36" y2="38" className={SYM_STROKE} strokeWidth="0.8" />
      <line x1="44" y1="44" x2="44" y2="38" className={SYM_STROKE} strokeWidth="0.8" />
    </g>
  )
}

/** 换电站：电池仓 + 桁架（工程示意） */
function LoadIsoIcon() {
  return (
    <g transform={`scale(${ICON_SCALE})`}>
      <path
        d="M6 48 L36 56 L66 48 L36 40 Z"
        className={`${SYM_FILL} ${SYM_STROKE}`}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M14 40 L36 32 L58 40"
        fill="none"
        className={SYM_STROKE}
        strokeWidth="1"
      />
      <path
        d="M14 40 V48 M58 40 V48"
        className={SYM_STROKE}
        strokeWidth="1"
      />
      <rect
        x="18"
        y="42"
        width="14"
        height="10"
        className={`${SYM_FILL_PANEL} ${SYM_STROKE}`}
        strokeWidth="1"
      />
      <rect
        x="40"
        y="42"
        width="14"
        height="10"
        className={`${SYM_FILL_PANEL} ${SYM_STROKE}`}
        strokeWidth="1"
      />
      <line x1="25" y1="42" x2="25" y2="52" className={SYM_STROKE} strokeWidth="0.6" />
      <line x1="47" y1="42" x2="47" y2="52" className={SYM_STROKE} strokeWidth="0.6" />
      <line x1="20" y1="32" x2="52" y2="32" className={SYM_STROKE} strokeWidth="1" />
      <line x1="36" y1="24" x2="36" y2="32" className={SYM_STROKE} strokeWidth="1" />
    </g>
  )
}

/** 储能：电池集装箱机柜（工程示意） */
function EssIsoIcon() {
  return (
    <g transform={`scale(${ICON_SCALE})`}>
      <rect
        x="8"
        y="12"
        width="40"
        height="38"
        className={`${SYM_FILL} ${SYM_STROKE}`}
        strokeWidth="1.2"
      />
      <line x1="8" y1="20" x2="48" y2="20" className={SYM_STROKE} strokeWidth="0.8" />
      <rect
        x="12"
        y="24"
        width="14"
        height="22"
        className={`${SYM_FILL_PANEL} ${SYM_STROKE}`}
        strokeWidth="0.9"
      />
      <rect
        x="30"
        y="24"
        width="14"
        height="22"
        className={`${SYM_FILL_PANEL} ${SYM_STROKE}`}
        strokeWidth="0.9"
      />
      {[30, 36, 42].map((y) => (
        <line
          key={y}
          x1="14"
          y1={y}
          x2="24"
          y2={y}
          className={SYM_STROKE}
          strokeWidth="0.5"
          opacity="0.65"
        />
      ))}
      {[30, 36, 42].map((y) => (
        <line
          key={`r-${y}`}
          x1="32"
          y1={y}
          x2="42"
          y2={y}
          className={SYM_STROKE}
          strokeWidth="0.5"
          opacity="0.65"
        />
      ))}
      <line x1="14" y1="46" x2="42" y2="46" className={SYM_STROKE} strokeWidth="0.8" />
      <circle cx="16" cy="46" r="1.2" className="fill-slate-400 dark:fill-slate-500" />
      <circle cx="40" cy="46" r="1.2" className="fill-slate-400 dark:fill-slate-500" />
    </g>
  )
}

/** 储能图例下方：功率居中；进度条 + SOC 数值横排并整体居中 */
function EssCaptions({ soc }: { soc: number }) {
  const essW = Math.abs(ESS_KW) < 0.01 ? 0 : Math.abs(ESS_KW) * 1000
  const essLabel = essW < 10 ? `${essW.toFixed(0)} W` : `${Math.abs(ESS_KW).toFixed(2)} kW`
  const barW = 40
  const barH = 4
  const socRowY = CAPTION_FONT_SIZE + CAPTION_GAP
  const socText = `${soc.toFixed(0)}%`
  const socTextW = 28
  const socGroupW = barW + CAPTION_GAP + socTextW
  const socGroupLeft = -socGroupW / 2
  const barCenterY = socRowY + barH / 2

  return (
    <g>
      <NodeCaption x={0} y={0}>
        {essLabel}
      </NodeCaption>
      <rect
        x={socGroupLeft}
        y={socRowY}
        width={barW}
        height={barH}
        rx="2"
        className="fill-slate-200 dark:fill-slate-700"
      />
      <rect
        x={socGroupLeft}
        y={socRowY}
        width={(barW * soc) / 100}
        height={barH}
        rx="2"
        fill={STORAGE_CHARGE_COLOR}
      />
      <NodeCaption
        x={socGroupLeft + barW + CAPTION_GAP}
        y={barCenterY}
        textAnchor="start"
        dominantBaseline="middle"
      >
        {socText}
      </NodeCaption>
    </g>
  )
}

/** 电网：输电铁塔 + 底座（与光伏/换电站/储能工程示意风格一致） */
function GridIsoIcon() {
  return (
    <g transform={`scale(${ICON_SCALE})`}>
      <path
        d="M6 48 L36 56 L66 48 L36 40 Z"
        className={`${SYM_FILL} ${SYM_STROKE}`}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M36 12 L30 24 H22 L26 36 H20 L24 46 H48 L52 36 H46 L50 24 H42 Z"
        className={`${SYM_FILL} ${SYM_STROKE}`}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <line x1="36" y1="12" x2="36" y2="46" className={SYM_STROKE} strokeWidth="0.6" />
      <line x1="28" y1="24" x2="44" y2="24" className={SYM_STROKE} strokeWidth="0.5" />
      <line x1="26" y1="36" x2="46" y2="36" className={SYM_STROKE} strokeWidth="0.5" />
      <line x1="8" y1="14" x2="64" y2="14" className={SYM_STROKE} strokeWidth="0.9" />
      <line x1="12" y1="17" x2="60" y2="17" className={SYM_STROKE} strokeWidth="0.9" />
      <line x1="16" y1="20" x2="56" y2="20" className={SYM_STROKE} strokeWidth="0.9" />
      <line x1="22" y1="24" x2="24" y2="28" className={SYM_STROKE} strokeWidth="0.6" />
      <line x1="50" y1="24" x2="48" y2="28" className={SYM_STROKE} strokeWidth="0.6" />
    </g>
  )
}

const topologyTooltipPanelClass =
  'min-w-[168px] rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2.5 shadow-lg shadow-slate-200/60 backdrop-blur-sm dark:border-slate-600 dark:bg-slate-800/95 dark:shadow-black/30'

const topologyTooltipCaretClass =
  'h-3 w-3 shrink-0 rotate-45 border border-slate-200/90 border-t-0 border-l-0 bg-white/95 dark:border-slate-600 dark:bg-slate-800/95'

function TopologyTooltip({
  nodeId,
  style,
  placement,
  caretInset,
  embedded,
}: {
  nodeId: TopologyNodeId
  style: CSSProperties
  placement: 'above' | 'below'
  /** 尖头水平偏移，使箭头对准设备图标 */
  caretInset?: string
  embedded?: boolean
}) {
  const detail = NODE_DETAILS[nodeId]
  const panel = (
    <div
      className={`${topologyTooltipPanelClass} ${
        embedded ? 'max-w-[min(11rem,calc(100%-0.75rem))]' : ''
      }`}
    >
      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
        {detail.title}
      </p>
      <ul className="mt-1.5 space-y-0.5">
        {detail.lines.map((line) => (
          <li
            key={line}
            className="text-[11px] leading-snug text-slate-600 dark:text-slate-300"
          >
            {line}
          </li>
        ))}
      </ul>
    </div>
  )

  const caretRowClass = caretInset
    ? '-mt-[7px] flex w-full justify-start'
    : '-mt-[7px] flex w-full justify-center'

  return (
    <div
      className={`pointer-events-none absolute z-50 flex flex-col ${
        caretInset ? 'items-start' : 'items-center'
      }`}
      style={style}
      role="tooltip"
    >
      {placement === 'below' ? (
        <>
          <span
            className={topologyTooltipCaretClass}
            style={caretInset ? { marginLeft: caretInset } : undefined}
            aria-hidden
          />
          <div className="-mt-[7px]">{panel}</div>
        </>
      ) : (
        <>
          {panel}
          <div className={caretRowClass} aria-hidden>
            <span
              className={topologyTooltipCaretClass}
              style={caretInset ? { marginLeft: caretInset } : undefined}
            />
          </div>
        </>
      )}
    </div>
  )
}

interface TopologyTooltipLayout {
  placement: 'above' | 'below'
  anchor: { left: string; top: string }
  translateX: string
  caretInset?: string
}

const TOOLTIP_LAYOUT: Record<TopologyNodeId, TopologyTooltipLayout> = {
  solar: {
    placement: 'below',
    anchor: { left: '42%', top: '8%' },
    translateX: '-50%',
  },
  load: {
    placement: 'below',
    anchor: { left: '42%', top: '38%' },
    translateX: '-50%',
  },
  ess: {
    placement: 'above',
    anchor: { left: '22%', top: '68%' },
    translateX: '-50%',
  },
  grid: {
    placement: 'above',
    anchor: { left: '78%', top: '72%' },
    translateX: '-50%',
  },
}

/** 嵌入储能卡片时：储能气泡右移、尖头对准图标，且不超出左侧 cell */
function resolveTooltipLayout(
  nodeId: TopologyNodeId,
  embedded: boolean,
): TopologyTooltipLayout {
  const base = TOOLTIP_LAYOUT[nodeId]
  if (!embedded || nodeId !== 'ess') return base

  return {
    ...base,
    anchor: { left: '30%', top: '66%' },
    translateX: '0%',
    caretInset: '24px',
  }
}

function buildTooltipStyle(layout: TopologyTooltipLayout): CSSProperties {
  const y =
    layout.placement === 'below'
      ? '10px'
      : 'calc(-100% - 8px)'

  return {
    left: layout.anchor.left,
    top: layout.anchor.top,
    transform: `translate(${layout.translateX}, ${y})`,
    maxWidth: 'calc(100% - 0.5rem)',
  }
}

/** 母线中心与支路、图例坐标（统一基准，嵌入时收窄横向间距） */
function buildTopologyLayout(embedded = false) {
  const cx = embedded ? 198 : 260
  const essSpread = embedded ? 168 : 212
  const gridSpread = embedded ? 68 : 90
  const hubTop = { x: cx, y: 60 }
  const hubMid = { x: cx, y: 108 }
  const hubSplit = { x: cx, y: 148 }
  const lineEntryY = 38

  /** 换电站叠在 hubMid 母线节点；光伏在其正上方同列 */
  const load = {
    x: hubMid.x - ICON_BOUNDS.load.w * 0.55,
    y: hubMid.y - ICON_BOUNDS.load.h * 0.45,
  }
  const solar = {
    x: load.x,
    y: load.y - SOLAR_LOAD_GAP - ICON_BOUNDS.solar.h - SOLAR_EXTRA_LIFT,
  }
  const ess = { x: cx - essSpread, y: ESS_GRID_Y }
  const gridNudge = embedded ? GRID_NUDGE.embedded : GRID_NUDGE.standalone
  const grid = {
    x: cx + gridSpread + gridNudge.x,
    y: ESS_GRID_Y + gridNudge.y,
  }

  const essSocBlockH = CAPTION_GAP + Math.max(4, CAPTION_FONT_SIZE)
  const essConn = {
    x: ess.x + ICON_BOUNDS.ess.w / 2,
    y: ess.y + ICON_BOUNDS.ess.h * 0.55,
  }
  const { bus: gridBusConn, foot: gridFootConn } = getGridAnchors(grid)

  /** 动效：储能 → 母线 → 负荷节点 → 母线 → 电网（沿拓扑走线，不直连） */
  const activeFlowPath = [
    `M ${essConn.x} ${ess.y + ICON_BOUNDS.ess.h}`,
    `L ${essConn.x} ${essConn.y}`,
    `L ${hubSplit.x} ${hubSplit.y}`,
    `L ${hubMid.x} ${hubMid.y}`,
    `L ${hubSplit.x} ${hubSplit.y}`,
    `L ${gridBusConn.x} ${gridBusConn.y}`,
    `L ${gridFootConn.x} ${gridFootConn.y}`,
  ].join(' ')

  return {
    hubTop,
    hubMid,
    hubSplit,
    lineEntryY,
    load,
    solar,
    ess,
    grid,
    essConn,
    gridBusConn,
    gridFootConn,
    essSocBlockH,
    activeFlowPath,
  }
}

interface NodeHitProps {
  id: TopologyNodeId
  x: number
  y: number
  w: number
  h: number
  onEnter: (id: TopologyNodeId) => void
  onLeave: () => void
  children: ReactNode
}

function TopologyNodeHit({
  id,
  x,
  y,
  w,
  h,
  onEnter,
  onLeave,
  children,
}: NodeHitProps) {
  return (
    <g
      className="cursor-pointer"
      onMouseEnter={() => onEnter(id)}
      onMouseLeave={onLeave}
    >
      <rect
        x={x - 8}
        y={y - 8}
        width={w + 16}
        height={h + 20}
        fill="transparent"
      />
      {children}
    </g>
  )
}

interface MicrogridTopologyProps {
  className?: string
  embedded?: boolean
}

export function MicrogridTopology({
  className = '',
  embedded = false,
}: MicrogridTopologyProps) {
  const [hovered, setHovered] = useState<TopologyNodeId | null>(null)

  const handleNodeEnter = useCallback((id: TopologyNodeId) => {
    setHovered(id)
  }, [])

  const handleNodeLeave = useCallback(() => {
    setHovered(null)
  }, [])

  const layout = buildTopologyLayout(embedded)
  const viewW = embedded ? TOPOLOGY_EMBEDDED_VIEW_W : TOPOLOGY_VIEW_W
  const viewH = embedded ? TOPOLOGY_EMBEDDED_VIEW_H : TOPOLOGY_VIEW_H
  const {
    hubTop,
    hubMid,
    hubSplit,
    lineEntryY,
    load,
    solar,
    ess,
    grid,
    essConn,
    gridBusConn,
    gridFootConn,
    essSocBlockH,
    activeFlowPath,
  } = layout

  const diagramOffsetX = embedded ? -28 : 0
  const shiftY = -10

  const activeTooltipLayout = hovered
    ? resolveTooltipLayout(hovered, embedded)
    : null
  const tooltipStyle: CSSProperties | undefined = activeTooltipLayout
    ? buildTooltipStyle(activeTooltipLayout)
    : undefined

  const Wrapper = embedded ? 'div' : 'section'

  return (
    <Wrapper
      className={
        embedded
          ? `min-w-0 shrink-0 lg:max-w-[20rem] ${className}`
          : `flex h-full flex-col ${cardSection} ${className}`
      }
    >
      <div
        className={
          embedded
            ? 'relative min-h-0 w-full max-w-full'
            : 'relative min-h-0 flex-1 w-full'
        }
      >
        {hovered && tooltipStyle && activeTooltipLayout && (
          <TopologyTooltip
            nodeId={hovered}
            style={tooltipStyle}
            placement={activeTooltipLayout.placement}
            caretInset={activeTooltipLayout.caretInset}
            embedded={embedded}
          />
        )}

        <div className="relative w-full max-w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${viewW} ${viewH}`}
            preserveAspectRatio={embedded ? 'xMidYMid meet' : 'xMidYMid meet'}
            overflow={embedded ? 'hidden' : 'visible'}
            className={
              embedded
                ? 'block h-[260px] w-full max-w-full'
                : 'block h-[280px] w-full'
            }
            role="img"
            aria-label="源网荷储能量流向拓扑图"
          >
            <defs>
              <linearGradient
                id="topologyActiveFlow"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={STORAGE_CHARGE_COLOR} stopOpacity="0.4" />
                <stop offset="100%" stopColor={STORAGE_CHARGE_COLOR} stopOpacity="1" />
              </linearGradient>
            </defs>

            <g transform={`translate(${diagramOffsetX}, ${shiftY})`}>
            <g
              className="stroke-[#d8dee6] dark:stroke-slate-600"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={`M ${hubTop.x} ${lineEntryY} L ${hubTop.x} ${hubTop.y}`} />
              <path d={`M ${hubTop.x} ${hubTop.y} L ${hubMid.x} ${hubMid.y}`} />
              <path d={`M ${hubMid.x} ${hubMid.y} L ${hubSplit.x} ${hubSplit.y}`} />
              <path d={`M ${hubSplit.x} ${hubSplit.y} L ${essConn.x} ${essConn.y}`} />
              <path d={`M ${hubSplit.x} ${hubSplit.y} L ${gridBusConn.x} ${gridBusConn.y}`} />
              <path d={`M ${essConn.x} ${essConn.y} L ${essConn.x} ${ess.y + ICON_BOUNDS.ess.h}`} />
              <path d={`M ${gridBusConn.x} ${gridBusConn.y} L ${gridFootConn.x} ${gridFootConn.y}`} />
            </g>

            <path
              d={activeFlowPath}
              fill="none"
              stroke="url(#topologyActiveFlow)"
              strokeWidth="2.5"
              strokeDasharray="7 6"
              className="topology-flow-active"
            />
            <circle r="4" fill={STORAGE_CHARGE_COLOR}>
              <animateMotion
                dur="3.2s"
                repeatCount="indefinite"
                path={activeFlowPath}
              />
            </circle>

            <TopologyNodeHit
              id="solar"
              x={solar.x}
              y={solar.y}
              w={ICON_BOUNDS.solar.w}
              h={nodeTextBlockHeight(ICON_BOUNDS.solar.h) + 8}
              onEnter={handleNodeEnter}
              onLeave={handleNodeLeave}
            >
              <g transform={`translate(${solar.x}, ${solar.y})`}>
                <SolarIsoIcon />
                <DeviceNameLabel
                  iconW={ICON_BOUNDS.solar.w}
                  iconH={ICON_BOUNDS.solar.h}
                  name={NODE_LABELS.solar}
                />
                <DeviceValueLabel
                  iconW={ICON_BOUNDS.solar.w}
                  iconH={ICON_BOUNDS.solar.h}
                  value={`${SOLAR_KW.toFixed(2)} kW`}
                />
              </g>
            </TopologyNodeHit>

            <TopologyNodeHit
              id="load"
              x={load.x}
              y={load.y}
              w={ICON_BOUNDS.load.w}
              h={nodeTextBlockHeight(ICON_BOUNDS.load.h) + 8}
              onEnter={handleNodeEnter}
              onLeave={handleNodeLeave}
            >
              <g transform={`translate(${load.x}, ${load.y})`}>
                <LoadIsoIcon />
                <DeviceNameLabel
                  iconW={ICON_BOUNDS.load.w}
                  iconH={ICON_BOUNDS.load.h}
                  name={NODE_LABELS.load}
                />
                <DeviceValueLabel
                  iconW={ICON_BOUNDS.load.w}
                  iconH={ICON_BOUNDS.load.h}
                  value={`${LOAD_KW.toFixed(2)} kW`}
                />
              </g>
            </TopologyNodeHit>

            <TopologyNodeHit
              id="ess"
              x={ess.x}
              y={ess.y}
              w={ICON_BOUNDS.ess.w}
              h={nodeTextBlockHeight(ICON_BOUNDS.ess.h, essSocBlockH) + 8}
              onEnter={handleNodeEnter}
              onLeave={handleNodeLeave}
            >
              <g transform={`translate(${ess.x}, ${ess.y})`}>
                <EssIsoIcon />
                <DeviceNameLabel
                  iconW={ICON_BOUNDS.ess.w}
                  iconH={ICON_BOUNDS.ess.h}
                  name={NODE_LABELS.ess}
                />
                <g
                  transform={`translate(${ICON_BOUNDS.ess.w / 2}, ${valueYBelowName(ICON_BOUNDS.ess.h)})`}
                >
                  <EssCaptions soc={SOC_VALUE} />
                </g>
              </g>
            </TopologyNodeHit>

            <TopologyNodeHit
              id="grid"
              x={grid.x}
              y={grid.y}
              w={ICON_BOUNDS.grid.w}
              h={nodeTextBlockHeight(ICON_BOUNDS.grid.h) + 8}
              onEnter={handleNodeEnter}
              onLeave={handleNodeLeave}
            >
              <g transform={`translate(${grid.x}, ${grid.y})`}>
                <GridIsoIcon />
                <DeviceNameLabel
                  iconW={ICON_BOUNDS.grid.w}
                  iconH={ICON_BOUNDS.grid.h}
                  name={NODE_LABELS.grid}
                />
                <DeviceValueLabel
                  iconW={ICON_BOUNDS.grid.w}
                  iconH={ICON_BOUNDS.grid.h}
                  value={`${GRID_KW.toFixed(2)} kW`}
                />
              </g>
            </TopologyNodeHit>
            </g>
          </svg>
        </div>
      </div>
    </Wrapper>
  )
}
