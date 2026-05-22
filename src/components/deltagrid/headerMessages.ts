import type { AlarmItem } from './types'
import { MOCK_ALARMS } from './constants'

export type MessageLevel = AlarmItem['level']

export const MESSAGE_LEVEL_LABELS: Record<
  MessageLevel,
  { label: string; dot: string; text: string; bg: string }
> = {
  critical: {
    label: '告警',
    dot: 'bg-danger',
    text: 'text-danger',
    bg: 'border-danger/20 bg-danger/5',
  },
  warning: {
    label: '警告',
    dot: 'bg-warning',
    text: 'text-warning',
    bg: 'border-warning/20 bg-warning/5',
  },
  info: {
    label: '提示',
    dot: 'bg-info',
    text: 'text-info',
    bg: 'border-info/20 bg-info/5',
  },
}

/** 今日报警日志（告警 / 警告 / 提示） */
export const TODAY_MESSAGES: AlarmItem[] = MOCK_ALARMS

export function countTodayMessages(messages: AlarmItem[]) {
  return {
    critical: messages.filter((item) => item.level === 'critical').length,
    warning: messages.filter((item) => item.level === 'warning').length,
    info: messages.filter((item) => item.level === 'info').length,
  }
}

export const TODAY_MESSAGE_COUNTS = countTodayMessages(TODAY_MESSAGES)

export const TODAY_MESSAGE_TOTAL = TODAY_MESSAGES.length

const LEVEL_ORDER: MessageLevel[] = ['critical', 'warning', 'info']

export function groupTodayMessages(messages: AlarmItem[]) {
  return LEVEL_ORDER.map((level) => ({
    level,
    meta: MESSAGE_LEVEL_LABELS[level],
    items: messages.filter((item) => item.level === level),
  })).filter((group) => group.items.length > 0)
}
