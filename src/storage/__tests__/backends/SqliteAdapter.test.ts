/**
 * SqliteAdapter + InMemorySqliteClient 单元测试
 *
 * 覆盖：
 * - 基本 CRUD（get/put/putMany/delete/clear/count）
 * - 懒初始化（init 前调用抛错）
 * - query 范围 + 排序 + 偏移
 * - 多次 init 幂等
 * - 错误处理：id 缺失 / 未初始化
 * - close 后重新 init 可用
 */

import { SqliteAdapter, InMemorySqliteClient } from '../../backends/sqlite';
import { StorageError } from '../../errors';

interface TestEntity {
  id: string,
  name: string,
  age: number,
  createdAt: string,
}

const newClient = () => new InMemorySqliteClient();
const newAdapter = (client = newClient(), table = 'test') => new SqliteAdapter<TestEntity>(client, table);

describe('SqliteAdapter', () => {
  describe('init lifecycle', () => {
    it('throws if used before init()', async () => {
      const a = newAdapter();
      await expect(a.getAll()).rejects.toThrow(StorageError);
    });

    it('init() is idempotent', async () => {
      const a = newAdapter();
      await a.init();
      await a.init(); // 不应抛
      await a.close();
    });
  });

  describe('CRUD', () => {
    let adapter: SqliteAdapter<TestEntity>;
    let client: InMemorySqliteClient;

    beforeEach(async () => {
      client = newClient();
      adapter = newAdapter(client, 'users');
      await adapter.init();
    });

    afterEach(async () => {
      await adapter.close();
    });

    it('put then get returns the same entity', async () => {
      const e: TestEntity = { id: '1', name: 'Alice', age: 30, createdAt: '2024-01-01' };
      await adapter.put(e);
      const got = await adapter.get('1');
      expect(got).toEqual(e);
    });

    it('get returns null for missing id', async () => {
      const got = await adapter.get('nonexistent');
      expect(got).toBeNull();
    });

    it('putMany puts multiple entities', async () => {
      const entities: TestEntity[] = [
        { id: '1', name: 'Alice', age: 30, createdAt: '2024-01-01' },
        { id: '2', name: 'Bob', age: 25, createdAt: '2024-01-02' },
        { id: '3', name: 'Charlie', age: 35, createdAt: '2024-01-03' },
      ];
      await adapter.putMany(entities);
      const all = await adapter.getAll();
      expect(all).toHaveLength(3);
    });

    it('put throws on missing id', async () => {
      await expect(adapter.put({ name: 'no id' } as never)).rejects.toThrow(StorageError);
    });

    it('delete returns true for existing, false for missing', async () => {
      await adapter.put({ id: '1', name: 'A', age: 1, createdAt: '' });
      expect(await adapter.delete('1')).toBe(true);
      expect(await adapter.delete('1')).toBe(false);
    });

    it('clear removes all', async () => {
      await adapter.put({ id: '1', name: 'A', age: 1, createdAt: '' });
      await adapter.put({ id: '2', name: 'B', age: 2, createdAt: '' });
      await adapter.clear();
      expect(await adapter.count()).toBe(0);
    });

    it('count returns size', async () => {
      expect(await adapter.count()).toBe(0);
      await adapter.put({ id: '1', name: 'A', age: 1, createdAt: '' });
      expect(await adapter.count()).toBe(1);
    });
  });

  describe('query', () => {
    let adapter: SqliteAdapter<TestEntity>;

    beforeEach(async () => {
      adapter = newAdapter(undefined, 'users');
      await adapter.init();
      await adapter.putMany([
        { id: '1', name: 'Alice', age: 30, createdAt: '2024-01-01' },
        { id: '2', name: 'Bob', age: 25, createdAt: '2024-02-01' },
        { id: '3', name: 'Charlie', age: 35, createdAt: '2024-03-01' },
        { id: '4', name: 'Dave', age: 28, createdAt: '2024-04-01' },
      ]);
    });

    afterEach(async () => {
      await adapter.close();
    });

    it('filters by range (gte/lte on age)', async () => {
      const results = await adapter.query({ range: { gte: 28, lte: 32 }, sortBy: 'age' });
      const ages = results.map((r) => r.age).sort();
      expect(ages).toEqual([28, 30]);
    });

    it('sorts ascending by default', async () => {
      const results = await adapter.query({ sortBy: 'age' });
      expect(results.map((r) => r.age)).toEqual([25, 28, 30, 35]);
    });

    it('sorts descending', async () => {
      const results = await adapter.query({ sortBy: 'age', sortDirection: 'desc' });
      expect(results.map((r) => r.age)).toEqual([35, 30, 28, 25]);
    });

    it('applies limit + offset', async () => {
      const results = await adapter.query({ sortBy: 'age', limit: 2, offset: 1 });
      expect(results.map((r) => r.age)).toEqual([28, 30]);
    });
  });

  describe('close / re-init', () => {
    it('close then re-init works', async () => {
      const a = newAdapter();
      await a.init();
      await a.put({ id: '1', name: 'A', age: 1, createdAt: '' });
      await a.close();
      await a.init();
      // close 后 in-memory client 数据被清空
      expect(await a.get('1')).toBeNull();
    });
  });
});

describe('InMemorySqliteClient', () => {
  it('isolates tables', async () => {
    const c = newClient();
    await c.init({ tables: ['a', 'b'] });
    await c.put('a', { id: '1' });
    await c.put('b', { id: '2' });
    expect(await c.getAll('a')).toEqual([{ id: '1' }]);
    expect(await c.getAll('b')).toEqual([{ id: '2' }]);
    await c.close();
  });

  it('lazily creates tables not in initial schema', async () => {
    const c = newClient();
    await c.init({ tables: ['a'] });
    await c.put('b', { id: '1' });
    expect(await c.count('b')).toBe(1);
    await c.close();
  });

  it('throws on put without id', async () => {
    const c = newClient();
    await c.init({ tables: ['a'] });
    await expect(c.put('a', { name: 'x' } as never)).rejects.toThrow();
    await c.close();
  });
});

describe('isNativePlatform', () => {
  it('returns false in jsdom (no Capacitor UA)', async () => {
    const { isNativePlatform } = await import('../../backends/sqlite');
    expect(await isNativePlatform()).toBe(false);
  });
});

describe('createPlatformSqliteClient', () => {
  it('returns InMemorySqliteClient in jsdom (web fallback)', async () => {
    const { createPlatformSqliteClient } = await import('../../backends/sqlite');
    const client = await createPlatformSqliteClient();
    expect(client).toBeInstanceOf(InMemorySqliteClient);
  });
});
