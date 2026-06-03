/**
 * storageConfig 单测
 *
 * 覆盖：
 * - 默认值是 indexeddb
 * - setStorageBackend 持久化到 LocalStorage
 * - subscribe 监听变化
 * - clearStorageBackendConfig 重置
 * - 隐私模式（localStorage 抛错）下不崩
 */

import {
  getStorageBackendConfig,
  clearStorageBackendConfig,
  _resetStorageBackendConfig,
  STORAGE_BACKEND_KINDS,
  isLargeCapacityBackend,
  isPersistentBackend,
  type StorageBackendKind,
} from '../../config/storageConfig';

describe('StorageBackendConfig', () => {
  beforeEach(() => {
    localStorage.clear();
    _resetStorageBackendConfig();
  });

  it('default is indexeddb', () => {
    const cfg = getStorageBackendConfig();
    expect(cfg.getStorageBackend()).toBe('indexeddb');
  });

  it('setStorageBackend persists to localStorage', () => {
    const cfg = getStorageBackendConfig();
    cfg.setStorageBackend('localStorage');
    expect(cfg.getStorageBackend()).toBe('localStorage');
    expect(localStorage.getItem('growthos:storageBackend')).toBe('localStorage');
  });

  it('setStorageBackend reads from localStorage on init', () => {
    localStorage.setItem('growthos:storageBackend', 'inMemory');
    _resetStorageBackendConfig();
    const cfg = getStorageBackendConfig();
    expect(cfg.getStorageBackend()).toBe('inMemory');
  });

  it('ignores invalid localStorage value', () => {
    localStorage.setItem('growthos:storageBackend', 'invalid-kind');
    _resetStorageBackendConfig();
    const cfg = getStorageBackendConfig();
    expect(cfg.getStorageBackend()).toBe('indexeddb');
  });

  it('notifies subscribers on change', () => {
    const cfg = getStorageBackendConfig();
    const listener = jest.fn();
    const unsubscribe = cfg.subscribe(listener);

    cfg.setStorageBackend('localStorage');
    expect(listener).toHaveBeenCalledWith('localStorage');

    unsubscribe();
    cfg.setStorageBackend('inMemory');
    // unsubscribe 后不再被调用
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not notify when setting same value', () => {
    const cfg = getStorageBackendConfig();
    const listener = jest.fn();
    cfg.subscribe(listener);

    cfg.setStorageBackend('indexeddb'); // 已是默认
    expect(listener).not.toHaveBeenCalled();
  });

  it('subscriber errors do not block other subscribers', () => {
    const cfg = getStorageBackendConfig();
    const goodListener = jest.fn();
    cfg.subscribe(() => { throw new Error('boom'); });
    cfg.subscribe(goodListener);

    // 不应抛错
    expect(() => cfg.setStorageBackend('localStorage')).not.toThrow();
    expect(goodListener).toHaveBeenCalledWith('localStorage');
  });

  it('clearStorageBackendConfig removes localStorage entry', () => {
    localStorage.setItem('growthos:storageBackend', 'inMemory');
    clearStorageBackendConfig();
    expect(localStorage.getItem('growthos:storageBackend')).toBeNull();
  });
});

describe('helpers', () => {
  it('isLargeCapacityBackend', () => {
    expect(isLargeCapacityBackend('indexeddb')).toBe(true);
    expect(isLargeCapacityBackend('localStorage')).toBe(false);
    expect(isLargeCapacityBackend('inMemory')).toBe(false);
  });

  it('isPersistentBackend', () => {
    expect(isPersistentBackend('indexeddb')).toBe(true);
    expect(isPersistentBackend('localStorage')).toBe(true);
    expect(isPersistentBackend('inMemory')).toBe(false);
  });

  it('STORAGE_BACKEND_KINDS contains all three kinds', () => {
    expect(STORAGE_BACKEND_KINDS).toEqual(['indexeddb', 'localStorage', 'inMemory']);
  });
});

describe('privacy mode tolerance', () => {
  it('survives localStorage throwing on getItem', () => {
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = jest.fn(() => {
      throw new Error('SecurityError');
    });

    _resetStorageBackendConfig();
    expect(() => getStorageBackendConfig()).not.toThrow();
    expect(getStorageBackendConfig().getStorageBackend()).toBe('indexeddb');

    Storage.prototype.getItem = originalGetItem;
  });

  it('survives localStorage throwing on setItem', () => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = jest.fn(() => {
      throw new Error('QuotaExceededError');
    });

    const cfg = getStorageBackendConfig();
    expect(() => cfg.setStorageBackend('inMemory')).not.toThrow();
    // 内存中的值还是变了
    expect(cfg.getStorageBackend()).toBe('inMemory');

    Storage.prototype.setItem = originalSetItem;
  });
});

describe('regression: each kind round-trips', () => {
  it.each<StorageBackendKind>(['indexeddb', 'localStorage', 'inMemory'])(
    'kind %s can be set and read back',
    (kind) => {
      _resetStorageBackendConfig();
      const cfg = getStorageBackendConfig();
      cfg.setStorageBackend(kind);
      expect(cfg.getStorageBackend()).toBe(kind);
    },
  );
});
