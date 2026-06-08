import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach, vi } from 'vitest';

import type {
  Capability,
  CapabilityHistory,
  Experience,
  ExperienceCapabilityLink,
} from '../../shared/types';

const mockStore: { capabilities: Capability[]; history: CapabilityHistory[] } = {
  capabilities: [],
  history: [],
};

vi.mock('../../shared/utils/secureStorage', () => ({
  secureStorage: {
    getItem: vi.fn((key: string) => {
      if (key === 'growthos-capabilities') return mockStore.capabilities;
      if (key === 'growthos-cap-history') return mockStore.history;
      return null;
    }),
    setItem: vi.fn((key: string, value: unknown) => {
      if (key === 'growthos-capabilities') mockStore.capabilities = value as Capability[];
      if (key === 'growthos-cap-history') mockStore.history = value as CapabilityHistory[];
    }),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

import capabilityReducer, {
  addCapability,
  deleteCapability,
  updateCapability,
  calculateCapabilityLevel,
  getCapabilitiesByCategory,
  getCapabilityTree,
  type CapabilitiesState,
} from '../../features/capabilities/store/capabilitySlice';

const seedCapabilities: Capability[] = [
  {
    id: 'cap1',
    userId: 'user1',
    name: 'React 开发',
    category: 'skill',
    parentId: null,
    currentLevel: 75,
    targetLevel: 90,
    growthRate: 0.12,
    description: '前端 React 框架开发能力',
    icon: 'react',
    color: '#61dafb',
    lastUpdated: '2024-03-01T10:00:00.000Z',
    createdAt: '2024-01-01T10:00:00.000Z',
  },
  {
    id: 'cap2',
    userId: 'user1',
    name: '公开演讲',
    category: 'social',
    parentId: null,
    currentLevel: 40,
    targetLevel: 70,
    growthRate: 0.08,
    lastUpdated: '2024-02-20T14:00:00.000Z',
    createdAt: '2024-02-01T10:00:00.000Z',
  },
  {
    id: 'cap3',
    userId: 'user1',
    name: '系统设计',
    category: 'cognition',
    parentId: null,
    currentLevel: 60,
    targetLevel: 85,
    growthRate: 0.1,
    lastUpdated: '2024-03-10T09:00:00.000Z',
    createdAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'cap4',
    userId: 'user1',
    name: 'Hooks 进阶',
    category: 'skill',
    parentId: 'cap1',
    currentLevel: 50,
    targetLevel: 80,
    growthRate: 0.15,
    lastUpdated: '2024-03-05T10:00:00.000Z',
    createdAt: '2024-02-10T10:00:00.000Z',
  },
];

const seedHistory: CapabilityHistory[] = [
  { id: 'h1', capabilityId: 'cap1', level: 60, recordedAt: '2024-01-15T10:00:00.000Z' },
  { id: 'h2', capabilityId: 'cap1', level: 75, recordedAt: '2024-03-01T10:00:00.000Z' },
  { id: 'h3', capabilityId: 'cap2', level: 35, recordedAt: '2024-02-20T14:00:00.000Z' },
];

const calcExperiences: Experience[] = [
  {
    id: 'exp1',
    userId: 'user1',
    event: '完成 React 项目',
    reflection: '深入理解了组件化',
    confidence: 0.8,
    occurredAt: '2026-03-15T10:00:00.000Z',
    createdAt: '2026-03-15T10:00:00.000Z',
    updatedAt: '2026-03-15T10:00:00.000Z',
  },
  {
    id: 'exp2',
    userId: 'user1',
    event: '技术分享',
    confidence: 0.6,
    occurredAt: '2024-02-20T14:00:00.000Z',
    createdAt: '2024-02-20T14:00:00.000Z',
    updatedAt: '2024-02-20T14:00:00.000Z',
  },
];

const calcLinks: ExperienceCapabilityLink[] = [
  { id: 'link1', experienceId: 'exp1', capabilityId: 'cap1', contribution: 0.8 },
  { id: 'link2', experienceId: 'exp2', capabilityId: 'cap2', contribution: 0.6 },
];

function makeStore(preloaded?: { capabilities: CapabilitiesState }) {
  return configureStore({
    reducer: { capabilities: capabilityReducer },
    preloadedState: preloaded,
  });
}

describe('capabilitySlice', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.capabilities = [...seedCapabilities];
    mockStore.history = [...seedHistory];

    store = makeStore({
      capabilities: {
        capabilities: [...seedCapabilities],
        history: [...seedHistory],
        isLoading: false,
        error: null,
      },
    });
  });

  test('should return the initial state', () => {
    const initialState: CapabilitiesState = {
      capabilities: [],
      history: [],
      isLoading: false,
      error: null,
    };

    const freshStore = makeStore();
    expect(freshStore.getState().capabilities).toEqual(initialState);
  });

  test('should handle addCapability (creates with id and timestamps)', async () => {
    const newCapability = {
      userId: 'user1',
      name: 'TypeScript 高级类型',
      category: 'skill' as const,
      parentId: null,
      currentLevel: 30,
      targetLevel: 80,
      growthRate: 0.1,
      description: '泛型和条件类型',
    };

    await store.dispatch(addCapability(newCapability));
    const state = store.getState().capabilities;

    expect(state.capabilities).toHaveLength(5);
    expect(state.capabilities[0].name).toBe('TypeScript 高级类型');
    expect(state.capabilities[0].id).toBeDefined();
    expect(state.capabilities[0].createdAt).toBeDefined();
    expect(state.capabilities[0].lastUpdated).toBeDefined();
  });

  test('should handle deleteCapability (removes + clears history)', async () => {
    const capabilityId = 'cap1';

    await store.dispatch(deleteCapability(capabilityId));
    const state = store.getState().capabilities;

    expect(state.capabilities).toHaveLength(3);
    expect(state.capabilities.find((c) => c.id === capabilityId)).toBeUndefined();
    expect(state.history.find((h) => h.capabilityId === capabilityId)).toBeUndefined();
  });

  test('should handle updateCapability (updates fields, lastUpdated)', async () => {
    const updateData = {
      id: 'cap2',
      currentLevel: 55,
      targetLevel: 80,
      description: '提升了演讲技巧和自信心',
    };

    await store.dispatch(updateCapability(updateData));
    const state = store.getState().capabilities;
    const updated = state.capabilities.find((c) => c.id === 'cap2');

    expect(updated).toBeDefined();
    expect(updated!.currentLevel).toBe(55);
    expect(updated!.targetLevel).toBe(80);
    expect(updated!.description).toBe('提升了演讲技巧和自信心');
    expect(updated!.lastUpdated).not.toBe(seedCapabilities[1].lastUpdated);
  });

  test('should calculate capability level with time decay algorithm', () => {
    const level = calculateCapabilityLevel('cap1', calcExperiences, calcLinks);

    expect(level).toBeGreaterThan(0);
    expect(level).toBeLessThanOrEqual(100);
  });

  test('should calculate capability level returns 0 for no links', () => {
    const level = calculateCapabilityLevel('nonexistent', calcExperiences, calcLinks);
    expect(level).toBe(0);
  });

  test('should select capabilities by category', () => {
    const skillCaps = getCapabilitiesByCategory(store.getState(), 'skill');

    expect(skillCaps).toHaveLength(2);
    expect(skillCaps.every((c) => c.category === 'skill')).toBe(true);
    const names = skillCaps.map((c) => c.name);
    expect(names).toContain('React 开发');
    expect(names).toContain('Hooks 进阶');
  });

  test('should select capability tree (hierarchical)', () => {
    const tree = getCapabilityTree(store.getState());

    const rootIds = tree.map((node) => node.id);
    expect(rootIds).toContain('cap1');
    expect(rootIds).toContain('cap2');
    expect(rootIds).toContain('cap3');
    expect(rootIds).not.toContain('cap4');

    const cap1Node = tree.find((node) => node.id === 'cap1');
    expect(cap1Node).toBeDefined();
    expect(cap1Node!.children).toHaveLength(1);
    expect(cap1Node!.children[0].id).toBe('cap4');
  });

  test('should return empty array for non-existent category', () => {
    const result = getCapabilitiesByCategory(store.getState(), 'nonexistent');
    expect(result).toHaveLength(0);
  });

  test('should handle capability tree with no children', () => {
    const flatCaps = seedCapabilities.map((c) => ({ ...c, parentId: null }));
    const flatStore = makeStore({
      capabilities: {
        capabilities: flatCaps,
        history: [],
        isLoading: false,
        error: null,
      },
    });
    const tree = getCapabilityTree(flatStore.getState());
    expect(tree).toHaveLength(4);
    tree.forEach((node) => {
      expect(node.children).toHaveLength(0);
    });
  });

  test('should handle updateCapability with partial data', async () => {
    await store.dispatch(updateCapability({ id: 'cap1', currentLevel: 80 }));
    const state = store.getState().capabilities;
    const updated = state.capabilities.find((c) => c.id === 'cap1');
    expect(updated!.currentLevel).toBe(80);
    expect(updated!.targetLevel).toBe(90); // unchanged
  });

  test('should handle calculateCapabilityLevel with reflection and principle', () => {
    const expsWithReflection: Experience[] = [
      {
        ...calcExperiences[0],
        reflection: 'Deep learning experience',
        principle: 'Practice makes perfect',
      },
    ];
    const level = calculateCapabilityLevel('cap1', expsWithReflection, calcLinks);
    expect(level).toBeGreaterThan(0);
  });

  test('should handle calculateCapabilityLevel with zero confidence', () => {
    const expsZeroConf: Experience[] = [{ ...calcExperiences[0], confidence: 0 }];
    const level = calculateCapabilityLevel('cap1', expsZeroConf, calcLinks);
    expect(level).toBeGreaterThanOrEqual(0);
  });

  test('should handle calculateCapabilityLevel with missing experience', () => {
    const badLinks: ExperienceCapabilityLink[] = [
      { id: 'bad-link', experienceId: 'nonexistent', capabilityId: 'cap1', contribution: 0.8 },
    ];
    const level = calculateCapabilityLevel('cap1', calcExperiences, badLinks);
    expect(level).toBe(0);
  });

  test('should handle empty capabilities list for tree', () => {
    const emptyStore = makeStore({
      capabilities: { capabilities: [], history: [], isLoading: false, error: null },
    });
    const tree = getCapabilityTree(emptyStore.getState());
    expect(tree).toHaveLength(0);
  });

  test('should handle clearError action', () => {
    const errorStore = makeStore({
      capabilities: { capabilities: [], history: [], isLoading: false, error: 'Some error' },
    });
    errorStore.dispatch({ type: 'capabilities/clearError' });
    expect(errorStore.getState().capabilities.error).toBeNull();
  });
});
