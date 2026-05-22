import { useState } from 'react'
import { DashboardHeader } from './DashboardHeader'
import { StorageInfoCard } from './StorageInfoCard'
import { DeviceStatusCard } from './DeviceStatusCard'
import { PowerWaveformChart } from './PowerWaveformChart'
import { BatteryConsistencyPanel } from './BatteryConsistencyPanel'
import { StorageVolumeChart } from './StorageVolumeChart'
import { AlarmStatisticsChart } from './AlarmStatisticsChart'
import { SocCriticalAlert } from './SocCriticalAlert'
import { SOC_CRITICAL_THRESHOLD, SOC_VALUE } from './constants'
export function DeltaGridEMDashboard() {
  const [socAlertDismissed, setSocAlertDismissed] = useState(false)

  const isSocCritical = SOC_VALUE <= SOC_CRITICAL_THRESHOLD
  const showSocAlert = isSocCritical && !socAlertDismissed

  return (
    <div className="relative min-h-screen bg-canvas text-slate-800 transition-colors duration-200 dark:text-slate-100">
      <SocCriticalAlert
        visible={showSocAlert}
        soc={SOC_VALUE}
        onDismiss={() => setSocAlertDismissed(true)}
      />

      <div className="mx-auto max-w-[1600px] space-y-4 p-4 md:space-y-5 md:p-6">
        <DashboardHeader />

        {/* 储能信息 + 设备状态（等高，以较高一侧为准） */}
        <div className="grid gap-4 lg:grid-cols-[13fr_7fr] lg:items-stretch lg:gap-5">
          <StorageInfoCard />
          <DeviceStatusCard />
        </div>

        {/* 储能充放电曲线 + 电池一致性分析（右侧模块高度封顶、框内滚动） */}
        <div className="grid gap-4 lg:grid-cols-[13fr_7fr] lg:items-start lg:gap-5">
          <PowerWaveformChart />
          <BatteryConsistencyPanel />
        </div>

        {/* 储能充放电量 + 设备告警统计 */}
        <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch lg:gap-5">
          <StorageVolumeChart />
          <AlarmStatisticsChart />
        </div>
      </div>
    </div>
  )
}

export default DeltaGridEMDashboard
