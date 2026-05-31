import React from 'react';
import { type GrowthRecord, type Mood } from '../types';
import { MOOD_OPTIONS } from '../constants';
import i18n from '../i18n';

// 计算连续记录天数
export const calculateStreak = (records: GrowthRecord[]): number => {
  if (!records || records.length === 0) return 0;
  
  // 使用 Set 快速查找日期
  const datesSet = new Set(
    records.map(record => 
      new Date(record.createdAt).toISOString().split('T')[0]
    )
  );
  
  let streak = 0;
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() - i);
    const checkDateStr = checkDate.toISOString().split('T')[0];
    
    if (datesSet.has(checkDateStr)) {
      streak++;
    } else if (i > 0) {
      // 如果不是今天且没有记录，中断连续
      break;
    }
    // i === 0 时（今天），即使没有记录也不中断
  }
  
  return streak;
};

// 格式化日期
export const formatDate = (dateStr: string, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(dateStr);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Intl.DateTimeFormat(i18n.language, options || defaultOptions).format(date);
};

// 获取情绪颜色类名
export const getMoodColor = (mood: Mood): string => {
  const moodOption = MOOD_OPTIONS.find(opt => opt.value === mood);
  const color = moodOption?.color || 'gray';
  
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800'
  };
  
  return colorMap[color] || colorMap.gray;
};

// 获取情绪显示文本
export const getMoodText = (mood: Mood): string => {
  const moodOption = MOOD_OPTIONS.find(opt => opt.value === mood);
  if (moodOption) {
    return i18n.t(moodOption.i18nKey);
  }
  return '';
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
  records: GrowthRecord[],
  searchTerm: string,
  selectedMoods: Mood[],
  selectedTags: string[],
  dateRange: { start: string, end: string }
): GrowthRecord[] => {
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
