/**
 * ⚠️ SECURITY WARNING ⚠️
 * ============================================================
 * 这是一个**纯客户端**的认证实现，仅用于离线 Demo / 本地开发。
 *
 * 关键问题：
 * 1. 用户表 + 密码哈希都存在浏览器 storage 中。XSS、浏览器扩展、
 *    本地文件读取、磁盘镜像都能拿到原始数据。
 * 2. 客户端 PBKDF2 600k 次迭代是"剧场式安全"——攻击者拿到 hash 后
 *    可以离线爆破，浏览器跑得再慢也赶不上一张 GPU 跑 hashcat。
 * 3. Refresh token 也是本地生成的，等于没有 token 体系。
 *
 * 生产环境必须：
 * - 接入真实后端（bcrypt/argon2 服务端）
 * - 客户端只持有 HttpOnly + Secure cookie 或短期 access token
 * - 永远不要把密码哈希发到客户端
 *
 * 本文件保留 register/login 的"外形"是因为 UI 依赖这些 API。
 * ============================================================
 */

import { secureStorage } from '../../utils/secureStorage';
import { STORAGE_KEYS } from '../../constants';
import type { User } from '../../types';
import { tokenManager } from '../../utils/tokenManager';
import { ErrorFactory } from '../api/ApiResponse';

const MIN_PASSWORD_LENGTH = 8;

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const hex = Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

interface StoredUser {
  id: string,
  email: string,
  name?: string,
  passwordHash: string,
  createdAt: string,
}

async function loadUsersFromStorage(): Promise<StoredUser[]> {
  try {
    const data = await secureStorage.getItem<StoredUser[]>(STORAGE_KEYS.USERS);
    return data ?? [];
  } catch (error) {
    throw ErrorFactory.storage(`Failed to load users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function saveUsersToStorage(users: StoredUser[]): Promise<void> {
  try {
    await secureStorage.setItem(STORAGE_KEYS.USERS, users);
  } catch (error) {
    throw ErrorFactory.storage(`Failed to save users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 注意：这是一个**占位**哈希实现，不具备任何安全意义。
 * 仅用于：
 * 1. 满足 UI "有密码" 流程
 * 2. 防止明文 password 直接落盘
 * 真实场景必须替换为后端 bcrypt/argon2。
 */
async function hashPasswordPlaceholder(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function register(
  data: { email: string, password: string, name?: string },
): Promise<{ user: User, token: string, refreshToken?: string }> {
  const { email, password, name } = data;
  const users = await loadUsersFromStorage();

  const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    throw ErrorFactory.conflict('邮箱已被注册', { email });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw ErrorFactory.validation(`密码至少需要 ${MIN_PASSWORD_LENGTH} 个字符`, {
      field: 'password',
      minLength: MIN_PASSWORD_LENGTH,
    });
  }

  // 基础 email 格式校验（生产由后端做更严格校验）
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw ErrorFactory.validation('邮箱格式无效', { field: 'email' });
  }

  const passwordHash = await hashPasswordPlaceholder(password);

  const newUser: StoredUser = {
    id: generateId(),
    email,
    name: name || email.split('@')[0],
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await saveUsersToStorage(users);

  const safeUser: User = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    createdAt: newUser.createdAt,
  };

  // 缓存到 STORAGE_KEYS.USER 用于下次启动恢复登录态
  await secureStorage.setItem(STORAGE_KEYS.USER, safeUser);

  const tokenPair = await tokenManager.generateTokens(safeUser);

  return {
    user: safeUser,
    token: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
  };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: User, token: string, refreshToken?: string }> {
  const users = await loadUsersFromStorage();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    throw ErrorFactory.unauthorized('邮箱或密码错误');
  }

  const passwordHash = await hashPasswordPlaceholder(password);
  if (passwordHash !== user.passwordHash) {
    throw ErrorFactory.unauthorized('邮箱或密码错误');
  }

  const safeUser: User = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };

  await secureStorage.setItem(STORAGE_KEYS.USER, safeUser);

  const tokenPair = await tokenManager.generateTokens(safeUser);

  return {
    user: safeUser,
    token: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
  };
}

export async function logout(): Promise<void> {
  await tokenManager.clearTokens();
  void secureStorage.removeItem(STORAGE_KEYS.USER);
}

export async function getCurrentUserInfo(): Promise<User | null> {
  try {
    return await secureStorage.getItem<User>(STORAGE_KEYS.USER);
  } catch {
    return null;
  }
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
  tokenManager,
};

export default authServiceV2;
