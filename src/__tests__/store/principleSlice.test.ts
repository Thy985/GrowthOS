import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach, vi } from 'vitest';

import type { Principle } from '../../shared/types';

const mockStore: { principles: Principle[] } = { principles: [] };

vi.mock('../../shared/utils/secureStorage', () => ({
  secureStorage: {
    getItem: vi.fn((key: string) => {
      if (key === 'growthos-principles') return mockStore.principles;
      return null;
    }),
    setItem: vi.fn((key: string, value: unknown) => {
      if (key === 'growthos-principles') mockStore.principles = value as Principle[];
    }),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

import principleReducer, {
  addPrinciple,
  deletePrinciple,
  updatePrinciple,
  getPrinciplesByCategory,
  getTopPrinciples,
  type PrinciplesState,
} from '../../features/principles/store/principleSlice';

const seedPrinciples: Principle[] = [
  {
    id: 'p1',
    userId: 'user1',
    content: '先测量再优化',
    sourceExperienceIds: ['exp3'],
    category: 'performance',
    confidence: 0.9,
    usageCount: 15,
    lastUsedAt: '2024-03-15T10:00:00.000Z',
    createdAt: '2024-03-10T10:00:00.000Z',
  },
  {
    id: 'p2',
    userId: 'user1',
    content: '组件化思维是前端开发的核心',
    sourceExperienceIds: ['exp1'],
    category: 'architecture',
    confidence: 0.85,
    usageCount: 20,
    lastUsedAt: '2024-03-20T10:00:00.000Z',
    createdAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'p3',
    userId: 'user1',
    content: '沟通前先理解对方立场',
    sourceExperienceIds: ['exp2'],
    category: 'communication',
    confidence: 0.7,
    usageCount: 8,
    createdAt: '2024-02-20T10:00:00.000Z',
  },
  {
    id: 'p4',
    userId: 'user1',
    content: '小步快跑，持续迭代',
    sourceExperienceIds: [],
    category: 'methodology',
    confidence: 0.95,
    usageCount: 30,
    lastUsedAt: '2024-04-01T10:00:00.000Z',
    createdAt: '2024-01-05T10:00:00.000Z',
  },
];

function makeStore(preloaded?: { principles: PrinciplesState }) {
  return configureStore({
    reducer: { principles: principleReducer },
    preloadedState: preloaded,
  });
}

describe('principleSlice', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.principles = [...seedPrinciples];

    store = makeStore({
      principles: {
        principles: [...seedPrinciples],
        isLoading: false,
        error: null,
      },
    });
  });

  test('should return the initial state', () => {
    const initialState: PrinciplesState = {
      principles: [],
      isLoading: false,
      error: null,
    };

    const freshStore = makeStore();
    expect(freshStore.getState().principles).toEqual(initialState);
  });

  test('should handle addPrinciple (creates with id and timestamps)', async () => {
    const newPrinciple = {
      userId: 'user1',
      content: '测试驱动开发能提高代码质量',
      sourceExperienceIds: ['exp4'],
      category: 'methodology',
      confidence: 0.8,
      usageCount: 0,
    };

    await store.dispatch(addPrinciple(newPrinciple));
    const state = store.getState().principles;

    expect(state.principles).toHaveLength(5);
    expect(state.principles[0].content).toBe('测试驱动开发能提高代码质量');
    expect(state.principles[0].id).toBeDefined();
    expect(state.principles[0].createdAt).toBeDefined();
  });

  test('should handle deletePrinciple (filters by id)', async () => {
    const principleId = 'p3';

    await store.dispatch(deletePrinciple(principleId));
    const state = store.getState().principles;

    expect(state.principles).toHaveLength(3);
    expect(state.principles.find((p) => p.id === principleId)).toBeUndefined();
  });

  test('should handle updatePrinciple (updates fields, usageCount)', async () => {
    const updateData = {
      id: 'p1',
      content: '先测量再优化，没有数据不要盲目优化',
      confidence: 0.95,
      usageCount: 25,
    };

    await store.dispatch(updatePrinciple(updateData));
    const state = store.getState().principles;
    const updated = state.principles.find((p) => p.id === 'p1');

    expect(updated).toBeDefined();
    expect(updated!.content).toBe('先测量再优化，没有数据不要盲目优化');
    expect(updated!.confidence).toBe(0.95);
    expect(updated!.usageCount).toBe(25);
  });

  test('should select principles by category', () => {
    const methodologyPrinciples = getPrinciplesByCategory(store.getState(), 'methodology');

    expect(methodologyPrinciples).toHaveLength(1);
    expect(methodologyPrinciples[0].category).toBe('methodology');
    expect(methodologyPrinciples[0].content).toBe('小步快跑，持续迭代');
  });

  test('should select principles by category returns empty for unknown category', () => {
    const result = getPrinciplesByCategory(store.getState(), 'nonexistent');
    expect(result).toHaveLength(0);
  });

  test('should select top principles sorted by confidence * usageCount', () => {
    const top3 = getTopPrinciples(store.getState(), 3);

    expect(top3).toHaveLength(3);
    expect(top3[0].id).toBe('p4');
    expect(top3[1].id).toBe('p2');
    expect(top3[2].id).toBe('p1');
  });

  test('should handle loading state: pending/fulfilled/rejected', async () => {
    const promise = store.dispatch(
      addPrinciple({
        userId: 'user1',
        content: '测试 loading 状态的原则',
        sourceExperienceIds: [],
        confidence: 0.5,
        usageCount: 0,
      }),
    );

    const pendingState = store.getState().principles;
    expect(pendingState.isLoading).toBe(true);

    await promise;
    const fulfilledState = store.getState().principles;
    expect(fulfilledState.isLoading).toBe(false);
    expect(fulfilledState.error).toBeNull();

    const store2 = makeStore({
      principles: {
        principles: [],
        isLoading: false,
        error: null,
      },
    });

    await store2.dispatch(updatePrinciple({ id: 'nonexistent', confidence: 0.5 }));
    const rejectedState = store2.getState().principles;
    expect(rejectedState.isLoading).toBe(false);
    expect(rejectedState.error).toBeDefined();
  });
});
