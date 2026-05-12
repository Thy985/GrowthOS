import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';
import { STORAGE_KEYS } from '../../constants';
import type { Reminder, CreateReminderDTO, UpdateReminderDTO } from '../../types';

const isNative = Capacitor.isNativePlatform();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getReminderFromStorage(): Reminder[] {
  try {
    const data = secureStorage.getItem<Reminder[]>(STORAGE_KEYS.REMINDERS);
    return data ?? [];
  } catch (error) {
    console.error('Error reading reminders from storage:', error);
    return [];
  }
}

function saveRemindersToStorage(reminders: Reminder[]): void {
  try {
    secureStorage.setItem(STORAGE_KEYS.REMINDERS, reminders);
  } catch (error) {
    console.error('Error saving reminders to storage:', error);
    throw new Error('保存提醒失败');
  }
}

export async function getReminders(): Promise<Reminder[]> {
  if (isNative) {
    throw new Error('Native SQLite not implemented yet');
  }
  return getReminderFromStorage();
}

export async function getReminderById(id: string): Promise<Reminder | null> {
  const reminders = getReminderFromStorage();
  return reminders.find(r => r.id === id) || null;
}

export async function createReminder(data: CreateReminderDTO): Promise<Reminder> {
  const reminders = getReminderFromStorage();
  
  const newReminder: Reminder = {
    id: generateId(),
    title: data.title,
    description: data.description || '',
    date: data.date,
    time: data.time,
    goalId: data.goalId,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  reminders.push(newReminder);
  saveRemindersToStorage(reminders);
  
  return newReminder;
}

export async function updateReminder(id: string, updates: UpdateReminderDTO): Promise<Reminder> {
  const reminders = getReminderFromStorage();
  const index = reminders.findIndex(r => r.id === id);
  
  if (index === -1) {
    throw new Error('提醒不存在');
  }
  
  const updatedReminder: Reminder = {
    ...reminders[index],
    ...updates,
    id: reminders[index].id,
    createdAt: reminders[index].createdAt,
    updatedAt: new Date().toISOString()
  };
  
  reminders[index] = updatedReminder;
  saveRemindersToStorage(reminders);
  
  return updatedReminder;
}

export async function deleteReminder(id: string): Promise<void> {
  const reminders = getReminderFromStorage();
  const filteredReminders = reminders.filter(r => r.id !== id);
  
  if (filteredReminders.length === reminders.length) {
    throw new Error('提醒不存在');
  }
  
  saveRemindersToStorage(filteredReminders);
}

export async function completeReminder(id: string): Promise<Reminder> {
  return updateReminder(id, { isCompleted: true });
}

export async function getUpcomingReminders(): Promise<Reminder[]> {
  const reminders = getReminderFromStorage();
  const now = new Date();
  
  return reminders
    .filter(r => !r.isCompleted)
    .filter(r => {
      const reminderDate = new Date(`${r.date}T${r.time}`);
      return reminderDate >= now;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
}

const reminderServiceV2 = {
  getReminders,
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
  getUpcomingReminders
};

export default reminderServiceV2;
