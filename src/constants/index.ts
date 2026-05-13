// 应用常量
export const APP_NAME = 'GrowthOS';
export const APP_VERSION = '1.0.0';

import type { BadgeStats, LLMConfig, LLMProvider } from '../types';

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

// === AI Agent 常量 ===

// AI 存储键
export const AI_STORAGE_KEYS = {
  LLM_CONFIG: 'ai_llm_config',
  CHAT_SESSIONS: 'ai_chat_sessions',
  RECENT_MESSAGES: 'ai_recent_messages',
  ARCHIVED_MESSAGES: 'ai_archived_messages',
  SETTINGS: 'ai_settings'
} as const;

// LLM 提供者配置
export const DEFAULT_LLM_CONFIGS: Record<LLMProvider, Omit<LLMConfig, 'apiKey'>> = {
  openai: {
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 1000,
    baseUrl: 'https://api.openai.com/v1'
  },
  anthropic: {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    temperature: 0.7,
    maxTokens: 1000,
    baseUrl: 'https://api.anthropic.com/v1'
  },
  deepseek: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 1000,
    baseUrl: 'https://api.deepseek.com/v1'
  },
  custom: {
    provider: 'custom',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 1000,
    baseUrl: ''
  }
} as const;

// LLM 提供者列表
export const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', icon: '🤖' },
  { value: 'anthropic', label: 'Anthropic', icon: '🌟' },
  { value: 'deepseek', label: 'DeepSeek', icon: '🚀' },
  { value: 'custom', label: '自定义', icon: '⚙️' }
] as const;

// 系统提示词
export const AI_SYSTEM_PROMPT = `你是 GrowthOS 的 AI 成长导师，帮助用户实现个人成长。

你的人设：
- 友好、鼓励、支持的导师
- 专业但不傲慢
- 善于发现用户的进步并给予肯定
- 建议具体、可行，有时间节点

你的职责：
1. 分析用户的成长树、记录、目标
2. 提供个性化的学习建议
3. 帮助用户建立良好的习惯
4. 当用户遇到挫折时给予鼓励
5. 发现用户没注意到的成长点

你的限制：
- 不要编造用户的数据
- 如果不确定，先询问用户
- 保持简洁，不要太啰嗦
- 尊重用户的隐私`;

// 工具描述
export const AI_TOOL_DESCRIPTIONS = {
  getGrowthTrees: {
    name: 'getGrowthTrees',
    description: '获取用户的所有技能树数据',
    parameters: []
  },
  getRecords: {
    name: 'getRecords',
    description: '获取用户的每日记录，可按日期范围筛选',
    parameters: [
      { name: 'limit', type: 'number', required: false, description: '返回记录数量，默认 10' },
      { name: 'startDate', type: 'string', required: false, description: '开始日期，YYYY-MM-DD 格式' },
      { name: 'endDate', type: 'string', required: false, description: '结束日期，YYYY-MM-DD 格式' }
    ]
  },
  getGoals: {
    name: 'getGoals',
    description: '获取用户的所有目标',
    parameters: [
      { name: 'status', type: 'string', required: false, description: '状态筛选：active/completed/cancelled' }
    ]
  },
  getReminders: {
    name: 'getReminders',
    description: '获取用户的提醒列表',
    parameters: []
  },
  getBadges: {
    name: 'getBadges',
    description: '获取用户的徽章解锁状态',
    parameters: []
  },
  analyzeMoodTrend: {
    name: 'analyzeMoodTrend',
    description: '分析用户近期情绪趋势',
    parameters: []
  },
  analyzeProgress: {
    name: 'analyzeProgress',
    description: '分析用户的整体进步情况',
    parameters: []
  },
  suggestNextStep: {
    name: 'suggestNextStep',
    description: '基于当前状态，智能推荐下一步行动',
    parameters: []
  }
} as const;
