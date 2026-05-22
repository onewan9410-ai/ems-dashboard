import { useState, useRef, useEffect, useLayoutEffect, useMemo, forwardRef } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode } from "react";
import {
  Bell, ChevronDown, RefreshCw, Moon, Sun, X,
  AlertTriangle, AlertCircle, Info, BatteryCharging,
  Zap, Shield, Bot, Activity, Server, Wind,
  TrendingUp, ChevronLeft, ChevronRight, Search, ArrowRight, ExternalLink, CircleHelp,
} from "lucide-react";
import {
  ComposedChart, Area, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Cell,
} from "recharts";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...i: ClassValue[]) => twMerge(clsx(...i));

/** Shared light/dark surface helpers */
const UI = {
  panelMd: "rounded-md border border-border bg-muted",
  panelDeep: "rounded-lg border border-border bg-secondary/60 dark:bg-[#0D1826]",
  popover: "rounded-lg border border-border bg-popover shadow-xl",
  borderB: "border-b border-border",
  borderT: "border-t border-border",
  chipIdle: "border-border text-muted-foreground hover:text-foreground",
  chipActive: "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  textTitle: "text-foreground",
  textBody: "text-slate-700 dark:text-slate-300",
  textSub: "text-muted-foreground",
  hoverRow: "hover:bg-secondary",
  inputShell: "rounded-md border border-border bg-muted",
  scrollArea: "[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-[#334155]/50",
  tabActive: "bg-secondary text-foreground",
  kpiCard: "rounded-xl border border-border bg-muted px-3 py-2",
  chartPeriodShell: "inline-flex h-6 items-stretch overflow-hidden rounded border border-border bg-muted/80",
  chartPeriodDateLabel:
    "flex h-6 min-w-[11.5rem] items-center justify-center border-x border-border px-2 font-mono text-[11px] font-medium leading-none tabular-nums text-muted-foreground",
  chartPeriodNavBtn:
    "inline-flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
} as const;

/** 充放电曲线 / 电池一致性：固定高度，内容在卡片内滚动（与主站 panelModuleScroll 一致） */
const ROW2_MODULE_HEIGHT =
  "h-[26rem] max-h-[26rem] overflow-hidden md:h-[27rem] md:max-h-[27rem]";

/** 列表底部淡出：15px，透明度 0 → 100% */
const LIST_BOTTOM_FADE =
  "pointer-events-none absolute bottom-0 left-0 right-0 h-[15px] rounded-b-lg bg-gradient-to-b from-card/0 to-card";

function chartPeriodSegmentClass(active: boolean, withDivider: boolean) {
  return cn(
    "inline-flex h-6 items-center px-2.5 text-[11px] font-medium leading-none transition-colors",
    withDivider && "border-l border-border",
    active
      ? "bg-card text-foreground"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
  );
}

function ChartGranularityTabs({
  value,
  onChange,
  options = ["日", "月", "年"],
}: {
  value: string;
  onChange?: (v: string) => void;
  options?: readonly string[];
}) {
  return (
    <div className={UI.chartPeriodShell} role="group" aria-label="时间粒度">
      {options.map((p, index) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange?.(p)}
          className={chartPeriodSegmentClass(value === p, index > 0)}
          aria-pressed={value === p}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function ChartDateNavigator({
  label,
  onPrev,
  onNext,
  nextDisabled,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className={UI.chartPeriodShell} aria-label="日期导航">
      <button type="button" onClick={onPrev} className={UI.chartPeriodNavBtn} aria-label="上一周期">
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className={UI.chartPeriodDateLabel}>{label}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className={UI.chartPeriodNavBtn}
        aria-label="下一周期"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ChartPeriodToolbar({
  granularity,
  onGranularityChange,
  periodLabel,
  onPrev,
  onNext,
  nextDisabled,
  showGranularity = true,
  granularityOptions = ["日", "月", "年"],
}: {
  granularity?: string;
  onGranularityChange?: (v: string) => void;
  periodLabel: string;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  showGranularity?: boolean;
  granularityOptions?: readonly string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {showGranularity && granularity != null && (
        <ChartGranularityTabs value={granularity} onChange={onGranularityChange} options={granularityOptions} />
      )}
      <ChartDateNavigator
        label={periodLabel}
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={nextDisabled}
      />
    </div>
  );
}

function AiPredictionPanel({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn(UI.panelMd, "px-2.5 py-2", className)}>
      <p className={cn("text-[10px] leading-relaxed", UI.textBody)}>
        <span className="font-medium text-[#3B82F6]">AI预警：</span>
        {text}
      </p>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface DeviceIssue { msg: string; time: string; severity: "alarm" | "warning"; }
interface Device {
  id: string; name: string; type: string;
  status: "online" | "warning" | "offline" | "fault";
  detail: string; value: string;
  issues: DeviceIssue[];
  aiInsight: string | null;
  aiPrediction?: string | null;
}
interface AlarmItem {
  type: "告警" | "警告" | "提示";
  msg: string; detail: string; time: string; code: string;
  status: "未处理" | "处理中" | "已恢复" | "信息";
}
interface NotifItem { id: number; device: string; msg: string; time: string; }

// ─── Mock Data ────────────────────────────────────────────────────────────────
// ─── 储能充放电曲线数据（与主站 PowerWaveformChart 一致）────────────────────────
const TARIFF_PERIODS = [
  { label: "谷", start: "00:00", end: "08:00", fill: "#A5B4FC", fillOpacity: 0.1, labelFill: "#818CF8" },
  { label: "峰", start: "08:00", end: "11:00", fill: "#FDA4AF", fillOpacity: 0.1, labelFill: "#FB7185" },
  { label: "平", start: "11:00", end: "17:00", fill: "#CBD5E1", fillOpacity: 0.1, labelFill: "#94A3B8" },
  { label: "峰", start: "17:00", end: "22:00", fill: "#FDA4AF", fillOpacity: 0.1, labelFill: "#FB7185" },
  { label: "谷", start: "22:00", end: "24:00", fill: "#A5B4FC", fillOpacity: 0.1, labelFill: "#818CF8" },
] as const;

function timeToMinutes(time: string) {
  if (time === "24:00") return 24 * 60;
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function timeLabelToHour(time: string) {
  return timeToMinutes(time) / 60;
}

function getTariffPeriod(time: string) {
  const minutes = timeToMinutes(time);
  for (const period of TARIFF_PERIODS) {
    const start = timeToMinutes(period.start);
    const end = timeToMinutes(period.end);
    if (minutes >= start && minutes < end) return period;
  }
  return null;
}

/** 储能运行态 — 全页数值与状态保持一致 */
const STORAGE_SOC = 10.3;
const STORAGE_DISCHARGE_KW = 13.5;
const STORAGE_STATE = "放电中";

/** 参考运行曲线：单轴功率，正=充电、负=放电 */
const WAVEFORM_POWER_BY_HOUR = [
  0.32, 0.38, 0.35, 0.40, 0.36, 0.42, 0.38, 0.34, 0.33, // 00–08 谷期充电
  -1.15, -0.52, -1.28, -1.05, -0.88, -1.42, -1.18, -0.95, // 09–16 峰/平放电
  -1.35, -1.05, -0.72, -1.22, -0.58, -1.10, -0.85, -1.24, // 17–23 含当前放电态
] as const;

type WaveformPoint = { time: string; power: number; soc: number };
type WaveformChartPoint = WaveformPoint & {
  chargePower: number | null;
  dischargePower: number | null;
};

function buildWaveformData(powers: readonly number[]): WaveformPoint[] {
  const startSoc = 50;
  const integrated = powers.slice(0, -1).reduce((sum, power) => sum + power, 0);
  const rate = integrated !== 0 ? (STORAGE_SOC - startSoc) / integrated : 0;

  let soc = startSoc;
  return powers.map((power, hour) => {
    const point: WaveformPoint = {
      time: `${String(hour).padStart(2, "0")}:00`,
      power,
      soc: hour === powers.length - 1
        ? STORAGE_SOC
        : Number(Math.max(STORAGE_SOC, Math.min(100, soc)).toFixed(1)),
    };
    soc += power * rate;
    return point;
  });
}

const WAVEFORM_DATA = buildWaveformData(WAVEFORM_POWER_BY_HOUR);

function interpolateZeroCrossTime(t1: string, p1: number, t2: string, p2: number) {
  const [h1, m1] = t1.split(":").map(Number);
  const [h2, m2] = t2.split(":").map(Number);
  const mins1 = h1 * 60 + m1;
  const mins2 = h2 * 60 + m2;
  const ratio = Math.abs(p1) / (Math.abs(p1) + Math.abs(p2));
  const mins = Math.round(mins1 + ratio * (mins2 - mins1));
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

function splitPowerWaveform(data: WaveformPoint[]): WaveformChartPoint[] {
  const result: WaveformChartPoint[] = [];
  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    const prev = i > 0 ? data[i - 1] : null;
    if (prev && prev.power * point.power < 0) {
      result.push({
        time: interpolateZeroCrossTime(prev.time, prev.power, point.time, point.power),
        power: 0,
        soc: point.soc,
        chargePower: 0,
        dischargePower: 0,
      });
    }
    result.push({
      ...point,
      chargePower: point.power > 0 ? point.power : point.power === 0 ? 0 : null,
      dischargePower: point.power < 0 ? point.power : point.power === 0 ? 0 : null,
    });
  }
  return result;
}

const curveChartData = splitPowerWaveform(WAVEFORM_DATA);
type CurveChartPlotPoint = WaveformChartPoint & { hour: number };
const curveChartPlotData: CurveChartPlotPoint[] = [
  ...curveChartData.map(point => ({ ...point, hour: timeLabelToHour(point.time) })),
  {
    time: "24:00",
    hour: 24,
    power: 0,
    soc: curveChartData.at(-1)?.soc ?? STORAGE_SOC,
    chargePower: null,
    dischargePower: null,
  },
];
const STORAGE_DISCHARGE_COLOR = "#EAB308";
const CURVE_DISCHARGE_COLOR = STORAGE_DISCHARGE_COLOR;
const CURVE_CHARGE_COLOR = "#3B82F6";
const CURVE_SOC_COLOR = "#22C55E";
const SOC_ACCENT = "#F97316";
const EFFICIENCY_GAUGE_COLOR = "#3B82F6";
const CURVE_POWER_FILL = 0.12;

const volumeDataDay = [
  { label: "05-15", 充电: 1820, 放电: 1680 },
  { label: "05-16", 充电: 2140, 放电: 2010 },
  { label: "05-17", 充电: 1560, 放电: 1380 },
  { label: "05-18", 充电: 2380, 放电: 2240 },
  { label: "05-19", 充电: 1940, 放电: 1820 },
  { label: "05-20", 充电: 2560, 放电: 2410 },
  { label: "05-21", 充电: 1234, 放电: 980  },
];
const volumeDataMonth = [
  { label: "01月", 充电: 32400, 放电: 29800 },
  { label: "02月", 充电: 28900, 放电: 26100 },
  { label: "03月", 充电: 35200, 放电: 32100 },
  { label: "04月", 充电: 38600, 放电: 35900 },
  { label: "05月", 充电: 14850, 放电: 13520 },
];

type VolumeChartPoint = { label: string; 充电: number; 放电: number };

const VOLUME_DAY_LOOKUP = new Map(volumeDataDay.map(row => [row.label, row]));
const VOLUME_MONTH_LOOKUP = new Map(volumeDataMonth.map(row => [row.label, row]));

function mockVolumePoint(seed: string, scale = 1): Pick<VolumeChartPoint, "充电" | "放电"> {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 1000;
  return {
    充电: Math.round(((hash % 140) + 40) * 18 * scale),
    放电: Math.round(((hash % 120) + 35) * 16 * scale),
  };
}

function formatVolumeDayLabel(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getVolumeChartData(anchor: Date, period: string): VolumeChartPoint[] {
  if (period === "月") {
    const end = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    return Array.from({ length: 8 }, (_, index) => {
      const date = new Date(end);
      date.setMonth(end.getMonth() - (7 - index));
      const label = `${String(date.getMonth() + 1).padStart(2, "0")}月`;
      return { label, ...VOLUME_MONTH_LOOKUP.get(label) ?? mockVolumePoint(`month-${date.getFullYear()}-${date.getMonth()}`, 12) };
    });
  }
  if (period === "年") {
    const year = anchor.getFullYear();
    return Array.from({ length: 4 }, (_, index) => {
      const y = year - (3 - index);
      const label = `${String(y).slice(-2)}年`;
      return { label, ...mockVolumePoint(`year-${y}`, 180) };
    });
  }
  const end = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (6 - index));
    const label = formatVolumeDayLabel(date);
    return { label, ...VOLUME_DAY_LOOKUP.get(label) ?? mockVolumePoint(`day-${label}`) };
  });
}

function summarizeVolumeChartData(data: VolumeChartPoint[]) {
  const charge = data.reduce((sum, row) => sum + row.充电, 0);
  const discharge = data.reduce((sum, row) => sum + row.放电, 0);
  return { charge, discharge };
}

function formatVolumeSummaryValue(value: number) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} kWh`;
}

function getVolumeSummaryLabels(period: string) {
  if (period === "日") return { charge: "7日总充电", discharge: "7日总放电" };
  return { charge: "总充电", discharge: "总放电" };
}

/** 按日期 × 设备统计告警总次数（不区分告警/警告/提示） */
const alarmChartDayData = [
  { date: "08/19", pcs01: 1, pcs02: 1, bms01: 0, bms02: 0, hvac: 1, ems: 1 },
  { date: "08/18", pcs01: 0, pcs02: 0, bms01: 0, bms02: 0, hvac: 0, ems: 0 },
  { date: "08/17", pcs01: 1, pcs02: 0, bms01: 0, bms02: 0, hvac: 0, ems: 0 },
  { date: "08/16", pcs01: 0, pcs02: 0, bms01: 1, bms02: 1, hvac: 1, ems: 1 },
  { date: "08/15", pcs01: 1, pcs02: 1, bms01: 1, bms02: 1, hvac: 0, ems: 1 },
  { date: "08/14", pcs01: 0, pcs02: 0, bms01: 0, bms02: 0, hvac: 0, ems: 0 },
  { date: "08/13", pcs01: 0, pcs02: 0, bms01: 0, bms02: 0, hvac: 0, ems: 0 },
];

type AlarmChartRow = typeof alarmChartDayData[number];
const ALARM_DAY_LOOKUP = new Map(alarmChartDayData.map(row => [row.date, row]));
const ALARM_DEVICE_KEYS = ["pcs01", "pcs02", "bms01", "bms02", "hvac", "ems"] as const;

function emptyAlarmCounts(): Omit<AlarmChartRow, "date"> {
  return { pcs01: 0, pcs02: 0, bms01: 0, bms02: 0, hvac: 0, ems: 0 };
}

function mockAlarmDay(date: string): AlarmChartRow {
  let hash = 0;
  for (const char of date) hash = (hash * 31 + char.charCodeAt(0)) % 1000;
  return {
    date,
    pcs01: hash % 11 === 0 ? 1 : hash % 23 === 0 ? 2 : 0,
    pcs02: hash % 13 === 0 ? 1 : 0,
    bms01: hash % 17 === 0 ? 1 : hash % 29 === 0 ? 2 : 0,
    bms02: hash % 19 === 0 ? 1 : 0,
    hvac: hash % 31 === 0 ? 1 : 0,
    ems: hash % 9 === 0 ? 1 : hash % 21 === 0 ? 2 : 0,
  };
}

function resolveAlarmDay(mmdd: string): AlarmChartRow {
  return ALARM_DAY_LOOKUP.get(mmdd) ?? mockAlarmDay(mmdd);
}

function formatAlarmMmDd(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function sumAlarmCounts(rows: AlarmChartRow[]): Omit<AlarmChartRow, "date"> {
  const totals = emptyAlarmCounts();
  for (const row of rows) {
    for (const key of ALARM_DEVICE_KEYS) totals[key] += row[key];
  }
  return totals;
}

function aggregateAlarmMonth(year: number, month: number): AlarmChartRow {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows: AlarmChartRow[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    rows.push(resolveAlarmDay(`${String(month + 1).padStart(2, "0")}/${String(day).padStart(2, "0")}`));
  }
  return {
    date: `${String(year).slice(-2)}/${String(month + 1).padStart(2, "0")}`,
    ...sumAlarmCounts(rows),
  };
}

function getAlarmChartData(anchor: Date, period: string): AlarmChartRow[] {
  if (period === "月") {
    const end = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    return Array.from({ length: 8 }, (_, index) => {
      const date = new Date(end);
      date.setMonth(end.getMonth() - (7 - index));
      return aggregateAlarmMonth(date.getFullYear(), date.getMonth());
    });
  }
  const end = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (6 - index));
    return resolveAlarmDay(formatAlarmMmDd(date));
  });
}

function formatAlarmPeriodRange(anchor: Date, period: string) {
  return formatVolumePeriodRange(anchor, period === "月" ? "月" : "日");
}

const ALARM_GRANULARITY_OPTIONS = ["日", "月"] as const;

const ALARM_DEVICE_SERIES = [
  { key: "pcs01", label: "PCS-01", color: "#FF3B30" },
  { key: "pcs02", label: "PCS-02", color: "#F97316" },
  { key: "bms01", label: "BMS-01", color: "#2563EB" },
  { key: "bms02", label: "BMS-02", color: "#6366F1" },
  { key: "hvac", label: "HVAC", color: "#FB923C" },
  { key: "ems", label: "EMS", color: "#14B8A6" },
] as const;

const alarmDetailsByDate: Record<string, { msg: string; device: string; time: string }[]> = {
  "08/19": [
    { msg: "直流侧过温保护", device: "PCS-01", time: "14:22:08" },
    { msg: "并网电流不平衡", device: "PCS-02", time: "13:05:33" },
    { msg: "舱内湿度偏高", device: "HVAC", time: "08:42:15" },
    { msg: "调度指令执行超时", device: "EMS", time: "11:18:41" },
  ],
  "08/17": [{ msg: "MPPT 通道异常", device: "PCS-01", time: "16:30:02" }],
  "08/16": [
    { msg: "单体电压离散性偏高", device: "BMS-01", time: "13:11:27" },
    { msg: "SOC 估算偏差偏大", device: "BMS-02", time: "10:48:56" },
    { msg: "出水温度接近上限", device: "HVAC", time: "09:22:33" },
    { msg: "策略切换记录异常", device: "EMS", time: "07:55:10" },
  ],
  "08/15": [
    { msg: "并网保护动作", device: "PCS-01", time: "18:04:51" },
    { msg: "效率骤降", device: "PCS-02", time: "15:37:22" },
    { msg: "绝缘检测告警", device: "BMS-01", time: "12:08:44" },
    { msg: "均衡回路异常", device: "BMS-02", time: "06:12:09" },
    { msg: "通信链路中断", device: "EMS", time: "03:41:18" },
  ],
};

const devices: Device[] = [
  { id: "PCS-01", name: "变流器 PCS-01",   type: "pcs",  status: "online",  detail: STORAGE_STATE, value: `${STORAGE_DISCHARGE_KW} kW`, issues: [], aiInsight: null },
  { id: "PCS-02", name: "变流器 PCS-02",   type: "pcs",  status: "online",  detail: "待机",     value: "0 kW",    issues: [], aiInsight: null },
  { id: "BMS-01", name: "电池管理 BMS-01", type: "bms",  status: "warning", detail: "单体低压", value: "748.2 V",
    issues: [{ msg: "单体电压低于 3.28V",   time: "14:32", severity: "alarm"   }],
    aiInsight: "RACK-06 #12号电芯电压持续偏低，建议优先对该电芯进行主动均衡处理，预计2小时内恢复正常。" },
  { id: "BMS-02", name: "电池管理 BMS-02", type: "bms",  status: "online",  detail: "正常",     value: "751.6 V", issues: [], aiInsight: null,
    aiPrediction: "约 96 天后单体温差可能超出需关注阈值，建议提前复检热管理系统与均衡回路。" },
  { id: "HVAC",   name: "热管理 HVAC-01",  type: "hvac", status: "online",  detail: "制冷中",   value: "23.5 °C", issues: [], aiInsight: null },
  { id: "FIRE",   name: "消防系统",        type: "fire", status: "online",  detail: "待机",     value: "—",       issues: [], aiInsight: null },
  { id: "EMS",    name: "EMS 主控单元",    type: "ems",  status: "online",  detail: "调峰模式", value: "—",       issues: [], aiInsight: null },
];

function getDeviceSortPriority(d: Device): number {
  if (d.status === "warning" || d.status === "fault") return 1;
  if (d.issues.length > 0) return 2;
  if (d.aiPrediction) return 3;
  if (d.detail === "待机") return 5;
  return 4;
}

function compareDevices(a: Device, b: Device): number {
  const order = getDeviceSortPriority(a) - getDeviceSortPriority(b);
  return order !== 0 ? order : a.name.localeCompare(b.name, "zh-CN");
}

const notifs: Record<string, NotifItem[]> = {
  告警: [
    { id: 1, device: "BMS-01", msg: "单体电池电压低于告警阈值 3.28V",   time: "14:32" },
    { id: 2, device: "PCS-01", msg: "IGBT 温度超限 87.3°C > 85°C",       time: "13:56" },
    { id: 3, device: "PCS-01", msg: "输出电流不平衡超限 12.3%",          time: "12:10" },
  ],
  警告: [
    { id: 4, device: "BMS-02", msg: "单体温差偏大 ΔT = 6.2°C",           time: "11:45" },
    { id: 5, device: "HVAC",   msg: "环境温度偏高 32.4°C",               time: "10:22" },
    { id: 6, device: "EMS",    msg: "通信延时超过阈值 50 ms",             time: "09:18" },
  ],
  提示: [
    { id: 7, device: "EMS",    msg: "调度策略已切换：调峰模式 → 调频模式", time: "08:00" },
  ],
};

const alarmDetails: Record<string, AlarmItem[]> = {
  "PCS-01": [
    { type: "告警", msg: "IGBT 温度超限",   detail: "87.3°C > 85°C",  time: "13:56:22", code: "E1042", status: "处理中" },
    { type: "告警", msg: "输出电流不平衡",   detail: "12.3% > 10%",   time: "12:10:08", code: "E1018", status: "未处理" },
    { type: "告警", msg: "直流母线过压",     detail: "812V > 800V",   time: "10:32:41", code: "E1031", status: "已恢复" },
    { type: "警告", msg: "风扇转速异常",     detail: "1200 < 1500rpm",time: "11:45:30", code: "W0023", status: "未处理" },
    { type: "警告", msg: "散热器温度偏高",   detail: "72.1°C",        time: "10:22:18", code: "W0011", status: "已恢复" },
    { type: "提示", msg: "功率限幅已激活",   detail: "限制 800 kW",   time: "09:00:00", code: "I0007", status: "信息"   },
  ],
  "PCS-02": [
    { type: "告警", msg: "网侧电压不平衡",   detail: "2.8% > 2%",     time: "14:01:33", code: "E2005", status: "未处理" },
    { type: "警告", msg: "直流电容温度偏高", detail: "68.4°C",        time: "13:20:55", code: "W0031", status: "处理中" },
    { type: "警告", msg: "冷却液流量低",     detail: "4.2 L/min",     time: "12:45:10", code: "W0044", status: "未处理" },
    { type: "警告", msg: "辅助电源电压偏低", detail: "22.1V < 24V",   time: "11:30:08", code: "W0019", status: "已恢复" },
    { type: "提示", msg: "预防性维护提醒",   detail: "运行 1000h",    time: "08:00:00", code: "I0031", status: "信息"   },
  ],
  "BMS-01": [
    { type: "警告", msg: "单体电压离散性偏高", detail: "ΔV = 45mV",   time: "14:20:11", code: "W1001", status: "未处理" },
    { type: "提示", msg: "SOH 下降提示",       detail: "SOH = 91.2%", time: "08:00:00", code: "I1003", status: "信息"   },
    { type: "提示", msg: "均衡功能已激活",     detail: "RACK-06 主动均衡", time: "13:00:00", code: "I1011", status: "信息" },
    { type: "提示", msg: "SOC 校准完成",       detail: "误差 0.3%",   time: "06:30:00", code: "I1041", status: "信息"   },
    { type: "提示", msg: "绝缘检测结果",       detail: "正常 >100 MΩ",time: "06:00:00", code: "I1055", status: "信息"   },
    { type: "提示", msg: "本月放电量统计",     detail: "4,820 kWh",   time: "00:00:00", code: "I1030", status: "信息"   },
    { type: "提示", msg: "循环次数更新",       detail: "周期 342次",  time: "00:00:00", code: "I1005", status: "信息"   },
    { type: "提示", msg: "历史峰值温度",       detail: "Tmax 31.4°C", time: "12:00:00", code: "I1022", status: "信息"   },
  ],
  "BMS-02": [
    { type: "告警", msg: "单体过充保护触发", detail: "4.21V > 4.20V", time: "11:15:44", code: "E1201", status: "已恢复" },
    { type: "告警", msg: "温度传感器故障",   detail: "通道 7 断路",   time: "09:42:17", code: "E1218", status: "处理中" },
    { type: "警告", msg: "荷电状态偏差偏大", detail: "ΔSoC = 8.3%",  time: "14:05:22", code: "W1201", status: "未处理" },
    { type: "警告", msg: "电芯内阻偏高",     detail: "RACK-03 C12",  time: "08:00:00", code: "W1212", status: "未处理" },
    { type: "提示", msg: "充电截止电压更新", detail: "4.18V → 4.20V",time: "00:00:00", code: "I1201", status: "信息"   },
  ],
  "HVAC": [
    { type: "提示", msg: "压缩机运行小时数", detail: "2,340 h",      time: "00:00:00", code: "I3001", status: "信息" },
    { type: "提示", msg: "滤网更换提醒",     detail: "运行 500h 后", time: "08:00:00", code: "I3012", status: "信息" },
    { type: "提示", msg: "制冷能效比 COP",   detail: "3.41 kW/kW",   time: "10:00:00", code: "I3018", status: "信息" },
    { type: "提示", msg: "出水温度",         detail: "18.5°C",       time: "14:30:00", code: "I3021", status: "信息" },
    { type: "提示", msg: "冷媒压力正常",     detail: "0.82 MPa",     time: "12:00:00", code: "I3005", status: "信息" },
    { type: "提示", msg: "风机转速",         detail: "1,450 rpm",    time: "14:30:00", code: "I3022", status: "信息" },
  ],
  "EMS": [
    { type: "警告", msg: "调度指令延时偏高", detail: "120 ms > 100 ms",time: "13:45:00", code: "W9001", status: "未处理" },
    { type: "警告", msg: "网络丢包率偏高",   detail: "0.8% > 0.5%",   time: "11:20:33", code: "W9005", status: "已恢复" },
    { type: "提示", msg: "策略切换记录",     detail: "调峰 → 调频",  time: "08:00:00", code: "I9001", status: "信息"   },
    { type: "提示", msg: "日前计划同步",     detail: "2026-05-22",    time: "00:00:00", code: "I9010", status: "信息"   },
  ],
};

// ─── Topology Tooltip Data ─────────────────────────────────────────────────────
const tooltipContent: Record<string, { title: string; items: { l: string; v: string }[] }> = {
  solar:    { title: "光伏系统", items: [{ l: "当前出力", v: "680 kW" }, { l: "今日发电", v: "3,420 kWh" }, { l: "组件温度", v: "48.3 °C" }] },
  grid:     { title: "公共电网", items: [{ l: "并网电压", v: "10.2 kV" }, { l: "功率因数", v: "0.997" }, { l: "频率", v: "50.02 Hz" }] },
  ess:      { title: "储能系统", items: [{ l: "SOC", v: `${STORAGE_SOC}%` }, { l: "电芯温度", v: "25.3 °C" }, { l: "状态", v: STORAGE_STATE }] },
  pcc:      { title: "并网点", items: [{ l: "并网功率", v: "896.5 kW" }, { l: "电压", v: "380 V" }, { l: "频率", v: "50.02 Hz" }] },
  pcs:      { title: "变流器", items: [{ l: "当前功率", v: `${STORAGE_DISCHARGE_KW} kW` }, { l: "运行状态", v: STORAGE_STATE }, { l: "效率", v: "96.2%" }] },
  charging: { title: "充电桩群", items: [{ l: "接入车辆", v: "8 台" }, { l: "充电功率", v: "230 kW" }, { l: "今日充量", v: "1,120 kWh" }] },
};

// ─── Recharts shared axis props ───────────────────────────────────────────────
const axisStyle = {
  tick: { fill: "var(--chart-axis)", fontSize: 10 } as object,
  axisLine: false as false,
  tickLine: false as false,
};

const CHART_Y_AXIS_WIDTH = 44;

function PowerYAxisTick({ x = 0, y = 0, payload }: {
  x?: number; y?: number; payload?: { value: number };
}) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill="var(--chart-axis)" fontSize={10} fontStyle="italic">
      {Number(payload?.value ?? 0).toFixed(1)}
    </text>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={cn(UI.popover, "p-3 text-xs")}>
      <p className="mb-2 text-muted-foreground">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="h-1.5 w-3.5 rounded-full" style={{ background: e.color }} />
          <span className={UI.textBody}>{e.name}</span>
          <span className="ml-auto font-mono text-foreground pl-4">{e.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ on, color, onToggle }: { on: boolean; color?: string; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn("relative inline-flex h-3.5 w-7 flex-shrink-0 rounded-full transition-colors")}
      style={{ background: on ? (color || "#3B82F6") : "var(--switch-background)" }}
    >
      <span className={cn("absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow transition-transform",
        on ? "translate-x-[14px]" : "translate-x-0.5"
      )} />
    </button>
  );
}

// ─── Base Card ────────────────────────────────────────────────────────────────
const Card = forwardRef<HTMLDivElement, { className?: string; children: ReactNode }>(
  function Card({ className, children }, ref) {
  return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-border bg-card text-card-foreground shadow-sm shadow-slate-200/50 dark:shadow-none",
          className,
        )}
      >
      {children}
    </div>
    );
  },
);

const CONCEPT_HELP = {
  soc: "SOC（State of Charge，荷电状态）表示储能系统当前剩余电量占额定容量的百分比，用于评估可用能量与充放电空间。",
  cycleCount: "累计等效循环次数将历史累计充放电量折算为等效完整充放循环次数，用于衡量电池使用强度与老化程度。",
  chargeCurve: "展示选定日期内储能充放电功率与 SOC 变化曲线，结合分时电价背景，辅助分析充放策略与运行效益。",
  consistency: "对各电池簇的电压、温度一致性进行监测与对比，识别需关注或告警的异常簇，并给出维护建议。",
} as const;

function ConceptHelpTip({ text, placement = "bottom", iconClassName }: {
  text: string;
  placement?: "bottom" | "top";
  iconClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tipPos, setTipPos] = useState<{ x: number; y: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const updateTipPos = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTipPos({
      x: rect.left + rect.width / 2,
      y: placement === "top" ? rect.top - 6 : rect.bottom + 6,
    });
  };

  return (
    <span
      className="relative inline-flex shrink-0 items-center"
      onMouseEnter={() => {
        updateTipPos();
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={btnRef}
        type="button"
        className={cn(
          "inline-flex items-center justify-center transition-colors hover:opacity-80",
          iconClassName ? "" : "text-muted-foreground hover:text-foreground",
        )}
        aria-label="查看概念说明"
      >
        <CircleHelp className={cn("h-3 w-3", iconClassName)} />
      </button>
      {open && tipPos && createPortal(
        <div
          className="pointer-events-none fixed z-[9999] w-56 rounded-lg border border-border bg-popover p-2.5 text-[10px] leading-relaxed text-slate-700 shadow-2xl dark:text-slate-300"
          style={{
            left: tipPos.x,
            top: tipPos.y,
            transform: placement === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
          }}
        >
          {text}
        </div>,
        document.body,
      )}
    </span>
  );
}

function SectionTitle({ title, right, help }: { title: string; right?: ReactNode; help?: string }) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-3", UI.borderB)}>
      <div className="flex items-center gap-2">
        <div className="h-3.5 w-[3px] rounded-full bg-blue-500" />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</span>
        {help && <ConceptHelpTip text={help} placement="bottom" />}
      </div>
      {right}
    </div>
  );
}
function StatusDot({ status, detail }: { status: Device["status"]; detail?: string }) {
  const c = detail === "待机"
    ? "#64748B"
    : { online: "#22C55E", warning: "#FF3B30", offline: "#64748B", fault: "#FF3B30" }[status];
  return <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: c, boxShadow: `0 0 5px ${c}90` }} />;
}

// ─── Topology Node Icon ───────────────────────────────────────────────────────
function NodeIcon({ type, color }: { type: string; color: string }) {
  const s = { stroke: color, fill: "none", strokeWidth: 1.3, strokeLinecap: "round" as const };
  switch (type) {
    case "solar": return (
      <g {...s}>
        <rect x="-13" y="-10" width="26" height="20" rx="1.5" />
        <line x1="-6.5" y1="-10" x2="-6.5" y2="10" />
        <line x1="0" y1="-10" x2="0" y2="10" />
        <line x1="6.5" y1="-10" x2="6.5" y2="10" />
        <line x1="-13" y1="-3.5" x2="13" y2="-3.5" />
        <line x1="-13" y1="3.5" x2="13" y2="3.5" />
      </g>
    );
    case "grid": return (
      <g {...s}>
        <line x1="0" y1="-12" x2="0" y2="12" strokeWidth={1.8} />
        <line x1="-9" y1="-8" x2="9" y2="-8" />
        <line x1="-6" y1="-3" x2="6" y2="-3" />
        <line x1="-9" y1="-8" x2="-4" y2="12" />
        <line x1="9" y1="-8" x2="4" y2="12" />
        <line x1="-2" y1="-12" x2="2" y2="-12" />
      </g>
    );
    case "ess": return (
      <g {...s}>
        <rect x="-13" y="-10" width="24" height="20" rx="2" />
        <rect x="11" y="-5" width="4" height="10" rx="1" fill={color} fillOpacity={0.4} />
        <line x1="-7" y1="-6" x2="-7" y2="6" strokeWidth={1.6} />
        <line x1="-1" y1="-6" x2="-1" y2="6" strokeWidth={1.6} />
        <line x1="5" y1="-6" x2="5" y2="6" strokeWidth={1.6} />
      </g>
    );
    case "pcc": return (
      <g {...s}>
        <line x1="-14" y1="0" x2="14" y2="0" strokeWidth={2} />
        <line x1="-10" y1="0" x2="-10" y2="-10" />
        <line x1="0" y1="0" x2="0" y2="-10" />
        <line x1="10" y1="0" x2="10" y2="-10" />
        <line x1="-10" y1="0" x2="-10" y2="10" />
        <line x1="10" y1="0" x2="10" y2="10" />
        <circle cx="0" cy="0" r="3" fill={color} />
      </g>
    );
    case "pcs": return (
      <g {...s}>
        <rect x="-12" y="-10" width="24" height="20" rx="2" />
        <path
          d="M -7 4 C -3 -2, 1 8, 5 0 S 9 6, 9 4"
          fill="none"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <line x1="-8" y1="8" x2="8" y2="8" strokeWidth="1.2" />
      </g>
    );
    case "charging": return (
      <g fill={color}>
        <path d="M -2 -12 L -6 -2 L -1 -2 L -5 8 L 7 -4 L 1 -4 L 5 -12 Z" />
      </g>
    );
    default: return null;
  }
}

// ─── Topology SVG ─────────────────────────────────────────────────────────────
// Labels are placed directly below each node icon inside the SVG.
// 左列：光伏 ↓ PCC ↓ PCS；右列：电网 / 充电桩群 / 储能（与充电桩群同列）
// 放电流向：储能 → PCS → PCC → 充电桩
// 拓扑节点色：大电网深蓝 | 光伏金黄 | 储能青/蓝绿 | 负载紫/橙/灰
const TOPO_COLORS = {
  grid: "#1E40AF",
  solar: "#F97316",
  ess: "#14B8A6",
  pcs: "#06B6D4",
  pcc: "#2563EB",
  load: "#8B5CF6",
  standby: "#64748B",
} as const;

const TOPO_NODES = [
  { id: "solar",    label: "光伏系统", value: "待机",        accent: TOPO_COLORS.solar, cx: 70,  cy: 38  },
  { id: "grid",     label: "公共电网", value: "待机",        accent: TOPO_COLORS.grid,  cx: 290, cy: 38  },
  { id: "pcc",      label: "并网点",   value: "896.5 kW",    accent: TOPO_COLORS.pcc,   cx: 70,  cy: 188 },
  { id: "charging", label: "充电桩群", value: "230 kW",      accent: TOPO_COLORS.load,  cx: 290, cy: 188 },
  { id: "pcs",      label: "变流器",   value: `${STORAGE_DISCHARGE_KW} kW`, accent: TOPO_COLORS.pcs,   cx: 70,  cy: 348 },
  { id: "ess",      label: "储能柜",   value: `SOC ${STORAGE_SOC}% · ${STORAGE_STATE}`, accent: SOC_ACCENT, cx: 290, cy: 348 },
];

function getTopoNodeColor(node: (typeof TOPO_NODES)[number]) {
  return node.value === "待机" ? TOPO_COLORS.standby : node.accent;
}
const TOPO_FLOW_ACTIVE = "#3B82F6";
const TOPO_FLOW_INACTIVE = "#64748B";
const TOPO_FLOW_DASH = "0 6";
const TOPO_ACTIVE_MOTION_PATH =
  "M 260 348 L 100 348 L 70 348 L 70 318 L 70 218 L 70 188 L 100 188 L 260 188";

const TOPO_FLOWS: { id: string; x1: number; y1: number; x2: number; y2: number; fy1?: number; active: boolean }[] = [
  { id: "solar-pcc",    x1: 70,  y1: 68,  x2: 70,  y2: 158, active: false },
  { id: "grid-pcc",     x1: 290, y1: 68,  x2: 70,  y2: 158, active: false },
  { id: "ess-pcs",      x1: 260, y1: 348, x2: 100, y2: 348, active: true  },
  { id: "pcs-pcc",      x1: 70,  y1: 318, x2: 70,  y2: 218, active: true  },
  { id: "pcc-charging", x1: 100, y1: 188, x2: 260, y2: 188, active: true  },
];

const TOPO_VIEW_W = 360;
const TOPO_VIEW_H = 440;

function topoTooltipStyle(nodeId: string): CSSProperties {
  const node = TOPO_NODES.find(n => n.id === nodeId);
  if (!node) return {};
  const top = `${((node.cy / TOPO_VIEW_H) * 100).toFixed(2)}%`;
  const onRight = node.cx > TOPO_VIEW_W / 2;
  if (onRight) {
    return { top, right: "0", transform: "translateY(-38%)" };
  }
  return { top, left: "38%", transform: "translateY(-38%)" };
}

function TopologySVG({ onHover }: { onHover: (id: string | null) => void }) {
  return (
    <svg
      viewBox={`0 0 ${TOPO_VIEW_W} ${TOPO_VIEW_H}`}
      preserveAspectRatio="xMidYMin meet"
      className="block w-full h-auto overflow-visible"
    >
      {/* Dotted connection lines */}
      {TOPO_FLOWS.map(f => {
        const y1 = f.fy1 ?? f.y1;
        return (
          <line key={f.id} x1={f.x1} y1={y1} x2={f.x2} y2={f.y2}
            stroke={f.active ? TOPO_FLOW_ACTIVE : TOPO_FLOW_INACTIVE}
            strokeOpacity={f.active ? 0.95 : 0.55}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={TOPO_FLOW_DASH} />
        );
      })}

      {/* Single dot traveling the full active path */}
      <circle r="4.5" fill={TOPO_FLOW_ACTIVE}
        style={{ filter: `drop-shadow(0 0 5px ${TOPO_FLOW_ACTIVE}99)` }}>
        <animateMotion dur="3s" repeatCount="indefinite" path={TOPO_ACTIVE_MOTION_PATH} />
      </circle>

      {/* Nodes */}
      {TOPO_NODES.map(node => {
        const color = getTopoNodeColor(node);
        return (
        <g key={node.id}
          transform={`translate(${node.cx},${node.cy})`}
          onMouseEnter={() => onHover(node.id)}
          onMouseLeave={() => onHover(null)}>
          {/* Label bg sits below icon ring; circles drawn on top so ring is not clipped */}
          <rect x="-52" y="42" width="104" height="48" rx="2" fill="var(--topo-label-bg)" />
          <circle r="40" fill={color} fillOpacity="0.06" />
          <circle r="30" fill="var(--topo-node-bg)" stroke={color} strokeWidth="1.8"
            style={{ filter: `drop-shadow(0 0 7px ${color}40)` }} />
          <g transform="scale(1.25)">
            <NodeIcon type={node.id} color={color} />
          </g>
          <text y="58" textAnchor="middle" fontSize="13"
            fill={node.id === "ess" ? color : "var(--topo-label-text)"}
            fontFamily="Inter, sans-serif" pointerEvents="none">{node.label}</text>
          <text y="77" textAnchor="middle" fontSize="12"
            fill={node.id === "ess" ? color : ("valueColor" in node && node.valueColor ? node.valueColor : "var(--topo-label-text)")}
            fontFamily="JetBrains Mono, monospace" pointerEvents="none">{node.value}</text>
          {/* Expanded hit area — drawn last, stable hover target */}
          <circle r="54" fill="transparent" stroke="none" style={{ cursor: "pointer" }} />
        </g>
        );
      })}
    </svg>
  );
}

// ─── SOC Horizontal Battery Gauge ─────────────────────────────────────────────
// ─── Arc Gauge (speedometer / dial style) ─────────────────────────────────────
// 270° sweep from 135° (7-o'clock) clockwise to 45° (5-o'clock), gap at bottom.
// Uses strokeDasharray on a rotated circle — cleanest SVG arc approach.
function ArcGauge({
  value, color, centerLabel, labelHelp, labelColor, valueColor, glow = true, helpIconClassName, overlay,
}: {
  value: number; color: string; centerLabel: string;
  labelHelp?: string;
  labelColor?: string;
  valueColor?: string;
  glow?: boolean;
  helpIconClassName?: string;
  overlay?: ReactNode;
}) {
  const cx = 90, cy = 100, r = 60;
  const circ = 2 * Math.PI * r;
  const arcLen = circ * (270 / 360);
  const valueDash = arcLen * Math.min(value, 100) / 100;
  const tipAngle = ((valueDash / circ) * 360 + 135) * (Math.PI / 180);
  const tipX = cx + r * Math.cos(tipAngle);
  const tipY = cy + r * Math.sin(tipAngle);

  const ticks = [0, 25, 50, 75, 100].map(p => {
    const rad = (135 + 270 * p / 100) * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    return {
      p,
      ix: cx + (r - 6) * cos, iy: cy + (r - 6) * sin,
      ox: cx + (r + 5) * cos, oy: cy + (r + 5) * sin,
      lx: cx + (r + 20) * cos, ly: cy + (r + 20) * sin,
    };
  });

  const centerFill = valueColor ?? color;
  const arcGlow = glow ? { filter: `drop-shadow(0 0 6px ${color}80)` } : undefined;

  return (
    <div className="relative isolate flex-1 min-w-0">
      <svg viewBox="0 10 180 162" className="relative z-0 w-full">
        {/* Background arc */}
        <circle cx={cx} cy={cy} r={r}
          fill="none" stroke="var(--gauge-track)" strokeWidth="9"
          strokeDasharray={`${arcLen.toFixed(1)} ${(circ - arcLen).toFixed(1)}`}
          transform={`rotate(135 ${cx} ${cy})`} strokeLinecap="butt" />
        {/* Value arc — butt cap avoids a round blob at the 0% origin */}
        <circle cx={cx} cy={cy} r={r}
          fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${valueDash.toFixed(1)} ${(circ - valueDash).toFixed(1)}`}
          transform={`rotate(135 ${cx} ${cy})`} strokeLinecap="butt"
          style={arcGlow} />
        {value > 0 && (
          <circle cx={tipX} cy={tipY} r={4.5} fill={color}
            style={arcGlow} />
        )}
        {/* Tick marks + labels */}
        {ticks.map(t => (
          <g key={t.p}>
            <line x1={t.ix} y1={t.iy} x2={t.ox} y2={t.oy}
              stroke="var(--gauge-tick)" strokeWidth="1.5" strokeLinecap="round" />
            <text x={t.lx} y={t.ly + 3.5} textAnchor="middle"
              fontSize="8" fill="var(--chart-axis)" fontFamily="JetBrains Mono, monospace">{t.p}</text>
          </g>
        ))}
        {/* Center value + label */}
        <text x={cx} y={cy + 8} textAnchor="middle"
          fontSize="24" fontWeight="700" fill={centerFill}
          fontFamily="JetBrains Mono, monospace"
          style={glow ? { filter: `drop-shadow(0 0 10px ${color}50)` } : undefined}>
          {value.toFixed(2)}%
        </text>
        {labelHelp ? (
          <foreignObject x={cx - 42} y={cy + 13} width={84} height={14} className="overflow-visible">
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              className="flex h-full items-center justify-center gap-0.5"
              style={{ fontSize: 9, lineHeight: "9px", color: labelColor ?? "var(--chart-axis)" }}
            >
              <span>{centerLabel}</span>
              <ConceptHelpTip text={labelHelp} placement="top" iconClassName={cn("h-2.5 w-2.5", helpIconClassName)} />
            </div>
          </foreignObject>
        ) : (
          <text x={cx} y={cy + 24} textAnchor="middle" fontSize="9" fill={labelColor ?? "var(--chart-axis)"}>{centerLabel}</text>
        )}
      </svg>
      {overlay ? (
        <div className="pointer-events-none absolute inset-0 z-30">
          {overlay}
        </div>
      ) : null}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
const PRIMARY_TABS = ["场站总览", "新能源收益", "运行", "台账", "功率因数", "储能测算", "能效"];
const SECONDARY_TABS = ["光伏系统", "储能系统", "充电系统", "单线图"];

function Header({
  primaryTab, setPrimaryTab, secondaryTab, setSecondaryTab,
  isDark, setIsDark, showNotif, onBell, onCloseNotif,
}: {
  primaryTab: string; setPrimaryTab: (t: string) => void;
  secondaryTab: string; setSecondaryTab: (t: string) => void;
  isDark: boolean; setIsDark: (v: boolean) => void;
  showNotif: boolean;
  onBell: () => void;
  onCloseNotif: () => void;
}) {
  const bellRef = useRef<HTMLButtonElement>(null);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <button className="group flex flex-shrink-0 items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100">钱塘江源网荷储虚拟电厂</span>
            <ChevronDown className="h-4 w-4 text-slate-500 transition-colors group-hover:text-slate-700 dark:group-hover:text-slate-300" />
          </button>
          <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">虚拟电厂</span>
          <span className="flex items-center gap-1.5 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-2.5 py-0.5 text-xs font-medium text-[#22C55E]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />
            正常运行中
          </span>
          <span className="hidden font-mono text-xs text-slate-500 sm:inline">2026-05-21 14:32:08</span>
          <button className="hidden rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            ref={bellRef}
            onClick={onBell}
            aria-label="通知中心"
            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-blue-500/5 hover:text-blue-500 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF3B30] text-[9px] font-bold leading-none text-white">7</span>
          </button>
          {showNotif && createPortal(
            <NotificationPopover anchorRef={bellRef} onClose={onCloseNotif} />,
            document.body,
          )}
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label={isDark ? "切换为浅色模式" : "切换为暗黑模式"}
            title={isDark ? "浅色模式" : "暗黑模式"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-blue-500/5 hover:text-blue-500 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className={cn("flex overflow-x-auto px-4 sm:px-5", UI.borderB)}>
        {PRIMARY_TABS.map(tab => (
          <button key={tab} onClick={() => setPrimaryTab(tab)}
            className={cn("relative flex-shrink-0 px-3.5 py-2.5 text-xs transition-colors",
              primaryTab === tab ? "font-semibold text-blue-500 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200")}>
            {tab}
            {primaryTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-blue-500" />}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-5">
        {SECONDARY_TABS.map(tab => (
          <button key={tab} onClick={() => setSecondaryTab(tab)}
            className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              secondaryTab === tab
                ? "bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.35)]"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-[#1E2736] dark:hover:text-slate-200")}>
            {tab}
          </button>
        ))}
      </div>
    </Card>
  );
}

// ─── 数据概览 (with Topology) ──────────────────────────────────────────────────
const StorageInfoCard = forwardRef<HTMLDivElement>(function StorageInfoCard(_, ref) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showAiTip, setShowAiTip] = useState(false);
  const [showLowSocWarning, setShowLowSocWarning] = useState(true);
  const tooltip = hoveredNode ? tooltipContent[hoveredNode] : null;

  return (
    <Card ref={ref}>
      <SectionTitle title="数据概览" />
      <div className="flex flex-col gap-4 px-3 pb-[14px] pt-3 sm:px-4 lg:flex-row lg:items-start lg:gap-0">
        {/* LEFT 38%: Topology SVG — labels rendered inside SVG below each node */}
        <div className="relative w-full flex-shrink-0 self-start lg:w-[38%] lg:pr-4">
          <div className="relative w-full">
            <TopologySVG onHover={setHoveredNode} />
            {hoveredNode && tooltip && (
              <div
                className="pointer-events-none absolute z-30 w-44 rounded-lg border border-border bg-popover p-3 shadow-2xl"
                style={topoTooltipStyle(hoveredNode)}
              >
                <div className={cn("mb-2 text-[11px] font-semibold", UI.textTitle)}>{tooltip.title}</div>
                {tooltip.items.map(it => (
                  <div key={it.l} className="flex justify-between gap-2 py-0.5 text-[10px]">
                    <span className="shrink-0 text-muted-foreground">{it.l}</span>
                    <span className="text-right font-mono text-foreground">{it.v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="absolute inset-y-0 right-0 hidden w-px bg-border lg:block" />
        </div>

        {/* RIGHT 62%: KPI Grid */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 lg:pl-5">
          {/* 2×2 metric cards */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "当前功率",         value: String(STORAGE_DISCHARGE_KW), unit: "kW",  tag: STORAGE_STATE as string | null },
              { label: "今日充电量",       value: "1,234", unit: "kWh", tag: null },
              { label: "今日放电量",       value: "980",   unit: "kWh", tag: null },
              { label: "累计等效循环次数", value: "342",   unit: "次",  tag: null, help: CONCEPT_HELP.cycleCount },
            ].map(m => (
              <div key={m.label} className={UI.kpiCard}>
                <div className={cn("mb-1 flex items-center gap-1 text-[10px]", UI.textTitle)}>
                  <span>{m.label}</span>
                  {("help" in m && m.help) ? <ConceptHelpTip text={m.help} /> : null}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[22px] font-bold leading-none text-foreground">
                    {m.value}
                  </span>
                  <span className={cn("text-xs", UI.textTitle)}>{m.unit}</span>
                  {m.tag && (
                    <span className="self-center rounded-full border border-[#EAB308]/40 bg-[#EAB308]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#EAB308]">
                      {m.tag}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* SOC + Efficiency arc gauges, each with its own tip cell */}
          <div className="flex gap-2 mt-3">
            {/* SOC gauge + low-charge warning */}
            <div className="flex-1 flex flex-col">
              <ArcGauge
                value={STORAGE_SOC}
                color={SOC_ACCENT}
                centerLabel="SOC 荷电状态"
                labelHelp={CONCEPT_HELP.soc}
                overlay={showLowSocWarning ? (
                  <div className="pointer-events-auto absolute inset-x-0 bottom-[7%] flex translate-y-[5px] items-center justify-center">
                    <div className="relative w-4/5 max-w-full">
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0"
                        style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "6px solid rgba(249,115,22,0.35)" }} />
                      <div className="flex items-center gap-1.5 rounded-md border border-[#F97316]/30 bg-card/95 py-1.5 pl-2 pr-1.5 shadow-sm backdrop-blur-[2px]">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0 text-[#F97316]" />
                        <span className="flex-1 text-center text-[10px] font-medium leading-none text-[#F97316]">低电量预警，请及时充电</span>
                        <button
                          type="button"
                          onClick={() => setShowLowSocWarning(false)}
                          className="inline-flex shrink-0 items-center justify-center text-[#F97316]/70 transition-colors hover:text-[#F97316]"
                          aria-label="关闭低电量预警"
                        >
                          <X className="h-3 w-3" />
                        </button>
                  </div>
                </div>
              </div>
                ) : undefined}
              />
            </div>
            {/* Efficiency gauge + AI tip */}
            <div className="flex-1 flex flex-col">
              <ArcGauge
                value={60.12}
                color={EFFICIENCY_GAUGE_COLOR}
                centerLabel="累计综合效能"
                valueColor="var(--foreground)"
                glow
                overlay={
                  <div className="pointer-events-auto absolute inset-x-0 bottom-[7%] flex translate-y-[5px] items-center justify-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <span className="text-[10px] font-medium leading-none">AI效能查看</span>
                    <div className="relative"
                      onMouseEnter={() => setShowAiTip(true)}
                      onMouseLeave={() => setShowAiTip(false)}>
                      <button
                          className="flex items-center justify-center transition-colors hover:text-foreground"
                      >
                          <Info className="h-3 w-3" />
                      </button>
                      {showAiTip && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 z-40">
                            <div className={cn(UI.popover, "border-blue-500/30 p-3 text-[10px] leading-relaxed", UI.textBody)}>
                            <div className="flex items-center gap-1.5 mb-1.5 text-[#3B82F6] font-semibold text-[11px]">
                              <Bot className="h-3 w-3" />
                              AI 效能分析
                            </div>
                            当前综合效能 60.12%，处于正常区间。建议在峰时段优先放电，谷时段充电，预计可提升效能至 65% 以上。
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                            style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid rgba(59,130,246,0.3)" }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                }
              />
            </div>
          </div>

        </div>
      </div>
    </Card>
  );
});

// ─── 设备详情弹窗 ──────────────────────────────────────────────────────────────
function DeviceDetailModal({ device, onClose }: { device: Device; onClose: () => void }) {
  const statusLabel = { online: "正常", warning: "告警", offline: "离线", fault: "故障" } as const;
  const statusColor = { online: "#22C55E", warning: "#FF3B30", offline: "#64748B", fault: "#FF3B30" } as const;
  const typeLabel   = { pcs: "PCS 变流器", bms: "BMS 管理系统", hvac: "热管理系统", fire: "消防系统", meter: "电表" } as const;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const metrics = [
    { label: "设备类型", value: typeLabel[device.type as keyof typeof typeLabel] ?? device.type },
    { label: "当前状态", value: statusLabel[device.status], color: statusColor[device.status] },
    { label: "运行数值", value: device.value },
    { label: "设备信息", value: device.detail },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={cn("flex items-center gap-3 px-5 py-4", UI.borderB)}>
          <StatusDot status={device.status} detail={device.detail} />
          <div className="flex-1 min-w-0">
            <h2 className={cn("text-sm font-semibold truncate", UI.textTitle)}>{device.name}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">{device.id}</p>
          </div>
          <button onClick={onClose}
            className={cn("flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors", UI.hoverRow, "hover:text-foreground")}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Metrics grid */}
        <div className={cn("grid grid-cols-2 gap-px bg-border", UI.borderB)}>
          {metrics.map(m => (
            <div key={m.label} className="bg-card px-4 py-3">
              <div className="text-[10px] text-muted-foreground mb-1">{m.label}</div>
              <div className="text-xs font-semibold" style={{ color: m.color ?? undefined }}>{m.value}</div>
            </div>
          ))}
        </div>
        {/* Issues */}
        {device.issues.length > 0 && (
          <div className={cn("px-5 py-3", UI.borderB)}>
            <div className="text-[11px] font-semibold text-muted-foreground mb-2">告警 / 需关注</div>
            <div className="space-y-2">
              {device.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ background: device.status === "warning" || device.status === "fault" || issue.severity === "alarm" ? "#FF3B30" : "#F97316" }} />
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-[11px]", UI.textBody)}>{issue.msg}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground font-mono">{issue.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* AI Insight */}
        {device.aiInsight && (
          <div className={cn("px-5 py-3", UI.borderB)}>
            <div className="flex items-center gap-1.5 mb-2">
              <Bot className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">AI 建议</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{device.aiInsight}</p>
          </div>
        )}
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3">
          <button onClick={onClose}
            className={cn("flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground hover:border-slate-400 dark:hover:border-[#475569]")}>
            <ExternalLink className="h-3 w-3" />
            查看完整报告
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 设备状态 ──────────────────────────────────────────────────────────────────
function DeviceStatusCard({ height }: { height?: number }) {
  const [filter, setFilter] = useState("全部");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const getIcon = (type: string) => {
    const cls = "h-3.5 w-3.5";
    return type === "pcs" ? <Zap className={cls} /> : type === "bms" ? <BatteryCharging className={cls} /> :
      type === "hvac" ? <Wind className={cls} /> : type === "fire" ? <Shield className={cls} /> : <Server className={cls} />;
  };
  const statusLabel = { online: "正常", warning: "告警", offline: "离线", fault: "故障" };
  const statusColor = { online: "#22C55E", warning: "#FF3B30", offline: "#64748B", fault: "#FF3B30" };

  const alarmCount = devices.filter(d => d.status === "warning" || d.status === "fault").length;
  const warnCount  = devices.filter(d => d.issues.length > 0).length;
  const aiCount    = devices.filter(d => d.aiPrediction).length;

  const tabs = [
    { key: "全部",   label: "全部" },
    ...(alarmCount > 0 ? [{ key: "告警",   label: `告警 ${alarmCount}` }] : []),
    ...(warnCount  > 0 ? [{ key: "需关注", label: `需关注 ${warnCount}` }] : []),
    ...(aiCount    > 0 ? [{ key: "AI预警", label: `AI预警 ${aiCount}`  }] : []),
  ];

  const filteredDevices = useMemo(() => {
    const list = filter === "告警"   ? devices.filter(d => d.status === "warning" || d.status === "fault")
    : filter === "需关注" ? devices.filter(d => d.issues.length > 0)
      : filter === "AI预警" ? devices.filter(d => d.aiPrediction)
    : devices;
    return [...list].sort(compareDevices);
  }, [filter]);

  return (
    <>
    {selectedDevice && <DeviceDetailModal device={selectedDevice} onClose={() => setSelectedDevice(null)} />}
    <Card
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        height ? "h-full max-h-full" : "h-[24rem] max-h-[24rem] sm:h-[26rem] sm:max-h-[26rem]",
      )}
      style={height ? { height, maxHeight: height, minHeight: height } : undefined}
    >
      <SectionTitle title="设备状态" />
      {/* Filter chips */}
      <div className={cn("flex shrink-0 items-center gap-1.5 overflow-x-auto px-3 py-2.5 scrollbar-none", UI.borderB)}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={cn("flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
              filter === t.key ? UI.chipActive : UI.chipIdle)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">
          <div className={cn("h-full overflow-y-auto px-3 pt-2 pb-[15px] space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:rounded-full", UI.scrollArea)}>
        {filteredDevices.map(d => {
          const isAlarm = d.status === "warning" || d.status === "fault";
          return (
          <div key={d.id}
            className={cn("rounded-md border px-3 py-2.5 mx-0.5 transition-colors",
              isAlarm ? "border-[#FF3B30]/25 bg-[#FF3B30]/5" : "border-border bg-muted")}>
            <div className="flex items-center gap-2.5">
              <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md",
                d.status === "online" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" :
                isAlarm ? "bg-[#FF3B30]/15 text-[#FF3B30]" : "bg-slate-200 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400")}>
                {getIcon(d.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <StatusDot status={d.status} detail={d.detail} />
                  <div className="flex min-w-0 flex-1 items-center gap-0.5">
                    <span className={cn("min-w-0 truncate text-xs font-semibold", UI.textTitle)}>{d.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDevice(d)}
                      aria-label={`查看 ${d.name} 详情`}
                      className="flex-shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">{d.detail}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{d.value}</div>
                <div className="text-[10px] font-medium mt-0.5" style={{ color: statusColor[d.status] }}>{statusLabel[d.status]}</div>
              </div>
            </div>
            {/* Issues */}
            {d.issues.map((issue, i) => (
              <div key={i} className="flex items-center gap-2 mt-2">
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: isAlarm || issue.severity === "alarm" ? "#FF3B30" : "#F97316" }} />
                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <span className={cn("text-[11px]", UI.textSub)}>{issue.msg}</span>
                  {d.aiInsight && i === d.issues.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                      aria-expanded={expanded === d.id}
                      aria-label={expanded === d.id ? "收起解决建议" : "展开解决建议"}
                      className="flex-shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded === d.id && "rotate-180")} />
                    </button>
                  )}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{issue.time}</span>
              </div>
            ))}
            {expanded === d.id && d.aiInsight && (
              <div className={cn(UI.panelMd, "mt-2 px-2.5 py-2")}>
                <p className={cn("text-[10px] leading-relaxed", UI.textBody)}>
                  <span className="font-medium text-[#EA580C]">解决建议：</span>
                    {d.aiInsight}
                </p>
                  </div>
                )}
            {d.aiPrediction && (
              <AiPredictionPanel text={d.aiPrediction} className="mt-2" />
            )}
          </div>
          );
        })}
        </div>
          <div className={LIST_BOTTOM_FADE} />
        </div>
      </div>
    </Card>
    </>
  );
}

function formatCurvePowerLabel(power: number) {
  if (power > 0) return { tag: "充电", color: CURVE_CHARGE_COLOR };
  if (power < 0) return { tag: "放电", color: CURVE_DISCHARGE_COLOR };
  return { tag: "", color: "#94A3B8" };
}

// ─── 储能充放电曲线 ────────────────────────────────────────────────────────────
function CurveChartTooltip({ active, payload }: {
  active?: boolean;
  payload?: { payload: CurveChartPlotPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  if (!row) return null;
  const label = row.time;
  const { tag, color } = formatCurvePowerLabel(row.power);
  const tariffPeriod = getTariffPeriod(label);
  return (
    <div className={cn(UI.popover, "p-3 text-xs")}>
      <p className="mb-2 text-muted-foreground">
      {label}
        {tariffPeriod ? (
          <span className="ml-1.5 font-medium" style={{ color: tariffPeriod.labelFill }}>
            {tariffPeriod.label}
          </span>
        ) : null}
      </p>
      <div className="flex items-center gap-2 py-0.5">
        <span className="h-1.5 w-3.5 rounded-full bg-[#22C55E]" />
        <span className={UI.textSub}>SOC (%)</span>
        <span className="ml-auto font-mono text-foreground">{row.soc.toFixed(1)}%</span>
      </div>
      <div className="flex items-center gap-2 py-0.5">
        <span className="h-1.5 w-3.5 rounded-full" style={{ background: color }} />
        <span className={UI.textSub}>储能充放电功率</span>
        <span className="ml-auto font-mono" style={{ color }}>
          {row.power.toFixed(2)} kW{tag ? ` · ${tag}` : ""}
        </span>
      </div>
    </div>
  );
}

function ChargeCurveCard() {
  const [chartDate, setChartDate] = useState("2026-05-21");
  return (
    <Card className={cn("flex min-h-0 flex-col pb-2", ROW2_MODULE_HEIGHT)}>
      <SectionTitle
        title="储能充放电曲线"
        help={CONCEPT_HELP.chargeCurve}
        right={
          <div className="flex items-center gap-3">
            <ChartDateNavigator
              label={chartDate}
              onPrev={() => setChartDate("2026-05-20")}
              onNext={() => setChartDate("2026-05-21")}
            />
            <div className={cn("flex items-center gap-2 text-[10px] text-muted-foreground pl-2 border-l border-border")}>
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-4 rounded-full inline-block" style={{ background: CURVE_DISCHARGE_COLOR }} />放电（kW）
        </span>
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-4 rounded-full inline-block" style={{ background: CURVE_CHARGE_COLOR }} />充电（kW）
        </span>
              <span className="flex items-center gap-1">
          <span className="h-0.5 w-4 rounded-full bg-[#22C55E] inline-block" />SOC（%）
        </span>
      </div>
        </div>
        }
      />
      <div className="relative min-h-0 flex-1 px-1.5 pt-2 pb-0">
        <span
          className="pointer-events-none absolute top-2 z-10 text-[10px] italic leading-none text-muted-foreground"
          style={{ left: 0, width: CHART_Y_AXIS_WIDTH, textAlign: "right", paddingRight: 4 }}
        >kW</span>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={curveChartPlotData} margin={{ top: 16, right: 36, left: 0, bottom: 0 }}>
            <CartesianGrid yAxisId="power" strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} strokeOpacity={0.8} />
            <XAxis
              dataKey="hour"
              type="number"
              domain={[0, 24]}
              {...axisStyle}
              ticks={[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]}
              tickFormatter={hour => `${String(hour).padStart(2, "0")}:00`}
              allowDecimals={false}
            />
            <YAxis yAxisId="power" orientation="left" {...axisStyle} domain={[-1.9, 0.45]}
              width={CHART_Y_AXIS_WIDTH} tick={<PowerYAxisTick />} ticks={[-1.8, -1.2, -0.6]} />
            <YAxis yAxisId="soc" orientation="right" {...axisStyle} domain={[0, 100]} width={36}
              tickFormatter={v => `${v}%`} ticks={[25, 50, 75, 100]} />
            {TARIFF_PERIODS.map(period => (
              <ReferenceArea
                key={`${period.start}-${period.end}`}
                x1={timeLabelToHour(period.start)}
                x2={timeLabelToHour(period.end)}
                yAxisId="power"
                fill={period.fill}
                fillOpacity={period.fillOpacity}
                strokeOpacity={0}
                label={{
                  value: period.label,
                  position: "insideTop",
                  fill: period.labelFill,
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />
            ))}
            <Tooltip content={<CurveChartTooltip />} />
            <ReferenceLine yAxisId="power" y={0} stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={1} strokeOpacity={0.55} />
            <Area yAxisId="power" type="monotone" dataKey="dischargePower" stroke="none"
              fill={CURVE_DISCHARGE_COLOR} fillOpacity={CURVE_POWER_FILL} baseValue={0}
              connectNulls isAnimationActive={false} tooltipType="none" />
            <Area yAxisId="power" type="monotone" dataKey="chargePower" stroke="none"
              fill={CURVE_CHARGE_COLOR} fillOpacity={CURVE_POWER_FILL} baseValue={0}
              connectNulls isAnimationActive={false} tooltipType="none" />
            <Line yAxisId="power" type="monotone" dataKey="dischargePower" name="放电"
              stroke={CURVE_DISCHARGE_COLOR} strokeWidth={2} dot={false} connectNulls tooltipType="none" />
            <Line yAxisId="power" type="monotone" dataKey="chargePower" name="充电"
              stroke={CURVE_CHARGE_COLOR} strokeWidth={2} dot={false} connectNulls tooltipType="none" />
            <Line yAxisId="soc" type="monotone" dataKey="soc" name="SOC"
              stroke={CURVE_SOC_COLOR} strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* 优化方案建议 */}
      <div className={cn("mx-4 mt-2 shrink-0 px-3 py-2", UI.panelDeep)}>
        <p className={cn("text-[11px] leading-relaxed", UI.textBody)}>
          <span className={cn("font-semibold", UI.textTitle)}>优化建议：</span>
          谷期（00:00–09:00）充电正常，但峰期放电深度过大，SOC 已降至 10.3%，建议控制峰期放电量并适当提高谷期充电功率。
        </p>
      </div>
    </Card>
  );
}

// ─── 电池一致性分析 ────────────────────────────────────────────────────────────
type BatteryStatus = "正常" | "需关注" | "告警";
interface BatteryItem {
  id: string; name: string; status: BatteryStatus;
  issues: { label: string; value: string }[];
  voltConsistency: BatteryStatus; tempConsistency: BatteryStatus;
  voltDelta: string; tempDelta: string;
  suggestion?: string;
  aiPrediction?: string;
}
const batteryList: BatteryItem[] = [
  { id: "RACK-01", name: "电池簇 01", status: "正常",   voltConsistency: "正常",   tempConsistency: "正常",   voltDelta: "30 mV", tempDelta: "3.3 °C",
    issues: [{ label: "压差", value: "30 mV" }, { label: "温差", value: "3.3 °C" }] },
  { id: "RACK-02", name: "电池簇 02", status: "需关注", voltConsistency: "需关注", tempConsistency: "正常",   voltDelta: "34 mV", tempDelta: "3.8 °C",
    issues: [{ label: "压差", value: "34 mV" }, { label: "温差", value: "3.8 °C" }],
    suggestion: "建议对该电池簇启动主动均衡，重点排查 #4、#9 号电芯，预计均衡完成后压差可降至 20 mV 以内。" },
  { id: "RACK-03", name: "电池簇 03", status: "正常",   voltConsistency: "正常",   tempConsistency: "正常",   voltDelta: "28 mV", tempDelta: "3.5 °C",
    issues: [{ label: "压差", value: "28 mV" }, { label: "温差", value: "3.5 °C" }],
    aiPrediction: "约 88 天后电芯压差将超出警戒阈值，建议提前安排均衡维护。" },
  { id: "RACK-04", name: "电池簇 04", status: "需关注", voltConsistency: "需关注", tempConsistency: "需关注", voltDelta: "33 mV", tempDelta: "4.2 °C",
    issues: [{ label: "压差", value: "33 mV" }, { label: "温差", value: "4.2 °C" }],
    suggestion: "温差偏高，建议检查冷却液流量及风道堵塞情况；同时对压差偏大电芯执行均衡策略，优先处理 #7 号电芯。" },
  { id: "RACK-05", name: "电池簇 05", status: "正常",   voltConsistency: "正常",   tempConsistency: "正常",   voltDelta: "27 mV", tempDelta: "3.5 °C",
    issues: [{ label: "压差", value: "27 mV" }, { label: "温差", value: "3.5 °C" }] },
  { id: "RACK-06", name: "电池簇 06", status: "告警",   voltConsistency: "告警",   tempConsistency: "需关注", voltDelta: "34 mV", tempDelta: "4.2 °C",
    issues: [{ label: "压差", value: "34 mV" }, { label: "温差", value: "4.2 °C" }],
    suggestion: "单体电压已低于安全阈值，建议立即停止放电并切换充电模式。重点检查 #12 号电芯，必要时进行容量标定或更换。" },
  { id: "RACK-07", name: "电池簇 07", status: "正常",   voltConsistency: "正常",   tempConsistency: "正常",   voltDelta: "31 mV", tempDelta: "3.7 °C",
    issues: [{ label: "压差", value: "31 mV" }, { label: "温差", value: "3.7 °C" }],
    aiPrediction: "约 105 天后温差可能超出需关注阈值，建议届时复检热管理系统。" },
  { id: "RACK-08", name: "电池簇 08", status: "需关注", voltConsistency: "需关注", tempConsistency: "需关注", voltDelta: "35 mV", tempDelta: "3.8 °C",
    issues: [{ label: "压差", value: "35 mV" }, { label: "温差", value: "3.8 °C" }],
    suggestion: "压差与温差同步偏高，建议降低该簇充放电倍率至 0.5C，并在下次维护窗口期安排全面检测。" },
];

function BatteryRow({ b, isFocused, rowRef, onToggle }: {
  b: BatteryItem; isFocused?: boolean; rowRef?: (el: HTMLDivElement | null) => void;
  onToggle?: (open: boolean) => void;
}) {
  const [exp, setExp] = useState(false);
  useEffect(() => { if (isFocused) setExp(true); }, [isFocused]);
  const toggle = () => setExp(v => {
    const next = !v;
    onToggle?.(next);
    return next;
  });
  const statusColor = { 正常: "#22C55E", 需关注: "#F97316", 告警: "#FF3B30" }[b.status];
  const statusBg    = { 正常: "#22C55E18", 需关注: "#F9731618", 告警: "#FF3B3018" }[b.status];
  return (
    <div ref={rowRef} className={cn("border-b border-border last:border-0 transition-colors",
      b.status === "告警" && "bg-[#FF3B30]/4",
      isFocused && "ring-1 ring-inset ring-blue-500/40 bg-blue-500/5")}>
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex items-center gap-1.5 flex-shrink-0 min-w-0">
          <span className={cn("text-[11px] font-semibold whitespace-nowrap", UI.textTitle)}>{b.name}</span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
          style={{ color: statusColor, background: statusBg }}>{b.status}</span>
        </div>
        <div className="ml-auto flex flex-shrink-0 flex-wrap justify-end gap-1">
          {b.issues
            .filter(iss => iss.label !== "单体低压")
            .map(iss => (
            <span key={iss.label} className={cn("rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]", UI.textSub)}>
              {iss.label}：<span className="font-mono" style={{ color: statusColor }}>{iss.value}</span>
            </span>
          ))}
        </div>
        <button onClick={toggle}
          className="flex-shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", exp && "rotate-180")} />
        </button>
      </div>
      {exp && (
        <div className="mx-3 mb-2.5 space-y-1.5">
          <div className={cn(UI.panelMd, "px-2.5 py-2")}>
            <div className="grid grid-cols-2 divide-x divide-border">
              {([
                {
                  title: "电压",
                  rows: [
                    { label: "一致性", value: b.voltConsistency, kind: "status" as const },
                    { label: "极差", value: b.voltDelta, kind: "metric" as const },
                  ],
                },
                {
                  title: "温度",
                  rows: [
                    { label: "一致性", value: b.tempConsistency, kind: "status" as const },
                    { label: "极差", value: b.tempDelta, kind: "metric" as const },
                  ],
                },
              ] as const).map((group, index) => (
                <div
                  key={group.title}
                  className={cn("min-w-0 space-y-1", index === 0 ? "pr-2.5" : "pl-2.5")}
                >
                  <div className={cn("text-[10px] font-semibold", UI.textSub)}>
                    {group.title}
                  </div>
                  {group.rows.map(row => {
                    const statusTone = row.kind === "status"
                      ? { 正常: "#22C55E", 需关注: "#F97316", 告警: "#FF3B30" }[row.value as BatteryStatus]
                      : undefined;
                    const statusBg = row.kind === "status" && statusTone
                      ? `${statusTone}18`
                      : undefined;
                return (
                      <div key={row.label} className="flex items-center justify-between gap-2 text-[10px] leading-tight">
                        <span className="shrink-0 text-muted-foreground">{row.label}</span>
                        {row.kind === "status" ? (
                          <span
                            className="ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                            style={{ color: statusTone, background: statusBg }}
                          >
                            {row.value}
                          </span>
                        ) : (
                          <span className="ml-auto shrink-0 text-right font-mono text-slate-700 dark:text-slate-300">
                            {row.value}
                          </span>
                        )}
                  </div>
                );
              })}
                </div>
              ))}
            </div>
          </div>
          {b.aiPrediction && <AiPredictionPanel text={b.aiPrediction} />}
          {b.suggestion && (
            <div className={cn(UI.panelMd, "px-2.5 py-2")}>
              <p className={cn("text-[10px] leading-relaxed", UI.textBody)}>
                <span className="font-medium text-[#EA580C]">解决建议：</span>
                {b.suggestion}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BatteryConsistencyCard() {
  const [tab,         setTab]         = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [focusedId,   setFocusedId]   = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const rowRefs   = useRef<Record<string, HTMLDivElement | null>>({});
  const listRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!focusedId) return;
    const el = rowRefs.current[focusedId];
    if (el && listRef.current) {
      const top = el.offsetTop - listRef.current.offsetTop;
      listRef.current.scrollTo({ top, behavior: "smooth" });
    }
  }, [focusedId]);

  const alarmCount = batteryList.filter(b => b.status === "告警").length;
  const warnCount  = batteryList.filter(b => b.status === "需关注").length;
  const aiCount    = batteryList.filter(b => !!b.aiPrediction).length;

  const tabs = [
    { key: "全部",   label: "全部" },
    { key: "告警",   label: `告警 ${alarmCount}` },
    { key: "需关注", label: `需关注 ${warnCount}` },
    { key: "AI预警", label: `AI预警 ${aiCount}` },
  ];

  const filtered = batteryList.filter(b => {
    if (tab === "告警")   return b.status === "告警";
    if (tab === "需关注") return b.status === "需关注";
    if (tab === "AI预警") return !!b.aiPrediction;
    return true;
  });

  const searchResults = batteryList.filter(b =>
    b.name.includes(searchQuery) || b.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (id: string) => {
    setFocusedId(id);
    setSearchOpen(false);
    setSearchQuery("");
    setTab("全部");
  };

  return (
    <Card className={cn("flex min-h-0 flex-col", ROW2_MODULE_HEIGHT)}>
      <div className="flex-shrink-0">
      <SectionTitle
        title="电池一致性分析"
        help={CONCEPT_HELP.consistency}
        right={
          <div ref={searchRef} className="relative">
            <div className={cn("flex items-center gap-1.5 px-2 py-1 transition-colors", UI.inputShell,
              searchOpen ? "border-blue-500/50" : "")}>
              <Search className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="搜索电池簇"
                className="w-24 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground outline-none"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {searchOpen && (
              <div className={cn("absolute right-0 top-full mt-1.5 w-52 z-30 overflow-hidden shadow-2xl", UI.popover)}>
                {searchResults.length === 0 ? (
                  <div className="px-3 py-3 text-[11px] text-muted-foreground text-center">无匹配结果</div>
                ) : (
                  searchResults.map(b => {
                    const c = { 正常: "#22C55E", 需关注: "#F97316", 告警: "#FF3B30" }[b.status];
                    return (
                      <button key={b.id} onClick={() => handleSelect(b.id)}
                        className={cn("w-full flex items-center gap-2 px-3 py-2 text-left transition-colors border-b border-border last:border-0",
                          UI.hoverRow, focusedId === b.id && "bg-secondary")}>
                        <span className={cn("flex-1 text-[11px]", UI.textTitle)}>{b.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{b.id}</span>
                        <span className="text-[10px] font-semibold" style={{ color: c }}>{b.status}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        }
      />
      </div>
      {/* Filter tabs */}
      <div className={cn("flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0", UI.borderB)}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setFocusedId(null); }}
            className={cn("flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
              tab === t.key ? UI.chipActive : UI.chipIdle)}>
            {t.label}
          </button>
        ))}
      </div>
      {/* Scrollable list — fills card to match 充放电曲线 height; expand scrolls inside */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={listRef}
          className={cn("h-full overflow-y-auto overscroll-contain px-3 pt-2 pb-2.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:rounded-full", UI.scrollArea)}
        >
        {filtered.map(b => (
          <BatteryRow key={b.id} b={b}
            isFocused={focusedId === b.id}
            rowRef={el => { rowRefs.current[b.id] = el; }}
              onToggle={open => {
                if (!open || !listRef.current) return;
                requestAnimationFrame(() => {
                  const el = rowRefs.current[b.id];
                  if (!el || !listRef.current) return;
                  const top = el.offsetTop - listRef.current.offsetTop;
                  listRef.current.scrollTo({ top, behavior: "smooth" });
                });
              }}
          />
        ))}
        {filtered.length === 0 && (
            <div className="flex h-20 items-center justify-center text-xs text-muted-foreground">无匹配数据</div>
        )}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[10px] rounded-b-lg bg-gradient-to-b from-transparent to-card" />
      </div>
    </Card>
  );
}

// ─── 储能充放电量 ──────────────────────────────────────────────────────────────
function formatVolumePeriodRange(anchor: Date, period: string): string {
  if (period === "月") {
    const end = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = new Date(end);
    start.setMonth(end.getMonth() - 7);
    const fmtMonth = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return `${fmtMonth(start)} ~ ${fmtMonth(end)}`;
  }
  if (period === "年") {
    const year = anchor.getFullYear();
    return `${year - 3} ~ ${year}`;
  }
  const end = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  const fmtFull = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fmtShort = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${fmtFull(start)} ~ ${fmtShort(end)}`;
}

function shiftVolumeAnchor(anchor: Date, period: string, delta: number): Date {
  const next = new Date(anchor);
  if (period === "月") next.setMonth(next.getMonth() + delta * 8);
  else if (period === "年") next.setFullYear(next.getFullYear() + delta * 4);
  else next.setDate(next.getDate() + delta * 7);
  return next;
}

function ChargeVolumeCard() {
  const [period, setPeriod] = useState("日");
  const [anchorDate, setAnchorDate] = useState(() => new Date(2026, 4, 21));
  const data = useMemo(() => getVolumeChartData(anchorDate, period), [anchorDate, period]);
  const summary = useMemo(() => summarizeVolumeChartData(data), [data]);
  const summaryLabels = getVolumeSummaryLabels(period);
  const periodRangeLabel = useMemo(
    () => formatVolumePeriodRange(anchorDate, period),
    [anchorDate, period],
  );

  return (
    <Card>
      <SectionTitle
        title="储能充放电量"
        right={
          <div className="flex items-center gap-3">
            <ChartPeriodToolbar
              granularity={period}
              onGranularityChange={setPeriod}
              periodLabel={periodRangeLabel}
              onPrev={() => setAnchorDate(d => shiftVolumeAnchor(d, period, -1))}
              onNext={() => setAnchorDate(d => shiftVolumeAnchor(d, period, 1))}
            />
            <div className={cn("flex items-center gap-2 text-[10px] text-muted-foreground pl-2 border-l border-border")}>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-500 inline-block" />充电</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#EAB308] inline-block" />放电</span>
            </div>
          </div>
        }
      />
      <div
        className="mx-4 mt-3 mb-3 flex items-baseline justify-center gap-8"
        aria-label="当前时间范围充放电量汇总"
      >
        {[
          { label: summaryLabels.charge, value: formatVolumeSummaryValue(summary.charge), color: "#3B82F6" },
          { label: summaryLabels.discharge, value: formatVolumeSummaryValue(summary.discharge), color: STORAGE_DISCHARGE_COLOR },
          { label: "当前状态", value: STORAGE_STATE, color: STORAGE_DISCHARGE_COLOR },
        ].map(s => (
          <div key={s.label} className="flex items-baseline gap-1.5">
            <span className="shrink-0 text-[10px] text-muted-foreground">{s.label}</span>
            <span className="whitespace-nowrap text-sm font-bold font-mono leading-none tabular-nums" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>
      <div className="px-4 pb-2 pt-3">
        <ResponsiveContainer width="100%" height={216}>
          <BarChart data={data} barGap={3} barCategoryGap="30%" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" {...axisStyle} />
            <YAxis {...axisStyle} width={42} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--chart-cursor)" }} />
            <Bar dataKey="充电" fill="#3B82F6" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => <Cell key={`charge-${i}`} fill="#3B82F6" />)}
            </Bar>
            <Bar dataKey="放电" fill={STORAGE_DISCHARGE_COLOR} radius={[3, 3, 0, 0]}>
              {data.map((_, i) => <Cell key={`discharge-${i}`} fill={STORAGE_DISCHARGE_COLOR} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─── 设备告警统计 ──────────────────────────────────────────────────────────────
function AlarmStatsCard({ onBarClick }: { onBarClick: (date: string) => void }) {
  const [period, setPeriod] = useState("日");
  const [anchorDate, setAnchorDate] = useState(() => new Date(2025, 7, 19));
  const [hiddenDevices, setHiddenDevices] = useState<Record<string, boolean>>({});
  const [hideEmptyDates, setHideEmptyDates] = useState(true);

  const periodRangeLabel = useMemo(
    () => formatAlarmPeriodRange(anchorDate, period),
    [anchorDate, period],
  );

  const chartRows = useMemo(() => {
    return getAlarmChartData(anchorDate, period)
      .map(row => {
        const display = { ...row } as Record<string, string | number>;
        let total = 0;
        for (const dev of ALARM_DEVICE_SERIES) {
          if (hiddenDevices[dev.key]) {
            display[dev.key] = 0;
            continue;
          }
          const count = row[dev.key as keyof typeof row] as number;
          display[dev.key] = count > 0 ? count : 0;
          total += count;
        }
        display.total = total;
        return display;
      })
      .filter(row => !hideEmptyDates || (row.total as number) > 0)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [anchorDate, period, hiddenDevices, hideEmptyDates]);

  const visibleDevices = ALARM_DEVICE_SERIES.filter(d => !hiddenDevices[d.key]);
  const lastKey = visibleDevices[visibleDevices.length - 1]?.key;

  const TotalLabel = (props: { x?: number; y?: number; width?: number; height?: number; index?: number }) => {
    const { x = 0, y = 0, width = 0, height = 0, index = 0 } = props;
    const row = chartRows[index];
    if (!row || !(row.total as number)) return null;
    return (
      <text x={x + width + 6} y={y + height / 2 + 4} fontSize={9} fill="var(--chart-axis)" textAnchor="start">
        共 {row.total} 次
      </text>
    );
  };

  const chartHeight = Math.max(chartRows.length * 36 + 24, chartRows.length === 0 ? 80 : 120);
  const yAxisWidth = period === "月" ? 48 : 44;

  return (
    <Card>
      <SectionTitle
        title="设备告警统计"
        right={
          <ChartPeriodToolbar
            granularity={period}
            onGranularityChange={setPeriod}
            granularityOptions={ALARM_GRANULARITY_OPTIONS}
            periodLabel={periodRangeLabel}
            onPrev={() => setAnchorDate(d => shiftVolumeAnchor(d, period, -1))}
            onNext={() => setAnchorDate(d => shiftVolumeAnchor(d, period, 1))}
          />
        }
      />
      <div className="flex items-center justify-between gap-3 px-4 pt-2">
        <p className="min-w-0 text-[10px] text-muted-foreground">
          {period === "月" ? "按设备统计各月告警次数，点击图表查看明细" : "按设备统计各日告警次数，点击图表查看明细"}
        </p>
        <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
          <Toggle
            on={hideEmptyDates}
            color="#3B82F6"
            onToggle={() => setHideEmptyDates(v => !v)}
          />
          <span className="whitespace-nowrap">{hideEmptyDates ? "隐藏无告警日期" : "显示无告警日期"}</span>
      </div>
      </div>
      {chartRows.length === 0 ? (
        <div className="flex items-center justify-center px-4 pb-6 pt-2 text-xs text-muted-foreground" style={{ height: chartHeight }}>
          该时段无告警记录
        </div>
      ) : (
      <div className="px-4 pb-2 pt-1" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartRows} layout="vertical" barSize={14} margin={{ top: 0, right: 56, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" horizontal={false} />
            <XAxis type="number" {...axisStyle} allowDecimals={false} />
            <YAxis type="category" dataKey="date" {...axisStyle} width={yAxisWidth} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--chart-cursor)" }} />
            {visibleDevices.map(dev => (
              <Bar
                key={dev.key}
                dataKey={dev.key}
                stackId="device"
                fill={dev.color}
                cursor="pointer"
                onClick={(d) => onBarClick(String((d as { date?: string }).date ?? ""))}
                radius={dev.key === lastKey ? [0, 3, 3, 0] : [0, 0, 0, 0]}
                label={dev.key === lastKey ? <TotalLabel /> : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      )}
      <div className={cn("flex flex-wrap items-center gap-3 px-4 py-2.5", UI.borderT)}>
        {ALARM_DEVICE_SERIES.map(dev => (
          <div key={dev.key} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Toggle
              on={!hiddenDevices[dev.key]}
              color={dev.color}
              onToggle={() => setHiddenDevices(prev => ({ ...prev, [dev.key]: !prev[dev.key] }))}
            />
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: dev.color }} />
              {dev.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Notification Popover ─────────────────────────────────────────────────────
const typeIcon = {
  告警: <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-[#FF3B30]" />,
  警告: <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-[#F97316]" />,
  提示: <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-[#3B82F6]" />,
};
const typeColor: Record<string, string> = { 告警: "#FF3B30", 警告: "#F97316", 提示: "#3B82F6" };

function NotificationPopover({
  anchorRef,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const [pos, setPos] = useState<{ top: number; right: number; arrowRight: number } | null>(null);

  useLayoutEffect(() => {
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({
        top: rect.bottom + 10,
        right: window.innerWidth - rect.right,
        arrowRight: rect.width / 2 - 7,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef]);

  if (!pos) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-[352px] rounded-lg border border-border bg-popover shadow-2xl"
        style={{ top: pos.top, right: pos.right }}
      >
        <div
          className="absolute -top-[7px] h-3.5 w-3.5 rotate-45 border-l border-t border-border bg-popover"
          style={{ right: pos.arrowRight }}
        />
        <div className={cn("flex items-center justify-between px-4 py-3", UI.borderB)}>
          <span className={cn("text-sm font-semibold", UI.textTitle)}>通知中心</span>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#FF3B30]/30 bg-[#FF3B30]/15 px-2 py-0.5 text-[11px] font-semibold text-[#FF3B30]">7 未读</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors rounded p-0.5"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <div className={cn("max-h-[390px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:rounded-full", UI.scrollArea)}>
          {(["告警", "警告", "提示"] as const).map(type => (
            <div key={type}>
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: typeColor[type] }}>{type} · {notifs[type].length}</span>
              </div>
              {notifs[type].map(n => (
                <div key={n.id} className={cn("flex items-start gap-3 border-b border-border px-4 py-2.5 transition-colors cursor-pointer", UI.hoverRow)}>
                  {typeIcon[type]}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-xs font-semibold", UI.textBody)}>{n.device}</span>
                      <span className="font-mono text-[10px] text-muted-foreground flex-shrink-0">{n.time}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{n.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className={cn("px-4 py-2.5 text-center", UI.borderT)}>
          <button className="text-xs text-blue-600 hover:text-blue-500 transition-colors dark:text-blue-400 dark:hover:text-blue-300">查看全部通知 →</button>
        </div>
      </div>
    </>
  );
}

// ─── SOC Critical Alert ───────────────────────────────────────────────────────
function SOCCriticalAlert({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-x-3 top-24 z-50 w-auto max-w-sm rounded-lg border border-[#FF3B30]/60 bg-popover shadow-2xl sm:inset-x-auto sm:right-6 sm:w-72">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#FF3B30]/40 bg-[#FF3B30]/15">
          <Bot className="h-4 w-4 text-[#FF3B30]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#FF3B30]">AI 紧急处置</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B30] animate-pulse" />
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-3.5 w-3.5" /></button>
          </div>
          <p className={cn("mt-2 text-[11px] leading-[1.6]", UI.textBody)}>
            <span className="font-mono font-bold text-[#FF3B30]">RACK-06</span> SOC 降至{" "}
            <span className="font-mono font-bold text-[#FF3B30]">{STORAGE_SOC}%</span>，低于安全阈值 15%。建议立即切换充电模式。
          </p>
          <div className="mt-3 flex gap-2">
            <button className="flex-1 rounded-md bg-[#FF3B30] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#e0332a] transition-colors">立即处置</button>
            <button onClick={onClose} className="flex-1 rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">稍后</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Alarm Detail Panel ───────────────────────────────────────────────────────
function AlarmDetailPanel({ date, onClose }: { date: string; onClose: () => void }) {
  const items = alarmDetailsByDate[date] || [];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-[400px] flex-col border-l border-border bg-card shadow-2xl">
        <div className={cn("px-6 py-4 flex-shrink-0", UI.borderB)}>
          <div className="flex items-start justify-between">
            <div>
              <div className={cn("text-sm font-bold", UI.textTitle)}>2025/{date} 告警明细</div>
              <div className="mt-1 text-[11px] text-muted-foreground">共 {items.length} 次</div>
              </div>
            <button onClick={onClose} className={cn("rounded-md p-1.5 text-muted-foreground transition-colors", UI.hoverRow, "hover:text-foreground")}><X className="h-4 w-4" /></button>
            </div>
          </div>
        <div className={cn("flex-1 overflow-y-auto px-4 py-3 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full", UI.scrollArea)}>
          {items.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">该日无告警记录</p>
          ) : items.map((item, i) => (
            <div key={i} className={cn("rounded-lg border border-border bg-muted/80 p-3")}>
              <p className={cn("text-xs font-semibold", UI.textTitle)}>{item.msg}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{item.device}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{item.time}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
function OverviewDeviceRow() {
  const storageRef = useRef<HTMLDivElement>(null);
  const [pairedHeight, setPairedHeight] = useState(0);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true,
  );

  useLayoutEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useLayoutEffect(() => {
    const node = storageRef.current;
    if (!node || !isDesktop) {
      setPairedHeight(0);
      return;
    }

    const syncHeight = () => {
      const next = Math.round(node.getBoundingClientRect().height);
      setPairedHeight(prev => (prev === next ? prev : next));
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [isDesktop]);

  const pairedStyle: CSSProperties | undefined = isDesktop && pairedHeight > 0
    ? { height: pairedHeight, maxHeight: pairedHeight, minHeight: pairedHeight }
    : undefined;

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,13fr)_minmax(0,7fr)]">
      <StorageInfoCard ref={storageRef} />
      <div className="min-h-0 overflow-hidden" style={pairedStyle}>
        <DeviceStatusCard height={isDesktop && pairedHeight > 0 ? pairedHeight : undefined} />
      </div>
    </div>
  );
}

export default function App() {
  const [primaryTab,   setPrimaryTab]   = useState("运行");
  const [secondaryTab, setSecondaryTab] = useState("储能系统");
  const [showNotif,    setShowNotif]    = useState(false);
  const [showSOCAlert, setShowSOCAlert] = useState(true);
  const [selectedAlarmDate, setSelectedAlarmDate] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    if (!showSOCAlert) return;
    const timer = window.setTimeout(() => setShowSOCAlert(false), 5000);
    return () => window.clearTimeout(timer);
  }, [showSOCAlert]);

  return (
    <div className={cn("min-h-screen overflow-x-hidden bg-background", isDark && "dark")}
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Inter, 'Noto Sans SC', sans-serif" }}>
      <div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:space-y-5 sm:p-4 lg:p-6">
        <Header
          primaryTab={primaryTab} setPrimaryTab={setPrimaryTab}
          secondaryTab={secondaryTab} setSecondaryTab={setSecondaryTab}
          isDark={isDark} setIsDark={setIsDark}
          showNotif={showNotif}
          onBell={() => setShowNotif(v => !v)}
          onCloseNotif={() => setShowNotif(false)}
        />
        {/* Rows 1+2 — aligned with main app: row height not driven by expanded battery rows */}
        <div className="space-y-5">
          <OverviewDeviceRow />
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,13fr)_minmax(0,7fr)]">
            <ChargeCurveCard />
            <BatteryConsistencyCard />
          </div>
        </div>
        {/* Row 3 — equal */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChargeVolumeCard />
          <AlarmStatsCard onBarClick={d => d && setSelectedAlarmDate(d)} />
        </div>
      </div>

      {showSOCAlert && <SOCCriticalAlert    onClose={() => setShowSOCAlert(false)} />}
      {selectedAlarmDate && <AlarmDetailPanel date={selectedAlarmDate} onClose={() => setSelectedAlarmDate(null)} />}
    </div>
  );
}
