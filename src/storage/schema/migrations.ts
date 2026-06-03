/**
 * IndexedDB schema 迁移
 *
 * 设计：
 * - 每个版本一个 Migration 对象
 * - 旧版本用户访问时按顺序执行 fromVersion+1 ... CURRENT
 * - 测试中可通过 resetDatabase 强制从 v1 升级验证
 */

import type { IDBPDatabase } from 'idb';
import type { GrowthOSDB } from './types';

export interface Migration {
  version: number,
  description: string,
  up: (db: IDBPDatabase<GrowthOSDB>) => Promise<void>,
}

/**
 * v1: 初始 schema
 * - 6 个 object stores + 必需索引
 */
const migrationV1: Migration = {
  version: 1,
  description: 'Initial schema: records, goals, reminders, users, chatSessions, chatMessages',
  up: async (db) => {
    if (!db.objectStoreNames.contains('records')) {
      const records = db.createObjectStore('records', { keyPath: 'id' });
      records.createIndex('by-date', 'date');
      records.createIndex('by-updated', 'updatedAt');
      records.createIndex('by-category', 'category');
      records.createIndex('by-mood', 'mood');
    }

    if (!db.objectStoreNames.contains('goals')) {
      const goals = db.createObjectStore('goals', { keyPath: 'id' });
      goals.createIndex('by-status', 'status');
      goals.createIndex('by-updated', 'updatedAt');
      goals.createIndex('by-targetDate', 'targetDate');
    }

    if (!db.objectStoreNames.contains('reminders')) {
      const reminders = db.createObjectStore('reminders', { keyPath: 'id' });
      reminders.createIndex('by-completed', 'isCompleted');
      reminders.createIndex('by-updated', 'updatedAt');
      reminders.createIndex('by-date', 'date');
    }

    if (!db.objectStoreNames.contains('users')) {
      const users = db.createObjectStore('users', { keyPath: 'id' });
      users.createIndex('by-email', 'email', { unique: true });
    }

    if (!db.objectStoreNames.contains('chatSessions')) {
      const sessions = db.createObjectStore('chatSessions', { keyPath: 'id' });
      sessions.createIndex('by-updated', 'updatedAt');
    }

    if (!db.objectStoreNames.contains('chatMessages')) {
      const messages = db.createObjectStore('chatMessages', { keyPath: 'id' });
      messages.createIndex('by-session', 'sessionId');
      messages.createIndex('by-timestamp', 'timestamp');
    }
  },
};

/**
 * v2: 加 trees store（从 secureStorage 迁出）
 * - 整个树（含 children 节点）作为一条记录
 */
const migrationV2: Migration = {
  version: 2,
  description: 'Add trees store for growthTreeServiceV2',
  up: async (db) => {
    if (!db.objectStoreNames.contains('trees')) {
      const trees = db.createObjectStore('trees', { keyPath: 'id' });
      trees.createIndex('by-updated', 'updatedAt');
    }
  },
};

/**
 * 所有迁移（顺序执行）
 * 加新版本：写一个 migrationVx，往数组里 push 即可
 */
export const migrations: readonly Migration[] = [migrationV1, migrationV2];

export function getLatestVersion(): number {
  return migrations.length > 0 ? migrations[migrations.length - 1].version : 0;
}
