import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { secureStorage } from '../../utils/secureStorage';
import { GrowthState, Record, Tag, Tree, GoalState } from '../../types';
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

// 选择器

// 搜索记录
export const searchRecords = createSelector(
  [(state: GrowthState) => state.records, (state: GrowthState, searchTerm: string) => searchTerm],
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

// 按日期范围过滤记录
export const filterRecordsByDateRange = createSelector(
  [(state: GrowthState) => state.records, (state: GrowthState, startDate: Date) => startDate, (state: GrowthState, startDate: Date, endDate: Date) => endDate],
  (records, startDate, endDate) => {
    return records.filter(record => {
      const recordDate = new Date(record.createdAt);
      return recordDate >= startDate && recordDate <= endDate;
    });
  }
);

// 按情绪过滤记录
export const filterRecordsByMood = createSelector(
  [(state: GrowthState) => state.records, (state: GrowthState, mood: '很好' | '一般' | '不太好') => mood],
  (records, mood) => {
    return records.filter(record => record.mood === mood);
  }
);

// 按标签过滤记录
export const filterRecordsByTags = createSelector(
  [(state: GrowthState) => state.records, (state: GrowthState, tags: Tag[]) => tags],
  (records, tags) => {
    return records.filter(record => {
      if (!record.tags || record.tags.length === 0) return false;
      return tags.some(tag => record.tags.includes(tag));
    });
  }
);

// 获取所有标签
export const getAllTags = createSelector(
  (state: GrowthState) => state.tags,
  (tags) => tags
);

// 导出数据
export const exportData = createAsyncThunk('growth/exportData', async (options: { format: 'json' | 'csv' | 'markdown', dataTypes: string[], startDate?: Date, endDate?: Date }, { getState }) => {
  try {
    const state = getState() as { growth: GrowthState; goal: GoalState };
    let { records, tags, trees } = state.growth;
    const { goals } = state.goal;
    
    // 过滤时间范围
    if (options.startDate && options.endDate) {
      records = records.filter(record => {
        const recordDate = new Date(record.createdAt);
        return recordDate >= options.startDate! && recordDate <= options.endDate!;
      });
    }
    
    let fileName = `growth-data-${new Date().toISOString().split('T')[0]}`;
    let blob: Blob;
    let mimeType: string;
    
    switch (options.format) {
      case 'csv':
        // 生成CSV格式
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
        mimeType = 'text/csv';
        fileName += '.csv';
        break;
        
      case 'markdown':
        // 生成Markdown格式
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
        mimeType = 'text/markdown';
        fileName += '.md';
        break;
        
      case 'json':
      default:
        // 生成JSON格式
        const data = {
          records: options.dataTypes.includes('records') ? records : [],
          tags: options.dataTypes.includes('tags') ? tags : [],
          trees: options.dataTypes.includes('trees') ? trees : [],
          goals: options.dataTypes.includes('goals') ? goals : []
        };
        const jsonStr = JSON.stringify(data, null, 2);
        blob = new Blob([jsonStr], { type: 'application/json' });
        mimeType = 'application/json';
        fileName += '.json';
        break;
    }
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    
    return { success: true, message: '数据导出成功' };
  } catch (error) {
    logger.error('导出数据异常', error);
    throw error;
  }
});

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
