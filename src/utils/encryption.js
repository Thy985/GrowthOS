// 加密/解密工具
// 使用CryptoJS库实现AES加密

import CryptoJS from 'crypto-js';

class EncryptionUtil {
  constructor() {
    // 使用固定的密钥（实际应用中应该从环境变量或安全的地方获取）
    this.key = CryptoJS.enc.Utf8.parse('GrowthOS-Secure-Key-2024');
    this.iv = CryptoJS.enc.Utf8.parse('GrowthOS-IV-2024'); // 初始化向量
  }

  // 使用AES-256-CBC加密
  encrypt(text) {
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
  decrypt(encryptedText) {
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
