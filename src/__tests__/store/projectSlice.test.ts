import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach, vi } from 'vitest';

import type { Project } from '../../shared/types';

const mockStore: { projects: Project[] } = { projects: [] };

vi.mock('../../shared/utils/secureStorage', () => ({
  secureStorage: {
    getItem: vi.fn((key: string) => {
      if (key === 'growthos-projects') return mockStore.projects;
      return null;
    }),
    setItem: vi.fn((key: string, value: unknown) => {
      if (key === 'growthos-projects') mockStore.projects = value as Project[];
    }),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

import projectReducer, {
  addProject,
  deleteProject,
  updateProject,
  getActiveProjects,
  getCompletedProjects,
  type ProjectsState,
} from '../../features/projects/store/projectSlice';

const seedProjects: Project[] = [
  {
    id: 'proj1',
    userId: 'user1',
    name: 'React 后台管理系统',
    description: '企业级后台管理系统',
    status: 'active',
    startDate: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-03-15T10:00:00.000Z',
  },
  {
    id: 'proj2',
    userId: 'user1',
    name: '技术分享准备',
    description: '准备前端技术分享材料',
    status: 'completed',
    startDate: '2024-02-01T00:00:00.000Z',
    endDate: '2024-02-20T00:00:00.000Z',
    retrospective: {
      whatWentWell: ['材料充分', '互动良好'],
      whatWentWrong: ['时间控制不好'],
      nextTime: ['提前排练'],
    },
    createdAt: '2024-02-01T10:00:00.000Z',
    updatedAt: '2024-02-20T14:00:00.000Z',
  },
  {
    id: 'proj3',
    userId: 'user1',
    name: '数据库优化项目',
    description: '优化核心查询性能',
    status: 'active',
    startDate: '2024-03-01T00:00:00.000Z',
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2024-03-10T09:00:00.000Z',
  },
  {
    id: 'proj4',
    userId: 'user1',
    name: '旧系统重构',
    description: '重构遗留代码库',
    status: 'paused',
    startDate: '2024-01-15T00:00:00.000Z',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-02-28T10:00:00.000Z',
  },
];

function makeStore(preloaded?: { projects: ProjectsState }) {
  return configureStore({
    reducer: { projects: projectReducer },
    preloadedState: preloaded,
  });
}

describe('projectSlice', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.projects = [...seedProjects];

    store = makeStore({
      projects: {
        projects: [...seedProjects],
        isLoading: false,
        error: null,
      },
    });
  });

  test('should return the initial state', () => {
    const initialState: ProjectsState = {
      projects: [],
      isLoading: false,
      error: null,
    };

    const freshStore = makeStore();
    expect(freshStore.getState().projects).toEqual(initialState);
  });

  test('should handle addProject (creates with id, timestamps, default active status)', async () => {
    const newProject = {
      userId: 'user1',
      name: 'AI 助手集成',
      description: '在项目中集成 AI 能力',
      status: 'active' as const,
      startDate: '2024-04-01T00:00:00.000Z',
    };

    await store.dispatch(addProject(newProject));
    const state = store.getState().projects;

    expect(state.projects).toHaveLength(5);
    expect(state.projects[0].name).toBe('AI 助手集成');
    expect(state.projects[0].id).toBeDefined();
    expect(state.projects[0].createdAt).toBeDefined();
    expect(state.projects[0].updatedAt).toBeDefined();
  });

  test('should handle deleteProject (filters by id)', async () => {
    const projectId = 'proj4';

    await store.dispatch(deleteProject(projectId));
    const state = store.getState().projects;

    expect(state.projects).toHaveLength(3);
    expect(state.projects.find((p) => p.id === projectId)).toBeUndefined();
  });

  test('should handle updateProject (updates fields, status changes)', async () => {
    const updateData = {
      id: 'proj1',
      description: '企业级后台管理系统 - 已升级到 v2',
      status: 'completed' as const,
      endDate: '2024-04-01T00:00:00.000Z',
    };

    await store.dispatch(updateProject(updateData));
    const state = store.getState().projects;
    const updated = state.projects.find((p) => p.id === 'proj1');

    expect(updated).toBeDefined();
    expect(updated!.description).toBe('企业级后台管理系统 - 已升级到 v2');
    expect(updated!.status).toBe('completed');
    expect(updated!.endDate).toBe('2024-04-01T00:00:00.000Z');
    expect(updated!.updatedAt).not.toBe(seedProjects[0].updatedAt);
  });

  test('should handle loading state: pending/fulfilled/rejected', async () => {
    const promise = store.dispatch(
      addProject({
        userId: 'user1',
        name: '测试项目',
        status: 'active' as const,
      }),
    );

    const pendingState = store.getState().projects;
    expect(pendingState.isLoading).toBe(true);

    await promise;
    const fulfilledState = store.getState().projects;
    expect(fulfilledState.isLoading).toBe(false);
    expect(fulfilledState.error).toBeNull();

    const store2 = makeStore({
      projects: {
        projects: [],
        isLoading: false,
        error: null,
      },
    });

    await store2.dispatch(updateProject({ id: 'nonexistent', status: 'active' as const }));
    const rejectedState = store2.getState().projects;
    expect(rejectedState.isLoading).toBe(false);
    expect(rejectedState.error).toBeDefined();
  });

  test('should select active projects', () => {
    const active = getActiveProjects(store.getState());

    expect(active).toHaveLength(2);
    expect(active.every((p) => p.status === 'active')).toBe(true);
    const names = active.map((p) => p.name);
    expect(names).toContain('React 后台管理系统');
    expect(names).toContain('数据库优化项目');
  });

  test('should select completed projects', () => {
    const completed = getCompletedProjects(store.getState());

    expect(completed).toHaveLength(1);
    expect(completed[0].status).toBe('completed');
    expect(completed[0].name).toBe('技术分享准备');
  });

  test('should handle updateProject status change from active to paused', async () => {
    const updateData = {
      id: 'proj3',
      status: 'paused' as const,
    };

    await store.dispatch(updateProject(updateData));
    const state = store.getState().projects;
    const updated = state.projects.find((p) => p.id === 'proj3');

    expect(updated).toBeDefined();
    expect(updated!.status).toBe('paused');

    const active = getActiveProjects(store.getState());
    expect(active).toHaveLength(1);
    expect(active.find((p) => p.id === 'proj3')).toBeUndefined();
  });
});
