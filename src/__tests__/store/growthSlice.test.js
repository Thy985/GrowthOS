import { configureStore } from '@reduxjs/toolkit';
import growthReducer, { 
  addRecord, 
  searchRecords, 
  filterRecordsByMood,
  filterRecordsByTags 
} from '../../store/slices/growthSlice.ts';

// 模拟的测试数据
const mockRecords = [
  {
    id: '1',
    activity: '学习React',
    learning: '学习了React的hooks',
    reflection: 'React的hooks很强大',
    mood: '很好',
    tags: ['学习', 'React'],
    createdAt: '2024-01-01T10:00:00.000Z'
  },
  {
    id: '2',
    activity: '学习Redux',
    learning: '学习了Redux Toolkit',
    reflection: 'Redux Toolkit简化了Redux的使用',
    mood: '一般',
    tags: ['学习', 'Redux'],
    createdAt: '2024-01-02T10:00:00.000Z'
  },
  {
    id: '3',
    activity: '学习TypeScript',
    learning: '学习了TypeScript的类型系统',
    reflection: 'TypeScript提高了代码的可维护性',
    mood: '很好',
    tags: ['学习', 'TypeScript'],
    createdAt: '2024-01-03T10:00:00.000Z'
  }
];

const mockTags = ['学习', 'React', 'Redux', 'TypeScript'];

describe('growthSlice', () => {
  let store;
  
  beforeEach(() => {
    store = configureStore({
      reducer: {
        growth: growthReducer
      },
      preloadedState: {
        growth: {
          records: mockRecords,
          tags: mockTags,
          trees: [],
          isLoading: false,
          error: null
        }
      }
    });
  });
  
  test('should return the initial state', () => {
    const initialState = {
      records: [],
      tags: [],
      trees: [],
      isLoading: false,
      error: null
    };
    
    const store = configureStore({
      reducer: {
        growth: growthReducer
      }
    });
    
    expect(store.getState().growth).toEqual(initialState);
  });
  
  test('should handle searchRecords', () => {
    const searchTerm = 'React';
    const result = searchRecords(store.getState().growth, searchTerm);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].activity).toBe('学习React');
  });
  
  test('should handle filterRecordsByMood', () => {
    const mood = '很好';
    const result = filterRecordsByMood(store.getState().growth, mood);
    
    expect(result).toHaveLength(2);
    expect(result.every(record => record.mood === '很好')).toBe(true);
  });
  
  test('should handle filterRecordsByTags', () => {
    const tags = ['React'];
    const result = filterRecordsByTags(store.getState().growth, tags);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].tags).toEqual(expect.arrayContaining(['学习', 'React']));
  });
  
  test('should handle addRecord', async () => {
    const newRecord = {
      activity: '学习Vue',
      learning: '学习了Vue的组合式API',
      reflection: 'Vue的组合式API很灵活',
      mood: '很好',
      tags: ['学习', 'Vue']
    };
    
    await store.dispatch(addRecord(newRecord));
    const state = store.getState().growth;
    
    expect(state.records).toHaveLength(4);
    expect(state.records[0].activity).toBe('学习Vue');
    expect(state.tags).toContain('Vue');
  });
});
