import { createSlice, createAsyncThunk, type PayloadAction, createSelector } from '@reduxjs/toolkit';
import recordServiceV2 from '../../common/services/recordServiceV2';
import growthTreeServiceV2 from '../../common/services/growthTreeServiceV2';
import { type GrowthState, type GrowthRecord, type Tag, type Tree, type GoalState, type CreateRecordDTO } from '../../types';
import logger from '../../utils/logger';
import { generateExportData, downloadBlob, type ExportOptions } from '../../utils/exportUtils';

const initialState: GrowthState = {
  records: [],
  tags: [],
  trees: [],
  isLoading: false,
  error: null
};

export const loadData = createAsyncThunk('growth/loadData', async () => {
  try {
    logger.info('加载成长数据');
    
    const records = await recordServiceV2.getRecords();
    const tags = await recordServiceV2.getTags();
    const trees = await growthTreeServiceV2.getGrowthTrees();
    
    logger.info('成长数据加载完成', { recordsCount: records.length, tagsCount: tags.length, treesCount: trees.length });
    return { records, tags, trees };
  } catch (error) {
    logger.error('加载成长数据异常', error instanceof Error ? error : undefined);
    throw error;
  }
});

export const addRecord = createAsyncThunk('growth/addRecord', async (record: CreateRecordDTO) => {
  try {
    logger.info('添加成长记录', { activity: record.activity, learning: record.learning, tags: record.tags });
    
    const newRecord = await recordServiceV2.createRecord({
      date: record.date || new Date().toISOString().split('T')[0],
      mood: record.mood,
      reflection: record.reflection,
      activity: record.activity || '',
      learning: record.learning || '',
      tags: record.tags
    });
    
    const updatedTags = await recordServiceV2.getTags();
    
    logger.info('成长记录添加成功', { recordId: newRecord.id, tagsCount: updatedTags.length });
    return { record: newRecord, tags: updatedTags };
  } catch (error) {
    logger.error('添加成长记录异常', error instanceof Error ? error : undefined, { activity: record.activity, learning: record.learning });
    throw error;
  }
});

export const searchRecords = createSelector(
  [(state: GrowthState) => state.records, (_state: GrowthState, searchTerm: string) => searchTerm],
  (records, searchTerm) => {
    const searchLower = searchTerm.toLowerCase();
    return records.filter(record => {
      return (
        (record.activity && record.activity.toLowerCase().includes(searchLower)) ||
        (record.learning && record.learning.toLowerCase().includes(searchLower)) ||
        (record.reflection && record.reflection.toLowerCase().includes(searchLower)) ||
        (record.tags && record.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    });
  }
);

export const filterRecordsByMood = createSelector(
  [(state: GrowthState) => state.records, (_state: GrowthState, mood: GrowthRecord['mood']) => mood],
  (records, mood) => {
    return records.filter(record => record.mood === mood);
  }
);

export const filterRecordsByTags = createSelector(
  [(state: GrowthState) => state.records, (_state: GrowthState, tags: Tag[]) => tags],
  (records, tags) => {
    return records.filter(record => {
      if (!record.tags || record.tags.length === 0) return false;
      return tags.some(tag => record.tags.includes(tag));
    });
  }
);

export const exportData = createAsyncThunk(
  'growth/exportData', 
  async (
    options: ExportOptions, 
    { getState }
  ) => {
    try {
      logger.info('开始导出数据', { format: options.format, dataTypes: options.dataTypes });
      
      const state = getState() as { growth: GrowthState, goal: GoalState };
      const { records, tags, trees } = state.growth;
      const { goals } = state.goal;
      
      // 生成导出数据
      const { fileName, blob } = generateExportData(options, {
        records,
        tags,
        trees,
        goals
      });
      
      // 触发下载
      downloadBlob(blob, fileName);
      
      logger.info('数据导出成功', { fileName });
      return { success: true, message: '数据导出成功' };
    } catch (error) {
      logger.error('导出数据异常', error instanceof Error ? error : undefined);
      throw error;
    }
  }
);

export const importData = createAsyncThunk('growth/importData', async (data: Partial<GrowthState>) => {
  try {
    if (data.records && Array.isArray(data.records)) {
      for (const record of data.records) {
        await recordServiceV2.createRecord({
          activity: record.activity,
          learning: record.learning,
          reflection: record.reflection,
          mood: record.mood,
          tags: record.tags,
          date: record.date
        });
      }
    }
    return data;
  } catch (error) {
    logger.error('导入数据异常', error instanceof Error ? error : undefined);
    throw error;
  }
});

const growthSlice = createSlice({
  name: 'growth',
  initialState,
  reducers: {
    setRecords: (state, action: PayloadAction<GrowthRecord[]>) => {
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
        state.error = action.error.message || '加载数据失败';
      })
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
        state.error = action.error.message || '添加记录失败';
      })
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
        state.error = action.error.message || '导入数据失败';
      });
  }
});

export const { setRecords, setTags, setTrees, clearError } = growthSlice.actions;
export default growthSlice.reducer;
