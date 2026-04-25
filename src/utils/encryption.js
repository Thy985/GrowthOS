// 简单的加密/解密工具
// 注意：这只是一个基础的加密实现，生产环境建议使用更强大的加密库

class EncryptionUtil {
  constructor() {
    // 使用固定的密钥（实际应用中应该从安全的地方获取）
    this.key = 'GrowthOS-Secure-Key-2024';
  }

  // 简单的XOR加密
  encrypt(text) {
    try {
      if (!text) return '';
      
      // 转换为JSON字符串
      const jsonStr = typeof text === 'string' ? text : JSON.stringify(text);
      
      // 简单的加密实现
      let encrypted = '';
      for (let i = 0; i < jsonStr.length; i++) {
        const charCode = jsonStr.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length);
        encrypted += String.fromCharCode(charCode);
      }
      
      // Base64编码
      return btoa(encodeURIComponent(encrypted));
    } catch (error) {
      console.error('加密失败:', error);
      return null;
    }
  }

  // 解密
  decrypt(encryptedText) {
    try {
      if (!encryptedText) return null;
      
      // Base64解码
      const decoded = decodeURIComponent(atob(encryptedText));
      
      // 解密
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length);
        decrypted += String.fromCharCode(charCode);
      }
      
      // 尝试解析为JSON
      try {
        return JSON.parse(decrypted);
      } catch {
        // 如果不是JSON，直接返回字符串
        return decrypted;
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
