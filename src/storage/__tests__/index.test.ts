import { createAdapter, createInitializedAdapter, isStorageAdapter } from '../index';
import { InMemoryAdapter } from '../backends/InMemoryAdapter';
import { LocalStorageAdapter } from '../backends/LocalStorageAdapter';
import { IndexedDbAdapter } from '../backends/IndexedDbAdapter';
import { resetDatabase } from '../schema';

interface Item { id: string, v: number }

describe('createAdapter factory', () => {
  it('creates InMemoryAdapter', async () => {
    const a = createAdapter<Item>({ kind: 'inMemory' });
    expect(a).toBeInstanceOf(InMemoryAdapter);
  });

  it('creates LocalStorageAdapter', () => {
    const a = createAdapter<Item>({ kind: 'localStorage', key: 'test' });
    expect(a).toBeInstanceOf(LocalStorageAdapter);
  });

  it('creates IndexedDbAdapter', () => {
    const a = createAdapter<Item>({ kind: 'indexeddb', store: 'records' });
    expect(a).toBeInstanceOf(IndexedDbAdapter);
  });

  it('createInitializedAdapter inits and returns', async () => {
    const a = await createInitializedAdapter<Item>({ kind: 'inMemory' });
    await a.put({ id: 'x', v: 1 });
    expect(await a.get('x')).toEqual({ id: 'x', v: 1 });
  });

  it('isStorageAdapter type guard', () => {
    expect(isStorageAdapter(new InMemoryAdapter())).toBe(true);
    expect(isStorageAdapter({})).toBe(false);
    expect(isStorageAdapter(null)).toBe(false);
    expect(isStorageAdapter('str')).toBe(false);
  });
});

describe('end-to-end: InMemoryAdapter via factory', () => {
  it('full CRUD works', async () => {
    const a = await createInitializedAdapter<Item>({ kind: 'inMemory' });
    await a.put({ id: '1', v: 1 });
    await a.put({ id: '2', v: 2 });
    await a.put({ id: '3', v: 3 });

    expect(await a.count()).toBe(3);
    expect(await a.get('2')).toEqual({ id: '2', v: 2 });

    await a.delete('2');
    expect(await a.get('2')).toBeNull();
    expect(await a.count()).toBe(2);
  });
});

describe('end-to-end: LocalStorageAdapter via factory', () => {
  beforeEach(() => localStorage.clear());

  it('full lifecycle', async () => {
    const a = await createInitializedAdapter<Item>({ kind: 'localStorage', key: 'factory-test' });
    await a.put({ id: 'singleton', v: 42 });
    expect((await a.get('singleton'))?.v).toBe(42);
    await a.clear();
    expect(await a.get('singleton')).toBeNull();
  });
});

describe('end-to-end: IndexedDbAdapter via factory', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('works on records store', async () => {
    const a = await createInitializedAdapter<Item>({ kind: 'indexeddb', store: 'records' });
    await a.put({ id: 'r1', v: 1 });
    await a.put({ id: 'r2', v: 2 });
    expect(await a.count()).toBe(2);
  });
});
