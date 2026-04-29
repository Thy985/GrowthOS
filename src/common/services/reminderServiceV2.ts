import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';

const isNative = Capacitor.isNativePlatform();

interface Reminder {
  id: number;
  title: string;
  description?: string;
  date: string;
  time: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// 加载提醒
export async function getReminders(): Promise<Reminder[]> {
  if (isNative) {
    // TODO: 实现原生 SQLite 查询
    throw new Error('Native SQLite getReminders not implemented yet');
  } else {
    // Web 模式
    const reminders = secureStorage.getItem('growth-reminders') || [];
    return reminders.sort((a: any, b: any) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
      return dateTimeA - dateTimeB;
    });
  }
}

// 创建提醒
export async function createReminder(reminder: Omit<Reminder, 'id' | 'is_completed' | 'created_at' | 'updated_at'>): Promise<Reminder> {
  if (isNative) {
    // TODO: 实现原生 SQLite 插入
    throw new Error('Native SQLite createReminder not implemented yet');
  } else {
    // Web 模式
    const reminders = secureStorage.getItem('growth-reminders') || [];
    const newReminder: Reminder = {
      ...reminder,
      id: Date.now(),
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    reminders.push(newReminder);
    secureStorage.setItem('growth-reminders', reminders);
    
    return newReminder;
  }
}

// 更新提醒
export async function updateReminder(id: number, updates: Partial<Omit<Reminder, 'id' | 'created_at'>>): Promise<Reminder> {
  if (isNative) {
    // TODO: 实现原生 SQLite 更新
    throw new Error('Native SQLite updateReminder not implemented yet');
  } else {
    // Web 模式
    const reminders = secureStorage.getItem('growth-reminders') || [];
    const index = reminders.findIndex((r: any) => r.id === id);
    
    if (index === -1) {
      throw new Error('Reminder not found');
    }
    
    reminders[index] = {
      ...reminders[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    secureStorage.setItem('growth-reminders', reminders);
    return reminders[index];
  }
}

// 标记提醒为完成
export async function completeReminder(id: number): Promise<Reminder> {
  return updateReminder(id, { is_completed: true });
}

// 删除提醒
export async function deleteReminder(id: number): Promise<void> {
  if (isNative) {
    // TODO: 实现原生 SQLite 删除
    throw new Error('Native SQLite deleteReminder not implemented yet');
  } else {
    // Web 模式
    const reminders = secureStorage.getItem('growth-reminders') || [];
    const updatedReminders = reminders.filter((r: any) => r.id !== id);
    secureStorage.setItem('growth-reminders', updatedReminders);
  }
}

export default {
  getReminders,
  createReminder,
  updateReminder,
  completeReminder,
  deleteReminder
};
