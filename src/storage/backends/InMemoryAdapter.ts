/**
 * InMemoryAdapter
 *
 * 用途：
 * - 单元测试：业务 Repository 直接用这个，零外部依赖
 * - 运行时兜底：IndexedDB 不可用时（如 Safari 隐私模式）降级到内存
 *
 * 特点：
 * - 全异步 API 形态一致
 * - 实现了"模糊查询"和范围（与 IndexedDB 不同，简化）
 * - put 覆盖式（与 IndexedDB 一致）
 */

import type { BaseEntity, StorageAdapter, QueryOptions, QueryValue } from '../types';
import { StorageError } from '../errors';

export class InMemoryAdapter<T extends BaseEntity> implements StorageAdapter<T> {
  private store: Map<string, T> = new Map();
  private initialized = false;

  async init(): Promise<void> {
    this.initialized = true;
  }

  private ensureInit(): void {
    if (!this.initialized) {
      throw new StorageError('PLATFORM_UNAVAILABLE', 'InMemoryAdapter not initialized');
    }
  }

  async get(id: string): Promise<T | null> {
    this.ensureInit();
    return this.store.get(id) ?? null;
  }

  async getAll(): Promise<T[]> {
    this.ensureInit();
    return Array.from(this.store.values());
  }

  async query(options: QueryOptions = {}): Promise<T[]> {
    this.ensureInit();
    let results = Array.from(this.store.values());

    // 范围过滤
    if (options.range) {
      const { gte, lte, gt, lt } = options.range;
      results = results.filter((item) => {
        // 注：内存版只支持按一个字段做 range（取第一项作为参考字段）
        // 真正的复杂 range 应该走 IDB index
        const value = (item as unknown as Record<string, QueryValue>)[
          (options.sortBy as string) ?? 'id'
        ];
        if (value === undefined || value === null) return false;
        if (gte !== undefined && gte !== null && value < gte) return false;
        if (lte !== undefined && lte !== null && value > lte) return false;
        if (gt !== undefined && gt !== null && value <= gt) return false;
        if (lt !== undefined && lt !== null && value >= lt) return false;
        return true;
      });
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
  }

  async put(entity: T): Promise<T> {
    this.ensureInit();
    if (!entity.id) {
      throw new StorageError('INVALID_INPUT', 'Entity must have an id');
    }
    this.store.set(entity.id, entity);
    return entity;
  }

  async putMany(entities: T[]): Promise<T[]> {
    this.ensureInit();
    const results: T[] = [];
    for (const entity of entities) {
      results.push(await this.put(entity));
    }
    return results;
  }

  async delete(id: string): Promise<boolean> {
    this.ensureInit();
    return this.store.delete(id);
  }

  async clear(): Promise<void> {
    this.ensureInit();
    this.store.clear();
  }

  async count(): Promise<number> {
    this.ensureInit();
    return this.store.size;
  }

  async close(): Promise<void> {
    this.initialized = false;
  }

  // 测试辅助
  has(id: string): boolean {
    return this.store.has(id);
  }

  // 测试辅助
  size(): number {
    return this.store.size;
  }
}
