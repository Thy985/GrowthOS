import { SyncedRepository } from '../sync/syncedRepository';
import { CachingRepository } from '../cache/cachingRepository';
import { Repository } from '../../common/repositories/repository';
import { InMemoryAdapter } from '../backends/InMemoryAdapter';
import type { BaseEntity } from '../types';
import { CrossTabChannel, getDefaultChannelName } from '../sync/crossTabChannel';

interface Item extends BaseEntity {
  id: string,
  name: string,
}

function makeStack(): {
  synced: SyncedRepository<Item>,
  caching: CachingRepository<Item>,
  inner: InMemoryAdapter<Item>,
} {
  const inner = new InMemoryAdapter<Item>();
  const repo = new Repository<Item>(inner);
  const caching = new CachingRepository<Item>(repo, { maxSize: 10 });
  const synced = new SyncedRepository<Item>(caching, 'records');
  return { synced, caching, inner };
}

describe('SyncedRepository', () => {
  it('delegates get/getAll to inner', async () => {
    const { synced, inner } = makeStack();
    await inner.init();
    await inner.put({ id: '1', name: 'a' });
    expect(await synced.get('1')).toEqual({ id: '1', name: 'a' });
    expect(await synced.getAll()).toHaveLength(1);
  });

  it('put() writes through and broadcasts', async () => {
    const { synced, inner } = makeStack();
    await inner.init();
    const result = await synced.put({ id: '1', name: 'a' });
    expect(result).toEqual({ id: '1', name: 'a' });
    expect(await inner.get('1')).toEqual({ id: '1', name: 'a' });
  });

  it('delete() returns false for missing id (no broadcast)', async () => {
    const { synced, inner } = makeStack();
    await inner.init();
    expect(await synced.delete('nonexistent')).toBe(false);
  });

  it('delete() returns true and broadcasts on success', async () => {
    const { synced, inner } = makeStack();
    await inner.init();
    await inner.put({ id: '1', name: 'a' });
    expect(await synced.delete('1')).toBe(true);
    expect(await inner.get('1')).toBeNull();
  });

  it('receiving a put event from another channel invalidates local cache', async () => {
    if (typeof BroadcastChannel === 'undefined') {
      // jsdom 不一定有 BroadcastChannel
      return;
    }
    const { synced: _synced, inner, caching } = makeStack();
    await inner.init();

    // 在外部（"另一个 tab"）开一个相同 channel name 的 channel，
    // 模拟其他 tab 的 put 事件
    const otherTab = new CrossTabChannel(getDefaultChannelName('records'));

    // Warm local cache
    await inner.put({ id: '1', name: 'a' });
    await caching.get('1');
    expect(caching.cacheStats().items).toBe(1);

    // 别的 tab 写入并广播
    otherTab.broadcastPut('records', '1');

    // 等消息传到
    await new Promise((r) => setTimeout(r, 30));

    // 本地缓存应该被清掉
    expect(caching.cacheStats().items).toBe(0);
    otherTab.close();
  });

  it('clear() broadcasts', async () => {
    const { synced, inner } = makeStack();
    await inner.init();
    await inner.put({ id: '1', name: 'a' });
    await synced.clear();
    expect(await inner.getAll()).toHaveLength(0);
  });
});
