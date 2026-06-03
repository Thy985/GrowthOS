import { LRUCache } from '../cache/lruCache';

describe('LRUCache', () => {
  it('returns undefined for missing key', () => {
    const c = new LRUCache<number>();
    expect(c.get('x')).toBeUndefined();
  });

  it('stores and retrieves a value', () => {
    const c = new LRUCache<number>();
    c.set('a', 1);
    expect(c.get('a')).toBe(1);
  });

  it('overwrites an existing key', () => {
    const c = new LRUCache<number>();
    c.set('a', 1);
    c.set('a', 2);
    expect(c.get('a')).toBe(2);
    expect(c.size).toBe(1);
  });

  it('evicts the LRU item when over capacity', () => {
    const c = new LRUCache<number>({ maxSize: 2 });
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    expect(c.has('a')).toBe(false);
    expect(c.has('b')).toBe(true);
    expect(c.has('c')).toBe(true);
  });

  it('move-to-end on get', () => {
    const c = new LRUCache<number>({ maxSize: 2 });
    c.set('a', 1);
    c.set('b', 2);
    // access a to make it most-recently-used
    c.get('a');
    c.set('c', 3);
    // b should be evicted, a should survive
    expect(c.has('a')).toBe(true);
    expect(c.has('b')).toBe(false);
    expect(c.has('c')).toBe(true);
  });

  it('invalidate removes a single key', () => {
    const c = new LRUCache<number>();
    c.set('a', 1);
    expect(c.invalidate('a')).toBe(true);
    expect(c.invalidate('a')).toBe(false);
    expect(c.has('a')).toBe(false);
  });

  it('invalidateAll clears the cache', () => {
    const c = new LRUCache<number>();
    c.set('a', 1);
    c.set('b', 2);
    c.invalidateAll();
    expect(c.size).toBe(0);
  });

  it('respects TTL', async () => {
    const c = new LRUCache<number>({ ttlMs: 30 });
    c.set('a', 1);
    expect(c.get('a')).toBe(1);
    await new Promise((r) => setTimeout(r, 50));
    expect(c.get('a')).toBeUndefined();
    expect(c.has('a')).toBe(false);
  });

  it('keys() returns all current keys', () => {
    const c = new LRUCache<number>();
    c.set('a', 1);
    c.set('b', 2);
    expect(c.keys().sort()).toEqual(['a', 'b']);
  });
});
