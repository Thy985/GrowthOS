import { CachingRepository } from '../cache/cachingRepository';
import { Repository } from '../../common/repositories/repository';
import { InMemoryAdapter } from '../backends/InMemoryAdapter';
import type { BaseEntity } from '../types';

interface Item extends BaseEntity {
  id: string,
  name: string,
  count: number,
}

function makeRepo(): { repo: Repository<Item>, inner: InMemoryAdapter<Item> } {
  const inner = new InMemoryAdapter<Item>();
  const repo = new Repository<Item>(inner);
  return { repo, inner };
}

describe('CachingRepository', () => {
  it('caches get() after first read', async () => {
    const { repo, inner } = makeRepo();
    const caching = new CachingRepository<Item>(repo, { maxSize: 10 });
    await inner.init();
    await inner.put({ id: '1', name: 'a', count: 1 });

    // First get: miss, populates cache
    expect(await caching.get('1')).toEqual({ id: '1', name: 'a', count: 1 });

    // Replace underlying value (bypass cache put, but use a fresh object)
    await inner.put({ id: '1', name: 'changed', count: 1 });

    // Second get: should be cache HIT (old value)
    const got = await caching.get('1');
    expect(got?.name).toBe('a');

    // Invalidate and re-get: should see new value
    caching.invalidateAll();
    const got2 = await caching.get('1');
    expect(got2?.name).toBe('changed');
  });

  it('put() invalidates and refreshes cache', async () => {
    const { repo, inner } = makeRepo();
    const caching = new CachingRepository<Item>(repo, { maxSize: 10 });
    await inner.init();
    await inner.put({ id: '1', name: 'old', count: 0 });

    expect((await caching.get('1'))?.name).toBe('old');
    await caching.put({ id: '1', name: 'new', count: 1 });
    expect((await caching.get('1'))?.name).toBe('new');
  });

  it('delete() invalidates the key', async () => {
    const { repo, inner } = makeRepo();
    const caching = new CachingRepository<Item>(repo, { maxSize: 10 });
    await inner.init();
    await inner.put({ id: '1', name: 'a', count: 1 });
    await caching.get('1'); // warm cache
    expect(caching.cacheStats().items).toBe(1);

    await caching.delete('1');
    expect(caching.cacheStats().items).toBe(0);
    expect(await caching.get('1')).toBeNull();
  });

  it('clear() invalidates all', async () => {
    const { repo, inner } = makeRepo();
    const caching = new CachingRepository<Item>(repo, { maxSize: 10 });
    await inner.init();
    await inner.put({ id: '1', name: 'a', count: 1 });
    await inner.put({ id: '2', name: 'b', count: 2 });
    await caching.get('1');
    await caching.get('2');

    await caching.clear();
    expect(caching.cacheStats().items).toBe(0);
  });

  it('getAll() optionally caches list', async () => {
    const { repo, inner } = makeRepo();
    const caching = new CachingRepository<Item>(repo, { maxSize: 10, cacheGetAll: true });
    await inner.init();
    await inner.put({ id: '1', name: 'a', count: 1 });

    const all1 = await caching.getAll();
    expect(all1).toHaveLength(1);
    expect(caching.cacheStats().lists).toBe(1);

    // Add a new item directly to inner (bypassing caching.put)
    await inner.put({ id: '2', name: 'b', count: 2 });

    // Cache HIT (no list refresh)
    const all2 = await caching.getAll();
    expect(all2).toHaveLength(1);

    // After explicit invalidate, should see both
    caching.invalidateAll();
    const all3 = await caching.getAll();
    expect(all3).toHaveLength(2);
  });

  it('getAll() without cacheGetAll still populates item cache', async () => {
    const { repo, inner } = makeRepo();
    const caching = new CachingRepository<Item>(repo, { maxSize: 10 });
    await inner.init();
    await inner.put({ id: '1', name: 'a', count: 1 });

    expect(caching.cacheStats().items).toBe(0);
    await caching.getAll();
    expect(caching.cacheStats().items).toBe(1);
    expect(caching.cacheStats().lists).toBe(0);
  });
});
