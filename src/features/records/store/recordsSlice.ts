// recordsSlice - 阶段 E: 把 growthSlice 中 records/tags 相关代码迁入
import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';

import type { Record, Tag } from '../../../shared/types';
import logger from '../../../shared/utils/logger';
import { secureStorage } from '../../../shared/utils/secureStorage';
import { generateId } from '../../../shared/utils/idGenerator';
import { loadData, importData } from '../../../store/slices/growthSlice';

export interface RecordsState {
  records: Record[];
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RecordsState = {
  records: [],
  tags: [],
  isLoading: false,
  error: null,
};

// 添加记录的异步 thunk
export const addRecord = createAsyncThunk(
  'records/addRecord',
  async (record: Omit<Record, 'id' | 'createdAt'>) => {
    try {
      logger.info('添加成长记录', {
        activity: record.activity,
        learning: record.learning,
        tags: record.tags,
      });
      const records = (secureStorage.getItem<Record[]>('growth-records') || []) as Record[];
      const newRecord: Record = {
        ...record,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      const updatedRecords = [newRecord, ...records];
      secureStorage.setItem('growth-records', updatedRecords);

      // 更新标签
      const tags = (secureStorage.getItem<Tag[]>('growth-tags') || []) as Tag[];
      if (record.tags && record.tags.length > 0) {
        const newTags = [...new Set([...tags, ...record.tags])];
        secureStorage.setItem('growth-tags', newTags);
      }

      const updatedTags = [...new Set([...tags, ...(record.tags || [])])];
      logger.info('成长记录添加成功', { recordId: newRecord.id, tagsCount: updatedTags.length });
      return { record: newRecord, tags: updatedTags };
    } catch (error) {
      logger.error('添加成长记录异常', error, {
        activity: record.activity,
        learning: record.learning,
      });
      throw error;
    }
  },
);

// 创建 records slice
const recordsSlice = createSlice({
  name: 'records',
  initialState,
  reducers: {
    setRecords: (state, action: PayloadAction<Record[]>) => {
      state.records = action.payload;
    },
    setTags: (state, action: PayloadAction<Tag[]>) => {
      state.tags = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 监听 loadData(来自 growthSlice)
      .addCase(loadData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = action.payload.records;
        state.tags = action.payload.tags;
      })
      .addCase(loadData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      // 监听 addRecord 自身
      .addCase(addRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = [action.payload.record, ...state.records];
        state.tags = action.payload.tags;
      })
      .addCase(addRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      // 监听 importData(来自 growthSlice)
      .addCase(importData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(importData.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.records) state.records = action.payload.records;
        if (action.payload.tags) state.tags = action.payload.tags;
      })
      .addCase(importData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      });
  },
});

export const { setRecords, setTags, clearError } = recordsSlice.actions;
export default recordsSlice.reducer;

// 选择器(从原 growthSlice 平移)
export const searchRecords = createSelector(
  [
    (state: { records: RecordsState }) => state.records.records,
    (_: unknown, searchTerm: string) => searchTerm,
  ],
  (records, searchTerm) => {
    const searchLower = searchTerm.toLowerCase();
    return records.filter((record) => {
      return (
        (record.activity && record.activity.toLowerCase().includes(searchLower)) ||
        (record.learning && record.learning.toLowerCase().includes(searchLower)) ||
        (record.reflection && record.reflection.toLowerCase().includes(searchLower)) ||
        (record.tags && record.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
      );
    });
  },
);

export const filterRecordsByDateRange = createSelector(
  [
    (state: { records: RecordsState }) => state.records.records,
    (_: unknown, startDate: Date) => startDate,
    (_: unknown, __: Date, endDate: Date) => endDate,
  ],
  (records, startDate, endDate) => {
    return records.filter((record) => {
      const recordDate = new Date(record.createdAt);
      return recordDate >= startDate && recordDate <= endDate;
    });
  },
);

export const filterRecordsByMood = createSelector(
  [
    (state: { records: RecordsState }) => state.records.records,
    (_: unknown, mood: '很好' | '一般' | '不太好') => mood,
  ],
  (records, mood) => {
    return records.filter((record) => record.mood === mood);
  },
);

export const filterRecordsByTags = createSelector(
  [(state: { records: RecordsState }) => state.records.records, (_: unknown, tags: Tag[]) => tags],
  (records, tags) => {
    return records.filter((record) => {
      if (!record.tags || record.tags.length === 0) return false;
      return tags.some((tag) => record.tags!.includes(tag));
    });
  },
);

export const getAllTags = createSelector(
  (state: { records: RecordsState }) => state.records.tags,
  (tags) => tags,
);
