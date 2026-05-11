import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';
import { STORAGE_KEYS } from '../../constants';
import type { User } from '../../types';

const isNative = Capacitor.isNativePlatform();

let currentUser: User | null = null;

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface StoredUser {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
  createdAt: string;
}

function loadUsersFromStorage(): StoredUser[] {
  try {
    const data = secureStorage.getItem(STORAGE_KEYS.USERS);
    return data || [];
  } catch {
    return [];
  }
}

function saveUsersToStorage(users: StoredUser[]): void {
  secureStorage.setItem(STORAGE_KEYS.USERS, users);
}

export async function register(email: string, password: string, name?: string): Promise<{ user: User; token: string }> {
  if (isNative) {
    throw new Error('Native SQLite register not implemented yet');
  }
  
  const users = loadUsersFromStorage();
  
  if (users.some(u => u.email === email)) {
    throw new Error('邮箱已被注册');
  }
  
  if (password.length < 6) {
    throw new Error('密码至少需要6个字符');
  }
  
  const passwordHash = await hashPassword(password);
  
  const newUser: StoredUser = {
    id: generateId(),
    email,
    name: name || email.split('@')[0],
    passwordHash,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsersToStorage(users);
  
  const userWithoutPassword: User = { 
    id: newUser.id, 
    email: newUser.email, 
    name: newUser.name,
    createdAt: newUser.createdAt
  };
  
  currentUser = userWithoutPassword;
  secureStorage.setItem(STORAGE_KEYS.USER, userWithoutPassword);
  
  return { user: userWithoutPassword, token: `token-${newUser.id}` };
}

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  if (isNative) {
    throw new Error('Native SQLite login not implemented yet');
  }
  
  const users = loadUsersFromStorage();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    throw new Error('邮箱或密码错误');
  }
  
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error('邮箱或密码错误');
  }
  
  const userWithoutPassword: User = { 
    id: user.id, 
    email: user.email, 
    name: user.name,
    createdAt: user.createdAt
  };
  
  currentUser = userWithoutPassword;
  secureStorage.setItem(STORAGE_KEYS.USER, userWithoutPassword);
  
  return { user: userWithoutPassword, token: `token-${user.id}` };
}

export async function logout(): Promise<void> {
  currentUser = null;
  secureStorage.removeItem(STORAGE_KEYS.USER);
}

export async function getCurrentUserInfo(): Promise<User | null> {
  if (currentUser) {
    return currentUser;
  }
  
  if (isNative) {
    return null;
  }
  
  const storedUser = secureStorage.getItem(STORAGE_KEYS.USER);
  if (storedUser) {
    currentUser = storedUser;
  }
  return currentUser;
}

const authServiceV2 = {
  register,
  login,
  logout,
  getCurrentUserInfo
};

export default authServiceV2;
