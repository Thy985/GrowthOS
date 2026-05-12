// 应用常量
export const APP_NAME = 'GrowthOS';
export const APP_VERSION = '1.0.0';

import type { BadgeStats } from '../types';

// 存储键名常量
export const STORAGE_KEYS = {
  RECORDS: 'growth-records',
  TAGS: 'growth-tags',
  TREES: 'growth-trees',
  GOALS: 'growth-goals',
  REMINDERS: 'growth-reminders',
  USER: 'auth-user',
  USERS: 'auth-users',
  THEME: 'app-theme',
  SETTINGS: 'app-settings'
} as const;

// 存储键名类型
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// 情绪选项
export const MOOD_OPTIONS = [
  { value: '很好', label: '很好', emoji: '😊', color: 'green' },
  { value: '一般', label: '一般', emoji: '😐', color: 'yellow' },
  { value: '不太好', label: '不太好', emoji: '😔', color: 'red' }
] as const;

// 情绪类型
export type MoodValue = typeof MOOD_OPTIONS[number]['value'];

// 徽章配置
export const BADGES = [
  { id: 'first_record', name: '初次记录', icon: '🌱', description: '完成第一条记录', condition: (stats: BadgeStats) => stats.totalRecords >= 1 },
  { id: 'ten_records', name: '十次成长', icon: '🌿', description: '完成10条记录', condition: (stats: BadgeStats) => stats.totalRecords >= 10 },
  { id: 'fifty_records', name: '稳步前进', icon: '🌳', description: '完成50条记录', condition: (stats: BadgeStats) => stats.totalRecords >= 50 },
  { id: 'hundred_records', name: '百日成长', icon: '🏆', description: '完成100条记录', condition: (stats: BadgeStats) => stats.totalRecords >= 100 },
  { id: 'streak_3', name: '连续3天', icon: '🔥', description: '连续记录3天', condition: (stats: BadgeStats) => stats.streak >= 3 },
  { id: 'streak_7', name: '一周坚持', icon: '⭐', description: '连续记录7天', condition: (stats: BadgeStats) => stats.streak >= 7 },
  { id: 'streak_30', name: '月度坚持', icon: '💎', description: '连续记录30天', condition: (stats: BadgeStats) => stats.streak >= 30 },
  { id: 'active_week', name: '活跃周', icon: '🚀', description: '本周记录数增长50%以上', condition: (stats: BadgeStats) => stats.weeklyChangePercent >= 50 && stats.weeklyRecords >= 5 }
] as const;

// 徽章类型
export type BadgeId = typeof BADGES[number]['id'];

// 目标状态
export const GOAL_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

// 目标状态文本
export const GOAL_STATUS_TEXT = {
  [GOAL_STATUS.ACTIVE]: '进行中',
  [GOAL_STATUS.COMPLETED]: '已完成',
  [GOAL_STATUS.CANCELLED]: '已取消'
} as const;

// 树节点类型
export const TREE_NODE_TYPES = {
  SKILL: 'skill',
  HABIT: 'habit',
  KNOWLEDGE: 'knowledge'
} as const;

// 树节点状态
export const TREE_NODE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
} as const;

// 时间常量
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
} as const;

// 动画时长
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
} as const;

// Toast 显示时长
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 3000,
  LONG: 5000
} as const;

// 成长进度基准
export const GROWTH_BENCHMARKS = {
  STARTER: 10,
  JUNIOR: 50,
  SENIOR: 100,
  MASTER: 500
} as const;

// 表格配置
export const TABLE_CONFIG = {
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
} as const;

// 错误代码
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  STORAGE_ERROR: 'STORAGE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// 验证规则
export const VALIDATION = {
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  TAG_MAX_LENGTH: 30,
  MAX_TAGS: 10,
  MAX_RECORD_LENGTH: 1000
} as const;

// 默认值
export const DEFAULTS = {
  MOOD: '一般',
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm'
} as const;
