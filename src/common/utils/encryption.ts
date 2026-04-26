// 加密/解密工具
// 使用CryptoJS库实现AES加密

import CryptoJS from 'crypto-js';

class EncryptionUtil {
  private key: CryptoJS.lib.WordArray;
  private iv: CryptoJS.lib.WordArray;

  constructor() {
    // 从环境变量获取密钥和初始化向量
    let encryptionKey = 'GrowthOS-Secure-Key-2024';
    let encryptionIV = 'GrowthOS-IV-2024';
    
    // 使用 process.env 来获取环境变量，这样在测试环境中也能正常工作
    if (typeof process !== 'undefined' && process.env) {
      encryptionKey = process.env.VITE_ENCRYPTION_KEY || encryptionKey;
      encryptionIV = process.env.VITE_ENCRYPTION_IV || encryptionIV;
    }
    
    this.key = CryptoJS.enc.Utf8.parse(encryptionKey);
    this.iv = CryptoJS.enc.Utf8.parse(encryptionIV); // 初始化向量
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
        padding: CryptoJS.pad.Pkcs7
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
        padding: CryptoJS.pad.Pkcs7
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