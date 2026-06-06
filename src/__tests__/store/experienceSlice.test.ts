import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach, vi } from 'vitest';

import type { Experience, ExperienceCapabilityLink } from '../../shared/types';

// Shared mock data container — populated in beforeEach, read by the hoisted mock
const mockStore: { experiences: Experience[]; links: ExperienceCapabilityLink[] } = {
  experiences: [],
  links: [],
};

vi.mock('../../shared/utils/secureStorage', () => ({
  secureStorage: {
    getItem: vi.fn((key: string) => {
      if (key === 'growthos-experiences') return mockStore.experiences;
      if (key === 'growthos-exp-cap-links') return mockStore.links;
      return null;
    }),
    setItem: vi.fn((key: string, value: unknown) => {
      if (key === 'growthos-experiences') mockStore.experiences = value as Experience[];
      if (key === 'growthos-exp-cap-links') mockStore.links = value as ExperienceCapabilityLink[];
    }),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

import experienceReducer, {
  addExperience,
  deleteExperience,
  updateExperience,
  getExperiencesByDateRange,
  getExperiencesByCapability,
  type ExperiencesState,
} from '../../features/experiences/store/experienceSlice';

const seedExperiences: Experience[] = [
  {
    id: '1',
    userId: 'user1',
    event: '首次独立完成 React 项目',
    reflection: '学会了组件拆分和状态管理',
    principle: '组件化思维很重要',
    confidence: 0.8,
    projectId: 'proj1',
    mood: 8,
    energy: 7,
    occurredAt: '2024-01-15T10:00:00.000Z',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: '2',
    userId: 'user1',
    event: '参加技术分享会',
    reflection: '演讲技巧需要提升',
    confidence: 0.6,
    projectId: 'proj2',
    mood: 5,
    energy: 6,
    occurredAt: '2024-02-20T14:00:00.000Z',
    createdAt: '2024-02-20T14:00:00.000Z',
    updatedAt: '2024-02-20T14:00:00.000Z',
  },
  {
    id: '3',
    userId: 'user1',
    event: '优化数据库查询性能',
    reflection: '索引使用要谨慎',
    principle: '先测量再优化',
    confidence: 0.9,
    mood: 9,
    energy: 8,
    occurredAt: '2024-03-10T09:00:00.000Z',
    createdAt: '2024-03-10T09:00:00.000Z',
    updatedAt: '2024-03-10T09:00:00.000Z',
  },
];

const seedLinks: ExperienceCapabilityLink[] = [
  { id: 'link1', experienceId: '1', capabilityId: 'cap1', contribution: 0.8 },
  { id: 'link2', experienceId: '2', capabilityId: 'cap2', contribution: 0.6 },
  { id: 'link3', experienceId: '3', capabilityId: 'cap1', contribution: 0.7 },
];

function makeStore(preloaded?: { experiences: ExperiencesState }) {
  return configureStore({
    reducer: { experiences: experienceReducer },
    preloadedState: preloaded,
  });
}

describe('experienceSlice', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.experiences = [...seedExperiences];
    mockStore.links = [...seedLinks];

    store = makeStore({
      experiences: {
        experiences: [...seedExperiences],
        links: [...seedLinks],
        isLoading: false,
        error: null,
      },
    });
  });

  test('should return the initial state', () => {
    const initialState: ExperiencesState = {
      experiences: [],
      links: [],
      isLoading: false,
      error: null,
    };

    const freshStore = makeStore();
    expect(freshStore.getState().experiences).toEqual(initialState);
  });

  test('should handle addExperience (creates with id and timestamps)', async () => {
    const newExperience = {
      userId: 'user1',
      event: '完成系统设计重构',
      reflection: '微服务架构需要仔细规划边界',
      confidence: 0.85,
      projectId: 'proj3',
      mood: 7,
      energy: 6,
      occurredAt: '2024-04-01T10:00:00.000Z',
    };

    await store.dispatch(addExperience(newExperience));
    const state = store.getState().experiences;

    expect(state.experiences).toHaveLength(4);
    expect(state.experiences[0].event).toBe('完成系统设计重构');
    expect(state.experiences[0].id).toBeDefined();
    expect(state.experiences[0].createdAt).toBeDefined();
    expect(state.experiences[0].updatedAt).toBeDefined();
  });

  test('should handle deleteExperience (filters by id)', async () => {
    const experienceId = '2';

    await store.dispatch(deleteExperience(experienceId));
    const state = store.getState().experiences;

    expect(state.experiences).toHaveLength(2);
    expect(state.experiences.find((e) => e.id === experienceId)).toBeUndefined();
    expect(state.links.find((l) => l.experienceId === experienceId)).toBeUndefined();
  });

  test('should handle updateExperience (updates fields)', async () => {
    const updateData = {
      id: '1',
      reflection: '深入理解了组件化设计的核心价值',
      confidence: 0.95,
    };

    await store.dispatch(updateExperience(updateData));
    const state = store.getState().experiences;
    const updated = state.experiences.find((e) => e.id === '1');

    expect(updated).toBeDefined();
    expect(updated!.reflection).toBe('深入理解了组件化设计的核心价值');
    expect(updated!.confidence).toBe(0.95);
    expect(updated!.updatedAt).not.toBe(seedExperiences[0].updatedAt);
  });

  test('should handle loading state: pending sets isLoading true', async () => {
    const promise = store.dispatch(
      addExperience({
        userId: 'user1',
        event: '测试 loading 状态',
        confidence: 0.5,
        occurredAt: '2024-05-01T10:00:00.000Z',
      }),
    );

    const pendingState = store.getState().experiences;
    expect(pendingState.isLoading).toBe(true);

    await promise;
    const fulfilledState = store.getState().experiences;
    expect(fulfilledState.isLoading).toBe(false);
    expect(fulfilledState.error).toBeNull();
  });

  test('should handle loading state: rejected sets error', async () => {
    const store2 = makeStore({
      experiences: {
        experiences: [],
        links: [],
        isLoading: false,
        error: null,
      },
    });

    await store2.dispatch(updateExperience({ id: 'nonexistent', confidence: 0.5 }));
    const state = store2.getState().experiences;

    expect(state.isLoading).toBe(false);
    expect(state.error).toBeDefined();
  });

  test('should select experiences by date range', () => {
    const startDate = new Date('2024-01-01T00:00:00.000Z');
    const endDate = new Date('2024-01-31T23:59:59.000Z');
    const result = getExperiencesByDateRange(store.getState(), startDate, endDate);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].event).toBe('首次独立完成 React 项目');
  });

  test('should select experiences by capability id', () => {
    const result = getExperiencesByCapability(store.getState(), 'cap1');

    expect(result).toHaveLength(2);
    const experienceIds = result.map((e) => e.id);
    expect(experienceIds).toContain('1');
    expect(experienceIds).toContain('3');
  });

  test('should handle addExperience with capability links', async () => {
    const newExperience = {
      userId: 'user1',
      event: '带领团队完成冲刺目标',
      confidence: 0.7,
      occurredAt: '2024-05-15T10:00:00.000Z',
      capabilityLinks: [
        { capabilityId: 'cap1', contribution: 0.9, evidence: '技术决策' },
        { capabilityId: 'cap3', contribution: 0.6 },
      ],
    };

    await store.dispatch(addExperience(newExperience));
    const state = store.getState().experiences;

    expect(state.experiences).toHaveLength(4);
    expect(state.links).toHaveLength(5);
    const newLinks = state.links.filter((l) => l.capabilityId === 'cap3');
    expect(newLinks).toHaveLength(1);
    expect(newLinks[0].evidence).toBeUndefined();
  });
});
