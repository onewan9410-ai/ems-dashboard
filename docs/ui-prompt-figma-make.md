# Figma Make 生成引导词 — 储能 EMS 运行看板 UI

> 将下文复制到 Figma Make / Figma AI 设计生成工具。建议先生成 **Dark Mode** 主画板，再复制为 Light Mode 替换色板。

---

## Prompt（英文主 prompt，Figma Make 识别更稳）

```
Design a desktop Energy Management System (EMS) dashboard for battery storage operations in a virtual power plant. Dark mode first. Target frame: 1440×1024 or 1600×960.

STYLE
- Modern B2B industrial SaaS, similar to Linear dark dashboard
- Background #0B0F14, cards #151B26, border 1px #334155 at 80% opacity
- Font: Inter + Noto Sans SC / PingFang SC for Chinese labels
- Corner radius 8px cards, 6px buttons, full-round pills
- Semantic colors: success #22C55E, warning #F59E0B, danger #FF3B30, info #3B82F6, charge blue #3B82F6, discharge orange #F59E0B
- Subtle shadows on cards only, no heavy glassmorphism

LAYOUT GRID (vertical stack, 24px gap, max-width 1600 centered, 24px padding)

ROW 1 — two columns 13:7 ratio, equal height
LEFT: "储能信息" card
RIGHT: "设备状态" card

ROW 2 — two columns 13:7, right column fixed height ~432px with internal scroll
LEFT: "储能充放电曲线" chart card
RIGHT: "电池一致性分析" card with tabs + rack list

ROW 3 — two equal columns
LEFT: "储能充放电量" bar chart card
RIGHT: "设备告警统计" horizontal stacked bar chart card

HEADER CARD (full width, spans above row 1)
Combined header module containing:
- Row A: site name "钱塘江源网荷储虚拟电厂" + chevron dropdown, pills "虚拟电厂"(blue), "正常运行中"(green dot), timestamp + refresh icon
- Row B: primary tabs — 场站总览, 新能源收益, 运行(active blue underline), 台账, 功率因数, 储能测算, 能效
- Row C: secondary tabs — 光伏系统, 储能系统(active blue fill), 充电系统, 单线图
- Top right: notification bell with red badge "7", theme toggle moon icon

OVERLAY COMPONENTS (separate variants)
1. Notification popover below bell: width 352px (22rem), height 450px, white/dark card, caret pointing up aligned to bell, grouped list 告警/警告/提示
2. SOC critical alert top-right floating: red border, AI icon, "AI 紧急处置", dismiss X
3. Alarm detail side panel overlay on right side of alarm chart when bar selected

Use Auto Layout everywhere. Use 8px spacing scale.
```

---

## 中文补充说明（可附在 Prompt 后）

### 画板结构（Frame Hierarchy）

```
📱 EMS Dashboard / 储能系统 / Dark
├── 🔴 Overlay / SOC Alert (optional variant)
├── 🔴 Overlay / Message Popover (hover variant)
├── 🟣 Header / 顶栏一体卡片
│   ├── TopBar（电厂信息 + 消息 + 主题）
│   ├── Nav / Primary Tabs
│   └── Nav / Secondary Tabs
├── 📊 Row1
│   ├── Card / 储能信息
│   │   ├── Topology 38%（源网荷储拓扑 SVG）
│   │   └── KPI Grid 62%
│   └── Card / 设备状态
├── 📊 Row2
│   ├── Card / 储能充放电曲线
│   └── Card / 电池一致性分析（固定高）
├── 📊 Row3
│   ├── Card / 储能充放电量
│   └── Card / 设备告警统计 + Detail Panel variant
```

---

## 模块视觉规格

### Header 顶栏
| 元素 | 规格 |
|---|---|
| 卡片 padding | 12–16px |
| 电厂名 | 16–18px Semibold `#F1F5F9` |
| 虚拟电厂 pill | 12px, border/info 30%, bg info 5% |
| 运行 pill | green dot 6px + text success |
| 主 Tab 高亮 | 14px, border-bottom 2px `#3B82F6` |
| 子 Tab 高亮 | 14px, bg info 10%, text info |
| 消息按钮 | 32×32, badge danger 16px 右上角 |
| 消息面板 | 352×450, pt 12 for caret, scroll list |

### 储能信息
| 区域 | 内容 |
|---|---|
| 拓扑 | 高 260px；节点图标：光伏板、换电站、储能柜、电网塔；蓝色流动虚线；无 hover 底色 |
| 当前功率 | Label 12px muted; Value 32px bold; Tag「放电中」orange pulse |
| 今日充放 | 32px 数值 + kWh 单位 14px |
| 循环次数 | 32px |
| SOC | 横向电池 gauge，≤20% 红色 |
| 效率环 | 圆环 60.12%，<70% 橙色；下挂 AI 诊断按钮 |

**Topology tooltip variant**
- Min width 168px, white/dark card, 8px radius
- Caret: 12px diamond, only top+left stroke, merges with panel border
- ESS tooltip: positioned right-shifted, caret inset 24px from left

**AI Diagnosis popover variant**
- Above button, warning border `#F59E0B` 40%, white/dark fill
- Caret pointing down centered

### 设备状态
- Filter chips row: 全部 / 告警(1) / 需关注(1) / 正常 / AI预警
- Device card: border light, padding 10–12px
- Issue row: colored left dot + title + time
- Expand link right-aligned 12px
- AI block: `border-l-4 border-info`, bg info 5%

### 储能充放电曲线
- Chart height ~208–240px
- Dual Y-axis: left kW, right %
- Area fills 12% opacity blue/orange
- Tariff bands: muted purple/gray vertical zones + legend chips
- Date nav center: `2025/08/21` +「当前」blue

### 电池一致性分析
- Module height locked 416–432px (26–27rem)
- Quick chips + search dropdown full width
- Rack row: name + status pills + chevron
- Metrics inline with `｜` divider
- AI cell: expandable chart 128px height inside blue-tint box

### 储能充放电量
- Grouped bar chart vertical
- X: dates MM/DD, Y: kWh
- Blue + orange bars side by side per day
- Controls: segmented 日/月/年 + date stepper

### 设备告警统计
- Horizontal stacked bars, Y=date labels
- X=count, right margin for「共 N 次」labels on bars
- Legend: toggle switches per device type (not just dots)
- Hint text 10px below title
- **Detail panel variant**: 288–320px wide, min-height 200px, slides from right over chart, dim mask gradient edges
- Checkbox「隐藏无告警日期」top right

---

## 交互原型标注（Figma Prototype）

为 Make 生成后手动补充连线，或在本 prompt 中要求标注：

| Hotspot | Trigger | Destination |
|---|---|---|
| Bell icon | Mouse enter | Message Popover frame |
| Topology node | Mouse enter | Tooltip variant (per node) |
| AI 效能诊断 | Mouse enter | Diagnosis popover |
| Alarm bar | On click | Detail panel visible |
| Detail mask | On click | Detail hidden |
| Theme btn | On click | Light mode frame |
| VPP chevron | On click | Dropdown open variant |

---

## 组件化建议（Figma Make 输出后整理）

创建 Components：
- `Card/Section` — padding 16, radius 8
- `Tab/Pill-Filter` — 告警/需关注/正常/AI 四色变体
- `Tab/Segmented` — 日/月/年
- `Tag/Status` — success warning danger info
- `Button/Icon-32` — border subtle
- `Popover/WithCaret` — top/bottom caret variants
- `Chart/Tooltip-Dark`
- `Topology/Node` — 4 types

---

## 设计 Token（Variables）

```
color/canvas       #0B0F14 | #F0F2F5
color/surface      #151B26 | #FFFFFF
color/border       #334155 | #E2E8F0
color/text/primary #F1F5F9 | #1E293B
color/text/muted   #8B9CB3 | #64748B
color/semantic/danger  #FF3B30
color/semantic/warning #F59E0B
color/semantic/success #22C55E
color/semantic/info    #3B82F6
color/energy/charge    #3B82F6
color/energy/discharge #F59E0B

font/size/kpi-1    32
font/size/kpi-2    18
font/size/kpi-3    12
font/size/title    14
font/size/axis     10

radius/card        8
radius/pill        999
spacing/module     16–20
```

---

## 交付物 Checklist

- [ ] 主画板 Dark + 组件覆盖
- [ ] Light mode 色板替换版
- [ ] Header + 4 行模块齐全
- [ ] 拓扑 hover 气泡 4 变体
- [ ] 消息面板 450px 变体
- [ ] 告警详情侧栏变体
- [ ] SOC 告警浮层变体
- [ ] 图表区域使用占位曲线/柱形（非 lorem）
- [ ] 中文文案与示例数据一致
- [ ] 8px grid / Auto Layout 可维护

---

## 参考 Mock 数据（文案一致）

```
电厂: 钱塘江源网荷储虚拟电厂
SOC: 10.00%
当前功率: -1.30 kW 放电中
今日充/放: 12.50 / 2.10 kWh
效率: 60.12%
消息: 告警2 警告3 提示2（展示列表共7条）
设备: 储能一体柜(告警3), 智能终端采集器(需关注1)
电池簇: RACK-C1 告警, RACK-A2 AI预警
```

---

## Figma Make 一句话极简 Prompt

若字数受限，使用：

> Dark B2B EMS dashboard, 1600px, Chinese UI. Header with VPP selector, tabs, bell notification popover 352×450 below icon, theme toggle. Row1: storage topology+KPIs | device status filters. Row2: power/SOC waveform | battery rack analysis scroll. Row3: charge/discharge bars | alarm stacked bars with side detail panel. Colors: bg #0B0F14, cards #151B26, blue #3B82F6, orange #F59E0B, red #FF3B30. Auto layout, 8px grid, industrial SaaS style.
