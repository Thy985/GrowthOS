import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';
import { getCurrentUser } from './dbService';

const isNative = Capacitor.isNativePlatform();

interface Record {
  id: number;
  date: string;
  mood?: string;
  reflection?: string;
  activity?: string;
  learning?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// 加载记录
export async function getRecords(): Promise<Record[]> {
  if (isNative) {
    // TODO: 实现原生 SQLite 查询
    throw new Error('Native SQLite getRecords not implemented yet');
  } else {
    // Web 模式
    const records = secureStorage.getItem('growth-records') || [];
    // 按照日期降序排列
    return records.sort((a: any, b: any) => new Date(b.created_at) - new Date(a.created_at));
  }
}

// 创建记录
export async function createRecord(record: Omit<Record, 'id' | 'created_at' | 'updated_at'>): Promise<Record> {
  if (isNative) {
    // TODO: 实现原生 SQLite 插入
    throw new Error('Native SQLite createRecord not implemented yet');
  } else {
    // Web 模式
    const records = secureStorage.getItem('growth-records') || [];
    const newRecord: Record = {
      ...record,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    records.unshift(newRecord);
    secureStorage.setItem('growth-records', records);
    
    // 更新标签
    if (record.tags && record.tags.length > 0) {
      const existingTags = secureStorage.getItem('growth-tags') || [];
      const updatedTags = Array.from(new Set([...existingTags, ...record.tags]));
      secureStorage.setItem('growth-tags', updatedTags);
    }
    
    return newRecord;
  }
}

// 获取标签
export async function getTags(): Promise<string[]> {
  if (isNative) {
    // TODO: 实现原生 SQLite 查询
    throw new Error('Native SQLite getTags not implemented yet');
  } else {
    // Web 模式
    return secureStorage.getItem('growth-tags') || [];
  }
}

export default {
  getRecords,
  createRecord,
  getTags
};
