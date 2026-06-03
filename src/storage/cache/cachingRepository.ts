/**
 * 跨 Repository 的读缓存层
 *
 * 把 LRUCache 接入 Repository：
 * - get() 命中缓存 → 不走底层
 * - getAll() → 可选：整体列表也缓存（短 TTL）
 * - put() / delete() / clear() → 失效对应 key 或整库
 *
 * 这是个**装饰器**，业务侧拿到带缓存的 Repository 后不需要改任何调用。
 *
 * 适用场景：
 * - 高频读 / 低频写（如目标列表、记录列表）
 * - 跨 slice 共享同一份内存数据（避免多次 IDB 查询）
 *
 * 不适用：
 * - 实时性要求 < 缓存 TTL 的场景
 * - 跨 tab 协同（应该交给 BroadcastChannel 处理）
 */

import type { BaseEntity, StorageAdapter } from '../types';
import type { ReadWriteRepository, Repository } from '../../common/repositories/repository';
import { LRUCache, type LRUOptions } from './lruCache';

export interface CachingRepositoryOptions extends LRUOptions {
  /** 是否缓存 getAll() 结果；默认 false（避免与 BroadcastChannel 冲突） */
  cacheGetAll?: boolean,
  /** getAll() 缓存 TTL；默认 1000ms */
  getAllTtlMs?: number,
}

/**
 * 装饰 Repository：包一层读缓存
 *
 * 注意：原 Repository 的 get() / getAll() 行为不变，
 *       只是结果先查缓存，命中就直接返回。
 *
 * 写路径（put / delete / clear / putMany）保持直通，
 * 但在调用前**先失效**对应 key。
 */
export class CachingRepository<T extends BaseEntity> implements ReadWriteRepository<T> {
  private readonly itemCache: LRUCache<T>;
  private readonly listCache: LRUCache<T[]> | null;
  private readonly getAllTtlMs: number;

  constructor(
    private readonly inner: Repository<T>,
    options: CachingRepositoryOptions = {},
  ) {
    this.itemCache = new LRUCache<T>({ maxSize: options.maxSize, ttlMs: options.ttlMs });
    this.listCache = options.cacheGetAll
      ? new LRUCache<T[]>({ maxSize: 16, ttlMs: options.getAllTtlMs ?? 1000 })
      : null;
    this.getAllTtlMs = options.getAllTtlMs ?? 1000;
  }

  async ready(): Promise<void> {
    return this.inner.ready();
  }

  get idb(): StorageAdapter<T> {
    return this.inner.idb;
  }

  async get(id: string): Promise<T | null> {
    const cached = this.itemCache.get(id);
    if (cached !== undefined) return cached;
    const fresh = await this.inner.get(id);
    if (fresh !== null) {
      this.itemCache.set(id, fresh);
    }
    return fresh;
  }

  async getAll(): Promise<T[]> {
    if (this.listCache) {
      const cached = this.listCache.get('__all__');
      if (cached !== undefined) return cached;
    }
    const fresh = await this.inner.getAll();
    if (this.listCache) {
      this.listCache.set('__all__', fresh);
    } else {
      // 即便不缓存 list，也填充 item 缓存（让后续 get() 命中）
      for (const item of fresh) this.itemCache.set(item.id, item);
    }
    return fresh;
  }

  async put(entity: T): Promise<T> {
    // 失效顺序：先失效缓存再写，否则 put 失败时缓存也会被错误清掉
    this.itemCache.invalidate(entity.id);
    this.listCache?.invalidate('__all__');
    const result = await this.inner.put(entity);
    this.itemCache.set(result.id, result);
    return result;
  }

  async putMany(entities: T[]): Promise<T[]> {
    for (const e of entities) this.itemCache.invalidate(e.id);
    this.listCache?.invalidate('__all__');
    const result = await this.inner.putMany(entities);
    for (const r of result) this.itemCache.set(r.id, r);
    return result;
  }

  async delete(id: string): Promise<boolean> {
    this.itemCache.invalidate(id);
    this.listCache?.invalidate('__all__');
    return this.inner.delete(id);
  }

  async clear(): Promise<void> {
    this.itemCache.invalidateAll();
    this.listCache?.invalidateAll();
    return this.inner.clear();
  }

  async count(): Promise<number> {
    return this.inner.count();
  }

  async queryByIndex(index: string, range?: { gte?: string | number, lte?: string | number }): Promise<T[]> {
    return this.inner.queryByIndex(index, range);
  }

  async close(): Promise<void> {
    return this.inner.close();
  }

  /** 测试 / 调试：清掉缓存（不影响底层数据） */
  invalidateAll(): void {
    this.itemCache.invalidateAll();
    this.listCache?.invalidateAll();
  }

  /** 测试 / 调试：缓存统计 */
  cacheStats(): { items: number, lists: number } {
    return {
      items: this.itemCache.size,
      lists: this.listCache?.size ?? 0,
    };
  }
}
