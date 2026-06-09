import encryptionUtil from './encryption';

class SecureStorage {
  private encryptionEnabled: boolean;

  constructor() {
    this.encryptionEnabled = true;
  }

  // 保存数据（加密）
  setItem(key: string, value: unknown): boolean {
    try {
      if (this.encryptionEnabled) {
        const encryptable: string | object =
          value === null ? 'null' : typeof value === 'object' ? value : String(value);
        const encryptedValue = encryptionUtil.encrypt(encryptable);
        if (encryptedValue !== null) {
          localStorage.setItem(key, encryptedValue);
          return true;
        }
        return false;
      } else {
        // 如果不加密，直接保存JSON字符串
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, stringValue);
        return true;
      }
    } catch (error) {
      console.error('保存数据失败:', error);
      return false;
    }
  }

  // 获取数据（解密）
  getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue === null) {
        return defaultValue;
      }

      if (this.encryptionEnabled) {
        const decryptedValue = encryptionUtil.decrypt(storedValue);
        return decryptedValue !== null ? (decryptedValue as T) : defaultValue;
      } else {
        // 如果不加密，直接解析
        try {
          return JSON.parse(storedValue) as T;
        } catch {
          return storedValue as unknown as T;
        }
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      return defaultValue;
    }
  }

  // 删除数据
  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('删除数据失败:', error);
      return false;
    }
  }

  // 清空所有数据（仅清理本应用使用的 key）
  clear(): boolean {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // 仅清理本应用已知使用的 key 前缀/模式
        if (
          key &&
          (key.startsWith('growth') ||
            key.startsWith('auth') ||
            key.startsWith('theme') ||
            key.startsWith('growthos'))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('清空数据失败:', error);
      return false;
    }
  }

  // 启用/禁用加密
  setEncryptionEnabled(enabled: boolean): void {
    this.encryptionEnabled = enabled;
  }
}

// 导出单例
const secureStorage = new SecureStorage();
export default secureStorage;
export { secureStorage };
