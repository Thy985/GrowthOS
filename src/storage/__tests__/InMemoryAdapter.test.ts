import { InMemoryAdapter } from '../backends/InMemoryAdapter';
import { MemoryAdapter } from '../backends/MemoryAdapter';
import { StorageError } from '../errors';

interface Item {
  id: string,
  score: number,
  category: string,
}
function item(id: string, score: number, category: string = 'a'): Item {
  return { id, score, category };
}

describe('InMemoryAdapter', () => {
  let adapter: InMemoryAdapter<Item>;

  beforeEach(async () => {
    adapter = new InMemoryAdapter<Item>();
    await adapter.init();
  });

  it('put + get round-trips', async () => {
    await adapter.put(item('a', 1));
    const got = await adapter.get('a');
    expect(got).toEqual(item('a', 1));
  });

  it('get returns null for missing', async () => {
    expect(await adapter.get('missing')).toBeNull();
  });

  it('put overwrites', async () => {
    await adapter.put(item('a', 1));
    await adapter.put(item('a', 2));
    expect(await adapter.get('a')).toEqual(item('a', 2));
  });

  it('putMany writes all', async () => {
    await adapter.putMany([item('a', 1), item('b', 2)]);
    expect(await adapter.count()).toBe(2);
  });

  it('delete removes and returns boolean', async () => {
    await adapter.put(item('a', 1));
    expect(await adapter.delete('a')).toBe(true);
    expect(await adapter.delete('a')).toBe(false);
    expect(await adapter.get('a')).toBeNull();
  });

  it('getAll returns all', async () => {
    await adapter.putMany([item('a', 1), item('b', 2), item('c', 3)]);
    const all = await adapter.getAll();
    expect(all).toHaveLength(3);
  });

  it('clear empties the store', async () => {
    await adapter.put(item('a', 1));
    await adapter.clear();
    expect(await adapter.count()).toBe(0);
  });

  it('count returns size', async () => {
    expect(await adapter.count()).toBe(0);
    await adapter.putMany([item('a', 1), item('b', 2)]);
    expect(await adapter.count()).toBe(2);
  });

  it('query with range filters and sorts', async () => {
    await adapter.putMany([
      item('a', 10, 'a'),
      item('b', 30, 'a'),
      item('c', 20, 'b'),
      item('d', 5, 'a'),
    ]);
    const asc = await adapter.query({ sortBy: 'score', sortDirection: 'asc' });
    expect(asc.map((i) => i.score)).toEqual([5, 10, 20, 30]);

    const gte20 = await adapter.query({ sortBy: 'score', range: { gte: 20 } });
    expect(gte20.map((i) => i.score)).toEqual([20, 30]);
  });

  it('query supports limit/offset', async () => {
    await adapter.putMany([item('a', 1), item('b', 2), item('c', 3), item('d', 4)]);
    const result = await adapter.query({ sortBy: 'score', offset: 1, limit: 2 });
    expect(result.map((i) => i.score)).toEqual([2, 3]);
  });

  it('put without id throws INVALID_INPUT', async () => {
    await expect(adapter.put({ score: 1, category: 'x' } as unknown as Item))
      .rejects.toThrow(StorageError);
  });

  it('rejects operations before init', async () => {
    const fresh = new InMemoryAdapter<Item>();
    await expect(fresh.get('a')).rejects.toThrow(/not initialized/);
  });

  it('close resets initialized', async () => {
    await adapter.close();
    await expect(adapter.get('a')).rejects.toThrow(/not initialized/);
  });
});

describe('MemoryAdapter', () => {
  it('initializes synchronously (usable without init await)', async () => {
    const adapter = new MemoryAdapter<Item>();
    // 不 await init 也能用
    await adapter.put(item('a', 1));
    expect(await adapter.get('a')).toEqual(item('a', 1));
  });
});
