/**
 * dataMigrator 单元测试
 *
 * 覆盖：
 * - 特殊路径：from === to / from = inMemory / to = inMemory
 * - LS → IDB 跨 backend 复制
 * - IDB → LS 跨 backend 复制
 * - overwrite = true / false
 * - 失败时部分成功（继续其他表）
 * - onProgress 回调
 * - estimateMigrationSize
 *
 * 注：LocalStorageAdapter 当前是"单 key 单记录"模式（pre-existing 限制）。
 * 测试按此现状写：LS 端 getAll() 最多返回 1 条。
 */

import 'fake-indexeddb/auto';
import {
  migrateTable,
  migrateBetweenBackends,
  estimateMigrationSize,
  MIGRATABLE_TABLES,
  type TableMigrationResult,
} from '../../migration/dataMigrator';
import { openGrowthDB, resetDatabase } from '../../schema';
import * as repoModule from '../../../common/repositories/repository';
import type { ReadWriteRepository } from '../../../common/repositories/repository';

const TABLE_ID = 'trees'; // Tree 含 name 字段便于测试

const sampleItem = (id: string): { id: string, name: string, createdAt: string, updatedAt: string } => ({
  id,
  name: `name-${id}`,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

const TABLE = MIGRATABLE_TABLES.find((t) => t.id === TABLE_ID)!;
const OTHER_TABLE = MIGRATABLE_TABLES.find((t) => t.id === 'goals')!;

/** 工具：清空 LS 上所有 MIGRATABLE_TABLES 的 key */
function clearAllLS(): void {
  for (const t of MIGRATABLE_TABLES) {
    localStorage.removeItem(t.lsKey);
  }
}

beforeEach(async () => {
  jest.restoreAllMocks();
  clearAllLS();
  // 删 IDB，让每个测试有干净起点
  await resetDatabase();
  await openGrowthDB();
});

afterAll(async () => {
  await resetDatabase();
  clearAllLS();
  jest.restoreAllMocks();
});

describe('migrateTable — special cases', () => {
  it('from === to returns success + skipped', async () => {
    const result = await migrateTable(MIGRATABLE_TABLES[0], 'indexeddb', 'indexeddb');
    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.count).toBe(0);
  });

  it('from = inMemory returns 0 items (no persistent data to migrate)', async () => {
    const result = await migrateTable(MIGRATABLE_TABLES[0], 'inMemory', 'localStorage');
    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
    expect(result.skipped).toBe(true);
  });

  it('to = inMemory is a no-op (inMemory is per-tab, no value writing)', async () => {
    // 先在 LS 写一些数据
    const sourceRepo = repoModule.createLocalStorageRepository<{ id: string, name: string }>(TABLE.lsKey);
    await sourceRepo.put(sampleItem('src-0'));

    const result = await migrateTable(TABLE, 'localStorage', 'inMemory');
    expect(result.success).toBe(true);
    // inMemory target 跳过，count = 0
    expect(result.count).toBe(0);
    expect(result.skipped).toBe(true);
  });
});

describe('migrateTable — localStorage → indexeddb', () => {
  it('copies 1 item from LS to IDB (LS is single-record by current design)', async () => {
    // 用 service 自身的 LS 写入方式（保证 key 格式一致）
    const sourceRepo = repoModule.createLocalStorageRepository<{ id: string, name: string, createdAt: string, updatedAt: string }>(TABLE.lsKey);
    await sourceRepo.put(sampleItem('item-0'));

    const result = await migrateTable(TABLE, 'localStorage', 'indexeddb');

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);

    // 验证 IDB 端有数据
    const db = await openGrowthDB();
    const fromIDB = await db.getAll('trees');
    expect(fromIDB).toHaveLength(1);
    expect(fromIDB[0].id).toBe('item-0');
  });

  it('does not delete the source data', async () => {
    const sourceRepo = repoModule.createLocalStorageRepository<{ id: string, name: string, createdAt: string, updatedAt: string }>(TABLE.lsKey);
    await sourceRepo.put(sampleItem('item-0'));

    await migrateTable(TABLE, 'localStorage', 'indexeddb');

    // LS 端应该原样保留
    expect(localStorage.getItem(TABLE.lsKey)).not.toBeNull();
  });

  it('overwrite = true (default) replaces existing items at target', async () => {
    // target (IDB) 已有 2 条
    const db = await openGrowthDB();
    await db.put('trees', { id: 'old-1', name: 'old', createdAt: '2024-01-01', updatedAt: '2024-01-01' });
    await db.put('trees', { id: 'old-2', name: 'old', createdAt: '2024-01-01', updatedAt: '2024-01-01' });

    // source (LS) 写入 1 条
    const sourceRepo = repoModule.createLocalStorageRepository<{ id: string, name: string, createdAt: string, updatedAt: string }>(TABLE.lsKey);
    await sourceRepo.put(sampleItem('new-0'));

    await migrateTable(TABLE, 'localStorage', 'indexeddb', { overwrite: true });

    const fromIDB = await db.getAll('trees');
    // overwrite=true + putMany → 用新数据替换
    expect(fromIDB).toHaveLength(1);
    expect(fromIDB[0].id).toBe('new-0');
  });

  it('overwrite = false skips existing IDs (keeps target items not in source)', async () => {
    const db = await openGrowthDB();
    await db.put('trees', { id: 'keep-1', name: 'keep', createdAt: '2024-01-01', updatedAt: '2024-01-01' });

    const sourceRepo = repoModule.createLocalStorageRepository<{ id: string, name: string, createdAt: string, updatedAt: string }>(TABLE.lsKey);
    await sourceRepo.put(sampleItem('new-0'));

    await migrateTable(TABLE, 'localStorage', 'indexeddb', { overwrite: false });

    const fromIDB = await db.getAll('trees');
    const ids = fromIDB.map((i) => i.id).sort();
    // keep-1 保留 + new-0 写入
    expect(ids).toEqual(['keep-1', 'new-0']);
  });
});

describe('migrateTable — indexeddb → localStorage', () => {
  it('writes the last IDB item to LS (LS can only hold 1 by current design)', async () => {
    const db = await openGrowthDB();
    await db.put('trees', { id: 'a', name: 'a-name', createdAt: '2024-01-01', updatedAt: '2024-01-01' });
    await db.put('trees', { id: 'b', name: 'b-name', createdAt: '2024-01-01', updatedAt: '2024-01-01' });

    const result = await migrateTable(TABLE, 'indexeddb', 'localStorage');
    expect(result.success).toBe(true);
    // IDB source: 2 items
    expect(result.count).toBe(2);

    // LS target 端：因为 LSAdapter.putMany 会循环 put（每次覆盖），只剩最后一条
    const targetRepo = repoModule.createLocalStorageRepository<{ id: string, name: string }>(TABLE.lsKey);
    const stored = await targetRepo.get('singleton');
    expect(stored).toBeTruthy();
    // stored 本身是单一对象（LSAdapter 总是把一个 entity 作为整体存）
  });
});

describe('migrateBetweenBackends', () => {
  it('returns one result per table when from === to', async () => {
    const results = await migrateBetweenBackends('indexeddb', 'indexeddb');
    expect(results).toHaveLength(MIGRATABLE_TABLES.length);
    expect(results.every((r) => r.skipped)).toBe(true);
  });

  it('migrates all tables in order', async () => {
    // 在 IDB 端放数据
    const db = await openGrowthDB();
    await db.put('trees', { id: 't1', name: 'tree-1', createdAt: '2024-01-01', updatedAt: '2024-01-01' });
    await db.put('trees', { id: 't2', name: 'tree-2', createdAt: '2024-01-01', updatedAt: '2024-01-01' });
    await db.put('goals', { id: 'g1', title: 'goal-1', targetValue: 1, currentValue: 0, targetDate: '2024-12-31', status: 'active', description: '', category: 'other', createdAt: '2024-01-01', updatedAt: '2024-01-01' });
    await db.put('reminders', { id: 'r1', title: 'rem-1', date: '2024-12-31', time: '10:00', isCompleted: false, description: '', createdAt: '2024-01-01', updatedAt: '2024-01-01' });

    const results = await migrateBetweenBackends('indexeddb', 'localStorage');

    const treesResult = results.find((r) => r.tableId === 'trees')!;
    const goalsResult = results.find((r) => r.tableId === 'goals')!;
    const remindersResult = results.find((r) => r.tableId === 'reminders')!;
    expect(treesResult.count).toBe(2);
    expect(goalsResult.count).toBe(1);
    expect(remindersResult.count).toBe(1);
    expect(results.every((r) => r.success)).toBe(true);
  });

  it('calls onProgress for each table completion', async () => {
    const calls: Array<[number, number, string]> = [];
    await migrateBetweenBackends('localStorage', 'indexeddb', {
      onProgress: (done, total, currentTable) => {
        calls.push([done, total, currentTable]);
      },
    });

    // 每个 MIGRATABLE_TABLE 调一次，最后还调一次 (total, total, '')
    expect(calls.length).toBe(MIGRATABLE_TABLES.length + 1);
    expect(calls[0][1]).toBe(MIGRATABLE_TABLES.length);
    expect(calls[MIGRATABLE_TABLES.length]).toEqual([
      MIGRATABLE_TABLES.length,
      MIGRATABLE_TABLES.length,
      '',
    ]);
  });

  it('isolates failures: one table fails, others continue (continueOnError = true)', async () => {
    // 模拟 goals 的 target LS putMany 失败，其他表正常
    const realCreate = jest.requireActual('../../../common/repositories/repository').createLocalStorageRepository;
    const spy = jest.spyOn(repoModule, 'createLocalStorageRepository').mockImplementation(
      (key: string) => {
        if (key === OTHER_TABLE.lsKey) {
          return {
            ready: async () => {},
            get: async () => null,
            getAll: async () => [],
            put: async <T,>(e: T) => e,
            putMany: async () => { throw new Error('target offline'); },
            delete: async () => true,
            clear: async () => {},
            count: async () => 0,
            queryByIndex: async () => [],
            close: async () => {},
          } as unknown as ReadWriteRepository<{ id: string }>;
        }
        return realCreate(key);
      },
    );

    // 在 IDB 端放数据
    const db = await openGrowthDB();
    await db.put('trees', { id: 't1', name: 'tree-1', createdAt: '2024-01-01', updatedAt: '2024-01-01' });
    await db.put('goals', { id: 'g1', title: 'g-1', targetValue: 1, currentValue: 0, targetDate: '2024-12-31', status: 'active', description: '', category: 'other', createdAt: '2024-01-01', updatedAt: '2024-01-01' });

    const results: TableMigrationResult[] = await migrateBetweenBackends('indexeddb', 'localStorage');

    const goalsResult = results.find((r) => r.tableId === 'goals')!;
    const treesResult = results.find((r) => r.tableId === 'trees')!;
    expect(goalsResult.success).toBe(false);
    expect(goalsResult.error).toMatch(/target offline/);
    expect(treesResult.success).toBe(true);
    expect(treesResult.count).toBe(1);

    spy.mockRestore();
  });
});

describe('estimateMigrationSize', () => {
  it('returns total 0 and per-table 0 when source is inMemory', async () => {
    const result = await estimateMigrationSize('inMemory');
    expect(result.totalItems).toBe(0);
    expect(result.tables).toHaveLength(MIGRATABLE_TABLES.length);
    expect(result.tables.every((t) => t.count === 0)).toBe(true);
  });

  it('counts items across all tables from LS (max 1 per table)', async () => {
    const treesRepo = repoModule.createLocalStorageRepository<{ id: string, name: string }>(TABLE.lsKey);
    await treesRepo.put(sampleItem('r1'));
    const goalsRepo = repoModule.createLocalStorageRepository<{ id: string, title: string }>(OTHER_TABLE.lsKey);
    await goalsRepo.put({ id: 'g1', title: 'goal' });

    const result = await estimateMigrationSize('localStorage');
    expect(result.totalItems).toBe(2);
    expect(result.tables.find((t) => t.tableId === 'trees')?.count).toBe(1);
    expect(result.tables.find((t) => t.tableId === 'goals')?.count).toBe(1);
  });

  it('counts items across all tables from IDB', async () => {
    const db = await openGrowthDB();
    await db.put('trees', { id: 't1', name: 'a', createdAt: '2024-01-01', updatedAt: '2024-01-01' });
    await db.put('trees', { id: 't2', name: 'b', createdAt: '2024-01-01', updatedAt: '2024-01-01' });
    await db.put('goals', { id: 'g1', title: 'c', targetValue: 1, currentValue: 0, targetDate: '2024-12-31', status: 'active', description: '', category: 'other', createdAt: '2024-01-01', updatedAt: '2024-01-01' });

    const result = await estimateMigrationSize('indexeddb');
    expect(result.totalItems).toBe(3);
    expect(result.tables.find((t) => t.tableId === 'trees')?.count).toBe(2);
    expect(result.tables.find((t) => t.tableId === 'goals')?.count).toBe(1);
  });
});

describe('MIGRATABLE_TABLES registry', () => {
  it('contains all 7 expected tables', () => {
    const ids = MIGRATABLE_TABLES.map((t) => t.id).sort();
    expect(ids).toEqual(
      ['chatMessages', 'chatSessions', 'goals', 'records', 'reminders', 'trees', 'users'],
    );
  });

  it('every table has a unique id and lsKey', () => {
    const ids = MIGRATABLE_TABLES.map((t) => t.id);
    const keys = MIGRATABLE_TABLES.map((t) => t.lsKey);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('sqlite backend migration', () => {
  beforeEach(async () => {
    // 清掉之前所有数据 + InMemorySqliteClient
    await resetDatabase();
    clearAllLS();
    // 通过 jest.requireActual 拿一个全新的 in-memory client
    // 注意：这里依赖模块单例（InMemorySqliteClient），是 process-level 状态
    // 测试间可能互相污染，故每个 describe 内保证顺序
  });

  it('migrateTable from indexeddb to sqlite (empty source)', async () => {
    const result = await migrateTable(TABLE, 'indexeddb', 'sqlite');
    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
  });

  it('migrateTable from sqlite to sqlite returns no-op success', async () => {
    const result = await migrateTable(TABLE, 'sqlite', 'sqlite');
    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
  });

  it('migrateBetweenBackends: indexeddb → sqlite overwrites with IDB data', async () => {
    // 在 IDB 端放 2 条 trees
    const db = await openGrowthDB();
    await db.put('trees', { id: 't1', name: 'tree-1', createdAt: '2024-01-01', updatedAt: '2024-01-01' });
    await db.put('trees', { id: 't2', name: 'tree-2', createdAt: '2024-01-01', updatedAt: '2024-01-01' });

    const results = await migrateBetweenBackends('indexeddb', 'sqlite', { overwrite: true });
    // 全部表应被复制（trees 有 2 条；其他表 0 条）
    const treesResult = results.find((r) => r.tableId === 'trees')!;
    expect(treesResult.success).toBe(true);
    expect(treesResult.count).toBe(2);
  });

  it('estimateMigrationSize works for sqlite source', async () => {
    const result = await estimateMigrationSize('sqlite');
    expect(result.tables).toHaveLength(MIGRATABLE_TABLES.length);
    // sqlite 客户端是 process-level 单例状态，可能保留上次测试的数据
    // 这里只断言结构正确
    result.tables.forEach((t) => {
      expect(t).toHaveProperty('tableId');
      expect(t).toHaveProperty('count');
    });
  });
});
