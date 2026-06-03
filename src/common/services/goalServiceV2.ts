import { Capacitor } from '@capacitor/core';
import type { Goal, CreateGoalDTO, UpdateGoalDTO } from '../../types';
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

let repositoryInstance: Repository<Goal> | null = null;
function getRepository(): Repository<Goal> {
  if (!repositoryInstance) {
    repositoryInstance = createIndexedDbRepository<Goal>('goals');
  }
  return repositoryInstance;
}

export async function getGoals(): Promise<Goal[]> {
  ensureNativeOrThrow();
  const repo = getRepository();
  const all = await repo.getAll();
  // 与旧行为一致：按 updatedAt 倒序
  return all.sort((a, b) => {
    const at = a.updatedAt ?? a.createdAt;
    const bt = b.updatedAt ?? b.createdAt;
    return at < bt ? 1 : -1;
  });
}

export async function getGoalById(id: string): Promise<Goal | null> {
  ensureNativeOrThrow();
  return getRepository().get(id);
}

export async function createGoal(data: CreateGoalDTO): Promise<Goal> {
  ensureNativeOrThrow();

  const newGoal: Goal = {
    id: generateId(),
    title: data.title,
    description: data.description ?? '',
    category: data.category ?? 'other',
    targetValue: data.targetValue,
    currentValue: data.currentValue ?? 0,
    targetDate: data.targetDate,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await getRepository().put(newGoal);
  return newGoal;
}

export async function updateGoal(id: string, updates: UpdateGoalDTO): Promise<Goal> {
  ensureNativeOrThrow();

  const repo = getRepository();
  const current = await repo.get(id);
  if (!current) {
    throw new StorageError('NOT_FOUND', '目标不存在', { details: { id } });
  }

  const next: Goal = {
    ...current,
    ...updates,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await repo.put(next);
  return next;
}

export async function deleteGoal(id: string): Promise<void> {
  ensureNativeOrThrow();
  const repo = getRepository();
  const existed = await repo.delete(id);
  if (!existed) {
    throw new StorageError('NOT_FOUND', '目标不存在', { details: { id } });
  }
}

export async function incrementGoalProgress(id: string, value: number): Promise<Goal> {
  ensureNativeOrThrow();
  const goal = await getGoalById(id);
  if (!goal) {
    throw new StorageError('NOT_FOUND', '目标不存在', { details: { id } });
  }
  const newCurrentValue = Math.max(0, goal.currentValue + value);
  const newStatus = newCurrentValue >= goal.targetValue ? 'completed' : goal.status;
  return updateGoal(id, {
    currentValue: newCurrentValue,
    status: newStatus,
  });
}

/** 测试用：重置单例 */
export function __resetGoalRepositoryForTest(): void {
  repositoryInstance = null;
}

/** 测试用：注入 Repository */
export function __setGoalRepositoryForTest(repo: Repository<Goal> | null): void {
  repositoryInstance = repo;
}

const goalServiceV2 = {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  incrementGoalProgress,
};

export default goalServiceV2;
