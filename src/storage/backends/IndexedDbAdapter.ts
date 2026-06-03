/**
 * IndexedDbAdapter
 *
 * 用途：业务数据（records / goals / reminders / users / chat）
 *
 * 设计：
 * - 每个 Adapter 实例对应一个 object store
 * - 所有方法走 IDB 事务
 * - query() 用索引（高频字段有 by-updated 等索引）
 *
 * 注意：
 * - 业务类型来自 src/types/index.ts（迁移时映射到 schema/types.ts 的 *Entity）
 * - 当前 step 仍用 schema/types.ts 的内部类型作为占位
 */

import type { IDBPDatabase } from 'idb';
import type { BaseEntity, StorageAdapter, QueryOptions, QueryValue } from '../types';
import type { GrowthOSDB, EntityStore } from '../schema/types';
import { getDB } from '../schema';
import { StorageError } from '../errors';

// idb 的 value type 是 GrowthOSDB[EntityStore]['value']，是各 store value 的联合
// Adapter<T> 的 T 必须能 cast 到这个联合
type IdbValue = GrowthOSDB[EntityStore]['value'];

export class IndexedDbAdapter<T extends BaseEntity> implements StorageAdapter<T> {
  private db: IDBPDatabase<GrowthOSDB> | null = null;

  constructor(private readonly storeName: EntityStore) {
    if (!storeName) {
      throw new StorageError('INVALID_INPUT', 'IndexedDbAdapter requires a non-empty storeName');
    }
  }

  async init(): Promise<void> {
    try {
      this.db = await getDB();
    } catch (err) {
      throw StorageError.from(err, `Failed to init IndexedDB for store ${this.storeName}`);
    }
  }

  private requireDb(): IDBPDatabase<GrowthOSDB> {
    if (!this.db) {
      throw new StorageError('PLATFORM_UNAVAILABLE', 'IndexedDbAdapter not initialized');
    }
    return this.db;
  }

  private get store() {
    return this.requireDb().transaction(this.storeName, 'readonly').objectStore(this.storeName);
  }

  private get rwStore() {
    return this.requireDb().transaction(this.storeName, 'readwrite').objectStore(this.storeName);
  }

  private castToT(value: unknown): T {
    return value as T;
  }

  private castToTArray(values: unknown[]): T[] {
    return values as T[];
  }

  async get(id: string): Promise<T | null> {
    try {
      const result = await this.store.get(id);
      return result ? this.castToT(result) : null;
    } catch (err) {
      throw StorageError.from(err, `Failed to get ${id} from ${this.storeName}`);
    }
  }

  async getAll(): Promise<T[]> {
    try {
      const results = await this.store.getAll();
      return this.castToTArray(results as unknown[]);
    } catch (err) {
      throw StorageError.from(err, `Failed to getAll from ${this.storeName}`);
    }
  }

  async query(options: QueryOptions = {}): Promise<T[]> {
    try {
      const db = this.requireDb();
      const tx = db.transaction(this.storeName, 'readonly');
      const objectStore = tx.objectStore(this.storeName);

      let results: T[] = [];

      if (options.index && options.range) {
        const idbRange = this.buildIdbRange(options.range);
        const index = objectStore.index(options.index as keyof GrowthOSDB[EntityStore]['indexes'] & string);
        if (idbRange) {
          results = this.castToTArray((await index.getAll(idbRange)) as unknown[]);
        } else {
          results = this.castToTArray((await index.getAll()) as unknown[]);
        }
      } else if (options.index) {
        const index = objectStore.index(options.index as keyof GrowthOSDB[EntityStore]['indexes'] & string);
        results = this.castToTArray((await index.getAll()) as unknown[]);
      } else if (options.range) {
        // 无索引的范围查询退化为全表扫描（按 sortBy/key 字段）
        const all = this.castToTArray((await objectStore.getAll()) as unknown[]);
        const { gte, lte, gt, lt } = options.range;
        const key = (options.sortBy as string) ?? 'id';
        results = all.filter((item) => {
          const v = (item as unknown as Record<string, QueryValue>)[key];
          if (v === undefined || v === null) return false;
          if (gte !== undefined && gte !== null && v < gte) return false;
          if (lte !== undefined && lte !== null && v > lte) return false;
          if (gt !== undefined && gt !== null && v <= gt) return false;
          if (lt !== undefined && lt !== null && v >= lt) return false;
          return true;
        });
      } else {
        results = this.castToTArray((await objectStore.getAll()) as unknown[]);
      }

      // 排序
      if (options.sortBy) {
        const dir = options.sortDirection === 'desc' ? -1 : 1;
        const key = options.sortBy as string;
        results.sort((a, b) => {
          const av = (a as unknown as Record<string, unknown>)[key];
          const bv = (b as unknown as Record<string, unknown>)[key];
          if (av === bv) return 0;
          if (av === undefined || av === null) return 1;
          if (bv === undefined || bv === null) return -1;
          return av < bv ? -1 * dir : 1 * dir;
        });
      }

      // 偏移
      if (options.offset && options.offset > 0) {
        results = results.slice(options.offset);
      }
      if (options.limit !== undefined && options.limit >= 0) {
        results = results.slice(0, options.limit);
      }

      return results;
    } catch (err) {
      throw StorageError.from(err, `Failed to query ${this.storeName}`);
    }
  }

  private buildIdbRange(range: { gte?: QueryValue, lte?: QueryValue, gt?: QueryValue, lt?: QueryValue }): IDBKeyRange | undefined {
    const gte = range.gte ?? null;
    const lte = range.lte ?? null;
    const gt = range.gt ?? null;
    const lt = range.lt ?? null;
    if (gte !== null && lte !== null) return IDBKeyRange.bound(gte, lte);
    if (gt !== null && lt !== null) return IDBKeyRange.bound(gt, lt, true, true);
    if (gte !== null && lt !== null) return IDBKeyRange.bound(gte, lt, false, true);
    if (gt !== null && lte !== null) return IDBKeyRange.bound(gt, lte, true, false);
    if (gte !== null) return IDBKeyRange.lowerBound(gte, false);
    if (gt !== null) return IDBKeyRange.lowerBound(gt, true);
    if (lte !== null) return IDBKeyRange.upperBound(lte, false);
    if (lt !== null) return IDBKeyRange.upperBound(lt, true);
    return undefined;
  }

  async put(entity: T): Promise<T> {
    if (!entity.id) {
      throw new StorageError('INVALID_INPUT', 'Entity must have an id');
    }
    try {
      await this.rwStore.put(entity as unknown as IdbValue);
      return entity;
    } catch (err) {
      throw StorageError.from(err, `Failed to put ${entity.id} into ${this.storeName}`);
    }
  }

  async putMany(entities: T[]): Promise<T[]> {
    const results: T[] = [];
    try {
      const db = this.requireDb();
      const tx = db.transaction(this.storeName, 'readwrite');
      const objectStore = tx.objectStore(this.storeName);
      for (const entity of entities) {
        if (!entity.id) {
          throw new StorageError('INVALID_INPUT', 'Entity must have an id');
        }
        await objectStore.put(entity as unknown as IdbValue);
        results.push(entity);
      }
      await tx.done;
      return results;
    } catch (err) {
      throw StorageError.from(err, `Failed to putMany into ${this.storeName}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.rwStore.delete(id);
      return true;
    } catch (err) {
      throw StorageError.from(err, `Failed to delete ${id} from ${this.storeName}`);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.rwStore.clear();
    } catch (err) {
      throw StorageError.from(err, `Failed to clear ${this.storeName}`);
    }
  }

  async count(): Promise<number> {
    try {
      return await this.store.count();
    } catch (err) {
      throw StorageError.from(err, `Failed to count ${this.storeName}`);
    }
  }

  async close(): Promise<void> {
    this.db = null;
  }
}
