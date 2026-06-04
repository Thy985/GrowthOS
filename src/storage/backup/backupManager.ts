/**
 * 备份管理器：导出 / 导入 全量数据
 *
 * 覆盖：
 * - 7 张业务表（records / goals / reminders / trees / users / chatSessions / chatMessages）
 * - 偏好设置（llmConfig / aiSettings / currentUser）
 *
 * 设计：
 * - 不依赖 service 层（避免循环）
 * - 用与 migrator 相同的"scratch repository"模式（无装饰器）
 * - 备份格式包含版本号和 schema 版本（未来兼容）
 * - 恢复分 merge / overwrite 两种语义
 *
 * 已知限制：
 * - LocalStorageAdapter 是单 key 单记录模式（pre-existing）
 *   恢复时，对 LS 后端，putMany 只会保留最后一条
 *   → 用户应切到 IDB 后再恢复
 */

import {
  createIndexedDbRepository,
  createLocalStorageRepository,
  createInMemoryRepository,
  type ReadWriteRepository,
} from '../../common/repositories/repository';
import type { BaseEntity } from '../types';
import { getStorageBackendConfig, type StorageBackendKind } from '../config/storageConfig';
import { type EntityStore, CURRENT_DB_VERSION } from '../schema/types';
import { MIGRATABLE_TABLES } from '../migration';
import { STORAGE_KEYS, AI_STORAGE_KEYS } from '../../constants';
import {
  BACKUP_TYPE_MARKER,
  BACKUP_FORMAT_VERSION,
  type BackupData,
  type CreateBackupOptions,
  type RestoreOptions,
  type RestoreResult,
  type RestoreTableResult,
  type AISettings,
  BackupFormatError,
} from './backupFormat';
import type { LLMConfig, User, GrowthRecord, Goal, Reminder, Tree, ChatSession, ChatMessage } from '../../types';

/** 备份偏好表（LS-only，无对应 IDB store） */
interface PreferenceTable {
  id: 'llmConfig' | 'aiSettings' | 'currentUser',
  lsKey: string,
}

/** 用于从 LS 读取偏好。`PREFERENCE_TABLES` 当前未在代码中直接遍历
 * （因为 readAllDataFromBackend 显式列出了 3 个 key），
 * 保留作 future reference（比如选择性备份）。
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PREFERENCE_TABLES: readonly PreferenceTable[] = [
  { id: 'llmConfig', lsKey: AI_STORAGE_KEYS.LLM_CONFIG },
  { id: 'aiSettings', lsKey: AI_STORAGE_KEYS.SETTINGS },
  { id: 'currentUser', lsKey: STORAGE_KEYS.USER },
];

const APP_VERSION_FALLBACK = '0.0.0';

/** 拿当前 app version：尝试 process.env.PACKAGE_VERSION（Vite 注入），否则 fallback */
function getAppVersion(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (typeof process !== 'undefined' ? process.env : {}) as any;
  return env.PACKAGE_VERSION ?? env.npm_package_version ?? APP_VERSION_FALLBACK;
}

/** 创建一个针对 backup/restore 的"裸" Repository */
function createScratchRepository<T extends BaseEntity>(
  kind: StorageBackendKind,
  lsKey: string,
  store: EntityStore,
): ReadWriteRepository<T> {
  switch (kind) {
    case 'indexeddb':
      return createIndexedDbRepository<T>(store, { cache: false, sync: false });
    case 'localStorage':
      return createLocalStorageRepository<T>(lsKey, { cache: false, sync: false });
    case 'inMemory':
      return createInMemoryRepository<T>({ cache: false, sync: false });
  }
}

/* ============================================================ */
/* 创建备份                                                     */
/* ============================================================ */

/** 从指定 backend 读所有表的数据（含 preferences） */
async function readAllDataFromBackend(
  kind: StorageBackendKind,
  options: { includeCredentials: boolean },
): Promise<BackupData['data']> {
  // 业务表
  const records = await readTable(kind, 'records');
  const goals = await readTable(kind, 'goals');
  const reminders = await readTable(kind, 'reminders');
  const trees = await readTable(kind, 'trees');
  const users = options.includeCredentials
    ? await readTable<User>(kind, 'users')
    : [];
  const chatSessions = await readTable<ChatSession>(kind, 'chatSessions');
  const chatMessages = await readTable<ChatMessage>(kind, 'chatMessages');

  // 偏好（永远读 LS；inMemory 时返回 null）
  const llmConfig = kind === 'inMemory' ? null : await readLS<LLMConfig>(AI_STORAGE_KEYS.LLM_CONFIG);
  const aiSettings = kind === 'inMemory' ? null : await readLS<AISettings>(AI_STORAGE_KEYS.SETTINGS);
  const currentUser = kind === 'inMemory' ? null : await readLS<User>(STORAGE_KEYS.USER);

  return {
    records: records as GrowthRecord[],
    goals: goals as Goal[],
    reminders: reminders as Reminder[],
    trees: trees as Tree[],
    users,
    chatSessions,
    chatMessages,
    preferences: {
      llmConfig: llmConfig ?? null,
      aiSettings: aiSettings ?? null,
      currentUser: currentUser ?? null,
    },
  };
}

/** 读单表（用与 migrator 相同的 scratch repo 模式） */
async function readTable<T extends BaseEntity>(kind: StorageBackendKind, tableId: string): Promise<T[]> {
  const table = MIGRATABLE_TABLES.find((t) => t.id === tableId);
  if (!table) throw new Error(`Unknown table: ${tableId}`);

  if (kind === 'inMemory') return [];

  const repo = createScratchRepository<T>(kind, table.lsKey, table.store);
  await repo.ready();
  return repo.getAll();
}

/** 读 LS 单 key（用于 preferences） */
async function readLS<T>(key: string): Promise<T | null> {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 创建备份（从当前 backend 读） */
export async function createBackup(options?: Partial<CreateBackupOptions>): Promise<BackupData> {
  const opts: CreateBackupOptions = {
    includeCredentials: true,
    appVersion: undefined,
    schemaVersion: undefined,
    ...options,
  };

  const kind = getStorageBackendConfig().getStorageBackend();
  const data = await readAllDataFromBackend(kind, { includeCredentials: opts.includeCredentials });

  return {
    $type: BACKUP_TYPE_MARKER,
    $version: BACKUP_FORMAT_VERSION,
    schemaVersion: opts.schemaVersion ?? CURRENT_DB_VERSION,
    timestamp: new Date().toISOString(),
    appVersion: opts.appVersion ?? getAppVersion(),
    data,
  };
}

/* ============================================================ */
/* 解析 + 校验                                                  */
/* ============================================================ */

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** 校验备份数据格式（类型守卫） */
export function validateBackup(input: unknown): asserts input is BackupData {
  if (!isObject(input)) {
    throw new BackupFormatError('备份格式错误：根对象不是 JSON object', 'INVALID_ROOT');
  }

  if (input.$type !== BACKUP_TYPE_MARKER) {
    throw new BackupFormatError(
      `不是有效的备份文件（缺少 $type 标记或值错误：${String(input.$type)}）`,
      'INVALID_MARKER',
    );
  }

  if (input.$version !== BACKUP_FORMAT_VERSION) {
    throw new BackupFormatError(
      `备份格式版本不匹配：备份 v${String(input.$version)}，本程序 v${BACKUP_FORMAT_VERSION}`,
      'VERSION_MISMATCH',
    );
  }

  if (!isObject(input.data)) {
    throw new BackupFormatError('备份格式错误：data 字段缺失', 'INVALID_DATA');
  }

  // 检查必需字段
  const requiredTopLevel: Array<keyof BackupData['data']> = [
    'records',
    'goals',
    'reminders',
    'trees',
    'users',
    'chatSessions',
    'chatMessages',
  ];
  for (const field of requiredTopLevel) {
    if (!Array.isArray(input.data[field])) {
      throw new BackupFormatError(`备份 data.${field} 缺失或不是数组`, 'INVALID_FIELD');
    }
  }

  if (!isObject(input.data.preferences)) {
    throw new BackupFormatError('备份 data.preferences 缺失', 'INVALID_PREFERENCES');
  }
}

/** 解析 + 校验备份文件内容（字符串） */
export function parseBackup(content: string): BackupData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new BackupFormatError(
      `备份文件不是有效 JSON: ${err instanceof Error ? err.message : String(err)}`,
      'INVALID_JSON',
    );
  }
  validateBackup(parsed);
  return parsed;
}

/* ============================================================ */
/* 恢复                                                         */
/* ============================================================ */

async function writeTable<T extends BaseEntity>(
  kind: StorageBackendKind,
  tableId: string,
  items: T[],
  mode: 'merge' | 'overwrite',
): Promise<RestoreTableResult> {
  const table = MIGRATABLE_TABLES.find((t) => t.id === tableId);
  if (!table) {
    return { tableId, count: 0, success: false, skipped: false, error: `Unknown table: ${tableId}` };
  }

  if (kind === 'inMemory') {
    return { tableId, count: items.length, success: true, skipped: true };
  }

  try {
    const repo = createScratchRepository<T>(kind, table.lsKey, table.store);
    await repo.ready();

    if (mode === 'overwrite') {
      await repo.clear();
      if (items.length > 0) {
        await repo.putMany(items);
      }
    } else {
      // merge：只插不存在的
      for (const item of items) {
        const existing = await repo.get(item.id);
        if (!existing) {
          await repo.put(item);
        }
      }
    }
    return { tableId, count: items.length, success: true, skipped: false };
  } catch (err) {
    return {
      tableId,
      count: 0,
      success: false,
      skipped: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function writeLS<T>(key: string, value: T | null): Promise<boolean> {
  if (typeof localStorage === 'undefined') return false;
  if (value === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
  return true;
}

/** 恢复备份到当前 backend */
export async function restoreFromBackup(
  backup: BackupData,
  options: RestoreOptions,
): Promise<RestoreResult> {
  const kind = getStorageBackendConfig().getStorageBackend();
  const { mode, includePreferences, includeCredentials } = options;
  const { data } = backup;

  // 业务表（用户表受 includeCredentials 控制）
  const tableJobs: Array<Promise<RestoreTableResult>> = [
    writeTable(kind, 'records', data.records, mode),
    writeTable(kind, 'goals', data.goals, mode),
    writeTable(kind, 'reminders', data.reminders, mode),
    writeTable(kind, 'trees', data.trees, mode),
    writeTable(kind, 'chatSessions', data.chatSessions, mode),
    writeTable(kind, 'chatMessages', data.chatMessages, mode),
  ];
  if (includeCredentials) {
    tableJobs.push(writeTable(kind, 'users', data.users, mode));
  }

  const tableResults = await Promise.all(tableJobs);
  const totalItems = tableResults.reduce((sum, r) => sum + r.count, 0);

  // 偏好
  const preferencesRestored = {
    llmConfig: false,
    aiSettings: false,
    currentUser: false,
  };
  if (includePreferences && kind !== 'inMemory') {
    if (data.preferences.llmConfig !== null) {
      preferencesRestored.llmConfig = await writeLS(AI_STORAGE_KEYS.LLM_CONFIG, data.preferences.llmConfig);
    }
    if (data.preferences.aiSettings !== null) {
      preferencesRestored.aiSettings = await writeLS(AI_STORAGE_KEYS.SETTINGS, data.preferences.aiSettings);
    }
    if (data.preferences.currentUser !== null) {
      preferencesRestored.currentUser = await writeLS(STORAGE_KEYS.USER, data.preferences.currentUser);
    }
  }

  return {
    tableResults,
    preferencesRestored,
    success: tableResults.every((r) => r.success),
    totalItems,
  };
}

/* ============================================================ */
/* 文件 I/O                                                     */
/* ============================================================ */

export { BackupFormatError };

/** 触发浏览器下载 */
export function downloadBackup(backup: BackupData, fileName?: string): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName ?? `growthos-backup-${backup.timestamp.split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 读 File → BackupData（异步；浏览器环境） */
export async function readBackupFile(file: File): Promise<BackupData> {
  const text = await file.text();
  return parseBackup(text);
}
