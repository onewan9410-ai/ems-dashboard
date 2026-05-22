import { useState } from 'react'
import { ChevronDown, Moon, RefreshCw, Sun } from 'lucide-react'
import { useTheme } from '../../theme/ThemeContext'
import { cardSection } from '../../theme/dashboardClasses'
import { HeaderMessageInbox } from './HeaderMessageInbox'
import {
  LIVE_TIMESTAMP,
  MAIN_TABS,
  OPERATION_SUB_TABS,
  VIRTUAL_POWER_PLANTS,
} from './constants'

export function DashboardHeader() {
  const { theme, toggleTheme } = useTheme()
  const [selectedVppId, setSelectedVppId] = useState<string>(
    VIRTUAL_POWER_PLANTS[0].id,
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(LIVE_TIMESTAMP)
  const [refreshing, setRefreshing] = useState(false)

  const selectedVpp =
    VIRTUAL_POWER_PLANTS.find((v) => v.id === selectedVppId) ??
    VIRTUAL_POWER_PLANTS[0]

  const handleRefresh = () => {
    setRefreshing(true)
    const now = new Date()
    const formatted = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    window.setTimeout(() => {
      setLastUpdated(formatted)
      setRefreshing(false)
    }, 600)
  }

  return (
    <header className={`${cardSection} overflow-visible px-4 py-3`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1">
            <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100 md:text-lg">
              {selectedVpp.name}
            </h1>

            <div className="relative">
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                aria-label="更换虚拟电厂"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-info dark:text-slate-400 dark:hover:bg-slate-700/80"
              >
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${pickerOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {pickerOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden
                    onClick={() => setPickerOpen(false)}
                  />
                  <ul className="absolute left-0 top-full z-20 mt-1 min-w-[240px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800">
                    {VIRTUAL_POWER_PLANTS.map((vpp) => (
                      <li key={vpp.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVppId(vpp.id)
                            setPickerOpen(false)
                          }}
                          className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/60 ${
                            vpp.id === selectedVppId
                              ? 'bg-info/5 font-medium text-info dark:bg-info/15'
                              : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span className="block">{vpp.name}</span>
                          <span className="mt-0.5 text-[10px] text-muted">
                            {vpp.region}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <span className="inline-flex items-center rounded-full border border-info/30 bg-info/5 px-2 py-0.5 text-xs font-medium text-info">
            虚拟电厂
          </span>

          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/5 px-2 py-0.5 text-xs text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            正常运行中
          </span>

          <span className="inline-flex items-center gap-1 text-xs text-muted">
            数据更新时间：{lastUpdated}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="刷新数据"
              className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-info disabled:opacity-50 dark:hover:bg-slate-700/80"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <HeaderMessageInbox />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '切换为浅色模式' : '切换为暗黑模式'}
            title={theme === 'dark' ? '浅色模式' : '暗黑模式'}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-info/40 hover:bg-info/5 hover:text-info dark:border-slate-600 dark:text-slate-300 dark:hover:bg-info/10"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <nav className="mt-3 flex flex-wrap gap-1 border-b border-slate-100 pb-0 dark:border-slate-700/80">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`px-3 py-2 text-sm transition-colors ${
              tab === '运行'
                ? 'border-b-2 border-info font-medium text-info'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <nav className="mt-2 flex flex-wrap gap-1">
        {OPERATION_SUB_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              tab === '储能系统'
                ? 'bg-info/10 font-medium text-info'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
    </header>
  )
}
