/**
 * 公开 API barrel
 *
 * 用法：
 *   import { createAdapter, StorageError } from '@/storage';
 *   import type { StorageAdapter, BaseEntity } from '@/storage';
 */

export { StorageError, isStorageError, type StorageErrorCode } from './errors';
export type { BaseEntity, StorageAdapter, QueryOptions, QueryValue } from './types';

export { InMemoryAdapter } from './backends/InMemoryAdapter';
export { MemoryAdapter } from './backends/MemoryAdapter';
export { LocalStorageAdapter } from './backends/LocalStorageAdapter';
export { IndexedDbAdapter } from './backends/IndexedDbAdapter';

export {
  openGrowthDB,
  getDB,
  resetDatabase,
} from './schema';
export {
  ENTITY_STORES,
  DB_NAME,
  CURRENT_DB_VERSION,
  type EntityStore,
  type GrowthOSDB,
  type RecordEntity,
  type GoalEntity,
  type ReminderEntity,
  type UserEntity,
  type ChatSessionEntity,
  type ChatMessageEntity,
} from './schema/types';

import type { BaseEntity, StorageAdapter } from './types';
import { InMemoryAdapter } from './backends/InMemoryAdapter';
import { MemoryAdapter } from './backends/MemoryAdapter';
import { LocalStorageAdapter } from './backends/LocalStorageAdapter';
import { IndexedDbAdapter } from './backends/IndexedDbAdapter';
import type { EntityStore } from './schema/types';

export type AdapterConfig =
  | { kind: 'indexeddb', store: EntityStore }
  | { kind: 'localStorage', key: string }
  | { kind: 'memory' }
  | { kind: 'inMemory' };  // 测试用

/**
 * 统一工厂：根据 config 创建对应后端 Adapter
 */
export function createAdapter<T extends BaseEntity>(config: AdapterConfig): StorageAdapter<T> {
  switch (config.kind) {
    case 'indexeddb':
      return new IndexedDbAdapter<T>(config.store) as unknown as StorageAdapter<T>;
    case 'localStorage':
      return new LocalStorageAdapter<T>(config.key) as unknown as StorageAdapter<T>;
    case 'memory':
      return new MemoryAdapter<T>();
    case 'inMemory':
      return new InMemoryAdapter<T>();
  }
}

/**
 * 工厂的异步版：先 init 再返回
 */
export async function createInitializedAdapter<T extends BaseEntity>(
  config: AdapterConfig,
): Promise<StorageAdapter<T>> {
  const adapter = createAdapter<T>(config);
  await adapter.init();
  return adapter;
}

/** 类型守卫：检查 AdapterFactory 返回值是否符合接口（编译时） */
export function isStorageAdapter<T extends BaseEntity>(value: unknown): value is StorageAdapter<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { init?: unknown }).init === 'function' &&
    typeof (value as { get?: unknown }).get === 'function' &&
    typeof (value as { put?: unknown }).put === 'function' &&
    typeof (value as { delete?: unknown }).delete === 'function'
  );
}

// 跨切关注点：缓存 + 跨 tab 同步 + 配额监控
export { LRUCache, CachingRepository } from './cache';
export type { LRUOptions, CachingRepositoryOptions } from './cache';
export { CrossTabChannel, SyncedRepository, getDefaultChannelName } from './sync';
export type { CrossTabEvent, CrossTabEventType, CrossTabSubscriber } from './sync';
export { QuotaMonitor, getQuotaMonitor } from './quota';
export type { QuotaStatus, QuotaLevel, QuotaMonitorOptions, QuotaSubscriber } from './quota';
// 后端配置中心
export {
  getStorageBackendConfig,
  clearStorageBackendConfig,
  _resetStorageBackendConfig,
  STORAGE_BACKEND_KINDS,
  isLargeCapacityBackend,
  isPersistentBackend,
} from './config';
export type { StorageBackendKind, StorageBackendConfig } from './config';
