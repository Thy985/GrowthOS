import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import recordServiceV2 from '../../common/services/recordServiceV2';
import growthTreeServiceV2 from '../../common/services/growthTreeServiceV2';
import { GrowthState, Record, Tag, Tree, GoalState, CreateRecordDTO } from '../../types';
import logger from '../../utils/logger';

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
  [(state: GrowthState) => state.records, (_state: GrowthState, mood: Record['mood']) => mood],
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
    options: { format: 'json' | 'csv' | 'markdown'; dataTypes: string[]; startDate?: Date; endDate?: Date }, 
    { getState }
  ) => {
    try {
      const state = getState() as { growth: GrowthState; goal: GoalState };
      let { records, tags, trees } = state.growth;
      const { goals } = state.goal;
      
      if (options.startDate && options.endDate) {
        records = records.filter(record => {
          const recordDate = new Date(record.createdAt);
          return recordDate >= options.startDate! && recordDate <= options.endDate!;
        });
      }
      
      let fileName = `growth-data-${new Date().toISOString().split('T')[0]}`;
      let blob: Blob;
      
      switch (options.format) {
        case 'csv': {
          let csvContent = '';
          
          if (options.dataTypes.includes('records')) {
            csvContent += '日期,活动,学习,反思,情绪,标签\n';
            records.forEach(record => {
              const date = new Date(record.createdAt).toLocaleDateString();
              const activity = record.activity ? `"${record.activity.replace(/"/g, '""')}"` : '';
              const learning = record.learning ? `"${record.learning.replace(/"/g, '""')}"` : '';
              const reflection = record.reflection ? `"${record.reflection.replace(/"/g, '""')}"` : '';
              const mood = record.mood;
              const tagsStr = record.tags ? `"${record.tags.join(',').replace(/"/g, '""')}"` : '';
              csvContent += `${date},${activity},${learning},${reflection},${mood},${tagsStr}\n`;
            });
          }
          
          if (options.dataTypes.includes('goals') && goals.length > 0) {
            csvContent += '\n目标标题,目标描述,目标值,当前值,开始日期,结束日期,状态\n';
            goals.forEach(goal => {
              const title = goal.title ? `"${goal.title.replace(/"/g, '""')}"` : '';
              const description = goal.description ? `"${goal.description.replace(/"/g, '""')}"` : '';
              const targetValue = goal.targetValue;
              const currentValue = goal.currentValue;
              const startDate = new Date(goal.startDate).toLocaleDateString();
              const endDate = new Date(goal.endDate).toLocaleDateString();
              const status = goal.status;
              csvContent += `${title},${description},${targetValue},${currentValue},${startDate},${endDate},${status}\n`;
            });
          }
          
          blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          fileName += '.csv';
          break;
        }
        
        case 'markdown': {
          let markdownContent = `# 成长数据导出\n\n`;
          markdownContent += `导出日期: ${new Date().toLocaleString()}\n\n`;
          
          if (options.dataTypes.includes('records') && records.length > 0) {
            markdownContent += `## 记录\n\n`;
            markdownContent += `| 日期 | 活动 | 学习 | 反思 | 情绪 | 标签 |\n`;
            markdownContent += `|------|------|------|------|------|------|\n`;
            records.forEach(record => {
              const date = new Date(record.createdAt).toLocaleDateString();
              const activity = record.activity || '';
              const learning = record.learning || '';
              const reflection = record.reflection || '';
              const mood = record.mood;
              const tags = record.tags ? record.tags.join(', ') : '';
              markdownContent += `| ${date} | ${activity} | ${learning} | ${reflection} | ${mood} | ${tags} |\n`;
            });
            markdownContent += `\n`;
          }
          
          if (options.dataTypes.includes('goals') && goals.length > 0) {
            markdownContent += `## 目标\n\n`;
            markdownContent += `| 标题 | 描述 | 目标值 | 当前值 | 开始日期 | 结束日期 | 状态 |\n`;
            markdownContent += `|------|------|--------|--------|----------|----------|------|\n`;
            goals.forEach(goal => {
              const title = goal.title || '';
              const description = goal.description || '';
              const targetValue = goal.targetValue;
              const currentValue = goal.currentValue;
              const startDate = new Date(goal.startDate).toLocaleDateString();
              const endDate = new Date(goal.endDate).toLocaleDateString();
              const status = goal.status;
              markdownContent += `| ${title} | ${description} | ${targetValue} | ${currentValue} | ${startDate} | ${endDate} | ${status} |\n`;
            });
            markdownContent += `\n`;
          }
          
          if (options.dataTypes.includes('tags') && tags.length > 0) {
            markdownContent += `## 标签\n\n`;
            markdownContent += tags.map(tag => `- ${tag}`).join('\n');
            markdownContent += `\n`;
          }
          
          blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
          fileName += '.md';
          break;
        }
        
        case 'json':
        default: {
          const data = {
            records: options.dataTypes.includes('records') ? records : [],
            tags: options.dataTypes.includes('tags') ? tags : [],
            trees: options.dataTypes.includes('trees') ? trees : [],
            goals: options.dataTypes.includes('goals') ? goals : []
          };
          const jsonStr = JSON.stringify(data, null, 2);
          blob = new Blob([jsonStr], { type: 'application/json' });
          fileName += '.json';
          break;
        }
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      
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
      data.records.forEach(async (record) => {
        await recordServiceV2.createRecord({
          activity: record.activity,
          learning: record.learning,
          reflection: record.reflection,
          mood: record.mood,
          tags: record.tags,
          date: record.date
        });
      });
    }
    return data;
  } catch (error) {
    throw error;
  }
});

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
