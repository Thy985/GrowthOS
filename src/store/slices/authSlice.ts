import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { secureStorage } from '../../utils/secureStorage';
import { AuthState } from '../../types';
import logger from '../../utils/logger';

// 用户类型
interface User {
  id: string;
  username: string;
  password: string;
}

// 初始状态
const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false
};

// 登录的异步thunk
export const login = createAsyncThunk('auth/login', async ({ username, password }: { username: string; password: string }) => {
  try {
    logger.info('用户登录', { username });
    // 简单的登录验证（实际应用中应该调用API）
    const users = secureStorage.getItem('auth-users') || [];
    const user = users.find((u: User) => u.username === username && u.password === password);
    
    if (!user) {
      const error = new Error('用户名或密码错误');
      logger.error('登录失败：用户名或密码错误', { username });
      throw error;
    }
    
    secureStorage.setItem('auth-user', user);
    logger.info('登录成功', { username });
    return user;
  } catch (error) {
    logger.error('登录异常', error, { username });
    throw error;
  }
});

// 注册的异步thunk
export const register = createAsyncThunk('auth/register', async ({ username, password, confirmPassword }: { username: string; password: string; confirmPassword: string }) => {
  try {
    logger.info('用户注册', { username });
    if (password !== confirmPassword) {
      const error = new Error('两次密码输入不一致');
      logger.error('注册失败：两次密码输入不一致', { username });
      throw error;
    }
    
    const users = secureStorage.getItem('auth-users') || [];
    if (users.some((u: User) => u.username === username)) {
      const error = new Error('用户名已存在');
      logger.error('注册失败：用户名已存在', { username });
      throw error;
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      username,
      password
    };
    
    const updatedUsers = [...users, newUser];
    secureStorage.setItem('auth-users', updatedUsers);
    secureStorage.setItem('auth-user', newUser);
    
    logger.info('注册成功', { username });
    return newUser;
  } catch (error) {
    logger.error('注册异常', error, { username });
    throw error;
  }
});

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
    }
  },
  extraReducers: (builder) => {
    builder
      // 登录
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // 注册
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
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
        state.error = action.error.message;
      })
      // 检查认证状态
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<User | null>) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
