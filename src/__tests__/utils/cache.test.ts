import { MemoryCache, LRUCache, Debouncer, Throttler, memoize, batch } from '../../utils/cache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache(1000);
  });

  afterEach(() => {
    cache.destroy();
  });

  test('should set and get values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  test('should return null for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  test('should check if key exists', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('nonexistent')).toBe(false);
  });

  test('should delete keys', () => {
    cache.set('key1', 'value1');
    expect(cache.delete('key1')).toBe(true);
    expect(cache.has('key1')).toBe(false);
  });

  test('should clear all keys', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    expect(cache.size).toBe(0);
  });

  test('should respect TTL expiration', async () => {
    const shortCache = new MemoryCache(100);
    shortCache.set('key1', 'value1', 50);
    
    expect(shortCache.get('key1')).toBe('value1');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(shortCache.get('key1')).toBeNull();
    shortCache.destroy();
  });

  test('should return all keys', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    expect(cache.keys()).toContain('key1');
    expect(cache.keys()).toContain('key2');
  });

  test('should clear namespace', () => {
    cache.set('ns1:key1', 'value1');
    cache.set('ns1:key2', 'value2');
    cache.set('ns2:key1', 'value3');
    
    cache.clearNamespace('ns1');
    
    expect(cache.has('ns1:key1')).toBe(false);
    expect(cache.has('ns1:key2')).toBe(false);
    expect(cache.has('ns2:key1')).toBe(true);
  });
});

describe('LRUCache', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>(3);
  });

  test('should set and get values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  test('should evict least recently used item when full', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4');
    
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key4')).toBe('value4');
  });

  test('should update existing key and move to most recent', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.get('key1');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4');
    
    expect(cache.get('key1')).toBe('value1');
  });

  test('should check if key exists', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('nonexistent')).toBe(false);
  });

  test('should delete keys', () => {
    cache.set('key1', 'value1');
    expect(cache.delete('key1')).toBe(true);
    expect(cache.has('key1')).toBe(false);
  });

  test('should clear all keys', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    expect(cache.cacheSize).toBe(0);
  });

  test('should report correct size', () => {
    expect(cache.cacheSize).toBe(0);
    cache.set('key1', 'value1');
    expect(cache.cacheSize).toBe(1);
  });
});

describe('Debouncer', () => {
  let debouncer: Debouncer;
  
  beforeEach(() => {
    jest.useFakeTimers();
    debouncer = new Debouncer();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('should debounce function calls', () => {
    const fn = jest.fn();
    
    debouncer.debounce(fn, 100);
    debouncer.debounce(fn, 100);
    debouncer.debounce(fn, 100);
    
    expect(fn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(100);
    
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should cancel pending debounce', () => {
    const fn = jest.fn();
    
    debouncer.debounce(fn, 100);
    debouncer.cancel();
    
    jest.advanceTimersByTime(100);
    
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('Throttler', () => {
  let throttler: Throttler;
  
  beforeEach(() => {
    jest.useFakeTimers();
    throttler = new Throttler();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('should throttle function calls', () => {
    const fn = jest.fn();
    
    throttler.throttle(fn, 100);
    throttler.throttle(fn, 100);
    throttler.throttle(fn, 100);
    
    expect(fn).toHaveBeenCalledTimes(1);
    
    jest.advanceTimersByTime(100);
    throttler.throttle(fn, 100);
    
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('should cancel pending throttle', () => {
    const fn = jest.fn();
    
    throttler.throttle(fn, 100);
    throttler.cancel();
    
    jest.advanceTimersByTime(150);
    
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('memoize', () => {
  test('should memoize function results', () => {
    const fn = jest.fn((a: number, b: number) => a + b);
    const memoized = memoize(fn);
    
    memoized(1, 2);
    memoized(1, 2);
    memoized(1, 2);
    
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should call function for different arguments', () => {
    const fn = jest.fn((a: number, b: number) => a + b);
    const memoized = memoize(fn);
    
    memoized(1, 2);
    memoized(2, 3);
    
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('batch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('should batch items and call function after delay', () => {
    const fn = jest.fn();
    const batched = batch(fn, 100);
    
    batched('item1');
    batched('item2');
    batched('item3');
    
    expect(fn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(100);
    
    expect(fn).toHaveBeenCalledWith(['item1', 'item2', 'item3']);
  });
});
