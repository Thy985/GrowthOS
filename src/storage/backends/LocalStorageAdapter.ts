/**
 * LocalStorageAdapter
 *
 * 用途：小配置项（< 1KB）
 *   - token
 *   - theme / language
 *   - LLM config
 *   - feature flags
 *   - 当前用户引用
 *
 * 设计：
 * - 每个 Adapter 实例对应一个 key，存"单个实体"
 * - getAll() 不可用（localStorage 本来就是 key-value）
 * - put 覆盖整个 key
 *
 * 安全：
 * - 不做客户端加密（剧场式安全已删除）
 * - token 视为不透明值，依赖服务端验证
 */

import type { BaseEntity, StorageAdapter, QueryOptions } from '../types';
import { StorageError } from '../errors';

export class LocalStorageAdapter<T extends BaseEntity> implements StorageAdapter<T> {
  private initialized = false;

  constructor(private readonly storageKey: string) {
    if (!storageKey) {
      throw new StorageError('INVALID_INPUT', 'LocalStorageAdapter requires a non-empty storageKey');
    }
  }

  async init(): Promise<void> {
    this.initialized = true;
  }

  private ensureInit(): void {
    if (!this.initialized) {
      throw new StorageError('PLATFORM_UNAVAILABLE', 'LocalStorageAdapter not initialized');
    }
  }

  private isAvailable(): boolean {
    try {
      // 检测 localStorage 是否可用（隐私模式、SSR、worker）
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const probe = '__growthos_probe__';
      window.localStorage.setItem(probe, probe);
      window.localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }

  async get(_id: string): Promise<T | null> {
    this.ensureInit();
    if (!this.isAvailable()) {
      throw new StorageError('PLATFORM_UNAVAILABLE', 'localStorage is not available');
    }
    const raw = window.localStorage.getItem(this.storageKey);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      throw new StorageError('CORRUPTED_DATA', `Failed to parse ${this.storageKey}`, { cause: err });
    }
  }

  async getAll(): Promise<T[]> {
    // localStorage 是 KV，没有"全部"的概念
    // 实现上视作"单条记录"：返回数组
    const item = await this.get('singleton');
    return item ? [item] : [];
  }

  async query(_options?: QueryOptions): Promise<T[]> {
    return this.getAll();
  }

  async put(entity: T): Promise<T> {
    this.ensureInit();
    if (!this.isAvailable()) {
      throw new StorageError('PLATFORM_UNAVAILABLE', 'localStorage is not available');
    }
    if (!entity.id) {
      throw new StorageError('INVALID_INPUT', 'Entity must have an id');
    }
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(entity));
      return entity;
    } catch (err) {
      throw StorageError.from(err, `Failed to write ${this.storageKey}`);
    }
  }

  async putMany(entities: T[]): Promise<T[]> {
    const results: T[] = [];
    for (const entity of entities) {
      results.push(await this.put(entity));
    }
    return results;
  }

  async delete(_id: string): Promise<boolean> {
    this.ensureInit();
    if (!this.isAvailable()) return false;
    const existed = window.localStorage.getItem(this.storageKey) !== null;
    window.localStorage.removeItem(this.storageKey);
    return existed;
  }

  async clear(): Promise<void> {
    await this.delete('singleton');
  }

  async count(): Promise<number> {
    if (await this.get('singleton')) return 1;
    return 0;
  }

  async close(): Promise<void> {
    this.initialized = false;
  }
}
