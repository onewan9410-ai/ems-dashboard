import { useEffect, useRef, useState } from 'react'
import { Bot, ChevronDown, ChevronUp } from 'lucide-react'
import {
  EFFICIENCY_VALUE,
  EFFICIENCY_WARNING_THRESHOLD,
  TARGET_EFFICIENCY,
} from './constants'
import {
  cardSection,
  cardTitle,
  kpiValue,
  kpiUnit,
  metricLabel,
} from '../../theme/dashboardClasses'
import { MicrogridTopology } from './MicrogridTopology'
import { PercentRingMetric } from './PercentRingMetric'
import { SocBatteryGauge } from './SocBatteryGauge'
import { getTodayVolume } from './storageVolumeData'

const CURRENT_POWER = -1.3
const TODAY_VOLUME = getTodayVolume()
const IS_DISCHARGING = CURRENT_POWER < 0
const IS_CHARGING = CURRENT_POWER > 0

/** 入口按钮：轻透明警示底 */
const diagnosisTriggerClass =
  'rounded-md border border-warning/40 bg-warning/5'
/** 气泡：白底 + 入口同款描边 */
const diagnosisPopoverClass =
  'rounded-md border border-warning/40 bg-white text-slate-700 dark:border-warning/40 dark:bg-slate-800 dark:text-slate-200'
const diagnosisCaretClass =
  'h-3.5 w-3.5 shrink-0 bg-white [clip-path:polygon(50%_100%,0_0,100%_0)] dark:bg-slate-800'

export function StorageInfoCard() {
  const [showDiagnosis, setShowDiagnosis] = useState(false)
  const diagnosisRef = useRef<HTMLDivElement>(null)
  const isEfficiencyLow = EFFICIENCY_VALUE < EFFICIENCY_WARNING_THRESHOLD
  const efficiencyColor = isEfficiencyLow ? '#f59e0b' : '#22c55e'

  useEffect(() => {
    if (!showDiagnosis) return

    const handlePointerDown = (event: MouseEvent) => {
      const root = diagnosisRef.current
      if (!root || root.contains(event.target as Node)) return
      setShowDiagnosis(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [showDiagnosis])

  return (
    <section className={`flex h-full min-h-0 flex-col ${cardSection}`}>
      <h2 className={`mb-3 shrink-0 ${cardTitle}`}>储能信息</h2>

      <div className="flex min-h-0 flex-1 flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
        <div className="relative z-10 min-w-0 shrink-0 overflow-visible lg:w-[38%]">
          <MicrogridTopology embedded className="w-full" />
        </div>

        <div className="grid min-w-0 flex-1 gap-5 overflow-visible sm:grid-cols-2 sm:gap-6">
          <div className="flex min-w-0 flex-col gap-5">
            <div>
              <p className={metricLabel}>当前功率</p>
              <p className={`kpi-tier-1 mt-1 whitespace-nowrap ${kpiValue}`}>
                {CURRENT_POWER.toFixed(2)}
                <span className={`${kpiUnit} ml-1`}>kW</span>
              </p>
              {IS_DISCHARGING && (
                <span className="kpi-meta mt-1.5 inline-flex w-fit items-center gap-1 rounded-full border border-discharge/30 bg-discharge/5 px-2 py-0.5 font-medium text-discharge">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-discharge" />
                  放电中
                </span>
              )}
              {IS_CHARGING && (
                <span className="kpi-meta mt-1.5 inline-flex w-fit items-center gap-1 rounded-full border border-charge/30 bg-charge/5 px-2 py-0.5 font-medium text-charge">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-charge" />
                  充电中
                </span>
              )}
            </div>

            <div>
              <p className={metricLabel}>今日充/放电量</p>
              <p className={`kpi-tier-1 mt-1 whitespace-nowrap ${kpiValue}`}>
                {TODAY_VOLUME.charge.toFixed(2)}
                <span className="kpi-tier-2 mx-0.5 text-slate-400 dark:text-slate-500">
                  /
                </span>
                {TODAY_VOLUME.discharge.toFixed(2)}
                <span className={`${kpiUnit} ml-1`}>kWh</span>
              </p>
            </div>

            <div>
              <p className={metricLabel}>累计等效循环次数</p>
              <p className={`kpi-tier-1 mt-1 whitespace-nowrap ${kpiValue}`}>
                2
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <SocBatteryGauge />

            <div className="relative overflow-visible">
              <PercentRingMetric
                label="累计综合效率"
                value={EFFICIENCY_VALUE}
                displayValue={`${EFFICIENCY_VALUE.toFixed(2)}%`}
                color={efficiencyColor}
              />
              {isEfficiencyLow && (
                <div
                  ref={diagnosisRef}
                  className="relative z-30 mt-2 w-fit"
                  onMouseEnter={() => setShowDiagnosis(true)}
                  onMouseLeave={() => setShowDiagnosis(false)}
                >
                  <button
                    type="button"
                    aria-expanded={showDiagnosis}
                    className={`kpi-meta inline-flex h-10 w-fit items-center gap-1 px-2.5 font-medium text-warning transition-colors hover:bg-warning/10 ${diagnosisTriggerClass}`}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    AI 效能诊断
                    {showDiagnosis ? (
                      <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    )}
                  </button>

                  {showDiagnosis && (
                    <div
                      className="absolute bottom-full left-1/2 z-50 w-[min(22rem,calc(100vw-2.5rem))] -translate-x-1/2 pb-2.5 sm:w-[min(26rem,calc(100vw-3rem))]"
                      role="region"
                      aria-label="AI 效能诊断报告"
                    >
                      <div
                        className={`px-3.5 py-3 shadow-md shadow-black/10 dark:shadow-black/30 ${diagnosisPopoverClass}`}
                      >
                        <p className="kpi-meta leading-relaxed">
                          <span className="font-semibold text-warning">
                            诊断报告：
                          </span>
                          暖通无效散热能耗占总系统损耗的{' '}
                          <strong className="font-semibold text-slate-800 dark:text-slate-100">
                            24.5%
                          </strong>
                          ，PCS 待机损耗占 8.2%。建议启用 AI
                          动态温控联动算法，预计可将综合效率从{' '}
                          {EFFICIENCY_VALUE.toFixed(1)}% 提升至{' '}
                          {TARGET_EFFICIENCY.toFixed(1)}%。
                        </p>
                        <button
                          type="button"
                          className="mt-2.5 w-full rounded-full bg-success px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
                        >
                          一键开启
                        </button>
                      </div>
                      <div className="-mt-[7px] flex justify-center" aria-hidden>
                        <span className={diagnosisCaretClass} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
