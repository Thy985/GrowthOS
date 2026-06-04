/**
 * StorageBackend 配置中心
 *
 * 让用户在运行时切换数据后端：
 * - indexeddb（默认）：容量大、支持索引、跨 tab 同步
 * - localStorage：简单、单 store ~5MB、跨 tab 同步由浏览器提供
 * - inMemory：纯内存、刷新清空、用于测试 / 降级
 *
 * 配置持久化到 LocalStorage（key: 'growthos:storageBackend'），
 * 这样刷新页面后选择仍在。
 *
 * 切换 backend 不会自动迁移数据。调用方需自行处理：
 *   1. setStorageBackend(newKind) 持久化配置
 *   2. 重建所有 service 单例（service 内部暴露 __reset*RepositoryForTest）
 *   3. 重新加载页面以让所有数据加载
 */

const STORAGE_KEY = 'growthos:storageBackend';

export const STORAGE_BACKEND_KINDS = ['indexeddb', 'localStorage', 'inMemory', 'sqlite'] as const;
export type StorageBackendKind = typeof STORAGE_BACKEND_KINDS[number];

/** 当前 backend 是否支持 capacity 大的场景（影响 UI 警告） */
export function isLargeCapacityBackend(kind: StorageBackendKind): boolean {
  return kind === 'indexeddb' || kind === 'sqlite';
}

/** 当前 backend 是否能跨页面刷新持久化 */
export function isPersistentBackend(kind: StorageBackendKind): boolean {
  return kind === 'indexeddb' || kind === 'localStorage' || kind === 'sqlite';
}

/** 解析为合法值，无效则返回 defaultKind */
function readFromLocalStorage(defaultKind: StorageBackendKind): StorageBackendKind {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (STORAGE_BACKEND_KINDS as readonly string[]).includes(raw)) {
      return raw as StorageBackendKind;
    }
  } catch {
    // 隐私模式 / 无 localStorage 时 getItem 可能抛错
  }
  return defaultKind;
}

/** 写回 LocalStorage，失败时静默（隐私模式） */
function writeToLocalStorage(kind: StorageBackendKind): void {
  try {
    localStorage.setItem(STORAGE_KEY, kind);
  } catch {
    // 忽略
  }
}

/** 清除 LocalStorage 中的配置（重置为默认） */
export function clearStorageBackendConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略
  }
}

export interface StorageBackendConfig {
  /** 获取当前配置的 backend */
  getStorageBackend(): StorageBackendKind,
  /** 切换 backend（持久化到 LocalStorage + 通知订阅者） */
  setStorageBackend(kind: StorageBackendKind): void,
  /** 订阅 backend 变化（service 用此重建单例） */
  subscribe(listener: (kind: StorageBackendKind) => void): () => void,
}

class StorageBackendConfigImpl implements StorageBackendConfig {
  private listeners = new Set<(kind: StorageBackendKind) => void>();
  private currentKind: StorageBackendKind;

  constructor() {
    this.currentKind = readFromLocalStorage('indexeddb');
  }

  getStorageBackend(): StorageBackendKind {
    return this.currentKind;
  }

  setStorageBackend(kind: StorageBackendKind): void {
    if (kind === this.currentKind) return;
    this.currentKind = kind;
    writeToLocalStorage(kind);
    for (const listener of this.listeners) {
      try {
        listener(kind);
      } catch (err) {
        // 监听器错误不能影响其他监听器
        console.error('[StorageBackendConfig] listener error:', err);
      }
    }
  }

  subscribe(listener: (kind: StorageBackendKind) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

/** 单例 */
let _instance: StorageBackendConfig | null = null;
export function getStorageBackendConfig(): StorageBackendConfig {
  if (!_instance) {
    _instance = new StorageBackendConfigImpl();
  }
  return _instance;
}

/** 测试用：重置单例（让 mock 生效） */
export function _resetStorageBackendConfig(): void {
  _instance = null;
}
