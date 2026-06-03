import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';
import { STORAGE_KEYS } from '../../constants';
import type { Goal, CreateGoalDTO, UpdateGoalDTO } from '../../types';

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

async function mutateGoals(
  mutator: (current: Goal[]) => Goal[] | Promise<Goal[]>,
): Promise<Goal[]> {
  const result = await secureStorage.updateWithVersion<Goal[]>(STORAGE_KEYS.GOALS, [], mutator);
  return result.value;
}

export async function getGoals(): Promise<Goal[]> {
  ensureNativeOrThrow();
  const { value } = await secureStorage.readWithVersion<Goal[]>(STORAGE_KEYS.GOALS, []);
  return value;
}

export async function getGoalById(id: string): Promise<Goal | null> {
  ensureNativeOrThrow();
  const goals = await getGoals();
  return goals.find((g) => g.id === id) ?? null;
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

  await mutateGoals((current) => [...current, newGoal]);
  return newGoal;
}

export async function updateGoal(id: string, updates: UpdateGoalDTO): Promise<Goal> {
  ensureNativeOrThrow();

  const updated = await mutateGoals((current) => {
    const index = current.findIndex((g) => g.id === id);
    if (index === -1) {
      throw new Error('目标不存在');
    }
    const next: Goal = {
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

  const found = updated.find((g) => g.id === id);
  if (!found) {
    throw new Error('目标不存在');
  }
  return found;
}

export async function deleteGoal(id: string): Promise<void> {
  ensureNativeOrThrow();

  await mutateGoals((current) => {
    const filtered = current.filter((g) => g.id !== id);
    if (filtered.length === current.length) {
      throw new Error('目标不存在');
    }
    return filtered;
  });
}

export async function incrementGoalProgress(id: string, value: number): Promise<Goal> {
  ensureNativeOrThrow();
  const goal = await getGoalById(id);
  if (!goal) {
    throw new Error('目标不存在');
  }
  const newCurrentValue = Math.max(0, goal.currentValue + value);
  const newStatus = newCurrentValue >= goal.targetValue ? 'completed' : goal.status;
  return updateGoal(id, {
    currentValue: newCurrentValue,
    status: newStatus,
  });
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
