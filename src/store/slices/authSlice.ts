import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { type AuthState } from '../../types';
import authServiceV2 from '../../common/services/authServiceV2';
import { STORAGE_KEYS } from '../../constants';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string, password: string }, { rejectWithValue }) => {
    try {
      const response = await authServiceV2.login(credentials.email, credentials.password);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败';
      return rejectWithValue(message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: { email: string, password: string, name?: string }, { rejectWithValue }) => {
    try {
      const response = await authServiceV2.register(data);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败';
      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_: void, { rejectWithValue }) => {
    try {
      await authServiceV2.logout();
    } catch (error) {
      const message = error instanceof Error ? error.message : '登出失败';
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    // 同步 action：从 localStorage 恢复登录态
    checkAuth: (state) => {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      if (!raw) return;
      try {
        const cached: unknown = JSON.parse(raw);
        // 兼容两种数据形状：
        // 1. { user: {...}, token: ... } （authServiceV2.setItem 时包装的）
        // 2. {...} （裸 user 对象）
        let user: AuthState['user'] = null;
        if (cached && typeof cached === 'object') {
          const obj = cached as Record<string, unknown>;
          if ('user' in obj && obj.user) {
            user = obj.user as AuthState['user'];
          } else if ('id' in obj && 'email' in obj) {
            user = obj as unknown as AuthState['user'];
          }
        }
        if (user) {
          state.user = user;
          state.isAuthenticated = true;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? action.error.message ?? '登录失败';
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? action.error.message ?? '注册失败';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        // 即便后端清 token 失败，本地态也要清掉
        state.user = null;
        state.isAuthenticated = false;
        state.error = (action.payload as string) ?? action.error.message ?? '登出失败';
      });
  },
});

export const { setUser, clearError, checkAuth } = authSlice.actions;
export default authSlice.reducer;
