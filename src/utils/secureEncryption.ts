/**
 * 使用 Web Crypto API 的安全加密工具
 * 采用 AES-GCM 模式（Galois/Counter Mode）- 带认证标签
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits 推荐用于 GCM
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

export class SecureEncryption {
  private _derivedKey: CryptoKey | null = null;
  private _salt: ArrayBuffer | null = null;

  constructor() {}

  /**
   * 从密码派生加密密钥
   * @param {string} password - 用户密码或设备标识
   * @param {Uint8Array} salt - 盐值
   * @returns {Promise<CryptoKey>}
   */
  async _deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer as unknown as BufferSource,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as unknown as BufferSource,
        iterations: ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 初始化加密器（需要先调用此方法）
   * @param {string} deviceId - 设备唯一标识符
   */
  async initialize(deviceId: string): Promise<void> {
    // 从 localStorage 获取盐值，如果没有则生成
    let saltBase64 = localStorage.getItem('_encryption_salt');
    
    if (!saltBase64) {
      const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
      saltBase64 = this._arrayBufferToBase64(salt);
      localStorage.setItem('_encryption_salt', saltBase64);
    }
    
    this._salt = this._base64ToArrayBuffer(saltBase64);
    this._derivedKey = await this._deriveKey(deviceId, this._salt);
  }

  /**
   * 加密数据
   * @param {any} data - 要加密的数据（会被 JSON 序列化）
   * @returns {string|null} Base64 编码的加密数据（包含 IV）
   */
  async encrypt(data: unknown): Promise<string | null> {
    if (!this._derivedKey) {
      console.error('加密器未初始化，请先调用 initialize()');
      return null;
    }

    try {
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);

      // 生成随机 IV
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

      // 加密
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv: iv },
        this._derivedKey,
        dataBuffer
      );

      // 组合 IV + 密文
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      // 返回 Base64 编码
      return this._arrayBufferToBase64(combined);
    } catch (error) {
      console.error('加密失败:', error);
      return null;
    }
  }

  /**
   * 解密数据
   * @param {string} encryptedBase64 - Base64 编码的加密数据
   * @returns {any|null} 解密后的数据
   */
  async decrypt<T = unknown>(encryptedBase64: string): Promise<T | null> {
    if (!this._derivedKey) {
      console.error('加密器未初始化，请先调用 initialize()');
      return null;
    }

    try {
      const combined = this._base64ToArrayBuffer(encryptedBase64);
      const combinedArray = new Uint8Array(combined);

      // 分离 IV 和密文
      const iv = combinedArray.slice(0, IV_LENGTH);
      const ciphertext = combinedArray.slice(IV_LENGTH);

      // 解密
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: iv },
        this._derivedKey,
        ciphertext
      );

      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedBuffer);
      
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('解密失败:', error);
      return null;
    }
  }

  /**
   * 生成设备唯一标识符
   * @returns {string}
   */
  static generateDeviceId(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown'
    ];
    
    const combined = components.join('|');
    
    // 使用简单的 hash
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `device_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
  }

  /**
   * 辅助方法：将 ArrayBuffer 转为 Base64
   */
  _arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * 辅助方法：将 Base64 转为 ArrayBuffer
   */
  _base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * 清除盐值（登出时调用）
   */
  clearSalt(): void {
    localStorage.removeItem('_encryption_salt');
    this._derivedKey = null;
    this._salt = null;
  }
}

// 导出单例
export const secureEncryption = new SecureEncryption();
export default secureEncryption;
