// growthSlice - 阶段 E: 退化为"数据编排 thunk 容器",状态迁出到 recordsSlice/treeSlice
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { GoalState, Record, Tag, Tree } from '../../shared/types';
import logger from '../../shared/utils/logger';
import { secureStorage } from '../../shared/utils/secureStorage';

interface GrowthOrchestrationState {
  isLoading: boolean;
  error: string | null;
}

const initialState: GrowthOrchestrationState = {
  isLoading: false,
  error: null,
};

// 加载数据
export const loadData = createAsyncThunk('growth/loadData', async () => {
  try {
    logger.info('加载成长数据');
    const records = (secureStorage.getItem<Record[]>('growth-records') || []) as Record[];
    const tags = (secureStorage.getItem<Tag[]>('growth-tags') || []) as Tag[];
    const trees = (secureStorage.getItem<Tree[]>('growth-trees') || []) as Tree[];

    logger.info('成长数据加载完成', {
      recordsCount: records.length,
      tagsCount: tags.length,
      treesCount: trees.length,
    });
    return { records, tags, trees };
  } catch (error) {
    logger.error('加载成长数据异常', error);
    throw error;
  }
});

// 导入数据
// 验证 Record 基本结构
const isValidRecord = (item: unknown): item is Record => {
  if (typeof item !== 'object' || item === null) return false;
  const r = item as Record;
  return typeof r.id === 'string' && typeof r.createdAt === 'string';
};

// 验证 Tag 基本结构
const isValidTag = (item: unknown): item is Tag => {
  return typeof item === 'string';
};

// 验证 Tree 基本结构
const isValidTree = (item: unknown): item is Tree => {
  if (typeof item !== 'object' || item === null) return false;
  const t = item as Tree;
  return typeof t.id === 'string' && typeof t.name === 'string';
};

export const importData = createAsyncThunk(
  'growth/importData',
  async (data: { records?: Record[]; tags?: Tag[]; trees?: Tree[]; goals?: unknown[] }) => {
    if (data.records && Array.isArray(data.records)) {
      // 校验导入数据，防止恶意注入
      const validatedRecords = data.records.filter(isValidRecord);
      if (validatedRecords.length !== data.records.length) {
        logger.warn('导入数据校验', {
          total: data.records.length,
          valid: validatedRecords.length,
          rejected: data.records.length - validatedRecords.length,
        });
      }
      secureStorage.setItem('growth-records', validatedRecords);
    }
    if (data.tags && Array.isArray(data.tags)) {
      const validatedTags = data.tags.filter(isValidTag);
      secureStorage.setItem('growth-tags', validatedTags);
    }
    if (data.trees && Array.isArray(data.trees)) {
      const validatedTrees = data.trees.filter(isValidTree);
      secureStorage.setItem('growth-trees', validatedTrees);
    }
    if (data.goals && Array.isArray(data.goals)) {
      secureStorage.setItem('growth-goals', data.goals);
    }
    return data;
  },
);

// 导出数据
export const exportData = createAsyncThunk(
  'growth/exportData',
  async (
    options: {
      format: 'json' | 'csv' | 'markdown';
      dataTypes: string[];
      startDate?: Date;
      endDate?: Date;
    },
    { getState },
  ) => {
    try {
      const state = getState() as {
        records: { records: Record[]; tags: Tag[] };
        tree: { trees: Tree[] };
        goal: GoalState;
      };
      const initialRecs = state.records.records;
      const { tags } = state.records;
      const { trees } = state.tree;
      const { goals } = state.goal;

      // 过滤时间范围
      let records = initialRecs;
      if (options.startDate && options.endDate) {
        records = records.filter((record) => {
          const recordDate = new Date(record.createdAt);
          return recordDate >= options.startDate! && recordDate <= options.endDate!;
        });
      }

      let fileName = `growth-data-${new Date().toISOString().split('T')[0]}`;
      let blob: Blob;

      // CSV 字段值转义（防止公式注入）
      const escapeCsvField = (value: string): string => {
        if (!value) return '';
        // 如果值以 =、+、-、@ 开头，添加前缀单引号防止公式执行
        const escaped = value.replace(/"/g, '""');
        if (/^[=+\-@]/.test(escaped)) {
          return `"'${escaped}"`;
        }
        return `"${escaped}"`;
      };

      switch (options.format) {
        case 'csv': {
          // 生成CSV格式
          let csvContent = '';

          if (options.dataTypes.includes('records')) {
            csvContent += '日期,活动,学习,反思,情绪,标签\n';
            records.forEach((record) => {
              const date = new Date(record.createdAt).toLocaleDateString();
              const activity = escapeCsvField(record.activity);
              const learning = escapeCsvField(record.learning);
              const reflection = escapeCsvField(record.reflection);
              const mood = record.mood;
              const tagsStr = escapeCsvField(record.tags ? record.tags.join(',') : '');
              csvContent += `${date},${activity},${learning},${reflection},${mood},${tagsStr}\n`;
            });
          }

          if (options.dataTypes.includes('goals') && goals.length > 0) {
            csvContent += '\n目标标题,目标描述,目标值,当前值,开始日期,结束日期,状态\n';
            goals.forEach((goal) => {
              const title = escapeCsvField(goal.title);
              const description = escapeCsvField(goal.description);
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
          // 生成Markdown格式
          let markdownContent = `# 成长数据导出\n\n`;
          markdownContent += `导出日期: ${new Date().toLocaleString()}\n\n`;

          if (options.dataTypes.includes('records') && records.length > 0) {
            markdownContent += `## 记录\n\n`;
            markdownContent += `| 日期 | 活动 | 学习 | 反思 | 情绪 | 标签 |\n`;
            markdownContent += `|------|------|------|------|------|------|\n`;
            records.forEach((record) => {
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
            goals.forEach((goal) => {
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
            markdownContent += tags.map((tag) => `- ${tag}`).join('\n');
            markdownContent += `\n`;
          }

          blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
          fileName += '.md';
          break;
        }

        case 'json':
        default: {
          // 生成JSON格式
          const data = {
            records: options.dataTypes.includes('records') ? records : [],
            tags: options.dataTypes.includes('tags') ? tags : [],
            trees: options.dataTypes.includes('trees') ? trees : [],
            goals: options.dataTypes.includes('goals') ? goals : [],
          };
          const jsonStr = JSON.stringify(data, null, 2);
          blob = new Blob([jsonStr], { type: 'application/json' });
          fileName += '.json';
          break;
        }
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
  },
);

// growth slice 只保留 orchestration isLoading/error 状态(供 exportData 用)
const growthSlice = createSlice({
  name: 'growth',
  initialState,
  reducers: {
    clearGrowthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(exportData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(exportData.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(exportData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      });
  },
});

export const { clearGrowthError } = growthSlice.actions;
export default growthSlice.reducer;
