/**
 * IndexedDB schema 定义
 *
 * - 每个 object store 对应一个业务实体
 * - 业务实体类型在 src/types/index.ts（后续迁移会更新）
 * - 索引：by-updated 是高频查询路径，必须有
 * - 此文件是 schema 的"真理源"
 */

import type { DBSchema } from 'idb';

// 业务实体类型（这里用最小子集；完整业务类型在 src/types/index.ts，
// 完整迁移到 StorageAdapter 时再做类型映射）
export interface RecordEntity {
  id: string,
  date: string,
  activity: string,
  learning: string,
  reflection: string,
  mood: string,
  category: string,
  tags: string[],
  createdAt: string,
  updatedAt: string,
}

export interface GoalEntity {
  id: string,
  title: string,
  description: string,
  category: string,
  targetValue: number,
  currentValue: number,
  targetDate: string,
  status: 'active' | 'completed' | 'cancelled',
  createdAt: string,
  updatedAt: string,
}

export interface ReminderEntity {
  id: string,
  title: string,
  description: string,
  date: string,
  time: string,
  goalId?: string,
  isCompleted: boolean,
  createdAt: string,
  updatedAt: string,
}

export interface UserEntity {
  id: string,
  email: string,
  name?: string,
  passwordHash: string,
  createdAt: string,
}

export interface ChatSessionEntity {
  id: string,
  title: string,
  createdAt: string,
  updatedAt: string,
  messageCount: number,
}

export interface ChatMessageEntity {
  id: string,
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  timestamp: string,
}

// 所有 entity store 的字符串联合
export const ENTITY_STORES = [
  'records',
  'goals',
  'reminders',
  'users',
  'chatSessions',
  'chatMessages',
] as const;

export type EntityStore = (typeof ENTITY_STORES)[number];

// IndexedDB schema（idb 库强类型化）
export interface GrowthOSDB extends DBSchema {
  records: {
    key: string,
    value: RecordEntity,
    indexes: {
      'by-date': string,
      'by-updated': string,
      'by-category': string,
      'by-mood': string,
    },
  },
  goals: {
    key: string,
    value: GoalEntity,
    indexes: {
      'by-status': string,
      'by-updated': string,
      'by-targetDate': string,
    },
  },
  reminders: {
    key: string,
    value: ReminderEntity,
    indexes: {
      'by-completed': string,
      'by-updated': string,
      'by-date': string,
    },
  },
  users: {
    key: string,
    value: UserEntity,
    indexes: {
      'by-email': string,
    },
  },
  chatSessions: {
    key: string,
    value: ChatSessionEntity,
    indexes: {
      'by-updated': string,
    },
  },
  chatMessages: {
    key: string,
    value: ChatMessageEntity,
    indexes: {
      'by-session': string,
      'by-timestamp': string,
    },
  },
}

export const DB_NAME = 'growthos';
export const CURRENT_DB_VERSION = 1;
