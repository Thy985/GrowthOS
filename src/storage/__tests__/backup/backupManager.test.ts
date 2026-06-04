/**
 * backupManager 单元测试
 *
 * 覆盖：
 * - createBackup：空 + 含数据 + 偏好 + credentials 选项
 * - parseBackup：合法 + 各种非法格式
 * - validateBackup：类型守卫
 * - restoreFromBackup：merge / overwrite / includePreferences / includeCredentials
 * - round trip：create → serialize → parse → restore
 * - 恢复失败时 tableResults 反映
 */

import 'fake-indexeddb/auto';
import {
  createBackup,
  restoreFromBackup,
  parseBackup,
  validateBackup,
  downloadBackup,
  readBackupFile,
  BackupFormatError,
} from '../../backup/backupManager';
import {
  BACKUP_TYPE_MARKER,
  BACKUP_FORMAT_VERSION,
  type BackupData,
} from '../../backup/backupFormat';
import { MIGRATABLE_TABLES } from '../../migration';
import { openGrowthDB, resetDatabase } from '../../schema';
import { getStorageBackendConfig, _resetStorageBackendConfig } from '../../config/storageConfig';
import { AI_STORAGE_KEYS, STORAGE_KEYS } from '../../../constants';
import * as repoModule from '../../../common/repositories/repository';

const sampleTree = (id: string) => ({
  id,
  name: `tree-${id}`,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  children: [],
});

const sampleGoal = (id: string) => ({
  id,
  title: `goal-${id}`,
  description: '',
  category: 'other' as const,
  targetValue: 1,
  currentValue: 0,
  targetDate: '2024-12-31',
  status: 'active' as const,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

const sampleUser = (id: string): { id: string, email: string, name: string, passwordHash: string, createdAt: string } => ({
  id,
  email: `${id}@example.com`,
  name: id,
  passwordHash: 'fake-hash',
  createdAt: '2024-01-01T00:00:00.000Z',
});

function clearAllLS(): void {
  for (const t of MIGRATABLE_TABLES) localStorage.removeItem(t.lsKey);
  localStorage.removeItem(AI_STORAGE_KEYS.LLM_CONFIG);
  localStorage.removeItem(AI_STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem('growthos:storageBackend');
}

beforeEach(async () => {
  jest.restoreAllMocks();
  _resetStorageBackendConfig();
  clearAllLS();
  await resetDatabase();
  await openGrowthDB();
  // 默认 backend = indexeddb
  getStorageBackendConfig().setStorageBackend('indexeddb');
});

afterAll(async () => {
  await resetDatabase();
  clearAllLS();
  jest.restoreAllMocks();
});

describe('createBackup', () => {
  it('returns valid empty backup when no data', async () => {
    const backup = await createBackup();
    expect(backup.$type).toBe(BACKUP_TYPE_MARKER);
    expect(backup.$version).toBe(BACKUP_FORMAT_VERSION);
    expect(backup.schemaVersion).toBeGreaterThan(0);
    expect(backup.timestamp).toBeTruthy();
    expect(backup.appVersion).toBeTruthy();
    expect(backup.data.records).toEqual([]);
    expect(backup.data.goals).toEqual([]);
    expect(backup.data.users).toEqual([]);
    expect(backup.data.preferences.llmConfig).toBeNull();
    expect(backup.data.preferences.aiSettings).toBeNull();
    expect(backup.data.preferences.currentUser).toBeNull();
  });

  it('captures all business tables + preferences when data exists', async () => {
    // 写 IDB
    const db = await openGrowthDB();
    await db.put('trees', sampleTree('t1'));
    await db.put('trees', sampleTree('t2'));
    await db.put('goals', sampleGoal('g1'));
    // 写偏好 LS
    localStorage.setItem(AI_STORAGE_KEYS.LLM_CONFIG, JSON.stringify({ provider: 'openai' }));
    localStorage.setItem(AI_STORAGE_KEYS.SETTINGS, JSON.stringify({ theme: 'dark' }));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ id: 'u1', email: 'a@b.c' }));

    const backup = await createBackup();
    expect(backup.data.trees).toHaveLength(2);
    expect(backup.data.goals).toHaveLength(1);
    expect(backup.data.preferences.llmConfig).toEqual({ provider: 'openai' });
    expect(backup.data.preferences.aiSettings).toEqual({ theme: 'dark' });
    expect(backup.data.preferences.currentUser).toEqual({ id: 'u1', email: 'a@b.c' });
  });

  it('omits users when includeCredentials = false', async () => {
    const db = await openGrowthDB();
    await db.put('users', sampleUser('u1'));

    const backup = await createBackup({ includeCredentials: false });
    expect(backup.data.users).toEqual([]);
  });

  it('includes users (with passwordHash) when includeCredentials = true', async () => {
    const db = await openGrowthDB();
    await db.put('users', sampleUser('u1'));

    const backup = await createBackup({ includeCredentials: true });
    expect(backup.data.users).toHaveLength(1);
    // passwordHash 是 User 的扩展字段，TS 类型不直接暴露，用断言访问
    const userWithHash = backup.data.users[0] as { passwordHash?: string };
    expect(userWithHash.passwordHash).toBe('fake-hash');
  });
});

describe('parseBackup + validateBackup', () => {
  it('parses a valid backup string', () => {
    const backup = createBackupSync();
    const text = JSON.stringify(backup);
    const parsed = parseBackup(text);
    expect(parsed.$type).toBe(BACKUP_TYPE_MARKER);
    expect(parsed.$version).toBe(BACKUP_FORMAT_VERSION);
  });

  it('throws BackupFormatError on invalid JSON', () => {
    expect(() => parseBackup('not json{')).toThrow(BackupFormatError);
  });

  it('throws on missing $type', () => {
    const text = JSON.stringify({ $version: 1, data: {} });
    expect(() => parseBackup(text)).toThrow(BackupFormatError);
  });

  it('throws on wrong $type', () => {
    const text = JSON.stringify({ $type: 'wrong', $version: 1, data: {} });
    expect(() => parseBackup(text)).toThrow(/不是有效的备份文件/);
  });

  it('throws on version mismatch', () => {
    const text = JSON.stringify({
      $type: BACKUP_TYPE_MARKER,
      $version: 999,
      data: { records: [], goals: [], reminders: [], trees: [], users: [], chatSessions: [], chatMessages: [], preferences: {} },
    });
    expect(() => parseBackup(text)).toThrow(/版本不匹配/);
  });

  it('throws on missing data field', () => {
    const text = JSON.stringify({ $type: BACKUP_TYPE_MARKER, $version: 1 });
    expect(() => parseBackup(text)).toThrow(/data 字段缺失/);
  });

  it('throws when data.records is not an array', () => {
    const text = JSON.stringify({
      $type: BACKUP_TYPE_MARKER,
      $version: 1,
      data: { records: 'not-array', goals: [], reminders: [], trees: [], users: [], chatSessions: [], chatMessages: [], preferences: {} },
    });
    expect(() => parseBackup(text)).toThrow(/records.*缺失或不是数组/);
  });

  it('throws when preferences is missing', () => {
    const text = JSON.stringify({
      $type: BACKUP_TYPE_MARKER,
      $version: 1,
      data: { records: [], goals: [], reminders: [], trees: [], users: [], chatSessions: [], chatMessages: [] },
    });
    expect(() => parseBackup(text)).toThrow(/preferences 缺失/);
  });

  it('validateBackup is a type guard', () => {
    const backup = createBackupSync();
    const obj: unknown = JSON.parse(JSON.stringify(backup));
    expect(() => validateBackup(obj)).not.toThrow();
    // 验证类型守卫：TS 应该把 obj 视为 BackupData
    const narrowed: BackupData = obj as BackupData;
    expect(narrowed.$type).toBe(BACKUP_TYPE_MARKER);
  });
});

describe('restoreFromBackup — merge mode', () => {
  it('inserts new items, skips existing IDs', async () => {
    // 现有数据
    const db = await openGrowthDB();
    await db.put('trees', sampleTree('existing-1'));

    // 备份里有 existing-1（应跳过）+ new-1（应插入）
    const backup: BackupData = {
      $type: BACKUP_TYPE_MARKER,
      $version: BACKUP_FORMAT_VERSION,
      schemaVersion: 2,
      timestamp: new Date().toISOString(),
      appVersion: 'test',
      data: {
        records: [],
        goals: [],
        reminders: [],
        trees: [sampleTree('existing-1'), sampleTree('new-1')],
        users: [],
        chatSessions: [],
        chatMessages: [],
        preferences: { llmConfig: null, aiSettings: null, currentUser: null },
      },
    };

    const result = await restoreFromBackup(backup, {
      mode: 'merge',
      includePreferences: false,
      includeCredentials: false,
    });

    const treesResult = result.tableResults.find((r) => r.tableId === 'trees')!;
    expect(treesResult.success).toBe(true);
    expect(treesResult.count).toBe(2);

    // existing-1 仍存在
    const existing = await db.get('trees', 'existing-1');
    expect(existing).toBeTruthy();
    // new-1 已插入
    const newItem = await db.get('trees', 'new-1');
    expect(newItem).toBeTruthy();
  });
});

describe('restoreFromBackup — overwrite mode', () => {
  it('clears target and writes backup data', async () => {
    const db = await openGrowthDB();
    await db.put('trees', sampleTree('old-1'));
    await db.put('trees', sampleTree('old-2'));

    const backup: BackupData = {
      $type: BACKUP_TYPE_MARKER,
      $version: BACKUP_FORMAT_VERSION,
      schemaVersion: 2,
      timestamp: new Date().toISOString(),
      appVersion: 'test',
      data: {
        records: [],
        goals: [],
        reminders: [],
        trees: [sampleTree('fresh-1')],
        users: [],
        chatSessions: [],
        chatMessages: [],
        preferences: { llmConfig: null, aiSettings: null, currentUser: null },
      },
    };

    await restoreFromBackup(backup, {
      mode: 'overwrite',
      includePreferences: false,
      includeCredentials: false,
    });

    // old-1 / old-2 不应再存在
    expect(await db.get('trees', 'old-1')).toBeUndefined();
    expect(await db.get('trees', 'old-2')).toBeUndefined();
    // fresh-1 已写入
    expect(await db.get('trees', 'fresh-1')).toBeTruthy();
  });
});

describe('restoreFromBackup — preferences & credentials', () => {
  it('restores preferences when includePreferences = true', async () => {
    const backup: BackupData = {
      $type: BACKUP_TYPE_MARKER,
      $version: BACKUP_FORMAT_VERSION,
      schemaVersion: 2,
      timestamp: new Date().toISOString(),
      appVersion: 'test',
      data: {
        records: [],
        goals: [],
        reminders: [],
        trees: [],
        users: [],
        chatSessions: [],
        chatMessages: [],
        preferences: {
          llmConfig: { provider: 'openai', apiKey: 'k', model: 'gpt-4', temperature: 0.7, maxTokens: 1024 },
          aiSettings: { theme: 'dark' },
          currentUser: { id: 'u1', email: 'a@b.c', name: 'A', createdAt: '2024-01-01' },
        },
      },
    };

    const result = await restoreFromBackup(backup, {
      mode: 'merge',
      includePreferences: true,
      includeCredentials: false,
    });

    expect(result.preferencesRestored.llmConfig).toBe(true);
    expect(result.preferencesRestored.aiSettings).toBe(true);
    expect(result.preferencesRestored.currentUser).toBe(true);
    expect(JSON.parse(localStorage.getItem(AI_STORAGE_KEYS.LLM_CONFIG)!)).toEqual({ provider: 'openai', apiKey: 'k', model: 'gpt-4', temperature: 0.7, maxTokens: 1024 });
  });

  it('skips preferences when includePreferences = false', async () => {
    const backup: BackupData = {
      $type: BACKUP_TYPE_MARKER,
      $version: BACKUP_FORMAT_VERSION,
      schemaVersion: 2,
      timestamp: new Date().toISOString(),
      appVersion: 'test',
      data: {
        records: [], goals: [], reminders: [], trees: [], users: [],
        chatSessions: [], chatMessages: [],
        preferences: {
          llmConfig: { provider: 'openai', apiKey: 'k', model: 'gpt-4', temperature: 0.7, maxTokens: 1024 },
          aiSettings: null, currentUser: null,
        },
      },
    };

    const result = await restoreFromBackup(backup, {
      mode: 'merge',
      includePreferences: false,
      includeCredentials: false,
    });

    expect(result.preferencesRestored.llmConfig).toBe(false);
    expect(localStorage.getItem(AI_STORAGE_KEYS.LLM_CONFIG)).toBeNull();
  });

  it('restores users only when includeCredentials = true', async () => {
    const db = await openGrowthDB();
    const backup: BackupData = {
      $type: BACKUP_TYPE_MARKER,
      $version: BACKUP_FORMAT_VERSION,
      schemaVersion: 2,
      timestamp: new Date().toISOString(),
      appVersion: 'test',
      data: {
        records: [], goals: [], reminders: [], trees: [],
        users: [sampleUser('u1')],
        chatSessions: [], chatMessages: [],
        preferences: { llmConfig: null, aiSettings: null, currentUser: null },
      },
    };

    // includeCredentials = false → users 表不应被写
    await restoreFromBackup(backup, { mode: 'merge', includePreferences: false, includeCredentials: false });
    expect(await db.get('users', 'u1')).toBeUndefined();

    // includeCredentials = true → users 表应被写
    await restoreFromBackup(backup, { mode: 'merge', includePreferences: false, includeCredentials: true });
    expect(await db.get('users', 'u1')).toBeTruthy();
  });
});

describe('Round trip: create → serialize → parse → restore', () => {
  it('preserves all data through full cycle (IDB → file → IDB)', async () => {
    // 1. 写源数据
    const db = await openGrowthDB();
    await db.put('trees', sampleTree('tree-A'));
    await db.put('trees', sampleTree('tree-B'));
    await db.put('goals', sampleGoal('goal-1'));
    localStorage.setItem(AI_STORAGE_KEYS.LLM_CONFIG, JSON.stringify({ provider: 'openai' }));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ id: 'u1', email: 'a@b.c', name: 'A', createdAt: '2024-01-01' }));

    // 2. 创建备份
    const backup = await createBackup();

    // 3. 模拟"清空"：删 IDB + 清 LS
    await db.clear('trees');
    await db.clear('goals');
    localStorage.removeItem(AI_STORAGE_KEYS.LLM_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.USER);

    // 4. 序列化 → 解析
    const text = JSON.stringify(backup);
    const restored = parseBackup(text);

    // 5. 恢复
    const result = await restoreFromBackup(restored, {
      mode: 'overwrite',
      includePreferences: true,
      includeCredentials: true,
    });

    expect(result.success).toBe(true);
    expect(result.totalItems).toBe(2 + 1); // 2 trees + 1 goal

    // 6. 验证数据回来了
    const treesAfter = await db.getAll('trees');
    expect(treesAfter.map((t) => t.id).sort()).toEqual(['tree-A', 'tree-B']);
    const goalsAfter = await db.getAll('goals');
    expect(goalsAfter.map((g) => g.id)).toEqual(['goal-1']);
    expect(JSON.parse(localStorage.getItem(AI_STORAGE_KEYS.LLM_CONFIG)!)).toEqual({ provider: 'openai' });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)!)).toEqual({ id: 'u1', email: 'a@b.c', name: 'A', createdAt: '2024-01-01' });
  });
});

describe('readBackupFile + downloadBackup', () => {
  it('readBackupFile parses a File object', async () => {
    const backup = createBackupSync();
    const text = JSON.stringify(backup);
    // jsdom 不提供 file.text()，手动实现
    const file = {
      name: 'test.json',
      type: 'application/json',
      text: async () => text,
    } as unknown as File;
    const parsed = await readBackupFile(file);
    expect(parsed.$type).toBe(BACKUP_TYPE_MARKER);
  });

  it('downloadBackup triggers a download (jsdom mocks anchor click)', () => {
    const backup = createBackupSync();
    const clickSpy = jest.fn();
    const originalCreate = document.createElement.bind(document);

    // jsdom 不提供 URL.createObjectURL；用 mock
    const origCreateObjectURL = URL.createObjectURL;
    const origRevokeObjectURL = URL.revokeObjectURL;
    (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = jest.fn(() => 'blob:mock-url');
    (URL as unknown as { revokeObjectURL: (url: string) => void }).revokeObjectURL = jest.fn();

    jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreate(tag);
      if (tag === 'a') (el as HTMLAnchorElement).click = clickSpy;
      return el;
    });

    downloadBackup(backup);
    expect(clickSpy).toHaveBeenCalled();

    // 还原
    URL.createObjectURL = origCreateObjectURL;
    URL.revokeObjectURL = origRevokeObjectURL;
  });
});

describe('Error handling', () => {
  it('restoreFromBackup reports per-table failures without aborting', async () => {
    // mock 让 records 表的 putMany 抛错
    const realCreate = jest.requireActual('../../../common/repositories/repository').createIndexedDbRepository;
    const spy = jest.spyOn(repoModule, 'createIndexedDbRepository').mockImplementation(
      (...args: unknown[]) => {
        const store = args[0] as string;
        if (store === 'records') {
          return {
            ready: async () => {},
            get: async () => null,
            getAll: async () => [],
            put: async <T,>(e: T) => e,
            putMany: async () => { throw new Error('records offline'); },
            delete: async () => true,
            clear: async () => {},
            count: async () => 0,
            queryByIndex: async () => [],
            close: async () => {},
          };
        }
        return realCreate(...args);
      },
    );

    const backup: BackupData = {
      $type: BACKUP_TYPE_MARKER,
      $version: BACKUP_FORMAT_VERSION,
      schemaVersion: 2,
      timestamp: new Date().toISOString(),
      appVersion: 'test',
      data: {
        records: [{ id: 'r1' } as never],
        goals: [sampleGoal('g1')],
        reminders: [], trees: [], users: [], chatSessions: [], chatMessages: [],
        preferences: { llmConfig: null, aiSettings: null, currentUser: null },
      },
    };

    const result = await restoreFromBackup(backup, {
      mode: 'overwrite',
      includePreferences: false,
      includeCredentials: false,
    });

    const recordsResult = result.tableResults.find((r) => r.tableId === 'records')!;
    const goalsResult = result.tableResults.find((r) => r.tableId === 'goals')!;
    expect(recordsResult.success).toBe(false);
    expect(recordsResult.error).toMatch(/records offline/);
    expect(goalsResult.success).toBe(true);
    expect(result.success).toBe(false); // 整体不算 success
    spy.mockRestore();
  });
});

// helper
function createBackupSync(): BackupData {
  return {
    $type: BACKUP_TYPE_MARKER,
    $version: BACKUP_FORMAT_VERSION,
    schemaVersion: 2,
    timestamp: new Date().toISOString(),
    appVersion: 'test',
    data: {
      records: [],
      goals: [],
      reminders: [],
      trees: [],
      users: [],
      chatSessions: [],
      chatMessages: [],
      preferences: { llmConfig: null, aiSettings: null, currentUser: null },
    },
  };
}
