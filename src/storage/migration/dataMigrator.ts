/**
 * 数据迁移工具：把数据从一个 backend 复制到另一个 backend
 *
 * 用途：用户在 StorageSettings 切换 storage backend 时，保留数据
 *   1. 读所有表的数据从 fromKind（按每个表的 backend-specific key 读）
 *   2. 写到 toKind（同样按 key 写）
 *   3. 任何表失败不影响其他表，返回每个表的 MigrationResult
 *
 * 边界情况：
 * - fromKind === toKind：直接返回（不复制）
 * - fromKind = inMemory：没有持久数据，count = 0
 * - toKind = inMemory：不写持久层（纯运行时）；跳过
 * - 任一表失败：捕获错误，标记失败，继续下一个
 *
 * ⚠️ 已知限制：
 * - LocalStorageAdapter 当前实现是"单 key 单记录"模式（不是数组存储）。
 *   服务 put 一个 entity 会覆盖前一个，导致 LS backend 实际只能保留最后一条。
 *   这是 pre-existing 问题，不在 migrator 修复范围。
 *   migrator 行为：对 LS 源，getAll() 返回 ≤ 1 entity，照实复制。
 *
 * 设计动机：
 * - 不依赖 service 模块（避免循环引用）
 * - 不装饰器（migration 是 transient operation；不需要 cache/sync）
 * - 不修改 source（只读 + 写 target）
 */

import {
  createIndexedDbRepository,
  createLocalStorageRepository,
  createInMemoryRepository,
  type ReadWriteRepository,
} from '../../common/repositories/repository';
import type { BaseEntity } from '../types';
import type { StorageBackendKind } from '../config/storageConfig';
import type { EntityStore } from '../schema/types';

/** 描述一个可被迁移的"表" */
export interface MigratableTable {
  /** 人类可读 id（用于 log / UI） */
  id: string,
  /** LocalStorage 模式下用的 key */
  lsKey: string,
  /** IndexedDB 模式下用的 object store */
  store: EntityStore,
}

/**
 * 可迁移的表清单
 *
 * 不包含：
 * - LLMConfig / AISettings（永远 LS，无 IDB store；用户偏好应该跟 backend 走）
 * - currentUser（永远 LS；跨 tab session 同步关键）
 *
 * 数据格式约束：
 * - IDB store 内存储的 value 就是业务实体（如 Tree 含 children 嵌入数组）
 * - LS key 下存储的是 Array<entity>（LocalStorageAdapter 约定）
 * - 所以两端直接 getAll / putMany 即可，**不需要**类型转换
 */
export const MIGRATABLE_TABLES: readonly MigratableTable[] = [
  { id: 'records', lsKey: 'records', store: 'records' },
  { id: 'goals', lsKey: 'growth-goals', store: 'goals' },
  { id: 'reminders', lsKey: 'growth-reminders', store: 'reminders' },
  { id: 'trees', lsKey: 'growth-trees', store: 'trees' },
  { id: 'users', lsKey: 'auth-users', store: 'users' },
  { id: 'chatSessions', lsKey: 'chatSessions', store: 'chatSessions' },
  { id: 'chatMessages', lsKey: 'chatMessages', store: 'chatMessages' },
];

/** 单表迁移结果 */
export interface TableMigrationResult {
  tableId: string,
  fromKind: StorageBackendKind,
  toKind: StorageBackendKind,
  count: number,
  success: boolean,
  error?: string,
  /** 当源或目标为 inMemory 时标记为 skipped */
  skipped?: boolean,
}

export interface MigrationOptions {
  /** 进度回调（已完成的表数, 总表数, 当前表 id） */
  onProgress?: (done: number, total: number, currentTableId: string) => void,
  /** 目标 backend 已有数据时是否覆盖（默认 true） */
  overwrite?: boolean,
  /** 遇到错误时是否继续（默认 true） */
  continueOnError?: boolean,
}

/**
 * 创建一个针对 migration 场景的"裸" Repository
 *
 * - 不启用 cache（migration 是一次性操作，缓存无意义）
 * - 不启用 sync（不需要广播变更）
 */
function createScratchRepository<T extends BaseEntity>(
  kind: StorageBackendKind,
  table: MigratableTable,
): ReadWriteRepository<T> {
  switch (kind) {
    case 'indexeddb':
      return createIndexedDbRepository<T>(table.store, { cache: false, sync: false });
    case 'localStorage':
      return createLocalStorageRepository<T>(table.lsKey, { cache: false, sync: false });
    case 'inMemory':
      return createInMemoryRepository<T>({ cache: false, sync: false });
  }
}

/** 迁移单表：sourceRepo.getAll → targetRepo.putMany */
export async function migrateTable(
  table: MigratableTable,
  fromKind: StorageBackendKind,
  toKind: StorageBackendKind,
  options?: MigrationOptions,
): Promise<TableMigrationResult> {
  const result: TableMigrationResult = {
    tableId: table.id,
    fromKind,
    toKind,
    count: 0,
    success: true,
  };

  if (fromKind === toKind) {
    return { ...result, success: true, count: 0, skipped: true };
  }

  if (fromKind === 'inMemory') {
    return { ...result, success: true, count: 0, skipped: true };
  }

  if (toKind === 'inMemory') {
    // inMemory 跨刷新就丢，写进去也没意义
    return { ...result, success: true, count: 0, skipped: true };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sourceRepo = createScratchRepository<any>(fromKind, table);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetRepo = createScratchRepository<any>(toKind, table);

    await sourceRepo.ready();
    await targetRepo.ready();

    const items = await sourceRepo.getAll();
    result.count = items.length;

    if (items.length > 0) {
      const overwrite = options?.overwrite ?? true;
      if (overwrite) {
        // 先清空 target（保证语义：完全替换）
        await targetRepo.clear();
        await targetRepo.putMany(items);
      } else {
        // 不覆盖：仅插入 ID 不冲突的
        for (const item of items) {
          const existing = await targetRepo.get(item.id);
          if (!existing) {
            await targetRepo.put(item);
          }
        }
      }
    }
  } catch (err) {
    result.success = false;
    result.error = err instanceof Error ? err.message : String(err);
  }

  return result;
}

/** 迁移所有表：串行执行，失败时按 continueOnError 决定是否继续 */
export async function migrateBetweenBackends(
  fromKind: StorageBackendKind,
  toKind: StorageBackendKind,
  options?: MigrationOptions,
): Promise<TableMigrationResult[]> {
  if (fromKind === toKind) {
    return MIGRATABLE_TABLES.map((table) => ({
      tableId: table.id,
      fromKind,
      toKind,
      count: 0,
      success: true,
      skipped: true,
    }));
  }

  const results: TableMigrationResult[] = [];
  const total = MIGRATABLE_TABLES.length;
  const continueOnError = options?.continueOnError ?? true;

  for (let i = 0; i < MIGRATABLE_TABLES.length; i++) {
    const table = MIGRATABLE_TABLES[i];
    options?.onProgress?.(i, total, table.id);

    try {
      const result = await migrateTable(table, fromKind, toKind, options);
      results.push(result);
      if (!result.success && !continueOnError) {
        // 短路：把剩余表标记为未执行
        for (let j = i + 1; j < MIGRATABLE_TABLES.length; j++) {
          results.push({
            tableId: MIGRATABLE_TABLES[j].id,
            fromKind,
            toKind,
            count: 0,
            success: false,
            error: 'aborted due to previous failure',
          });
        }
        break;
      }
    } catch (err) {
      // migrateTable 自己已经 try-catch；这里是双保险
      results.push({
        tableId: table.id,
        fromKind,
        toKind,
        count: 0,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
      if (!continueOnError) break;
    }
  }

  options?.onProgress?.(total, total, '');
  return results;
}

/** 估算迁移的数据量（用于 UI 显示"将复制 X 条记录"） */
export async function estimateMigrationSize(
  fromKind: StorageBackendKind,
): Promise<{ totalItems: number, tables: Array<{ tableId: string, count: number }> }> {
  if (fromKind === 'inMemory') {
    return { totalItems: 0, tables: MIGRATABLE_TABLES.map((t) => ({ tableId: t.id, count: 0 })) };
  }

  const tables: Array<{ tableId: string, count: number }> = [];
  let totalItems = 0;

  for (const table of MIGRATABLE_TABLES) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const repo = createScratchRepository<any>(fromKind, table);
      await repo.ready();
      const count = await repo.count();
      tables.push({ tableId: table.id, count });
      totalItems += count;
    } catch {
      tables.push({ tableId: table.id, count: 0 });
    }
  }

  return { totalItems, tables };
}
