import { calculateProgress, formatDate, getGoalStatusI18nKey, validateGoalForm, getGoalProgress } from '../../utils/goalUtils';
import type { Goal } from '../../types';

describe('Goal Utils', () => {
  describe('calculateProgress', () => {
    it('should calculate progress correctly', () => {
      expect(calculateProgress(50, 100)).toBe(50);
      expect(calculateProgress(0, 100)).toBe(0);
      expect(calculateProgress(100, 100)).toBe(100);
    });

    it('should calculate zero progress', () => {
      expect(calculateProgress(0, 100)).toBe(0);
    });

    it('should handle values exceeding target', () => {
      expect(calculateProgress(150, 100)).toBe(100);
    });

    it('should round to nearest integer', () => {
      expect(calculateProgress(33, 100)).toBe(33);
      expect(calculateProgress(66, 100)).toBe(66);
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const formatted = formatDate('2024-01-15');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('1');
      expect(formatted).toContain('15');
    });

    it('should handle invalid date', () => {
      const formatted = formatDate('invalid-date');
      expect(formatted).toBe('Invalid Date');
    });
  });

  describe('getGoalStatusI18nKey', () => {
    it('should return correct i18n key for each status', () => {
      expect(getGoalStatusI18nKey('active')).toBe('goals.inProgress');
      expect(getGoalStatusI18nKey('completed')).toBe('goals.completed');
      expect(getGoalStatusI18nKey('cancelled')).toBe('goals.cancelled');
    });

    it('should handle unknown status', () => {
      const unknownStatus = 'unknown' as Goal['status'];
      expect(getGoalStatusI18nKey(unknownStatus)).toBe('common.unknown');
    });
  });

  describe('getGoalProgress', () => {
    it('should compute progress from goal fields', () => {
      expect(getGoalProgress({ currentValue: 50, targetValue: 100 })).toBe(50);
      expect(getGoalProgress({ currentValue: 0, targetValue: 100 })).toBe(0);
      expect(getGoalProgress({ currentValue: 100, targetValue: 100 })).toBe(100);
    });

    it('should clamp at 100 when current > target', () => {
      expect(getGoalProgress({ currentValue: 150, targetValue: 100 })).toBe(100);
    });

    it('should return 0 when target is zero or invalid', () => {
      expect(getGoalProgress({ currentValue: 10, targetValue: 0 })).toBe(0);
      expect(getGoalProgress({ currentValue: 10, targetValue: -5 })).toBe(0);
    });
  });

  describe('validateGoalForm', () => {
    it('should validate complete form with no errors', () => {
      const form = {
        title: 'Valid Goal',
        description: 'Description',
        targetValue: '100',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      const result = validateGoalForm(form);
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should return errors for empty title', () => {
      const form = {
        title: '',
        description: 'Description',
        targetValue: '100',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      const result = validateGoalForm(form);
      expect(result.title).toBeTruthy();
    });

    it('should return errors for invalid targetValue', () => {
      const form = {
        title: 'Valid Title',
        description: 'Description',
        targetValue: '0',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      const result = validateGoalForm(form);
      expect(result.targetValue).toBeTruthy();
    });

    it('should return errors for non-numeric targetValue', () => {
      const form = {
        title: 'Valid Title',
        description: 'Description',
        targetValue: 'abc',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      const result = validateGoalForm(form);
      expect(result.targetValue).toBeTruthy();
    });

    it('should return errors for missing startDate', () => {
      const form = {
        title: 'Valid Title',
        description: 'Description',
        targetValue: '100',
        startDate: '',
        endDate: '2024-12-31',
      };
      const result = validateGoalForm(form);
      expect(result.startDate).toBeTruthy();
    });

    it('should return errors for missing endDate', () => {
      const form = {
        title: 'Valid Title',
        description: 'Description',
        targetValue: '100',
        startDate: '2024-01-01',
        endDate: '',
      };
      const result = validateGoalForm(form);
      expect(result.endDate).toBeTruthy();
    });

    it('should return error when endDate is before startDate', () => {
      const form = {
        title: 'Valid Title',
        description: 'Description',
        targetValue: '100',
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      };
      const result = validateGoalForm(form);
      expect(result.endDate).toBe('结束日期不能早于开始日期');
    });
  });
});
