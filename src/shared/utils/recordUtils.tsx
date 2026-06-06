import React from 'react';

import type { Record } from '../types';

// 格式化日期
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 获取情绪颜色
export const getMoodColor = (mood: string): string => {
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

// 高亮搜索结果（支持所有匹配项）
export const highlightSearchTerm = (
  text: string | undefined,
  searchTerm: string,
): React.ReactNode => {
  if (!text || !searchTerm) return text;

  const searchLower = searchTerm.toLowerCase();
  const textLower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let matchIndex = textLower.indexOf(searchLower);

  while (matchIndex !== -1) {
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }
    parts.push(
      <span key={matchIndex} className="bg-yellow-200 font-medium">
        {text.substring(matchIndex, matchIndex + searchTerm.length)}
      </span>,
    );
    lastIndex = matchIndex + searchTerm.length;
    matchIndex = textLower.indexOf(searchLower, lastIndex);
  }

  if (parts.length === 0) return text;

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
};

// 过滤记录
export const filterRecords = (
  records: Record[],
  searchTerm: string,
  selectedMoods: string[],
  selectedTags: string[],
  dateRange: { start: string; end: string },
): Record[] => {
  let filtered = records;

  // 搜索过滤
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter((record) => {
      return (
        (record.activity && record.activity.toLowerCase().includes(searchLower)) ||
        (record.learning && record.learning.toLowerCase().includes(searchLower)) ||
        (record.reflection && record.reflection.toLowerCase().includes(searchLower)) ||
        (record.tags && record.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
      );
    });
  }

  // 情绪过滤
  if (selectedMoods.length > 0) {
    filtered = filtered.filter((record) => selectedMoods.includes(record.mood));
  }

  // 标签过滤
  if (selectedTags.length > 0) {
    filtered = filtered.filter((record) => {
      if (!record.tags || record.tags.length === 0) return false;
      return selectedTags.some((tag) => record.tags.includes(tag));
    });
  }

  // 日期范围过滤（支持单独设置 start 或 end）
  if (dateRange.start || dateRange.end) {
    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    filtered = filtered.filter((record) => {
      const recordDate = new Date(record.createdAt);
      if (startDate && recordDate < startDate) return false;
      if (endDate && recordDate > endDate) return false;
      return true;
    });
  }

  return filtered;
};
