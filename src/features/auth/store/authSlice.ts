import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import type { AuthState } from '../../../shared/types';
import logger from '../../../shared/utils/logger';
import { secureStorage } from '../../../shared/utils/secureStorage';
import { generateId } from '../../../shared/utils/idGenerator';

// 用户类型（不再存储密码明文）
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
}

// 使用 Web Crypto API 进行密码哈希（SHA-256）
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// 初始状态
const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// 登录的异步thunk
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }) => {
    try {
      logger.info('用户登录', { username });
      const passwordHash = await hashPassword(password);
      const users = (secureStorage.getItem<User[]>('auth-users') || []) as User[];
      const user = users.find(
        (u: User) => u.username === username && u.passwordHash === passwordHash,
      );

      if (!user) {
        const error = new Error('用户名或密码错误');
        logger.error('登录失败：用户名或密码错误', { username });
        throw error;
      }

      // 返回用户信息时不包含密码哈希
      const { passwordHash: _, ...userWithoutPassword } = user;
      secureStorage.setItem('auth-user', userWithoutPassword);
      logger.info('登录成功', { username });
      return userWithoutPassword;
    } catch (error) {
      logger.error('登录异常', error, { username });
      throw error;
    }
  },
);

// 注册的异步thunk
export const register = createAsyncThunk(
  'auth/register',
  async ({
    username,
    password,
    confirmPassword,
  }: {
    username: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      logger.info('用户注册', { username });
      if (password !== confirmPassword) {
        const error = new Error('两次密码输入不一致');
        logger.error('注册失败：两次密码输入不一致', { username });
        throw error;
      }

      // 密码强度验证
      if (password.length < 6) {
        const error = new Error('密码长度至少为 6 个字符');
        logger.error('注册失败：密码过短', { username });
        throw error;
      }

      const users = (secureStorage.getItem<User[]>('auth-users') || []) as User[];
      if (users.some((u: User) => u.username === username)) {
        const error = new Error('用户名已存在');
        logger.error('注册失败：用户名已存在', { username });
        throw error;
      }

      const newUser: User = {
        id: generateId(),
        username,
        email: `${username}@example.com`,
        passwordHash: await hashPassword(password),
      };

      const updatedUsers = [...users, newUser];
      secureStorage.setItem('auth-users', updatedUsers);

      // 存储的用户不包含密码哈希
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      secureStorage.setItem('auth-user', userWithoutPassword);

      logger.info('注册成功', { username });
      return userWithoutPassword;
    } catch (error) {
      logger.error('注册异常', error, { username });
      throw error;
    }
  },
);

// 登出
export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    logger.info('用户登出');
    secureStorage.removeItem('auth-user');
    logger.info('登出成功');
    return true;
  } catch (error) {
    logger.error('登出异常', error);
    throw error;
  }
});

// 检查认证状态
export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
  try {
    logger.info('检查认证状态');
    const user = secureStorage.getItem('auth-user');
    logger.info('认证状态检查完成', { isAuthenticated: !!user });
    return user;
  } catch (error) {
    logger.error('认证状态检查异常', error);
    throw error;
  }
});

// 创建auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 登录
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? '登录失败';
      })
      // 注册
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? '注册失败';
      })
      // 登出
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? '登出失败';
      })
      // 检查认证状态
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        const user = action.payload as User | null;
        state.user = user;
        state.isAuthenticated = !!user;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? '认证检查失败';
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
