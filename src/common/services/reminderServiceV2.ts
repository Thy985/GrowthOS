import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';
import { STORAGE_KEYS } from '../../constants';
import type { Reminder, CreateReminderDTO, UpdateReminderDTO } from '../../types';

const isNative = Capacitor.isNativePlatform();

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const hex = Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function ensureNativeOrThrow(): void {
  if (isNative) {
    throw new Error('Native SQLite not implemented yet');
  }
}

async function mutateReminders(
  mutator: (current: Reminder[]) => Reminder[] | Promise<Reminder[]>,
): Promise<Reminder[]> {
  const result = await secureStorage.updateWithVersion<Reminder[]>(STORAGE_KEYS.REMINDERS, [], mutator);
  return result.value;
}

export async function getReminders(): Promise<Reminder[]> {
  ensureNativeOrThrow();
  const { value } = await secureStorage.readWithVersion<Reminder[]>(STORAGE_KEYS.REMINDERS, []);
  return value;
}

export async function getReminderById(id: string): Promise<Reminder | null> {
  ensureNativeOrThrow();
  const reminders = await getReminders();
  return reminders.find((r) => r.id === id) ?? null;
}

export async function createReminder(data: CreateReminderDTO): Promise<Reminder> {
  ensureNativeOrThrow();

  const newReminder: Reminder = {
    id: generateId(),
    title: data.title,
    description: data.description ?? '',
    date: data.date,
    time: data.time,
    goalId: data.goalId,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await mutateReminders((current) => [...current, newReminder]);
  return newReminder;
}

export async function updateReminder(id: string, updates: UpdateReminderDTO): Promise<Reminder> {
  ensureNativeOrThrow();

  const updated = await mutateReminders((current) => {
    const index = current.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error('提醒不存在');
    }
    const next: Reminder = {
      ...current[index],
      ...updates,
      id: current[index].id,
      createdAt: current[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    const copy = current.slice();
    copy[index] = next;
    return copy;
  });

  const found = updated.find((r) => r.id === id);
  if (!found) {
    throw new Error('提醒不存在');
  }
  return found;
}

export async function deleteReminder(id: string): Promise<void> {
  ensureNativeOrThrow();

  await mutateReminders((current) => {
    const filtered = current.filter((r) => r.id !== id);
    if (filtered.length === current.length) {
      throw new Error('提醒不存在');
    }
    return filtered;
  });
}

export async function completeReminder(id: string): Promise<Reminder> {
  return updateReminder(id, { isCompleted: true });
}

export async function getUpcomingReminders(): Promise<Reminder[]> {
  ensureNativeOrThrow();
  const reminders = await getReminders();
  const now = new Date();

  return reminders
    .filter((r) => !r.isCompleted)
    .filter((r) => new Date(`${r.date}T${r.time}`).getTime() >= now.getTime())
    .sort((a, b) =>
      new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
    );
}

const reminderServiceV2 = {
  getReminders,
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
  getUpcomingReminders,
};

export default reminderServiceV2;
