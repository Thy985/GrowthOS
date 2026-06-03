import { Capacitor } from '@capacitor/core';
import type { GrowthRecord as GrowthRecordEntity, Mood } from '../../types';
import { createIndexedDbRepository, createLocalStorageRepository, createInMemoryRepository, type ReadWriteRepository } from '../repositories/repository';
import { getStorageBackendConfig } from '../../storage/config';
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

const TAG_REGEX = /#([^\s]+)/g;
function extractTags(text: string): string[] {
  const matches = text.match(TAG_REGEX);
  return matches ? matches.map((tag) => tag.substring(1)) : [];
}

const DEFAULT_MOOD: Mood = 'okay';

function ensureNativeOrThrow(): void {
  if (isNative) {
    throw new Error('Native SQLite not implemented yet');
  }
}

// 单例 Repository（懒初始化，按当前 backend config 选后端）
let repositoryInstance: ReadWriteRepository<GrowthRecordEntity> | null = null;
function getRepository(): ReadWriteRepository<GrowthRecordEntity> {
  if (!repositoryInstance) {
    repositoryInstance = createRepositoryForBackend<GrowthRecordEntity>('records', 'records');
  }
  return repositoryInstance;
}

/** 通用：按当前 backend 配置创建对应 Repository */
function createRepositoryForBackend<T extends { id: string }>(
  storeKey: string,
  lsKey: string,
): ReadWriteRepository<T> {
  const kind = getStorageBackendConfig().getStorageBackend();
  switch (kind) {
    case 'indexeddb':
      return createIndexedDbRepository<T>(storeKey as never, { cache: true, sync: true });
    case 'localStorage':
      return createLocalStorageRepository<T>(lsKey, { cache: true, sync: true });
    case 'inMemory':
      return createInMemoryRepository<T>({ cache: false, sync: false });
  }
}

export interface RecordCreateInput {
  date?: string,
  mood?: Mood,
  reflection?: string,
  activity?: string,
  learning?: string,
  tags?: string[],
  category?: GrowthRecordEntity['category'],
}

/**
 * 默认按 createdAt 倒序返回（最新在前，与旧行为一致）
 */
export async function getRecords(): Promise<GrowthRecordEntity[]> {
  ensureNativeOrThrow();
  const repo = getRepository();
  const all = await repo.getAll();
  return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getRecordById(id: string): Promise<GrowthRecordEntity | null> {
  ensureNativeOrThrow();
  return getRepository().get(id);
}

export async function createRecord(data: RecordCreateInput): Promise<GrowthRecordEntity> {
  ensureNativeOrThrow();

  const activityTags = data.activity ? extractTags(data.activity) : [];
  const learningTags = data.learning ? extractTags(data.learning) : [];
  const explicitTags = data.tags ?? [];
  const mergedTags = [...new Set([...activityTags, ...learningTags, ...explicitTags])];

  const newRecord: GrowthRecordEntity = {
    id: generateId(),
    date: data.date ?? new Date().toISOString().split('T')[0],
    activity: data.activity ?? '',
    learning: data.learning ?? '',
    reflection: data.reflection ?? '',
    mood: data.mood ?? DEFAULT_MOOD,
    category: data.category ?? 'other',
    tags: mergedTags,
    createdAt: new Date().toISOString(),
  };

  await getRepository().put(newRecord);
  return newRecord;
}

export async function updateRecord(
  id: string,
  updates: Partial<GrowthRecordEntity>,
): Promise<GrowthRecordEntity> {
  ensureNativeOrThrow();

  const repo = getRepository();
  const current = await repo.get(id);
  if (!current) {
    throw new StorageError('NOT_FOUND', '记录不存在', { details: { id } });
  }

  const next: GrowthRecordEntity = {
    ...current,
    ...updates,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await repo.put(next);
  return next;
}

export async function deleteRecord(id: string): Promise<void> {
  ensureNativeOrThrow();
  const repo = getRepository();
  const existed = await repo.delete(id);
  if (!existed) {
    throw new StorageError('NOT_FOUND', '记录不存在', { details: { id } });
  }
}

export async function getTags(): Promise<string[]> {
  ensureNativeOrThrow();
  const records = await getRepository().getAll();
  const allTags = records.flatMap((r) => r.tags ?? []);
  return [...new Set(allTags)];
}

export async function searchRecords(query: string): Promise<GrowthRecordEntity[]> {
  ensureNativeOrThrow();
  const records = await getRecords();
  const lowerQuery = query.toLowerCase();
  if (!lowerQuery) return records;

  return records.filter((r) => {
    const activityMatch = r.activity?.toLowerCase().includes(lowerQuery) ?? false;
    const learningMatch = r.learning?.toLowerCase().includes(lowerQuery) ?? false;
    const reflectionMatch = r.reflection?.toLowerCase().includes(lowerQuery) ?? false;
    const tagMatch = r.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ?? false;
    return activityMatch || learningMatch || reflectionMatch || tagMatch;
  });
}

/** 测试用：重置单例（让测试可以替换后端） */
export function __resetRecordRepositoryForTest(): void {
  repositoryInstance = null;
}

/** 测试用：注入 Repository（让测试可换 InMemory / Mock） */
export function __setRecordRepositoryForTest(repo: ReadWriteRepository<GrowthRecordEntity> | null): void {
  repositoryInstance = repo;
}

const recordServiceV2 = {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  getTags,
  searchRecords,
};

export default recordServiceV2;
