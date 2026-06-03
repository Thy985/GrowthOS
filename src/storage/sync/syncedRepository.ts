/**
 * SyncedRepository
 *
 * 把 CrossTabChannel 接入 Repository：
 * - 本地 put / delete / clear → 广播给其他 tab
 * - 收到其他 tab 的事件 → 失效本地缓存
 *
 * 通常与 CachingRepository 组合使用：
 *
 *   base = createIndexedDbRepository<GrowthRecord>('records')
 *   cached = new CachingRepository(base)
 *   synced = new SyncedRepository(cached, 'records')
 *
 * 然后业务侧用 synced：读路径享受缓存，写路径自动广播。
 */

import type { BaseEntity } from '../types';
import type { ReadWriteRepository, Repository } from '../../common/repositories/repository';
import { CrossTabChannel, getDefaultChannelName } from './crossTabChannel';
import { CachingRepository } from '../cache/cachingRepository';

export class SyncedRepository<T extends BaseEntity> implements ReadWriteRepository<T> {
  private readonly channel: CrossTabChannel;
  private readonly store: string;
  private unsubscribe: (() => void) | null = null;
  private readonly invalidator: (key: string) => void;
  private readonly invalidateAllFn: () => void;

  constructor(
    private readonly inner: Repository<T> | CachingRepository<T>,
    store: string,
    channelName?: string,
  ) {
    this.store = store;
    this.channel = new CrossTabChannel(channelName ?? getDefaultChannelName(store as never));

    if (inner instanceof CachingRepository) {
      this.invalidator = (_key) => inner.invalidateAll();
      this.invalidateAllFn = () => inner.invalidateAll();
    } else {
      // 纯 Repository（无缓存）：也不维护内存态，但仍订阅以便业务侧可自己处理
      this.invalidator = () => {};
      this.invalidateAllFn = () => {};
    }

    this.unsubscribe = this.channel.subscribe((event) => {
      if (event.store !== store) return;
      if (event.type === 'clear') {
        this.invalidateAllFn();
      } else {
        // put / delete：id 不一定还有，最稳妥是失效全库
        this.invalidateAllFn();
      }
    });
  }

  get isCrossTabSupported(): boolean {
    return this.channel.isSupported;
  }

  get tabId(): string {
    return this.channel.id;
  }

  async ready(): Promise<void> {
    return this.inner.ready();
  }

  async get(id: string): Promise<T | null> {
    return this.inner.get(id);
  }

  async getAll(): Promise<T[]> {
    return this.inner.getAll();
  }

  async put(entity: T): Promise<T> {
    const result = await this.inner.put(entity);
    this.channel.broadcastPut(this.store as never, result.id);
    return result;
  }

  async putMany(entities: T[]): Promise<T[]> {
    const result = await this.inner.putMany(entities);
    for (const r of result) this.channel.broadcastPut(this.store as never, r.id);
    return result;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.inner.delete(id);
    if (result) this.channel.broadcastDelete(this.store as never, id);
    return result;
  }

  async clear(): Promise<void> {
    await this.inner.clear();
    this.channel.broadcastClear(this.store as never);
  }

  async count(): Promise<number> {
    return this.inner.count();
  }

  async queryByIndex(index: string, range?: { gte?: string | number, lte?: string | number }): Promise<T[]> {
    return this.inner.queryByIndex(index, range);
  }

  async close(): Promise<void> {
    this.unsubscribe?.();
    this.channel.close();
    this.unsubscribe = null;
    return this.inner.close();
  }
}
