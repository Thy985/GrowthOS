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
    test('returns no errors for valid form', () => {
      const errors = validateGoalForm({
        title: 'Learn React',
        description: '',
        targetValue: '100',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
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
      const errors = validateGoalForm({
        title: 'Test',
        description: '',
        targetValue: '100',
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      });
      expect(errors.endDate).toBe('结束日期不能早于开始日期');
    });
  });
});
