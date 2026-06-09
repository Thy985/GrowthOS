/**
 * capabilityHistory 集成测试
 *
 * 验证：
 * - addCapability 写入初始快照
 * - updateCapability 在等级变化符合规则时记录快照
 * - deleteCapability 级联清理 history
 */

import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import capabilityReducer, {
  addCapability,
  updateCapability,
  deleteCapability,
  setHistory,
} from '../../features/capabilities/store/capabilitySlice';
import type { Capability, CapabilityHistory } from '../../shared/types';

// Must use vi.hoisted() because vi.mock() is hoisted to the top of the file
const mockStorage = vi.hoisted(() => new Map<string, unknown>());

vi.mock('../../shared/utils/secureStorage', () => ({
  secureStorage: {
    getItem: (key: string) => {
      const val = mockStorage.get(key);
      return val !== undefined ? JSON.parse(JSON.stringify(val)) : null;
    },
    setItem: (key: string, value: unknown) => {
      mockStorage.set(key, value);
    },
    removeItem: (key: string) => {
      mockStorage.delete(key);
    },
    clear: () => {
      mockStorage.clear();
    },
  },
}));

const FIXED_NOW = new Date('2026-06-06T00:00:00Z');

function makeStore() {
  return configureStore({
    reducer: {
      capabilities: capabilityReducer,
    },
  });
}

function makeCap(
  overrides: Partial<Capability> = {},
): Omit<Capability, 'id' | 'createdAt' | 'lastUpdated'> {
  return {
    userId: 'user-1',
    name: 'Test Capability',
    category: 'skill',
    parentId: null,
    currentLevel: 50,
    targetLevel: 80,
    growthRate: 0,
    ...overrides,
  };
}

function makeHistory(capId: string, level: number, daysAgo: number): CapabilityHistory {
  const date = new Date(FIXED_NOW);
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `h-${capId}-${level}-${daysAgo}`,
    capabilityId: capId,
    level,
    recordedAt: date.toISOString(),
  };
}

describe('capabilityHistory integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    mockStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('addCapability writes initial snapshot to state.history', async () => {
    const store = makeStore();
    const capData = makeCap();

    await store.dispatch(addCapability(capData));

    const state = store.getState().capabilities;
    expect(state.history).toHaveLength(1);
    expect(state.history![0].capabilityId).toBe(state.capabilities[0].id);
    expect(state.history![0].level).toBe(capData.currentLevel);
  });

  it('addCapability preserves existing history when adding new capability', async () => {
    const store = makeStore();
    const existingHistory: CapabilityHistory[] = [
      makeHistory('cap-old', 30, 50),
      makeHistory('cap-old', 35, 30),
    ];
    mockStorage.set('growthos-cap-history', existingHistory);
    store.dispatch(setHistory(existingHistory));

    await store.dispatch(addCapability(makeCap()));

    const state = store.getState().capabilities;
    const generatedId = state.capabilities[0].id;
    expect(state.history).toHaveLength(3);
    expect(state.history![0].capabilityId).toBe(generatedId);
  });

  it('updateCapability with level change >= 5 records snapshot', async () => {
    const store = makeStore();
    await store.dispatch(addCapability(makeCap({ currentLevel: 50 })));
    const capId = store.getState().capabilities.capabilities[0].id;

    await store.dispatch(updateCapability({ id: capId, currentLevel: 56 }));

    const history = store.getState().capabilities.history;
    expect(history).toHaveLength(2);
    const updateSnap = history![history!.length - 1];
    expect(updateSnap.capabilityId).toBe(capId);
    expect(updateSnap.level).toBe(56);
  });

  it('updateCapability with small level change < 5 and < 24h does NOT record', async () => {
    const store = makeStore();
    await store.dispatch(addCapability(makeCap({ currentLevel: 50 })));
    const capId = store.getState().capabilities.capabilities[0].id;

    await store.dispatch(updateCapability({ id: capId, currentLevel: 52 }));

    expect(store.getState().capabilities.history).toHaveLength(1);
  });

  it('updateCapability with small change but > 24h records snapshot', async () => {
    const store = makeStore();
    await store.dispatch(addCapability(makeCap({ currentLevel: 50 })));
    const capId = store.getState().capabilities.capabilities[0].id;

    vi.advanceTimersByTime(25 * 60 * 60 * 1000);

    await store.dispatch(updateCapability({ id: capId, currentLevel: 52 }));

    expect(store.getState().capabilities.history).toHaveLength(2);
  });

  it('updateCapability with no level change does NOT record', async () => {
    const store = makeStore();
    await store.dispatch(addCapability(makeCap({ currentLevel: 50 })));
    const capId = store.getState().capabilities.capabilities[0].id;

    await store.dispatch(updateCapability({ id: capId, currentLevel: 50 }));

    expect(store.getState().capabilities.history).toHaveLength(1);
  });

  it('deleteCapability removes associated history', async () => {
    const store = makeStore();
    await store.dispatch(addCapability(makeCap({ name: 'Cap 1' })));
    const cap1Id = store.getState().capabilities.capabilities[0].id;
    vi.advanceTimersByTime(1000);
    await store.dispatch(addCapability(makeCap({ name: 'Cap 2', currentLevel: 30 })));
    const cap2Id = store.getState().capabilities.capabilities[0].id;

    expect(store.getState().capabilities.history).toHaveLength(2);

    await store.dispatch(deleteCapability(cap1Id));

    const history = store.getState().capabilities.history;
    expect(history).toHaveLength(1);
    expect(history![0].capabilityId).toBe(cap2Id);
  });

  it('multiple capabilities each maintain their own history', async () => {
    const store = makeStore();
    await store.dispatch(addCapability(makeCap({ name: 'A', currentLevel: 40 })));
    const capA = store.getState().capabilities.capabilities[0].id;
    vi.advanceTimersByTime(1000);
    await store.dispatch(addCapability(makeCap({ name: 'B', currentLevel: 60 })));
    const capB = store.getState().capabilities.capabilities[0].id;

    await store.dispatch(updateCapability({ id: capA, currentLevel: 50 }));
    await store.dispatch(updateCapability({ id: capB, currentLevel: 70 }));

    const history = store.getState().capabilities.history!;
    const capAHist = history.filter((h) => h.capabilityId === capA);
    const capBHist = history.filter((h) => h.capabilityId === capB);

    expect(capAHist).toHaveLength(2);
    expect(capBHist).toHaveLength(2);
    expect(capAHist[capAHist.length - 1].level).toBe(50);
    expect(capBHist[capBHist.length - 1].level).toBe(70);
  });

  it('deleteCapability does not affect other capabilities history', async () => {
    const store = makeStore();
    await store.dispatch(addCapability(makeCap({ currentLevel: 40 })));
    const capA = store.getState().capabilities.capabilities[0].id;
    vi.advanceTimersByTime(1000);
    await store.dispatch(addCapability(makeCap({ currentLevel: 60 })));
    const capB = store.getState().capabilities.capabilities[0].id;

    await store.dispatch(updateCapability({ id: capA, currentLevel: 50 }));
    await store.dispatch(updateCapability({ id: capB, currentLevel: 70 }));

    await store.dispatch(deleteCapability(capA));

    const history = store.getState().capabilities.history!;
    expect(history).toHaveLength(2);
    expect(history.every((h) => h.capabilityId === capB)).toBe(true);
  });
});
