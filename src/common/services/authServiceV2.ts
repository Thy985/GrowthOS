import { Capacitor } from '@capacitor/core';
import bcrypt from 'bcryptjs';
import { secureStorage } from '../../utils/secureStorage';
import { setCurrentUser, clearCurrentUser, getCurrentUser } from './dbService';

interface User {
  id: number;
  email: string;
  name?: string;
}

const isNative = Capacitor.isNativePlatform();

// 在内存中保存当前用户（为了简化）
let currentUser: User | null = null;

// 从 secureStorage 加载用户
function loadUsersFromStorage(): any[] {
  return secureStorage.getItem('auth-users') || [];
}

// 保存用户到 secureStorage
function saveUsersToStorage(users: any[]) {
  secureStorage.setItem('auth-users', users);
}

// 注册
export async function register(email: string, password: string, name?: string): Promise<{ user: User; token: string }> {
  if (isNative) {
    // TODO: 实现原生 SQLite 注册
    throw new Error('Native SQLite register not implemented yet');
  } else {
    // Web 模式
    const users = loadUsersFromStorage();
    
    // 检查邮箱是否已存在
    if (users.some(u => u.email === email)) {
      throw new Error('Email already exists');
    }
    
    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建新用户
    const newUser = {
      id: Date.now(),
      email,
      name: name || email.split('@')[0],
      password: hashedPassword,
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsersToStorage(users);
    
    // 保存当前用户
    const userWithoutPassword = { id: newUser.id, email: newUser.email, name: newUser.name };
    currentUser = userWithoutPassword;
    setCurrentUser(newUser.id);
    secureStorage.setItem('auth-user', userWithoutPassword);
    
    // 返回 token（简化）
    return { user: userWithoutPassword, token: 'jwt-token-simplified' };
  }
}

// 登录
export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  if (isNative) {
    // TODO: 实现原生 SQLite 登录
    throw new Error('Native SQLite login not implemented yet');
  } else {
    // Web 模式
    const users = loadUsersFromStorage();
    
    // 查找用户
    const user = users.find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }
    
    // 保存当前用户
    const userWithoutPassword = { id: user.id, email: user.email, name: user.name };
    currentUser = userWithoutPassword;
    setCurrentUser(user.id);
    secureStorage.setItem('auth-user', userWithoutPassword);
    
    return { user: userWithoutPassword, token: 'jwt-token-simplified' };
  }
}

// 登出
export async function logout(): Promise<void> {
  currentUser = null;
  clearCurrentUser();
  secureStorage.removeItem('auth-user');
}

// 获取当前用户
export async function getCurrentUserInfo(): Promise<User | null> {
  if (isNative) {
    // TODO: 实现原生 SQLite 获取用户
    return currentUser;
  } else {
    // Web 模式
    const storedUser = secureStorage.getItem('auth-user');
    if (storedUser) {
      currentUser = storedUser;
      setCurrentUser(storedUser.id);
    }
    return currentUser;
  }
}

export default {
  register,
  login,
  logout,
  getCurrentUserInfo
};
