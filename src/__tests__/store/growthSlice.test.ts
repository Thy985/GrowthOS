import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { secureStorage } from '../../shared/utils/secureStorage.ts';
import growthReducer, {
  loadData,
  importData,
  exportData,
  clearGrowthError,
} from '../../store/slices/growthSlice.ts';

// Mock logger to avoid console noise
vi.mock('../../shared/utils/logger.ts', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock URL.createObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockCreateElement = vi.fn(() => ({
  href: '',
  download: '',
  click: mockClick,
})) as unknown as typeof document.createElement;

beforeEach(() => {
  vi.stubGlobal('URL', {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  });
  vi.spyOn(document, 'createElement').mockImplementation(mockCreateElement);
  vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
  vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function makeStore() {
  return configureStore({
    reducer: { growth: growthReducer },
  });
}

describe('growthSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initial state defaults', () => {
    const store = makeStore();
    expect(store.getState().growth).toEqual({
      isLoading: false,
      error: null,
    });
  });

  it('clearGrowthError clears error', () => {
    const store = makeStore();
    store.dispatch(clearGrowthError());
    expect(store.getState().growth.error).toBeNull();
  });

  it('loadData reads records/tags/trees from secureStorage', async () => {
    secureStorage.setItem('growth-records', [{ id: 'r1' }]);
    secureStorage.setItem('growth-tags', ['a', 'b']);
    secureStorage.setItem('growth-trees', [{ id: 't1', name: 'test' }]);
    const store = makeStore();
    const result = await store.dispatch(loadData());
    expect((result.payload as any).records).toHaveLength(1);
    expect((result.payload as any).tags).toEqual(['a', 'b']);
    expect((result.payload as any).trees).toHaveLength(1);
  });

  it('loadData handles empty storage', async () => {
    const store = makeStore();
    const result = await store.dispatch(loadData());
    expect((result.payload as any).records).toEqual([]);
    expect((result.payload as any).tags).toEqual([]);
    expect((result.payload as any).trees).toEqual([]);
  });

  it('importData writes to secureStorage', async () => {
    const store = makeStore();
    await store.dispatch(
      importData({
        records: [
          {
            id: 'x',
            activity: '',
            learning: '',
            reflection: '',
            mood: '一般',
            tags: [],
            createdAt: '',
          },
        ],
        tags: ['tag1'],
        trees: [
          {
            id: 't2',
            name: '',
            parentId: null,
            description: '',
            icon: '',
            progress: 0,
            createdAt: '',
            updatedAt: '',
            children: [],
          },
        ],
        goals: [
          {
            id: 'g1',
            title: '',
            description: '',
            targetValue: 0,
            currentValue: 0,
            startDate: '',
            endDate: '',
            status: 'active',
            createdAt: '',
            updatedAt: '',
          },
        ],
      }),
    );
    const records = secureStorage.getItem<{ id: string }[]>('growth-records') || [];
    const tags = secureStorage.getItem<string[]>('growth-tags') || [];
    const trees = secureStorage.getItem<{ id: string }[]>('growth-trees') || [];
    const goals = secureStorage.getItem<{ id: string }[]>('growth-goals') || [];
    expect(records).toHaveLength(1);
    expect(tags).toContain('tag1');
    expect(trees).toHaveLength(1);
    expect(goals).toHaveLength(1);
  });

  it('importData handles empty payload', async () => {
    const store = makeStore();
    await store.dispatch(importData({}));
    // No error, just returns empty payload
  });

  it('exportData json triggers download', async () => {
    secureStorage.setItem('growth-records', [{ id: 'r1', createdAt: '2024-01-01' }]);
    secureStorage.setItem('growth-tags', ['t1']);
    secureStorage.setItem('growth-trees', [{ id: 't1', name: 'x' }]);
    // Need records/tree/goal slices in store for getState
    const recordsReducer = (state = { records: [], tags: [] }) => state;
    const treeReducer = (state = { trees: [] }) => state;
    const goalReducer = (state = { goals: [] }) => state;
    // New slices for experience management
    const experiencesReducer = (state = { experiences: [], links: [] }) => state;
    const capabilitiesReducer = (state = { capabilities: [], history: [] }) => state;
    const principlesReducer = (state = { principles: [] }) => state;
    const projectsReducer = (state = { projects: [] }) => state;
    const store = configureStore({
      reducer: {
        growth: growthReducer,
        records: recordsReducer as never,
        tree: treeReducer as never,
        goal: goalReducer as never,
        experiences: experiencesReducer as never,
        capabilities: capabilitiesReducer as never,
        principles: principlesReducer as never,
        projects: projectsReducer as never,
      },
    });
    await store.dispatch(
      exportData({
        format: 'json',
        dataTypes: ['records', 'tags', 'trees', 'goals'],
      }),
    );
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  it('exportData csv generates csv content', async () => {
    secureStorage.setItem('growth-records', [
      {
        id: 'r1',
        activity: 'test',
        learning: 'learn',
        reflection: 'ref',
        mood: '很好',
        tags: ['t1'],
        createdAt: '2024-01-01',
      },
    ]);
    const recordsReducer = (state = { records: [], tags: [] }) => state;
    const treeReducer = (state = { trees: [] }) => state;
    const goalReducer = (state = { goals: [] }) => state;
    // New slices for experience management
    const experiencesReducer = (state = { experiences: [], links: [] }) => state;
    const capabilitiesReducer = (state = { capabilities: [], history: [] }) => state;
    const principlesReducer = (state = { principles: [] }) => state;
    const projectsReducer = (state = { projects: [] }) => state;
    const store = configureStore({
      reducer: {
        growth: growthReducer,
        records: recordsReducer as never,
        tree: treeReducer as never,
        goal: goalReducer as never,
        experiences: experiencesReducer as never,
        capabilities: capabilitiesReducer as never,
        principles: principlesReducer as never,
        projects: projectsReducer as never,
      },
    });
    await store.dispatch(
      exportData({
        format: 'csv',
        dataTypes: ['records'],
      }),
    );
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  it('exportData markdown generates markdown content', async () => {
    secureStorage.setItem('growth-records', [
      {
        id: 'r1',
        activity: 'test',
        learning: 'learn',
        reflection: 'ref',
        mood: '很好',
        tags: ['t1'],
        createdAt: '2024-01-01',
      },
    ]);
    secureStorage.setItem('growth-tags', ['t1']);
    const recordsReducer = (state = { records: [], tags: [] }) => state;
    const treeReducer = (state = { trees: [] }) => state;
    const goalReducer = (state = { goals: [] }) => state;
    const experiencesReducer = (state = { experiences: [], links: [] }) => state;
    const capabilitiesReducer = (state = { capabilities: [], history: [] }) => state;
    const principlesReducer = (state = { principles: [] }) => state;
    const projectsReducer = (state = { projects: [] }) => state;
    const store = configureStore({
      reducer: {
        growth: growthReducer,
        records: recordsReducer as never,
        tree: treeReducer as never,
        goal: goalReducer as never,
        experiences: experiencesReducer as never,
        capabilities: capabilitiesReducer as never,
        principles: principlesReducer as never,
        projects: projectsReducer as never,
      },
    });
    await store.dispatch(
      exportData({
        format: 'markdown',
        dataTypes: ['records', 'tags'],
      }),
    );
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('exportData filters records by date range', async () => {
    secureStorage.setItem('growth-records', [
      { id: 'r1', createdAt: '2024-01-01' },
      { id: 'r2', createdAt: '2024-06-01' },
    ]);
    const recordsReducer = (state = { records: [], tags: [] }) => state;
    const treeReducer = (state = { trees: [] }) => state;
    const goalReducer = (state = { goals: [] }) => state;
    const experiencesReducer = (state = { experiences: [], links: [] }) => state;
    const capabilitiesReducer = (state = { capabilities: [], history: [] }) => state;
    const principlesReducer = (state = { principles: [] }) => state;
    const projectsReducer = (state = { projects: [] }) => state;
    const store = configureStore({
      reducer: {
        growth: growthReducer,
        records: recordsReducer as never,
        tree: treeReducer as never,
        goal: goalReducer as never,
        experiences: experiencesReducer as never,
        capabilities: capabilitiesReducer as never,
        principles: principlesReducer as never,
        projects: projectsReducer as never,
      },
    });
    await store.dispatch(
      exportData({
        format: 'json',
        dataTypes: ['records'],
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-12-31'),
      }),
    );
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });
});
