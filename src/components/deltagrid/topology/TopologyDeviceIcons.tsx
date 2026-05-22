import type { ReactElement } from 'react'

/** 拓扑设备图例 — 等距示意，配色与现有参考图一致 */

const C = {
  panel: '#434951',
  panelGrid: '#5a636e',
  frame: '#eef0f3',
  frameSide: '#dde2e8',
  stroke: '#c5cad3',
  pole: '#e6eaef',
  poleStroke: '#b8c0cc',
  tower: '#d4dce6',
  towerDark: '#a8b4c4',
  baseTop: '#f5f7fa',
  baseSide: '#2e3338',
  essBody: '#f8fafc',
  essGap: '#3a4048',
  essCap: '#2a2e34',
} as const

function lerp(
  a: [number, number],
  b: [number, number],
  t: number,
): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

function quad(c: [number, number][]) {
  const [tl, tr, br, bl] = c
  return `M ${tl[0]} ${tl[1]} L ${tr[0]} ${tr[1]} L ${br[0]} ${br[1]} L ${bl[0]} ${bl[1]} Z`
}

function cellGrid(corners: [number, number][], cols = 4, rows = 4) {
  const [tl, tr, br, bl] = corners
  const lines: ReactElement[] = []
  for (let i = 1; i < cols; i++) {
    const t = i / cols
    const a = lerp(tl, tr, t)
    const b = lerp(bl, br, t)
    lines.push(
      <line
        key={`v${i}`}
        x1={a[0]}
        y1={a[1]}
        x2={b[0]}
        y2={b[1]}
        stroke={C.panelGrid}
        strokeWidth="0.35"
      />,
    )
  }
  for (let j = 1; j < rows; j++) {
    const t = j / rows
    const a = lerp(tl, bl, t)
    const b = lerp(tr, br, t)
    lines.push(
      <line
        key={`h${j}`}
        x1={a[0]}
        y1={a[1]}
        x2={b[0]}
        y2={b[1]}
        stroke={C.panelGrid}
        strokeWidth="0.35"
      />,
    )
  }
  return (
    <g>
      <path d={quad(corners)} fill={C.panel} />
      {lines}
    </g>
  )
}

/** 光伏：2×2 组件 + 支架 */
export function SolarTopologyIcon() {
  const modules: [number, number][][] = [
    [
      [18, 16],
      [34, 16],
      [38, 24],
      [22, 24],
    ],
    [
      [34, 16],
      [50, 16],
      [54, 24],
      [38, 24],
    ],
    [
      [22, 24],
      [38, 24],
      [42, 32],
      [26, 32],
    ],
    [
      [38, 24],
      [54, 24],
      [58, 32],
      [42, 32],
    ],
  ]
  const poleX = 40
  return (
    <g>
      <rect
        x={poleX - 7}
        y={44}
        width={14}
        height={4}
        rx="0.5"
        fill={C.baseTop}
        stroke={C.stroke}
        strokeWidth="0.6"
      />
      <rect
        x={poleX - 1.5}
        y={32}
        width={3}
        height={12}
        fill={C.pole}
        stroke={C.poleStroke}
        strokeWidth="0.5"
      />
      {modules.map((m, i) => (
        <g key={i}>{cellGrid(m)}</g>
      ))}
      <path
        d="M54 16 L58 20 L58 32 L54 28 Z"
        fill={C.frameSide}
        stroke={C.stroke}
        strokeWidth="0.6"
      />
      <path
        d={quad([
          [18, 16],
          [54, 16],
          [58, 32],
          [22, 32],
        ])}
        fill="none"
        stroke={C.stroke}
        strokeWidth="0.9"
      />
      <line x1={36} y1={16} x2={40} y2={32} stroke={C.frame} strokeWidth="1.2" />
      <line x1={18} y1={24} x2={58} y2={24} stroke={C.frame} strokeWidth="1" />
    </g>
  )
}

/** 换电站：双电池仓 + 顶部桁架（区别于输电塔/储能柜） */
export function LoadTopologyIcon() {
  return (
    <g>
      <path
        d="M10 46 L38 52 L66 46 L38 40 Z"
        fill={C.baseTop}
        stroke={C.baseSide}
        strokeWidth="0.8"
      />
      <path
        d="M10 46 L10 48 L38 54 L66 48 L66 46 Z"
        fill={C.baseSide}
        opacity="0.85"
      />
      <path
        d="M14 36 L38 28 L62 36"
        fill="none"
        stroke={C.towerDark}
        strokeWidth="1.3"
      />
      <line x1={38} y1={20} x2={38} y2={28} stroke={C.towerDark} strokeWidth="1.3" />
      <line x1={20} y1={28} x2={56} y2={28} stroke={C.towerDark} strokeWidth="1.1" />
      <path
        d="M34 32 L38 28 L42 32"
        fill="none"
        stroke={C.tower}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <rect
        x={18}
        y={36}
        width={16}
        height={10}
        fill={C.frame}
        stroke={C.stroke}
        strokeWidth="0.8"
      />
      <rect
        x={42}
        y={36}
        width={16}
        height={10}
        fill={C.frame}
        stroke={C.stroke}
        strokeWidth="0.8"
      />
      <rect x={20} y={37} width={12} height={7} rx="0.5" fill={C.panel} />
      <rect x={44} y={37} width={12} height={7} rx="0.5" fill={C.panel} />
      <path
        d="M32 40 H34 M42 40 H44"
        stroke={C.frame}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M36 40 L38 38 L40 40"
        fill="none"
        stroke={C.tower}
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}

/** 储能：四层电池模组竖柜（与用户参考一致） */
export function EssTopologyIcon() {
  const layers = [14, 22, 30, 38]
  return (
    <g>
      <rect x={10} y={8} width={4} height={44} fill={C.essCap} />
      <rect x={34} y={8} width={4} height={44} fill={C.essCap} />
      <rect x={8} y={6} width={32} height={5} rx="1" fill={C.essCap} />
      <rect x={8} y={49} width={32} height={5} rx="1" fill={C.essCap} />
      {layers.map((y) => (
        <g key={y}>
          <rect
            x={12}
            y={y}
            width={24}
            height={6}
            rx="0.8"
            fill={C.essBody}
            stroke={C.stroke}
            strokeWidth="0.5"
          />
          <line
            x1={12}
            y1={y + 6}
            x2={36}
            y2={y + 6}
            stroke={C.essGap}
            strokeWidth="0.6"
          />
        </g>
      ))}
    </g>
  )
}

/** 电网：输电铁塔 + 圆角底座 */
export function GridTopologyIcon() {
  return (
    <g>
      <path
        d="M12 52 L40 52 L38 56 L14 56 Z"
        fill={C.baseSide}
      />
      <path
        d="M10 48 L42 48 L40 52 L12 52 Z"
        fill={C.baseTop}
        stroke={C.stroke}
        strokeWidth="0.7"
      />
      <path
        d="M26 10 L20 22 H14 L18 34 H12 L16 46 H36 L40 34 H34 L38 22 H32 Z"
        fill={C.tower}
        stroke={C.towerDark}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <line x1={26} y1={10} x2={26} y2={46} stroke={C.towerDark} strokeWidth="0.6" />
      <line x1={18} y1={22} x2={34} y2={22} stroke={C.towerDark} strokeWidth="0.5" />
      <line x1={16} y1={34} x2={36} y2={34} stroke={C.towerDark} strokeWidth="0.5" />
      <line x1={6} y1={14} x2={46} y2={14} stroke={C.towerDark} strokeWidth="0.9" />
      <line x1={8} y1={17} x2={44} y2={17} stroke={C.towerDark} strokeWidth="0.9" />
      <line x1={10} y1={20} x2={42} y2={20} stroke={C.towerDark} strokeWidth="0.9" />
      {[18, 30].map((y) => (
        <g key={y}>
          <line x1={14} y1={y} x2={16} y2={y + 3} stroke={C.towerDark} strokeWidth="0.7" />
          <line x1={36} y1={y} x2={38} y2={y + 3} stroke={C.towerDark} strokeWidth="0.7" />
        </g>
      ))}
    </g>
  )
}

/** PCS：方框 + 正弦波 */
export function PcsTopologyIcon() {
  return (
    <g>
      <rect
        x={14}
        y={14}
        width={32}
        height={32}
        rx="3"
        fill={C.frame}
        stroke={C.stroke}
        strokeWidth="0.9"
      />
      <path
        d="M20 30 C24 22, 28 38, 32 26 S40 34, 40 30"
        fill="none"
        stroke={C.towerDark}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1={18}
        y1={38}
        x2={42}
        y2={38}
        stroke={C.panelGrid}
        strokeWidth="0.8"
      />
    </g>
  )
}

export const TOPOLOGY_ICON_VIEW = {
  solar: { w: 76, h: 52 },
  load: { w: 76, h: 54 },
  ess: { w: 48, h: 58 },
  grid: { w: 52, h: 60 },
  pcs: { w: 60, h: 52 },
} as const
