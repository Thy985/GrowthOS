import { Goal } from '../types';

// 计算进度百分比
export const calculateProgress = (current: number, target: number): number => {
  return Math.min(Math.round((current / target) * 100), 100);
};

// 格式化日期
export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString();
};

// 获取目标状态的显示文本
export const getGoalStatusText = (status: Goal['status']): string => {
  switch (status) {
    case 'active':
      return '进行中';
    case 'completed':
      return '已完成';
    case 'cancelled':
      return '已取消';
    default:
      return status;
  }
};

// 验证目标表单
export const validateGoalForm = (formData: {
  title: string;
  description: string;
  targetValue: string;
  startDate: string;
  endDate: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!formData.title.trim()) {
    errors.title = '请输入目标标题';
  }
  if (!formData.targetValue || isNaN(Number(formData.targetValue)) || Number(formData.targetValue) <= 0) {
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