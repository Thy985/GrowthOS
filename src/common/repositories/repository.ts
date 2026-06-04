/**
 * Repository 基类
 *
 * 业务代码不再直接 import IndexedDbAdapter / LocalStorageAdapter，
 * 而是通过 Repository 拿一个 typed 的"表"对象。
 *
 * 设计动机：
 * 1. 隐藏后端选型。决定走 IndexedDB / LocalStorage / InMemory
 *    是 Repository 的事，业务只看到 get/put/delete/getAll。
 * 2. 懒初始化。Adapter init() 是 async，但业务不想每次 await。
 *    Repository 内部 promise 化，多并发调用合并到同一个 init。
 * 3. 测试可注入。createInMemory() 走纯内存后端，零外部依赖。
 * 4. 装饰器可堆叠。`createIndexedDbRepository(store, { cache: true, sync: true })`
 *    自动包成 SyncedRepository(CachingRepository(Repository))，
 *    业务侧拿到同一个 ReadWriteRepository 接口。
 */

import {
  IndexedDbAdapter,
  InMemoryAdapter,
  LocalStorageAdapter,
  SqliteAdapter,
  InMemorySqliteClient,
  type BaseEntity,
  type StorageAdapter,
  type StorageError,
} from '../../storage';
import type { SqliteClient } from '../../storage/backends/sqlite';
import type { EntityStore } from '../../storage/schema/types';
import { CachingRepository, type CachingRepositoryOptions } from '../../storage/cache/cachingRepository';
import { SyncedRepository } from '../../storage/sync/syncedRepository';

export type { StorageError };

// 平台检测：Capacitor.isNativePlatform() 在浏览器测试下是 false
// 这里用 typeof indexedDB 更稳：jsdom 有 fake-indexeddb 时是 object，原生浏览器也是 object
function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined' && indexedDB !== null;
}

/**
 * 业务侧用的通用 Repository 接口。
 *
 * 所有"表"对外暴露同一组读写方法（get/put/...），
 * 底层可以是裸 IDB / 带缓存 / 带跨 tab 同步，调用方无感。
 */
export interface ReadWriteRepository<T extends BaseEntity> {
  /** 懒初始化：多次调用复用同一个 init promise */
  ready(): Promise<void>,
  get(id: string): Promise<T | null>,
  getAll(): Promise<T[]>,
  put(entity: T): Promise<T>,
  putMany(entities: T[]): Promise<T[]>,
  delete(id: string): Promise<boolean>,
  clear(): Promise<void>,
  count(): Promise<number>,
  queryByIndex(index: string, range?: { gte?: string | number, lte?: string | number }): Promise<T[]>,
  close(): Promise<void>,
}

/**
 * 装饰器配置：让业务侧按需启用缓存 / 跨 tab 同步
 */
export interface RepositoryDecorators {
  /** 是否在 Repository 上包一层 LRU 读缓存 */
  cache?: boolean | CachingRepositoryOptions,
  /** 是否在 Repository 上包一层 BroadcastChannel 跨 tab 同步 */
  sync?: boolean,
}

/**
 * 基础 Repository：把 StorageAdapter 包成懒初始化的 typed "表"。
 */
export class Repository<T extends BaseEntity> implements ReadWriteRepository<T> {
  private initPromise: Promise<void> | null = null;

  constructor(private readonly adapter: StorageAdapter<T>) {}

  async ready(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.adapter.init();
    }
    return this.initPromise;
  }

  get idb(): StorageAdapter<T> {
    return this.adapter;
  }

  async get(id: string): Promise<T | null> {
    await this.ready();
    return this.adapter.get(id);
  }

  async getAll(): Promise<T[]> {
    await this.ready();
    return this.adapter.getAll();
  }

  async put(entity: T): Promise<T> {
    await this.ready();
    return this.adapter.put(entity);
  }

  async putMany(entities: T[]): Promise<T[]> {
    await this.ready();
    return this.adapter.putMany(entities);
  }

  async delete(id: string): Promise<boolean> {
    await this.ready();
    return this.adapter.delete(id);
  }

  async clear(): Promise<void> {
    await this.ready();
    return this.adapter.clear();
  }

  async count(): Promise<number> {
    await this.ready();
    return this.adapter.count();
  }

  async queryByIndex(index: string, range?: { gte?: string | number, lte?: string | number }): Promise<T[]> {
    await this.ready();
    return this.adapter.query({ index, range });
  }

  async close(): Promise<void> {
    return this.adapter.close();
  }
}

/**
 * 创建 IndexedDB Repository（生产 / 开发）
 *
 * 可选装饰器：
 *   createIndexedDbRepository<GrowthRecord>('records')              // 裸 IDB
 *   createIndexedDbRepository<GrowthRecord>('records', { cache: true })  // + LRU 缓存
 *   createIndexedDbRepository<GrowthRecord>('records', { sync: true })   // + 跨 tab 同步
 *   createIndexedDbRepository<GrowthRecord>('records', { cache: true, sync: true })
 *                                                                  // 两者都启用
 */
export function createIndexedDbRepository<T extends BaseEntity>(
  store: EntityStore,
  decorators: RepositoryDecorators = {},
): ReadWriteRepository<T> {
  if (!hasIndexedDB()) {
    throw new Error(
      `createIndexedDbRepository(${store}): IndexedDB is not available in this environment. ` +
      'Use createFallbackRepository() for SSR / tests.',
    );
  }
  const base = new Repository<T>(new IndexedDbAdapter<T>(store));
  return decorateRepository(base, store, decorators);
}

/**
 * 创建 LocalStorage Repository（小 config、单条记录）
 */
export function createLocalStorageRepository<T extends BaseEntity>(
  key: string,
  decorators: RepositoryDecorators = {},
): ReadWriteRepository<T> {
  const base = new Repository<T>(new LocalStorageAdapter<T>(key));
  // LocalStorage 是单 key 单条数据，跨 tab 同步由浏览器原生提供；缓存意义不大
  // 这里仍允许装饰器叠加，但默认不启用
  return decorators.cache || decorators.sync
    ? decorateRepository(base, key, decorators)
    : base;
}

/**
 * 创建纯内存 Repository（测试 / 兜底）
 */
export function createInMemoryRepository<T extends BaseEntity>(
  decorators: RepositoryDecorators = {},
): ReadWriteRepository<T> {
  const base = new Repository<T>(new InMemoryAdapter<T>());
  return decorators.cache || decorators.sync
    ? decorateRepository(base, 'inMemory', decorators)
    : base;
}

/**
 * 创建 SQLite Repository（Native: Capacitor iOS/Android / Web 降级: InMemory）
 *
 * - 注入 SqliteClient，默认为 InMemorySqliteClient（web 兜底）
 * - 真实 native 部署时，调用方应传 createPlatformSqliteClient() 的结果
 */
export function createSqliteRepository<T extends BaseEntity>(
  table: string,
  decorators: RepositoryDecorators = {},
  client?: SqliteClient,
): ReadWriteRepository<T> {
  const sqliteClient = client ?? new InMemorySqliteClient();
  const base = new Repository<T>(new SqliteAdapter<T>(sqliteClient, table));
  return decorators.cache || decorators.sync
    ? decorateRepository(base, `sqlite:${table}`, decorators)
    : base;
}

/**
 * 智能创建：有 IndexedDB 就用 IDB，否则退到内存
 * 用于不知道目标环境是否支持 IDB 的场景（如 service worker、测试）
 */
export function createFallbackRepository<T extends BaseEntity>(
  store: EntityStore,
  decorators: RepositoryDecorators = {},
): ReadWriteRepository<T> {
  if (hasIndexedDB()) {
    return createIndexedDbRepository<T>(store, decorators);
  }
  return createInMemoryRepository<T>(decorators);
}

/**
 * 装饰器栈工厂：在已建好的 Repository 上按顺序叠加装饰器
 *
 * 顺序：cache → sync（内层是 cache，外层是 sync）
 *
 * 为什么这样：
 * - 写路径：sync.broadcastPut → cache.invalidate → inner.put
 *   这样其他 tab 收到事件时，cache 已经被本 tab 的写失效，
 *   它们再读时不会拿到本 tab 失效前的脏值。
 * - 读路径：sync.get → cache.get → inner.get
 *   缓存命中时直接返回；其他 tab 写时由 sync 事件触发 cache 失效。
 *
 * 注意：cachingRepository / syncedRepository 仅 `import type` 引用 Repository，
 * 所以此处反向引用不会产生 runtime 循环。
 */
export function decorateRepository<T extends BaseEntity>(
  base: ReadWriteRepository<T>,
  store: string,
  decorators: RepositoryDecorators,
): ReadWriteRepository<T> {
  let current: ReadWriteRepository<T> = base;

  if (decorators.cache) {
    const cacheOpts: CachingRepositoryOptions =
      decorators.cache === true ? {} : decorators.cache;
    // 当前 current 实际是 Repository 实例（CachingRepository 构造签名要求 Repository）
    current = new CachingRepository<T>(current as Repository<T>, cacheOpts);
  }

  if (decorators.sync) {
    current = new SyncedRepository<T>(
      current as Repository<T> | CachingRepository<T>,
      store,
    );
  }

  return current;
}
