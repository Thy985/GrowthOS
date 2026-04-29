import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';

const isNative = Capacitor.isNativePlatform();

interface Goal {
  id: number;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// 加载目标
export async function getGoals(): Promise<Goal[]> {
  if (isNative) {
    // TODO: 实现原生 SQLite 查询
    throw new Error('Native SQLite getGoals not implemented yet');
  } else {
    // Web 模式
    const goals = secureStorage.getItem('growth-goals') || [];
    return goals.sort((a: any, b: any) => new Date(b.created_at) - new Date(a.created_at));
  }
}

// 创建目标
export async function createGoal(goal: Omit<Goal, 'id' | 'current_value' | 'status' | 'created_at' | 'updated_at'>): Promise<Goal> {
  if (isNative) {
    // TODO: 实现原生 SQLite 插入
    throw new Error('Native SQLite createGoal not implemented yet');
  } else {
    // Web 模式
    const goals = secureStorage.getItem('growth-goals') || [];
    const newGoal: Goal = {
      ...goal,
      id: Date.now(),
      current_value: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    goals.push(newGoal);
    secureStorage.setItem('growth-goals', goals);
    
    return newGoal;
  }
}

// 更新目标
export async function updateGoal(id: number, updates: Partial<Omit<Goal, 'id' | 'created_at'>>): Promise<Goal> {
  if (isNative) {
    // TODO: 实现原生 SQLite 更新
    throw new Error('Native SQLite updateGoal not implemented yet');
  } else {
    // Web 模式
    const goals = secureStorage.getItem('growth-goals') || [];
    const index = goals.findIndex((g: any) => g.id === id);
    
    if (index === -1) {
      throw new Error('Goal not found');
    }
    
    goals[index] = {
      ...goals[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    secureStorage.setItem('growth-goals', goals);
    return goals[index];
  }
}

// 删除目标
export async function deleteGoal(id: number): Promise<void> {
  if (isNative) {
    // TODO: 实现原生 SQLite 删除
    throw new Error('Native SQLite deleteGoal not implemented yet');
  } else {
    // Web 模式
    const goals = secureStorage.getItem('growth-goals') || [];
    const updatedGoals = goals.filter((g: any) => g.id !== id);
    secureStorage.setItem('growth-goals', updatedGoals);
  }
}

export default {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal
};
