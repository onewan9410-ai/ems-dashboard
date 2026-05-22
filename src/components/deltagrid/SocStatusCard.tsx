import { SocBatteryGauge } from './SocBatteryGauge'

export function SocStatusCard() {
  return (
    <section className="flex h-full flex-col justify-center rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
      <SocBatteryGauge />
    </section>
  )
}
