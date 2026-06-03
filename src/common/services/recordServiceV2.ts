import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';
import { STORAGE_KEYS } from '../../constants';
import type { GrowthRecord as GrowthRecordEntity, Mood } from '../../types';

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

export interface RecordCreateInput {
  date?: string,
  mood?: Mood,
  reflection?: string,
  activity?: string,
  learning?: string,
  tags?: string[],
  category?: GrowthRecordEntity['category'],
}

async function mutateRecords(
  mutator: (current: GrowthRecordEntity[]) => GrowthRecordEntity[] | Promise<GrowthRecordEntity[]>,
): Promise<GrowthRecordEntity[]> {
  const result = await secureStorage.updateWithVersion<GrowthRecordEntity[]>(
    STORAGE_KEYS.RECORDS,
    [],
    mutator,
  );
  return result.value;
}

export async function getRecords(): Promise<GrowthRecordEntity[]> {
  ensureNativeOrThrow();
  const { value } = await secureStorage.readWithVersion<GrowthRecordEntity[]>(STORAGE_KEYS.RECORDS, []);
  return value;
}

export async function getRecordById(id: string): Promise<GrowthRecordEntity | null> {
  ensureNativeOrThrow();
  const records = await getRecords();
  return records.find((r) => r.id === id) ?? null;
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

  await mutateRecords((current) => [newRecord, ...current]);
  return newRecord;
}

export async function updateRecord(
  id: string,
  updates: Partial<GrowthRecordEntity>,
): Promise<GrowthRecordEntity> {
  ensureNativeOrThrow();

  const updated = await mutateRecords((current) => {
    const index = current.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error('记录不存在');
    }
    const next: GrowthRecordEntity = {
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
    throw new Error('记录不存在');
  }
  return found;
}

export async function deleteRecord(id: string): Promise<void> {
  ensureNativeOrThrow();

  await mutateRecords((current) => {
    const filtered = current.filter((r) => r.id !== id);
    if (filtered.length === current.length) {
      throw new Error('记录不存在');
    }
    return filtered;
  });
}

export async function getTags(): Promise<string[]> {
  ensureNativeOrThrow();
  const records = await getRecords();
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
