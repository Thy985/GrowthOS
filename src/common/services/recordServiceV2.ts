import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';
import { STORAGE_KEYS } from '../../constants';
import type { Record } from '../../types';

const isNative = Capacitor.isNativePlatform();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getRecordFromStorage(): Record[] {
  try {
    const data = secureStorage.getItem(STORAGE_KEYS.RECORDS);
    return data || [];
  } catch (error) {
    console.error('Error reading records from storage:', error);
    return [];
  }
}

function saveRecordsToStorage(records: Record[]): void {
  try {
    secureStorage.setItem(STORAGE_KEYS.RECORDS, records);
  } catch (error) {
    console.error('Error saving records to storage:', error);
    throw new Error('保存记录失败');
  }
}

export async function getRecords(): Promise<Record[]> {
  if (isNative) {
    throw new Error('Native SQLite not implemented yet');
  }
  return getRecordFromStorage();
}

export async function getRecordById(id: string): Promise<Record | null> {
  const records = getRecordFromStorage();
  return records.find(r => r.id === id) || null;
}

export async function createRecord(data: {
  date?: string;
  mood?: string;
  reflection?: string;
  activity?: string;
  learning?: string;
  tags?: string[];
}): Promise<Record> {
  const records = getRecordFromStorage();
  
  const extractTags = (text: string): string[] => {
    const tagRegex = /#([^\s]+)/g;
    const matches = text.match(tagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };
  
  const activityTags = data.activity ? extractTags(data.activity) : [];
  const learningTags = data.learning ? extractTags(data.learning) : [];
  const explicitTags = data.tags || [];
  
  const newRecord: Record = {
    id: generateId(),
    date: data.date || new Date().toISOString().split('T')[0],
    mood: (data.mood as Record['mood']) || '一般',
    reflection: data.reflection || '',
    activity: data.activity || '',
    learning: data.learning || '',
    tags: [...new Set([...activityTags, ...learningTags, ...explicitTags])],
    createdAt: new Date().toISOString()
  };
  
  records.unshift(newRecord);
  saveRecordsToStorage(records);
  
  return newRecord;
}

export async function updateRecord(id: string, updates: Partial<Record>): Promise<Record> {
  const records = getRecordFromStorage();
  const index = records.findIndex(r => r.id === id);
  
  if (index === -1) {
    throw new Error('记录不存在');
  }
  
  const updatedRecord: Record = {
    ...records[index],
    ...updates,
    id: records[index].id,
    createdAt: records[index].createdAt,
    updatedAt: new Date().toISOString()
  };
  
  records[index] = updatedRecord;
  saveRecordsToStorage(records);
  
  return updatedRecord;
}

export async function deleteRecord(id: string): Promise<void> {
  const records = getRecordFromStorage();
  const filteredRecords = records.filter(r => r.id !== id);
  
  if (filteredRecords.length === records.length) {
    throw new Error('记录不存在');
  }
  
  saveRecordsToStorage(filteredRecords);
}

export async function getTags(): Promise<string[]> {
  const records = getRecordFromStorage();
  const allTags = records.flatMap(r => r.tags || []);
  return [...new Set(allTags)];
}

export async function searchRecords(query: string): Promise<Record[]> {
  const records = getRecordFromStorage();
  const lowerQuery = query.toLowerCase();
  
  return records.filter(r => {
    const activityMatch = r.activity?.toLowerCase().includes(lowerQuery);
    const learningMatch = r.learning?.toLowerCase().includes(lowerQuery);
    const reflectionMatch = r.reflection?.toLowerCase().includes(lowerQuery);
    const tagMatch = r.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
    
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
  searchRecords
};

export default recordServiceV2;
