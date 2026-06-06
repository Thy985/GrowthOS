import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach } from 'vitest';

import recordsReducer, {
  setRecords,
  setTags,
  clearError,
  searchRecords,
  filterRecordsByDateRange,
  filterRecordsByMood,
  filterRecordsByTags,
  getAllTags,
  type RecordsState,
} from '../../features/records/store/recordsSlice.ts';

function makeStore(preloaded?: { records: RecordsState }) {
  return configureStore({
    reducer: { records: recordsReducer },
    preloadedState: preloaded,
  });
}

const mockRecords: RecordsState['records'] = [
  {
    id: '1',
    activity: '学习React',
    learning: 'hooks',
    reflection: '很棒',
    mood: '很好',
    tags: ['React', '前端'],
    createdAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: '2',
    activity: '学习Vue',
    learning: 'composition api',
    reflection: '',
    mood: '一般',
    tags: ['Vue', '前端'],
    createdAt: '2024-03-20T10:00:00.000Z',
  },
  {
    id: '3',
    activity: '运动',
    learning: '',
    reflection: '跑步5公里',
    mood: '不太好',
    tags: ['运动'],
    createdAt: '2024-06-10T10:00:00.000Z',
  },
];

describe('recordsSlice reducers', () => {
  test('setRecords replaces records', () => {
    const store = makeStore();
    store.dispatch(setRecords(mockRecords));
    expect(store.getState().records.records).toHaveLength(3);
    expect(store.getState().records.records[0].id).toBe('1');
  });

  test('setTags replaces tags', () => {
    const store = makeStore();
    store.dispatch(setTags(['a', 'b']));
    expect(store.getState().records.tags).toEqual(['a', 'b']);
  });

  test('clearError clears error', () => {
    const store = makeStore({
      records: { records: [], tags: [], isLoading: false, error: 'some error' },
    });
    store.dispatch(clearError());
    expect(store.getState().records.error).toBeNull();
  });
});

describe('recordsSlice selectors', () => {
  let state: RecordsState;

  beforeEach(() => {
    state = {
      records: mockRecords,
      tags: ['React', 'Vue', '前端', '运动'],
      isLoading: false,
      error: null,
    };
  });

  test('searchRecords finds by activity', () => {
    const result = searchRecords({ records: state }, 'React');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('searchRecords finds by learning', () => {
    const result = searchRecords({ records: state }, 'composition');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  test('searchRecords finds by reflection', () => {
    const result = searchRecords({ records: state }, '跑步');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  test('searchRecords finds by tag', () => {
    const result = searchRecords({ records: state }, '前端');
    expect(result).toHaveLength(2);
  });

  test('searchRecords returns empty when no match', () => {
    const result = searchRecords({ records: state }, '不存在');
    expect(result).toHaveLength(0);
  });

  test('searchRecords is case-insensitive', () => {
    const result = searchRecords({ records: state }, 'react');
    expect(result).toHaveLength(1);
  });

  test('filterRecordsByDateRange filters correctly', () => {
    const result = filterRecordsByDateRange(
      { records: state },
      new Date('2024-01-01'),
      new Date('2024-02-28'),
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('filterRecordsByMood filters correctly', () => {
    const result = filterRecordsByMood({ records: state }, '很好');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('filterRecordsByTags filters correctly', () => {
    const result = filterRecordsByTags({ records: state }, ['Vue']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  test('filterRecordsByTags excludes records without tags', () => {
    const result = filterRecordsByTags({ records: state }, ['不存在的标签']);
    expect(result).toHaveLength(0);
  });

  test('getAllTags returns all tags', () => {
    const result = getAllTags({ records: state });
    expect(result).toEqual(['React', 'Vue', '前端', '运动']);
  });
});
