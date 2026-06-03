import { type Goal } from '../types';

// 计算进度百分比（统一入口，禁止散落重复实现）
export const calculateProgress = (current: number, target: number): number => {
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) {
    return 0;
  }
  return Math.min(Math.max(0, Math.round((current / target) * 100)), 100);
};

// 目标进度便捷计算
export const getGoalProgress = (goal: Pick<Goal, 'currentValue' | 'targetValue'>): number =>
  calculateProgress(goal.currentValue, goal.targetValue);

// 格式化日期（保留原 API，内部使用 Intl）
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return date.toLocaleDateString();
};

// 提醒日期+时间格式化
export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return date.toLocaleString();
};

// 获取目标状态的显示文本（i18n key 版本；非必要不直接返回硬编码文案）
export const getGoalStatusI18nKey = (status: Goal['status']): string => {
  switch (status) {
    case 'active':
      return 'goals.inProgress';
    case 'completed':
      return 'goals.completed';
    case 'cancelled':
      return 'goals.cancelled';
    default:
      return 'common.unknown';
  }
};

// 验证目标表单（保持向后兼容）
export interface GoalFormData {
  title: string,
  description: string,
  targetValue: string,
  startDate: string,
  endDate: string,
}

export const validateGoalForm = (formData: GoalFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!formData.title.trim()) {
    errors.title = '请输入目标标题';
  }
  const numeric = Number(formData.targetValue);
  if (!formData.targetValue || !Number.isFinite(numeric) || numeric <= 0) {
    errors.targetValue = '请输入有效的目标值';
  }
  if (!formData.startDate) {
    errors.startDate = '请选择开始日期';
  }
  if (!formData.endDate) {
    errors.endDate = '请选择结束日期';
  }
  if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
    errors.endDate = '结束日期不能早于开始日期';
  }
  return errors;
};
