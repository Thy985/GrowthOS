import type { GrowthRecord, Goal } from '../types';

/**
 * 导出选项接口
 */
export interface ExportOptions {
  format: 'json' | 'csv' | 'markdown';
  dataTypes: string[];
  startDate?: Date;
  endDate?: Date;
}

/**
 * 生成 CSV 内容
 * @param records - 记录列表
 * @param goals - 目标列表
 * @param dataTypes - 数据类型
 * @returns CSV 内容字符串
 */
export const generateCSV = (records: GrowthRecord[], goals: Goal[], dataTypes: string[]): string => {
  let csvContent = '';
  
  if (dataTypes.includes('records')) {
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
  
  if (dataTypes.includes('goals') && goals.length > 0) {
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
  
  return csvContent;
};

/**
 * 生成 Markdown 内容
 * @param records - 记录列表
 * @param goals - 目标列表
 * @param tags - 标签列表
 * @param dataTypes - 数据类型
 * @returns Markdown 内容字符串
 */
export const generateMarkdown = (
  records: GrowthRecord[], 
  goals: Goal[], 
  tags: string[], 
  dataTypes: string[]
): string => {
  let markdownContent = `# 成长数据导出\n\n`;
  markdownContent += `导出日期: ${new Date().toLocaleString()}\n\n`;
  
  if (dataTypes.includes('records') && records.length > 0) {
    markdownContent += `## 记录\n\n`;
    markdownContent += `| 日期 | 活动 | 学习 | 反思 | 情绪 | 标签 |\n`;
    markdownContent += `|------|------|------|------|------|------|\n`;
    records.forEach(record => {
      const date = new Date(record.createdAt).toLocaleDateString();
      const activity = record.activity || '';
      const learning = record.learning || '';
      const reflection = record.reflection || '';
      const mood = record.mood;
      const tagsList = record.tags ? record.tags.join(', ') : '';
      markdownContent += `| ${date} | ${activity} | ${learning} | ${reflection} | ${mood} | ${tagsList} |\n`;
    });
    markdownContent += `\n`;
  }
  
  if (dataTypes.includes('goals') && goals.length > 0) {
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
  
  if (dataTypes.includes('tags') && tags.length > 0) {
    markdownContent += `## 标签\n\n`;
    markdownContent += tags.map(tag => `- ${tag}`).join('\n');
    markdownContent += `\n`;
  }
  
  return markdownContent;
};

/**
 * 生成 JSON 数据
 * @param records - 记录列表
 * @param tags - 标签列表
 * @param trees - 技能树列表
 * @param goals - 目标列表
 * @param dataTypes - 数据类型
 * @returns JSON 对象
 */
export const generateJSON = (
  records: GrowthRecord[], 
  tags: string[], 
  trees: unknown[], 
  goals: Goal[], 
  dataTypes: string[]
) => {
  return {
    records: dataTypes.includes('records') ? records : [],
    tags: dataTypes.includes('tags') ? tags : [],
    trees: dataTypes.includes('trees') ? trees : [],
    goals: dataTypes.includes('goals') ? goals : []
  };
};

/**
 * 根据格式生成导出数据
 * @param options - 导出选项
 * @param data - 数据对象
 * @returns 包含文件名和 Blob 的对象
 */
export const generateExportData = (
  options: ExportOptions,
  data: {
    records: GrowthRecord[];
    tags: string[];
    trees: unknown[];
    goals: Goal[];
  }
) => {
  let fileName = `growth-data-${new Date().toISOString().split('T')[0]}`;
  let blob: Blob;
  
  // 根据日期范围过滤记录
  let filteredRecords = data.records;
  if (options.startDate && options.endDate) {
    filteredRecords = data.records.filter(record => {
      const recordDate = new Date(record.createdAt);
      return recordDate >= options.startDate! && recordDate <= options.endDate!;
    });
  }
  
  switch (options.format) {
    case 'csv':
      blob = new Blob([generateCSV(filteredRecords, data.goals, options.dataTypes)], { 
        type: 'text/csv;charset=utf-8;' 
      });
      fileName += '.csv';
      break;
      
    case 'markdown':
      blob = new Blob([generateMarkdown(filteredRecords, data.goals, data.tags, options.dataTypes)], { 
        type: 'text/markdown;charset=utf-8;' 
      });
      fileName += '.md';
      break;
      
    case 'json':
    default: {
      const jsonData = generateJSON(filteredRecords, data.tags, data.trees, data.goals, options.dataTypes);
      blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      fileName += '.json';
      break;
    }
  }
  
  return { fileName, blob };
};

/**
 * 触发文件下载
 * @param blob - Blob 对象
 * @param fileName - 文件名
 */
export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
