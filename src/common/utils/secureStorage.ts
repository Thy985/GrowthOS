import encryptionUtil from './encryption';

class SecureStorage {
  private encryptionEnabled: boolean;

  constructor() {
    this.encryptionEnabled = true;
  }

  // 保存数据（加密）
  setItem(key: string, value: any): boolean {
    try {
      if (this.encryptionEnabled) {
        const encryptedValue = encryptionUtil.encrypt(value);
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
        return decryptedValue !== null ? decryptedValue as T : defaultValue;
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

  // 清空所有数据
  clear(): boolean {
    try {
      localStorage.clear();
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