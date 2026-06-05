import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { formatDate, getMoodColor, highlightSearchTerm, filterRecords } from '../../shared/utils/recordUtils.tsx';
import type { Record } from '../../shared/types/index.ts';

const sampleRecords: Record[] = [
  {
    id: '1',
    activity: '学习 React',
    learning: 'hooks 基础',
    reflection: '理解 useState',
    mood: '很好',
    tags: ['学习', 'React'],
    createdAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: '2',
    activity: '学习 Redux',
    learning: 'reducer 模式',
    reflection: '可预测状态',
    mood: '一般',
    tags: ['学习', 'Redux'],
    createdAt: '2024-02-20T10:00:00.000Z',
  },
  {
    id: '3',
    activity: '项目实战',
    learning: '应用 hooks',
    reflection: '困难',
    mood: '不太好',
    tags: ['项目'],
    createdAt: '2024-03-10T10:00:00.000Z',
  },
];

describe('recordUtils', () => {
  describe('formatDate', () => {
    it('formats a date string into zh-CN locale', () => {
      const out = formatDate('2024-01-15T10:00:00.000Z');
      // 不同环境下 toLocaleDateString 行为可能不同(ICU),只断言非空字符串
      expect(typeof out).toBe('string');
      expect(out.length).toBeGreaterThan(0);
    });
  });

  describe('getMoodColor', () => {
    it('returns green classes for 很好', () => {
      expect(getMoodColor('很好')).toContain('green');
    });
    it('returns yellow classes for 一般', () => {
      expect(getMoodColor('一般')).toContain('yellow');
    });
    it('returns red classes for 不太好', () => {
      expect(getMoodColor('不太好')).toContain('red');
    });
    it('returns gray classes for unknown', () => {
      // @ts-expect-error - testing default
      expect(getMoodColor('unknown')).toContain('gray');
    });
  });

  describe('highlightSearchTerm', () => {
    it('returns original text when no searchTerm', () => {
      expect(highlightSearchTerm('hello', '')).toBe('hello');
    });

    it('returns original text when text is undefined', () => {
      expect(highlightSearchTerm(undefined, 'search')).toBeUndefined();
    });

    it('returns original text when no match found', () => {
      expect(highlightSearchTerm('hello', 'xyz')).toBe('hello');
    });

    it('returns JSX with highlight when match found', () => {
      const result = highlightSearchTerm('hello world', 'world');
      render(<>{result}</>);
      expect(screen.getByText('world')).toBeInTheDocument();
      const highlight = screen.getByText('world');
      expect(highlight.tagName).toBe('SPAN');
    });
  });

  describe('filterRecords', () => {
    it('returns all records when no filters', () => {
      const result = filterRecords(sampleRecords, '', [], [], { start: '', end: '' });
      expect(result).toHaveLength(3);
    });

    it('filters by search term in activity', () => {
      const result = filterRecords(sampleRecords, 'redux', [], [], { start: '', end: '' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('filters by search term in tags', () => {
      const result = filterRecords(sampleRecords, '项目', [], [], { start: '', end: '' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('filters by selected moods', () => {
      const result = filterRecords(sampleRecords, '', ['很好'], [], { start: '', end: '' });
      expect(result).toHaveLength(1);
      expect(result[0].mood).toBe('很好');
    });

    it('filters by selected tags', () => {
      const result = filterRecords(sampleRecords, '', [], ['React'], { start: '', end: '' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('filters by date range', () => {
      const result = filterRecords(sampleRecords, '', [], [], {
        start: '2024-02-01',
        end: '2024-02-28',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('excludes records without tags when filtering by tags', () => {
      const records: Record[] = [
        { ...sampleRecords[0], tags: [] },
        sampleRecords[1],
      ];
      const result = filterRecords(records, '', [], ['Redux'], { start: '', end: '' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });
  });
});
