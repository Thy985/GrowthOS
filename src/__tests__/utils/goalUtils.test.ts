import { describe, test, expect } from 'vitest';

import {
  calculateProgress,
  formatDate,
  getGoalStatusText,
  validateGoalForm,
} from '../../features/goals/utils/goalUtils.ts';

describe('goalUtils', () => {
  describe('calculateProgress', () => {
    test('calculates percentage correctly', () => {
      expect(calculateProgress(50, 100)).toBe(50);
      expect(calculateProgress(75, 100)).toBe(75);
      expect(calculateProgress(0, 100)).toBe(0);
    });

    test('caps at 100%', () => {
      expect(calculateProgress(150, 100)).toBe(100);
      expect(calculateProgress(200, 50)).toBe(100);
    });

    test('rounds to nearest integer', () => {
      expect(calculateProgress(33, 100)).toBe(33);
      expect(calculateProgress(67, 100)).toBe(67);
    });

    test('returns 0 for zero or negative target', () => {
      expect(calculateProgress(50, 0)).toBe(0);
      expect(calculateProgress(50, -1)).toBe(0);
    });
  });

  describe('formatDate', () => {
    test('formats ISO date string to locale date', () => {
      const result = formatDate('2024-01-15T10:00:00.000Z');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('getGoalStatusText', () => {
    test('returns correct text for active', () => {
      expect(getGoalStatusText('active')).toBe('进行中');
    });

    test('returns correct text for completed', () => {
      expect(getGoalStatusText('completed')).toBe('已完成');
    });

    test('returns correct text for cancelled', () => {
      expect(getGoalStatusText('cancelled')).toBe('已取消');
    });

    test('returns raw status for unknown values', () => {
      expect(getGoalStatusText('pending' as never)).toBe('pending');
    });
  });

  describe('validateGoalForm', () => {
    // 使用未来日期以避免"过去日期"验证
    const futureDate = () => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    };

    test('returns no errors for valid form', () => {
      const end = futureDate();
      const errors = validateGoalForm({
        title: 'Learn React',
        description: '',
        targetValue: '100',
        startDate: '2024-01-01',
        endDate: end,
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });

    test('returns error for empty title', () => {
      const errors = validateGoalForm({
        title: '',
        description: '',
        targetValue: '100',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      expect(errors.title).toBe('请输入目标标题');
    });

    test('returns error for invalid targetValue', () => {
      const errors1 = validateGoalForm({
        title: 'Test',
        description: '',
        targetValue: '',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      expect(errors1.targetValue).toBe('请输入有效的目标值');

      const errors2 = validateGoalForm({
        title: 'Test',
        description: '',
        targetValue: 'abc',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      expect(errors2.targetValue).toBe('请输入有效的目标值');

      const errors3 = validateGoalForm({
        title: 'Test',
        description: '',
        targetValue: '-5',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      expect(errors3.targetValue).toBe('请输入有效的目标值');
    });

    test('returns error for missing dates', () => {
      const errors1 = validateGoalForm({
        title: 'Test',
        description: '',
        targetValue: '100',
        startDate: '',
        endDate: '2024-12-31',
      });
      expect(errors1.startDate).toBe('请选择开始日期');

      const errors2 = validateGoalForm({
        title: 'Test',
        description: '',
        targetValue: '100',
        startDate: '2024-01-01',
        endDate: '',
      });
      expect(errors2.endDate).toBe('请选择结束日期');
    });

    test('returns error when end date is before start date', () => {
      // 使用未来的日期，但 start > end
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const nextYearPlus1 = new Date();
      nextYearPlus1.setFullYear(nextYearPlus1.getFullYear() + 2);
      const start = nextYearPlus1.toISOString().split('T')[0];
      const end = nextYear.toISOString().split('T')[0];
      const errors = validateGoalForm({
        title: 'Test',
        description: '',
        targetValue: '100',
        startDate: start,
        endDate: end,
      });
      expect(errors.endDate).toBe('结束日期不能早于开始日期');
    });

    test('returns error when end date is in the past', () => {
      const errors = validateGoalForm({
        title: 'Test',
        description: '',
        targetValue: '100',
        startDate: '2020-01-01',
        endDate: '2020-12-31',
      });
      expect(errors.endDate).toBe('结束日期不能是过去的日期');
    });
  });
});
