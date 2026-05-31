import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';
import { STORAGE_KEYS } from '../../constants';
import type { User } from '../../types';
import { tokenManager } from '../../utils/tokenManager';

const _isNative = Capacitor.isNativePlatform();

const PBKDF2_ITERATIONS = 600000;

async function hashPassword(
  password: string, 
  salt?: Uint8Array
): Promise<{ hash: string; salt: string }> {
  const actualSalt = salt || crypto.getRandomValues(new Uint8Array(16));
  const saltBase64 = btoa(String.fromCharCode(...actualSalt));
  
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: actualSalt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const keyBits = await crypto.subtle.exportKey('raw', derivedKey);
  const hashArray = Array.from(new Uint8Array(keyBits));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash, salt: saltBase64 };
}

async function verifyPassword(
  password: string, 
  storedHash: string, 
  storedSalt: string
): Promise<boolean> {
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
): Promise<{ user: User; token: string; refreshToken?: string }> {
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
  
  await secureStorage.setItem(STORAGE_KEYS.USER, userWithoutPassword);
  
  const tokenPair = await tokenManager.generateTokens(userWithoutPassword);
  
  return { 
    user: userWithoutPassword, 
    token: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken
  };
}

export async function login(
  email: string, 
  password: string
): Promise<{ user: User; token: string; refreshToken?: string }> {
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
  
  const tokenPair = await tokenManager.generateTokens(userWithoutPassword);
  
  return { 
    user: userWithoutPassword, 
    token: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken
  };
}

export async function logout(): Promise<void> {
  await tokenManager.clearTokens();
  await secureStorage.removeItem(STORAGE_KEYS.USER);
}

export async function getCurrentUserInfo(): Promise<User | null> {
  const storedUser = await secureStorage.getItem<User>(STORAGE_KEYS.USER);
  return storedUser;
}

export async function refreshAccessToken(): Promise<string | null> {
  return await tokenManager.refreshAccessToken();
}

export function getAccessToken(): string | null {
  return tokenManager.getAccessToken();
}

export function isTokenExpired(): boolean {
  return tokenManager.isTokenExpired();
}

export function isTokenExpiringSoon(): boolean {
  return tokenManager.isTokenExpiringSoon();
}

export function getTokenInfo() {
  return tokenManager.getTokenInfo();
}

const authServiceV2 = {
  register,
  login,
  logout,
  getCurrentUserInfo,
  refreshAccessToken,
  getAccessToken,
  isTokenExpired,
  isTokenExpiringSoon,
  getTokenInfo,
  tokenManager
};

export default authServiceV2;
