import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authServiceV2 from '../../common/services/authServiceV2';
import { AuthState } from '../../types';
import logger from '../../utils/logger';

// 用户类型
interface User {
  id: number;
  username: string;
  email: string;
}

// 初始状态
const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false
};

// 登录的异步thunk
export const login = createAsyncThunk('auth/login', async ({ email, password }: { email: string; password: string }) => {
  try {
    logger.info('用户登录', { email });
    const { user } = await authServiceV2.login(email, password);
    const userData = {
      id: user.id,
      username: user.name || user.email,
      email: user.email
    };
    logger.info('登录成功', { email });
    return userData;
  } catch (error: any) {
    logger.error('登录异常', error, { email });
    throw error;
  }
});

// 注册的异步thunk
export const register = createAsyncThunk('auth/register', async ({ name, email, password }: { name: string; email: string; password: string }) => {
  try {
    logger.info('用户注册', { email });
    const { user } = await authServiceV2.register(email, password, name);
    const userData = {
      id: user.id,
      username: user.name || user.email,
      email: user.email
    };
    logger.info('注册成功', { email });
    return userData;
  } catch (error: any) {
    logger.error('注册异常', error, { email });
    throw error;
  }
});

// 登出
export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    logger.info('用户登出');
    await authServiceV2.logout();
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
    const user = await authServiceV2.getCurrentUserInfo();
    if (user) {
      const userData = {
        id: user.id,
        username: user.name || user.email,
        email: user.email
      };
      logger.info('认证状态检查完成', { isAuthenticated: true, email: user.email });
      return userData;
    }
    logger.info('认证状态检查完成', { isAuthenticated: false });
    return null;
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
