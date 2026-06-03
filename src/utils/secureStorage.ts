import { secureEncryption, SecureEncryption } from './secureEncryption';

const DEVICE_ID_KEY = '_growthos_device_id';
const SCHEMA_VERSION = 1;

interface Envelope<T> {
  __schema: number,
  v: number,        // 业务版本号（每次写 +1）
  ts: number,       // 最后写入时间戳
  data: T,
}

function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = SecureEncryption.generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function isEnvelope<T>(value: unknown): value is Envelope<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__schema' in value &&
    'v' in value &&
    'ts' in value &&
    'data' in value
  );
}

class SecureStorage {
  private _initialized: boolean = false;
  private _initPromise: Promise<void> | null = null;
  // 简单异步互斥：同一 key 的写操作串行化
  private _writeLocks: Map<string, Promise<unknown>> = new Map();

  async initialize(): Promise<void> {
    if (this._initialized) return;

    if (!this._initPromise) {
      this._initPromise = (async () => {
        const deviceId = getDeviceId();
        await secureEncryption.initialize(deviceId);
        this._initialized = true;
      })();
    }

    return this._initPromise;
  }

  private async _ensureInitialized(): Promise<void> {
    if (!this._initialized) {
      await this.initialize();
    }
  }

  private async _withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this._writeLocks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    this._writeLocks.set(key, prev.then(() => next));
    try {
      await prev;
      return await fn();
    } finally {
      release();
      // 清理：如果还是同一个 promise，清掉
      if (this._writeLocks.get(key) === prev.then(() => next)) {
        this._writeLocks.delete(key);
      }
    }
  }

  /**
   * 带业务版本号的原子读取。
   * 返回 envelope（包含 v/ts/data），写回时必须用同一 v，避免丢失并发更新。
   */
  async readWithVersion<T>(key: string, defaultValue: T): Promise<{ value: T, version: number, timestamp: number }> {
    try {
      await this._ensureInitialized();
      const storedValue = localStorage.getItem(key);
      if (storedValue === null) {
        return { value: defaultValue, version: 0, timestamp: 0 };
      }
      const decrypted = await secureEncryption.decrypt<Envelope<T> | T>(storedValue);
      if (decrypted === null) {
        return { value: defaultValue, version: 0, timestamp: 0 };
      }
      if (isEnvelope<T>(decrypted)) {
        return { value: decrypted.data, version: decrypted.v, timestamp: decrypted.ts };
      }
      // 兼容老数据：无 envelope
      return { value: decrypted as T, version: 1, timestamp: Date.now() };
    } catch (error) {
      console.error('读取数据失败:', error);
      return { value: defaultValue, version: 0, timestamp: 0 };
    }
  }

  /**
   * 带业务版本号的原子写入。
   * expectedVersion: 0 表示新建；其他值必须与当前 version 匹配，否则抛错。
   */
  async writeWithVersion<T>(
    key: string,
    value: T,
    expectedVersion: number,
  ): Promise<{ version: number, timestamp: number }> {
    return this._withLock(key, async () => {
      await this._ensureInitialized();

      // 在锁内重新读取，避免其他写者改了值
      const current = await this.readWithVersion<T>(key, value);
      if (expectedVersion !== 0 && current.version !== expectedVersion) {
        throw new Error(
          `STORAGE_CONFLICT: key="${key}" expected version ${expectedVersion} but got ${current.version}`
        );
      }

      const envelope: Envelope<T> = {
        __schema: SCHEMA_VERSION,
        v: current.version + 1,
        ts: Date.now(),
        data: value,
      };

      const encrypted = await secureEncryption.encrypt(envelope);
      if (encrypted === null) {
        throw new Error('加密失败');
      }
      localStorage.setItem(key, encrypted);
      return { version: envelope.v, timestamp: envelope.ts };
    });
  }

  /**
   * 读改写的原子操作：传入 mutator（接收当前值，返回新值）。
   * 自动处理冲突：失败时重试最多 3 次。
   */
  async updateWithVersion<T>(
    key: string,
    defaultValue: T,
    mutator: (current: T) => T | Promise<T>,
    maxRetries: number = 3,
  ): Promise<{ value: T, version: number, timestamp: number }> {
    let attempt = 0;
    let lastError: unknown;
    while (attempt <= maxRetries) {
      const { value, version } = await this.readWithVersion<T>(key, defaultValue);
      const next: T = await mutator(value);
      try {
        const written = await this.writeWithVersion<T>(key, next, version);
        return { value: next, ...written };
      } catch (err) {
        lastError = err;
        attempt += 1;
        if (attempt > maxRetries) break;
        // 退避（指数 + 抖动）
        await new Promise((r) => setTimeout(r, 10 * 2 ** attempt + Math.random() * 10));
      }
    }
    throw lastError ?? new Error('STORAGE_UPDATE_FAILED');
  }

  async setItem(key: string, value: unknown): Promise<boolean> {
    try {
      await this.writeWithVersion(key, value, 0);
      return true;
    } catch (error) {
      console.error('保存数据失败:', error);
      return false;
    }
  }

  async getItem<T = unknown>(key: string, defaultValue: T | null = null): Promise<T | null> {
    const { value } = await this.readWithVersion<T>(key, (defaultValue ?? null) as T);
    return value;
  }

  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('删除数据失败:', error);
      return false;
    }
  }

  clear(): boolean {
    try {
      localStorage.clear();
      secureEncryption.clearSalt();
      localStorage.removeItem(DEVICE_ID_KEY);
      this._initialized = false;
      return true;
    } catch (error) {
      console.error('清空数据失败:', error);
      return false;
    }
  }
}

export const secureStorage = new SecureStorage();
export default secureStorage;
