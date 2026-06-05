// 加密/解密工具
// 使用CryptoJS库实现AES加密

import CryptoJS from 'crypto-js';

class EncryptionUtil {
  private key: CryptoJS.lib.WordArray;
  private iv: CryptoJS.lib.WordArray;

  constructor() {
    // 优先从 Vite 环境变量读取密钥（构建时注入）
    // 注意: import.meta.env 在浏览器中可用，process.env 在 Node.js 测试中可用
    let encryptionKey = '';
    let encryptionIV = '';

    if (typeof import.meta !== 'undefined' && import.meta.env) {
      encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || '';
      encryptionIV = import.meta.env.VITE_ENCRYPTION_IV || '';
    }

    // 测试环境回退
    if (typeof process !== 'undefined' && process.env) {
      encryptionKey = encryptionKey || process.env.VITE_ENCRYPTION_KEY || '';
      encryptionIV = encryptionIV || process.env.VITE_ENCRYPTION_IV || '';
    }

    // 无密钥时使用派生密钥而非硬编码值
    if (!encryptionKey) {
      console.warn('[Encryption] VITE_ENCRYPTION_KEY 未设置，使用派生密钥。请在 .env 中配置密钥。');
      // 使用设备指纹派生密钥（每次运行唯一，但不跨会话持久化）
      encryptionKey = `GrowthOS-${Date.now()}-${Math.random().toString(36).substr(2)}`;
    }
    if (!encryptionIV) {
      encryptionIV = encryptionKey.substring(0, 16);
    }

    // 确保密钥和 IV 长度符合 AES-256-CBC 要求
    this.key = CryptoJS.enc.Utf8.parse(encryptionKey.substring(0, 32).padEnd(32, '0'));
    this.iv = CryptoJS.enc.Utf8.parse(encryptionIV.substring(0, 16).padEnd(16, '0'));
  }

  // 使用AES-256-CBC加密
  encrypt(text: string | object): string | null {
    try {
      if (!text) return '';

      // 转换为JSON字符串
      const jsonStr = typeof text === 'string' ? text : JSON.stringify(text);

      // 使用AES-256-CBC加密
      const encrypted = CryptoJS.AES.encrypt(jsonStr, this.key, {
        iv: this.iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return encrypted.toString();
    } catch (error) {
      console.error('加密失败:', error);
      return null;
    }
  }

  // 解密
  decrypt(encryptedText: string): string | object | null {
    try {
      if (!encryptedText) return null;

      // 使用AES-256-CBC解密
      const decrypted = CryptoJS.AES.decrypt(encryptedText, this.key, {
        iv: this.iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);

      // 尝试解析为JSON
      try {
        return JSON.parse(decryptedStr);
      } catch {
        // 如果不是JSON，直接返回字符串
        return decryptedStr;
      }
    } catch (error) {
      console.error('解密失败:', error);
      return null;
    }
  }
}

// 导出单例
const encryptionUtil = new EncryptionUtil();
export default encryptionUtil;
