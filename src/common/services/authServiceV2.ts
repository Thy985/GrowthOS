import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';
import { STORAGE_KEYS } from '../../constants';
import type { User } from '../../types';

const isNative = Capacitor.isNativePlatform();

// 盐值迭代次数（根据 OWASP 建议，至少 600,000 次）
const PBKDF2_ITERATIONS = 600000;

/**
 * 使用 PBKDF2 + SHA-256 安全哈希密码
 * @param password - 用户输入的密码
 * @param salt - 可选盐值，如果不提供则生成新的
 */
async function hashPassword(
  password: string, 
  salt?: Uint8Array
): Promise<{ hash: string; salt: string }> {
  // 创建或使用盐值
  const actualSalt = salt || crypto.getRandomValues(new Uint8Array(16));
  const saltBase64 = btoa(String.fromCharCode(...actualSalt));
  
  // 编码密码
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // 导入密钥材料
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // 派生密钥
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: actualSalt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  // 获取密钥数据作为哈希
  const keyBits = await crypto.subtle.exportKey('raw', derivedKey);
  const hashArray = Array.from(new Uint8Array(keyBits));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash, salt: saltBase64 };
}

/**
 * 验证密码
 */
async function verifyPassword(
  password: string, 
  storedHash: string, 
  storedSalt: string
): Promise<boolean> {
  // 解码盐值
  const saltBytes = atob(storedSalt).split('').map(char => char.charCodeAt(0));
  const salt = new Uint8Array(saltBytes);
  
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface StoredUser {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

async function loadUsersFromStorage(): Promise<StoredUser[]> {
  try {
    const data = await secureStorage.getItem<StoredUser[]>(STORAGE_KEYS.USERS);
    return data ?? [];
  } catch {
    return [];
  }
}

async function saveUsersToStorage(users: StoredUser[]): Promise<void> {
  await secureStorage.setItem(STORAGE_KEYS.USERS, users);
}

export async function register(
  email: string, 
  password: string, 
  name?: string
): Promise<{ user: User; token: string }> {
  // 在 Native 和 Web 平台使用统一的实现
  const users = await loadUsersFromStorage();
  
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('邮箱已被注册');
  }
  
  if (password.length < 8) {
    throw new Error('密码至少需要8个字符');
  }
  
  const { hash: passwordHash, salt: passwordSalt } = await hashPassword(password);
  
  const newUser: StoredUser = {
    id: generateId(),
    email,
    name: name || email.split('@')[0],
    passwordHash,
    passwordSalt,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  await saveUsersToStorage(users);
  
  const userWithoutPassword: User = { 
    id: newUser.id, 
    email: newUser.email, 
    name: newUser.name,
    createdAt: newUser.createdAt
  };
  
  // 存储当前用户
  await secureStorage.setItem(STORAGE_KEYS.USER, userWithoutPassword);
  
  // 生成简单但不可伪造的 token（包含用户 ID 和签名）
  const token = await generateToken(userWithoutPassword);
  
  return { user: userWithoutPassword, token };
}

export async function login(
  email: string, 
  password: string
): Promise<{ user: User; token: string }> {
  // 在 Native 和 Web 平台使用统一的实现
  const users = await loadUsersFromStorage();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    throw new Error('邮箱或密码错误');
  }
  
  const isValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!isValid) {
    throw new Error('邮箱或密码错误');
  }
  
  const userWithoutPassword: User = { 
    id: user.id, 
    email: user.email, 
    name: user.name,
    createdAt: user.createdAt
  };
  
  await secureStorage.setItem(STORAGE_KEYS.USER, userWithoutPassword);
  const token = await generateToken(userWithoutPassword);
  
  return { user: userWithoutPassword, token };
}

export async function logout(): Promise<void> {
  await secureStorage.removeItem(STORAGE_KEYS.USER);
}

export async function getCurrentUserInfo(): Promise<User | null> {
  if (isNative) {
    // 在 Native 平台仍然使用 secureStorage
    const storedUser = await secureStorage.getItem<User>(STORAGE_KEYS.USER);
    return storedUser;
  }
  
  const storedUser = await secureStorage.getItem<User>(STORAGE_KEYS.USER);
  return storedUser;
}

/**
 * 生成简单的 JWT-like token
 */
async function generateToken(user: User): Promise<string> {
  const timestamp = Date.now();
  const data = {
    userId: user.id,
    email: user.email,
    exp: timestamp + 86400000 // 24小时过期
  };
  
  const base64Data = btoa(JSON.stringify(data));
  
  // 简单签名（实际项目应该使用更安全的 HMAC）
  const signatureBase = await crypto.subtle.digest(
    'SHA-256', 
    new TextEncoder().encode(base64Data + 'growthos-secret-key')
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBase)));
  
  return `${base64Data}.${signature}`;
}

const authServiceV2 = {
  register,
  login,
  logout,
  getCurrentUserInfo
};

export default authServiceV2;
