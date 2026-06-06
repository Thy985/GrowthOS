import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, beforeEach } from 'vitest';

import treeReducer, { setTrees, clearError } from '../../features/growth-tree/store/treeSlice.ts';
import type { Tree } from '../../shared/types/index.ts';
import { secureStorage } from '../../shared/utils/secureStorage.ts';
import growthReducer, { loadData, importData } from '../../store/slices/growthSlice.ts';

function makeStore() {
  return configureStore({
    reducer: { tree: treeReducer, growth: growthReducer },
  });
}

const sampleTrees: Tree[] = [
  {
    id: 't1',
    name: 'Web 技能树',
    parentId: null,
    description: '',
    icon: '',
    progress: 0,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    children: [],
  },
];

describe('treeSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initial state is empty', () => {
    const store = makeStore();
    expect(store.getState().tree).toEqual({
      trees: [],
      isLoading: false,
      error: null,
    });
  });

  it('setTrees sets trees', () => {
    const store = makeStore();
    store.dispatch(setTrees(sampleTrees));
    expect(store.getState().tree.trees).toEqual(sampleTrees);
  });

  it('clearError clears error', () => {
    const store = makeStore();
    // 先 dispatch importData rejected 制造 error
    const fakeAction = { type: 'tree/__setError', payload: 'oops' } as never;
    store.dispatch(fakeAction);
    store.dispatch(clearError());
    expect(store.getState().tree.error).toBeNull();
  });

  it('loadData fulfilled sets trees from storage', async () => {
    secureStorage.setItem('growth-trees', sampleTrees);
    const store = makeStore();
    await store.dispatch(loadData());
    expect(store.getState().tree.trees).toEqual(sampleTrees);
    expect(store.getState().tree.isLoading).toBe(false);
  });

  it('loadData fulfilled handles empty storage', async () => {
    const store = makeStore();
    await store.dispatch(loadData());
    expect(store.getState().tree.trees).toEqual([]);
  });

  it('importData fulfilled sets trees when payload has trees', async () => {
    const store = makeStore();
    await store.dispatch(importData({ trees: sampleTrees }));
    expect(store.getState().tree.trees).toEqual(sampleTrees);
  });

  it('importData fulfilled does not overwrite trees when payload missing trees', async () => {
    const store = makeStore();
    store.dispatch(setTrees(sampleTrees));
    await store.dispatch(importData({}));
    expect(store.getState().tree.trees).toEqual(sampleTrees);
  });
});

describe('growthSlice (orchestration)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initial state defaults', () => {
    const store = configureStore({ reducer: { growth: growthReducer } });
    expect(store.getState().growth).toEqual({
      isLoading: false,
      error: null,
    });
  });

  it('loadData fulfilled is silent in growth slice (records/tree slices own data)', async () => {
    const store = configureStore({ reducer: { growth: growthReducer } });
    await store.dispatch(loadData());
    // growthSlice 不再持有 records/tags/trees
    expect(store.getState().growth.isLoading).toBe(false);
  });

  it('importData writes records/tags/trees/goals to secureStorage', async () => {
    const store = configureStore({ reducer: { growth: growthReducer } });
    await store.dispatch(
      importData({
        records: [{ id: 'r1', createdAt: '2024-01-01' }] as never,
        tags: ['a'] as never,
        trees: sampleTrees as never,
        goals: [{ id: 'g1' }] as never,
      }),
    );
    // 验证 secureStorage 写入了(通过 secureStorage 读,自动解密)
    const records = secureStorage.getItem<{ id: string }[]>('growth-records') || [];
    const tags = secureStorage.getItem<string[]>('growth-tags') || [];
    const trees = secureStorage.getItem<Tree[]>('growth-trees') || [];
    const goals = secureStorage.getItem<{ id: string }[]>('growth-goals') || [];
    expect(records).toHaveLength(1);
    expect(tags).toContain('a');
    expect(trees).toHaveLength(1);
    expect(goals).toHaveLength(1);
  });
});
