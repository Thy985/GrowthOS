/**
 * 备份数据格式定义
 *
 * 备份文件结构（JSON）：
 * {
 *   $type: 'growthos-backup',
 *   $version: 1,                    // 备份格式版本（独立于 DB schema）
 *   schemaVersion: 2,               // 备份创建时的 DB schema 版本
 *   timestamp: '2024-...',
 *   appVersion: '0.x.y',
 *   data: {
 *     records: GrowthRecord[],
 *     goals: Goal[],
 *     reminders: Reminder[],
 *     trees: Tree[],
 *     users: User[],                // 包含 passwordHash（敏感）
 *     chatSessions: ChatSession[],
 *     chatMessages: ChatMessage[],
 *     preferences: {
 *       llmConfig: LLMConfig | null,
 *       aiSettings: AISettings | null,
 *       currentUser: User | null,
 *     },
 *   },
 * }
 *
 * 演进原则：
 * - $version 变化时必须保持向后兼容（老版本能读新备份 / 新版本能拒绝/警告老备份）
 * - schemaVersion 反映数据形态（添加/删除字段）；恢复时若不匹配应警告
 * - 加新字段时给默认值（不要破坏老备份解析）
 */

import type { GrowthRecord, Goal, Reminder, Tree, User, LLMConfig, ChatSession, ChatMessage } from '../../types';

/** AISettings 简化为通用 key-value（避免与 aiStorageService 循环依赖） */
export interface AISettings {
  [key: string]: unknown,
}

export const BACKUP_TYPE_MARKER = 'growthos-backup' as const;
export const BACKUP_FORMAT_VERSION = 1 as const;

export interface BackupData {
  $type: typeof BACKUP_TYPE_MARKER,
  $version: typeof BACKUP_FORMAT_VERSION,
  schemaVersion: number,
  timestamp: string,
  appVersion: string,
  data: {
    records: GrowthRecord[],
    goals: Goal[],
    reminders: Reminder[],
    trees: Tree[],
    users: User[],
    chatSessions: ChatSession[],
    chatMessages: ChatMessage[],
    preferences: {
      llmConfig: LLMConfig | null,
      aiSettings: AISettings | null,
      currentUser: User | null,
    },
  },
}

export interface CreateBackupOptions {
  /** 是否包含用户凭证（users 表的 passwordHash） */
  includeCredentials: boolean,
  /** 备份的 app 版本（默认从环境获取） */
  appVersion?: string,
  /** 备份的 schema 版本（默认从代码常量取） */
  schemaVersion?: number,
}

export interface RestoreOptions {
  /**
   * merge：保留目标已存在的 ID，只插入新数据
   * overwrite：清空目标表后写入（恢复完整快照）
   */
  mode: 'merge' | 'overwrite',
  /** 是否恢复偏好（llmConfig / aiSettings / currentUser） */
  includePreferences: boolean,
  /** 是否恢复 users 表（可能含 passwordHash） */
  includeCredentials: boolean,
}

export interface RestoreTableResult {
  tableId: string,
  count: number,
  success: boolean,
  skipped: boolean,
  error?: string,
}

export interface RestoreResult {
  tableResults: RestoreTableResult[],
  preferencesRestored: {
    llmConfig: boolean,
    aiSettings: boolean,
    currentUser: boolean,
  },
  success: boolean,
  totalItems: number,
}

export class BackupFormatError extends Error {
  readonly code: string;
  constructor(message: string, code: string = 'INVALID_FORMAT') {
    super(message);
    this.name = 'BackupFormatError';
    this.code = code;
  }
}
