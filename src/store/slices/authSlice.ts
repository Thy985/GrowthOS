import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { AuthState } from '../../types';
import authServiceV2 from '../../common/services/authServiceV2';

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
      const response = await authServiceV2.login(credentials);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '登录失败');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: { email: string, password: string, name: string }, { rejectWithValue }) => {
    try {
      const response = await authServiceV2.register(data);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '注册失败');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authServiceV2.logout();
});

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authServiceV2.refreshToken();
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '刷新token失败');
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
    checkAuth: (state) => {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          state.user = JSON.parse(user);
          state.isAuthenticated = true;
        } catch {
          state.user = null;
          state.isAuthenticated = false;
        }
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
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('user');
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.user = action.payload.user;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      });
  },
});

export const { setUser, clearError, checkAuth } = authSlice.actions;

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: { auth: AuthState }) => state.auth);

  return {
    ...auth,
    login: (credentials: { email: string, password: string }) =>
      dispatch(login(credentials)),
    register: (data: { email: string, password: string, name: string }) =>
      dispatch(register(data)),
    logout: () => dispatch(logout()),
    checkAuth: () => dispatch(checkAuth()),
    clearError: () => dispatch(clearError()),
  };
};

export default authSlice.reducer;
