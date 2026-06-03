import { Capacitor } from '@capacitor/core';
import type { Reminder, CreateReminderDTO, UpdateReminderDTO } from '../../types';
import { createIndexedDbRepository } from '../repositories/repository';
import type { Repository } from '../repositories/repository';
import { StorageError } from '../../storage';

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

let repositoryInstance: Repository<Reminder> | null = null;
function getRepository(): Repository<Reminder> {
  if (!repositoryInstance) {
    repositoryInstance = createIndexedDbRepository<Reminder>('reminders');
  }
  return repositoryInstance;
}

export async function getReminders(): Promise<Reminder[]> {
  ensureNativeOrThrow();
  const repo = getRepository();
  const all = await repo.getAll();
  return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getReminderById(id: string): Promise<Reminder | null> {
  ensureNativeOrThrow();
  return getRepository().get(id);
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

  await getRepository().put(newReminder);
  return newReminder;
}

export async function updateReminder(id: string, updates: UpdateReminderDTO): Promise<Reminder> {
  ensureNativeOrThrow();

  const repo = getRepository();
  const current = await repo.get(id);
  if (!current) {
    throw new StorageError('NOT_FOUND', '提醒不存在', { details: { id } });
  }

  const next: Reminder = {
    ...current,
    ...updates,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await repo.put(next);
  return next;
}

export async function deleteReminder(id: string): Promise<void> {
  ensureNativeOrThrow();
  const repo = getRepository();
  const existed = await repo.delete(id);
  if (!existed) {
    throw new StorageError('NOT_FOUND', '提醒不存在', { details: { id } });
  }
}

export async function completeReminder(id: string): Promise<Reminder> {
  return updateReminder(id, { isCompleted: true });
}

export async function getUpcomingReminders(): Promise<Reminder[]> {
  ensureNativeOrThrow();
  const reminders = await getRepository().getAll();
  const now = new Date();

  return reminders
    .filter((r) => !r.isCompleted)
    .filter((r) => new Date(`${r.date}T${r.time}`).getTime() >= now.getTime())
    .sort((a, b) =>
      new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
    );
}

/** 测试用：重置单例 */
export function __resetReminderRepositoryForTest(): void {
  repositoryInstance = null;
}

/** 测试用：注入 Repository */
export function __setReminderRepositoryForTest(repo: Repository<Reminder> | null): void {
  repositoryInstance = repo;
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
