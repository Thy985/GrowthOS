import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';
import { STORAGE_KEYS } from '../../constants';
import type { Goal, CreateGoalDTO, UpdateGoalDTO } from '../../types';

const isNative = Capacitor.isNativePlatform();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getGoalFromStorage(): Goal[] {
  try {
    const data = secureStorage.getItem(STORAGE_KEYS.GOALS);
    return data || [];
  } catch (error) {
    console.error('Error reading goals from storage:', error);
    return [];
  }
}

function saveGoalsToStorage(goals: Goal[]): void {
  try {
    secureStorage.setItem(STORAGE_KEYS.GOALS, goals);
  } catch (error) {
    console.error('Error saving goals to storage:', error);
    throw new Error('保存目标失败');
  }
}

export async function getGoals(): Promise<Goal[]> {
  if (isNative) {
    throw new Error('Native SQLite not implemented yet');
  }
  return getGoalFromStorage();
}

export async function getGoalById(id: string): Promise<Goal | null> {
  const goals = getGoalFromStorage();
  return goals.find(g => g.id === id) || null;
}

export async function createGoal(data: {
  title: string;
  description?: string;
  target_value: number;
  start_date: string;
  end_date: string;
}): Promise<Goal> {
  const goals = getGoalFromStorage();
  
  const newGoal: Goal = {
    id: generateId(),
    title: data.title,
    description: data.description || '',
    targetValue: data.target_value,
    currentValue: 0,
    startDate: data.start_date,
    endDate: data.end_date,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  goals.push(newGoal);
  saveGoalsToStorage(goals);
  
  return newGoal;
}

export async function updateGoal(id: string, updates: UpdateGoalDTO): Promise<Goal> {
  const goals = getGoalFromStorage();
  const index = goals.findIndex(g => g.id === id);
  
  if (index === -1) {
    throw new Error('目标不存在');
  }
  
  const updatedGoal: Goal = {
    ...goals[index],
    ...updates,
    id: goals[index].id,
    createdAt: goals[index].createdAt,
    updatedAt: new Date().toISOString()
  };
  
  goals[index] = updatedGoal;
  saveGoalsToStorage(goals);
  
  return updatedGoal;
}

export async function deleteGoal(id: string): Promise<void> {
  const goals = getGoalFromStorage();
  const filteredGoals = goals.filter(g => g.id !== id);
  
  if (filteredGoals.length === goals.length) {
    throw new Error('目标不存在');
  }
  
  saveGoalsToStorage(filteredGoals);
}

export async function incrementGoalProgress(id: string, value: number): Promise<Goal> {
  const goals = getGoalFromStorage();
  const goal = goals.find(g => g.id === id);
  
  if (!goal) {
    throw new Error('目标不存在');
  }
  
  const newCurrentValue = goal.currentValue + value;
  const newStatus = newCurrentValue >= goal.targetValue ? 'completed' : goal.status;
  
  return updateGoal(id, {
    currentValue: newCurrentValue,
    status: newStatus
  });
}

const goalServiceV2 = {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  incrementGoalProgress
};

export default goalServiceV2;
