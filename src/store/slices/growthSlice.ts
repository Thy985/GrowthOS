import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { secureStorage } from '../../utils/secureStorage';
import { GrowthState, Record, Tag, Tree } from '../../types';
import logger from '../../utils/logger';

// 初始状态
const initialState: GrowthState = {
  records: [],
  tags: [],
  trees: [],
  isLoading: false,
  error: null
};

// 加载数据
export const loadData = createAsyncThunk('growth/loadData', async () => {
  try {
    logger.info('加载成长数据');
    const records = secureStorage.getItem('growth-records') || [];
    const tags = secureStorage.getItem('growth-tags') || [];
    const trees = secureStorage.getItem('growth-trees') || [];
    
    logger.info('成长数据加载完成', { recordsCount: records.length, tagsCount: tags.length, treesCount: trees.length });
    return { records, tags, trees };
  } catch (error) {
    logger.error('加载成长数据异常', error);
    throw error;
  }
});

// 添加记录的异步thunk
export const addRecord = createAsyncThunk('growth/addRecord', async (record: Omit<Record, 'id' | 'createdAt'>) => {
  try {
    logger.info('添加成长记录', { activity: record.activity, learning: record.learning, tags: record.tags });
    const records = secureStorage.getItem('growth-records') || [];
    const newRecord: Record = {
      ...record,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    const updatedRecords = [newRecord, ...records];
    secureStorage.setItem('growth-records', updatedRecords);
    
    // 更新标签
    const tags = secureStorage.getItem('growth-tags') || [];
    if (record.tags && record.tags.length > 0) {
      const newTags = [...new Set([...tags, ...record.tags])];
      secureStorage.setItem('growth-tags', newTags);
    }
    
    const updatedTags = [...new Set([...tags, ...(record.tags || [])])];
    logger.info('成长记录添加成功', { recordId: newRecord.id, tagsCount: updatedTags.length });
    return { record: newRecord, tags: updatedTags };
  } catch (error) {
    logger.error('添加成长记录异常', error, { activity: record.activity, learning: record.learning });
    throw error;
  }
});

// 搜索记录
export const searchRecords = (state: GrowthState, action: PayloadAction<{ searchTerm: string }>) => {
  const { searchTerm } = action.payload;
  return state.records.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (record.activity && record.activity.toLowerCase().includes(searchLower)) ||
      (record.learning && record.learning.toLowerCase().includes(searchLower)) ||
      (record.reflection && record.reflection.toLowerCase().includes(searchLower)) ||
      (record.tags && record.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  });
};

// 按日期范围过滤记录
export const filterRecordsByDateRange = (state: GrowthState, action: PayloadAction<{ startDate: Date; endDate: Date }>) => {
  const { startDate, endDate } = action.payload;
  return state.records.filter(record => {
    const recordDate = new Date(record.createdAt);
    return recordDate >= startDate && recordDate <= endDate;
  });
};

// 按情绪过滤记录
export const filterRecordsByMood = (state: GrowthState, action: PayloadAction<{ mood: '很好' | '一般' | '不太好' }>) => {
  const { mood } = action.payload;
  return state.records.filter(record => record.mood === mood);
};

// 按标签过滤记录
export const filterRecordsByTags = (state: GrowthState, action: PayloadAction<{ tags: Tag[] }>) => {
  const { tags } = action.payload;
  return state.records.filter(record => {
    if (!record.tags || record.tags.length === 0) return false;
    return tags.some(tag => record.tags.includes(tag));
  });
};

// 获取所有标签
export const getAllTags = (state: GrowthState) => {
  return state.tags;
};

// 导出数据
export const exportData = (state: GrowthState) => {
  const data = {
    records: state.records,
    tags: state.tags,
    trees: state.trees
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `growth-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// 导入数据
export const importData = createAsyncThunk('growth/importData', async (data: Partial<GrowthState>) => {
  try {
    if (data.records && Array.isArray(data.records)) {
      secureStorage.setItem('growth-records', data.records);
    }
    if (data.tags && Array.isArray(data.tags)) {
      secureStorage.setItem('growth-tags', data.tags);
    }
    if (data.trees && Array.isArray(data.trees)) {
      secureStorage.setItem('growth-trees', data.trees);
    }
    return data;
  } catch (error) {
    throw error;
  }
});

// 创建growth slice
const growthSlice = createSlice({
  name: 'growth',
  initialState,
  reducers: {
    setRecords: (state, action: PayloadAction<Record[]>) => {
      state.records = action.payload;
    },
    setTags: (state, action: PayloadAction<Tag[]>) => {
      state.tags = action.payload;
    },
    setTrees: (state, action: PayloadAction<Tree[]>) => {
      state.trees = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 加载数据
      .addCase(loadData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = action.payload.records;
        state.tags = action.payload.tags;
        state.trees = action.payload.trees;
      })
      .addCase(loadData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // 添加记录
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
        state.error = action.error.message;
      })
      // 导入数据
      .addCase(importData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(importData.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.records) state.records = action.payload.records;
        if (action.payload.tags) state.tags = action.payload.tags;
        if (action.payload.trees) state.trees = action.payload.trees;
      })
      .addCase(importData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  }
});

export const { setRecords, setTags, setTrees, clearError } = growthSlice.actions;
export default growthSlice.reducer;
