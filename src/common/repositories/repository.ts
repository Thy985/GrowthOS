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
 */

import {
  IndexedDbAdapter,
  InMemoryAdapter,
  LocalStorageAdapter,
  type BaseEntity,
  type StorageAdapter,
  type StorageError,
} from '../../storage';
import type { EntityStore } from '../../storage/schema/types';

export type { StorageError };

// 平台检测：Capacitor.isNativePlatform() 在浏览器测试下是 false
// 这里用 typeof indexedDB 更稳：jsdom 有 fake-indexeddb 时是 object，原生浏览器也是 object
function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined' && indexedDB !== null;
}

/**
 * 业务层用的 typed "表"。
 * 暴露 StorageAdapter 的全部方法，但参数类型锁定到 T。
 */
export class Repository<T extends BaseEntity> {
  private initPromise: Promise<void> | null = null;

  constructor(private readonly adapter: StorageAdapter<T>) {}

  /** 懒初始化：多次调用复用同一个 init promise */
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
 */
export function createIndexedDbRepository<T extends BaseEntity>(
  store: EntityStore,
): Repository<T> {
  if (!hasIndexedDB()) {
    throw new Error(
      `createIndexedDbRepository(${store}): IndexedDB is not available in this environment. ` +
      'Use createFallbackRepository() for SSR / tests.',
    );
  }
  return new Repository<T>(new IndexedDbAdapter<T>(store));
}

/**
 * 创建 LocalStorage Repository（小 config、单条记录）
 */
export function createLocalStorageRepository<T extends BaseEntity>(
  key: string,
): Repository<T> {
  return new Repository<T>(new LocalStorageAdapter<T>(key));
}

/**
 * 创建纯内存 Repository（测试 / 兜底）
 * 业务侧一般不用，用 createIndexedDbRepository 即可（IndexedDB 不可用时
 * 由 Repository 内部降级）。
 */
export function createInMemoryRepository<T extends BaseEntity>(): Repository<T> {
  return new Repository<T>(new InMemoryAdapter<T>());
}

/**
 * 智能创建：有 IndexedDB 就用 IDB，否则退到内存
 * 用于不知道目标环境是否支持 IDB 的场景（如 service worker、测试）
 */
export function createFallbackRepository<T extends BaseEntity>(
  store: EntityStore,
): Repository<T> {
  if (hasIndexedDB()) {
    return createIndexedDbRepository<T>(store);
  }
  return createInMemoryRepository<T>();
}
