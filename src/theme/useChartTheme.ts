import { useTheme } from './ThemeContext'

export function useChartTheme() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return {
    isDark,
    axisColor: isDark ? '#6b7c93' : '#999999',
    gridStroke: isDark ? '#2a3444' : '#e2e8f0',
    axisLineStroke: isDark ? '#3d4f63' : '#cbd5e1',
    refLineStroke: isDark ? '#4b5f73' : '#94a3b8',
    tooltipPanel:
      'rounded-lg border px-3 py-2 text-xs shadow-sm ' +
      (isDark
        ? 'border-slate-600 bg-slate-800 shadow-black/30'
        : 'border-slate-200 bg-white'),
    tooltipTitle: isDark
      ? 'mb-1 font-medium text-slate-100'
      : 'mb-1 font-medium text-slate-800',
    tooltipBody: isDark ? 'text-slate-300' : 'text-slate-600',
    unitLabel: isDark ? 'text-[#6b7c93]' : 'text-[#999999]',
    /** 柱图 hover 行/列背景（10% 白，无描边） */
    barHoverCursor: {
      fill: 'rgba(255, 255, 255, 0.1)',
      stroke: 'none',
      strokeWidth: 0,
    } as const,
  }
}
