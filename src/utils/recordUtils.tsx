import React from 'react';
import { Record } from '../types';

// 格式化日期
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取情绪颜色
export const getMoodColor = (mood: '很好' | '一般' | '不太好'): string => {
  switch (mood) {
    case '很好':
      return 'bg-green-100 text-green-800';
    case '一般':
      return 'bg-yellow-100 text-yellow-800';
    case '不太好':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// 高亮搜索结果
export const highlightSearchTerm = (text: string | undefined, searchTerm: string): React.ReactNode => {
  if (!text || !searchTerm) return text;
  
  const searchLower = searchTerm.toLowerCase();
  const textLower = text.toLowerCase();
  
  if (textLower.includes(searchLower)) {
    const index = textLower.indexOf(searchLower);
    const before = text.substring(0, index);
    const match = text.substring(index, index + searchTerm.length);
    const after = text.substring(index + searchTerm.length);
    
    return (
      <>
        {before}
        <span className="bg-yellow-200 font-medium">{match}</span>
        {after}
      </>
    );
  }
  
  return text;
};

// 过滤记录
export const filterRecords = (
  records: Record[],
  searchTerm: string,
  selectedMoods: string[],
  selectedTags: string[],
  dateRange: { start: string; end: string }
): Record[] => {
  let filtered = records;
  
  // 搜索过滤
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter(record => {
      return (
        (record.activity && record.activity.toLowerCase().includes(searchLower)) ||
        (record.learning && record.learning.toLowerCase().includes(searchLower)) ||
        (record.reflection && record.reflection.toLowerCase().includes(searchLower)) ||
        (record.tags && record.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    });
  }
  
  // 情绪过滤
  if (selectedMoods.length > 0) {
    filtered = filtered.filter(record => selectedMoods.includes(record.mood));
  }
  
  // 标签过滤
  if (selectedTags.length > 0) {
    filtered = filtered.filter(record => {
      if (!record.tags || record.tags.length === 0) return false;
      return selectedTags.some(tag => record.tags.includes(tag));
    });
  }
  
  // 日期范围过滤
  if (dateRange.start && dateRange.end) {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);
    
    filtered = filtered.filter(record => {
      const recordDate = new Date(record.createdAt);
      return recordDate >= startDate && recordDate <= endDate;
    });
  }
  
  return filtered;
};