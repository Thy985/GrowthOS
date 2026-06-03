import { IndexedDbAdapter } from '../backends/IndexedDbAdapter';
import { openGrowthDB, resetDatabase } from '../schema';

interface TestRecord {
  id: string,
  date: string,
  mood: string,
  score: number,
}

function rec(id: string, date: string, mood: string, score: number): TestRecord {
  return { id, date, mood, score };
}

describe('IndexedDbAdapter (records store)', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it('opens DB and creates stores from migrations', async () => {
    const db = await openGrowthDB();
    const names = Array.from(db.objectStoreNames);
    expect(names).toEqual(
      expect.arrayContaining(['records', 'goals', 'reminders', 'users', 'chatSessions', 'chatMessages'])
    );
  });

  it('put + get round-trips', async () => {
    const a = new IndexedDbAdapter<TestRecord>('records');
    await a.init();
    await a.put(rec('r1', '2026-01-01', 'great', 10));
    expect(await a.get('r1')).toMatchObject({ id: 'r1', score: 10 });
  });

  it('get returns null for missing', async () => {
    const a = new IndexedDbAdapter<TestRecord>('records');
    await a.init();
    expect(await a.get('nope')).toBeNull();
  });

  it('getAll returns everything', async () => {
    const a = new IndexedDbAdapter<TestRecord>('records');
    await a.init();
    await a.putMany([rec('a', '2026-01-01', 'great', 1), rec('b', '2026-01-02', 'okay', 2)]);
    const all = await a.getAll();
    expect(all).toHaveLength(2);
  });

  it('query by index (by-mood)', async () => {
    const a = new IndexedDbAdapter<TestRecord>('records');
    await a.init();
    await a.putMany([
      rec('a', '2026-01-01', 'great', 1),
      rec('b', '2026-01-02', 'okay', 2),
      rec('c', '2026-01-03', 'great', 3),
    ]);
    const greaT = await a.query({ index: 'by-mood' });  // 注意：IDB index 没指定值时返回所有
    expect(greaT.length).toBe(3);
  });

  it('query with range on indexed field (by-date)', async () => {
    const a = new IndexedDbAdapter<TestRecord>('records');
    await a.init();
    await a.putMany([
      rec('a', '2026-01-01', 'great', 1),
      rec('b', '2026-01-05', 'okay', 2),
      rec('c', '2026-01-10', 'great', 3),
    ]);
    const range = await a.query({
      index: 'by-date',
      range: { gte: '2026-01-03', lte: '2026-01-08' },
      sortBy: 'date',
      sortDirection: 'asc',
    });
    expect(range.map((r) => r.id)).toEqual(['b']);
  });

  it('query with limit/offset', async () => {
    const a = new IndexedDbAdapter<TestRecord>('records');
    await a.init();
    await a.putMany([
      rec('a', '2026-01-01', 'great', 1),
      rec('b', '2026-01-02', 'okay', 2),
      rec('c', '2026-01-03', 'great', 3),
    ]);
    const result = await a.query({ sortBy: 'score', offset: 1, limit: 1 });
    expect(result).toHaveLength(1);
  });

  it('count returns size', async () => {
    const a = new IndexedDbAdapter<TestRecord>('records');
    await a.init();
    expect(await a.count()).toBe(0);
    await a.putMany([rec('a', '2026-01-01', 'great', 1)]);
    expect(await a.count()).toBe(1);
  });

  it('delete removes and returns true', async () => {
    const a = new IndexedDbAdapter<TestRecord>('records');
    await a.init();
    await a.put(rec('a', '2026-01-01', 'great', 1));
    expect(await a.delete('a')).toBe(true);
    expect(await a.delete('a')).toBe(true); // idb delete 不报错总是返回 true
    expect(await a.get('a')).toBeNull();
  });

  it('clear empties store', async () => {
    const a = new IndexedDbAdapter<TestRecord>('records');
    await a.init();
    await a.putMany([rec('a', '2026-01-01', 'great', 1), rec('b', '2026-01-02', 'okay', 2)]);
    await a.clear();
    expect(await a.count()).toBe(0);
  });

  it('rejects empty storeName', () => {
    expect(() => new IndexedDbAdapter<TestRecord>('' as never)).toThrow(/non-empty/);
  });

  it('rejects put without id', async () => {
    const a = new IndexedDbAdapter<TestRecord>('records');
    await a.init();
    await expect(
      a.put({ date: '2026-01-01', mood: 'great', score: 1 } as unknown as TestRecord)
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('throws PLATFORM_UNAVAILABLE if used before init', async () => {
    const a = new IndexedDbAdapter<TestRecord>('records');
    await expect(a.get('a')).rejects.toMatchObject({ code: 'PLATFORM_UNAVAILABLE' });
  });
});

describe('IndexedDbAdapter (goals store)', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  interface Goal {
    id: string,
    status: string,
    targetValue: number,
    currentValue: number,
  }

  it('queries by status index', async () => {
    const a = new IndexedDbAdapter<Goal>('goals');
    await a.init();
    await a.putMany([
      { id: 'g1', status: 'active', targetValue: 100, currentValue: 30 },
      { id: 'g2', status: 'completed', targetValue: 100, currentValue: 100 },
    ]);
    const active = await a.query({ index: 'by-status' });
    expect(active).toHaveLength(2);
  });
});
