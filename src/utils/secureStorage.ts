import { secureEncryption, SecureEncryption } from './secureEncryption';

const DEVICE_ID_KEY = '_growthos_device_id';

function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = SecureEncryption.generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

class SecureStorage {
  private _initialized: boolean = false;
  private _initPromise: Promise<void> | null = null;

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

  async setItem(key: string, value: unknown): Promise<boolean> {
    try {
      await this._ensureInitialized();
      
      const encrypted = await secureEncryption.encrypt(value);
      if (encrypted !== null) {
        localStorage.setItem(key, encrypted);
        return true;
      }
      return false;
    } catch (error) {
      console.error('保存数据失败:', error);
      return false;
    }
  }

  async getItem<T = unknown>(key: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      await this._ensureInitialized();
      
      const storedValue = localStorage.getItem(key);
      if (storedValue === null) {
        return defaultValue;
      }

      const decrypted = await secureEncryption.decrypt<T>(storedValue);
      return decrypted !== null ? decrypted : defaultValue;
    } catch (error) {
      console.error('获取数据失败:', error);
      return defaultValue;
    }
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
