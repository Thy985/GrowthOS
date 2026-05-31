import {
  calculateProgress,
  formatDate,
  getGoalStatusText,
  validateGoalForm
} from '../../utils/goalUtils';

describe('goalUtils', () => {
  describe('calculateProgress', () => {
    test('should calculate correct progress percentage', () => {
      expect(calculateProgress(50, 100)).toBe(50);
      expect(calculateProgress(25, 100)).toBe(25);
      expect(calculateProgress(0, 100)).toBe(0);
    });

    test('should cap progress at 100%', () => {
      expect(calculateProgress(150, 100)).toBe(100);
      expect(calculateProgress(100, 100)).toBe(100);
    });

    test('should handle zero target', () => {
      expect(calculateProgress(50, 0)).toBe(100);
    });

    test('should round to nearest integer', () => {
      expect(calculateProgress(33, 100)).toBe(33);
      expect(calculateProgress(67, 100)).toBe(67);
    });
  });

  describe('formatDate', () => {
    test('should format date string correctly', () => {
      const result = formatDate('2024-01-15');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    test('should handle ISO date string', () => {
      const result = formatDate('2024-01-15T10:30:00.000Z');
      expect(result).toBeTruthy();
    });
  });

  describe('getGoalStatusText', () => {
    test('should return correct text for active status', () => {
      expect(getGoalStatusText('active')).toBe('进行中');
    });

    test('should return correct text for completed status', () => {
      expect(getGoalStatusText('completed')).toBe('已完成');
    });

    test('should return correct text for cancelled status', () => {
      expect(getGoalStatusText('cancelled')).toBe('已取消');
    });

    test('should return unknown status for invalid status', () => {
      expect(getGoalStatusText('invalid' as any)).toBe('invalid');
    });
  });

  describe('validateGoalForm', () => {
    test('should return no errors for valid form', () => {
      const formData = {
        title: 'Test Goal',
        description: 'Test Description',
        targetValue: '100',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };
      
      const errors = validateGoalForm(formData);
      expect(Object.keys(errors).length).toBe(0);
    });

    test('should return error for empty title', () => {
      const formData = {
        title: '',
        description: 'Test Description',
        targetValue: '100',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };
      
      const errors = validateGoalForm(formData);
      expect(errors.title).toBe('请输入目标标题');
    });

    test('should return error for whitespace-only title', () => {
      const formData = {
        title: '   ',
        description: 'Test Description',
        targetValue: '100',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };
      
      const errors = validateGoalForm(formData);
      expect(errors.title).toBe('请输入目标标题');
    });

    test('should return error for invalid target value', () => {
      const formData = {
        title: 'Test Goal',
        description: 'Test Description',
        targetValue: 'invalid',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };
      
      const errors = validateGoalForm(formData);
      expect(errors.targetValue).toBe('请输入有效的目标值');
    });

    test('should return error for zero target value', () => {
      const formData = {
        title: 'Test Goal',
        description: 'Test Description',
        targetValue: '0',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };
      
      const errors = validateGoalForm(formData);
      expect(errors.targetValue).toBe('请输入有效的目标值');
    });

    test('should return error for negative target value', () => {
      const formData = {
        title: 'Test Goal',
        description: 'Test Description',
        targetValue: '-10',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };
      
      const errors = validateGoalForm(formData);
      expect(errors.targetValue).toBe('请输入有效的目标值');
    });

    test('should return error for missing start date', () => {
      const formData = {
        title: 'Test Goal',
        description: 'Test Description',
        targetValue: '100',
        startDate: '',
        endDate: '2024-12-31'
      };
      
      const errors = validateGoalForm(formData);
      expect(errors.startDate).toBe('请选择开始日期');
    });

    test('should return error for missing end date', () => {
      const formData = {
        title: 'Test Goal',
        description: 'Test Description',
        targetValue: '100',
        startDate: '2024-01-01',
        endDate: ''
      };
      
      const errors = validateGoalForm(formData);
      expect(errors.endDate).toBe('请选择结束日期');
    });

    test('should return error when end date is before start date', () => {
      const formData = {
        title: 'Test Goal',
        description: 'Test Description',
        targetValue: '100',
        startDate: '2024-12-31',
        endDate: '2024-01-01'
      };
      
      const errors = validateGoalForm(formData);
      expect(errors.endDate).toBe('结束日期不能早于开始日期');
    });

    test('should accept same start and end date', () => {
      const formData = {
        title: 'Test Goal',
        description: 'Test Description',
        targetValue: '100',
        startDate: '2024-01-01',
        endDate: '2024-01-01'
      };
      
      const errors = validateGoalForm(formData);
      expect(Object.keys(errors).length).toBe(0);
    });

    test('should return multiple errors', () => {
      const formData = {
        title: '',
        description: 'Test Description',
        targetValue: 'invalid',
        startDate: '',
        endDate: ''
      };
      
      const errors = validateGoalForm(formData);
      expect(Object.keys(errors).length).toBe(4);
      expect(errors.title).toBeDefined();
      expect(errors.targetValue).toBeDefined();
      expect(errors.startDate).toBeDefined();
      expect(errors.endDate).toBeDefined();
    });
  });
});
