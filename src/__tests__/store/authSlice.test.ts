import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import authReducer, {
  login,
  register,
  logout,
  checkAuth,
  clearError,
} from '../../features/auth/store/authSlice.ts';
import { secureStorage } from '../../shared/utils/secureStorage.ts';

function makeStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

describe('authSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initial state is empty', () => {
    const store = makeStore();
    expect(store.getState().auth).toEqual({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
    });
  });

  it('clearError clears error', () => {
    const store = makeStore();
    store.dispatch(clearError());
    expect(store.getState().auth.error).toBeNull();
  });

  describe('register', () => {
    it('creates new user and authenticates', async () => {
      const store = makeStore();
      const result = await store.dispatch(
        register({ username: 'alice', password: 'pw', confirmPassword: 'pw' }),
      );
      expect(result.type).toBe('auth/register/fulfilled');
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.username).toBe('alice');
      expect(state.user?.email).toBe('alice@example.com');
    });

    it('rejects when password mismatch', async () => {
      const store = makeStore();
      const result = await store.dispatch(
        register({ username: 'bob', password: 'pw1', confirmPassword: 'pw2' }),
      );
      expect(result.type).toBe('auth/register/rejected');
      expect(store.getState().auth.error).toBe('两次密码输入不一致');
      expect(store.getState().auth.isAuthenticated).toBe(false);
    });

    it('rejects when username exists', async () => {
      const store = makeStore();
      await store.dispatch(register({ username: 'alice', password: 'pw', confirmPassword: 'pw' }));
      const result = await store.dispatch(
        register({ username: 'alice', password: 'pw', confirmPassword: 'pw' }),
      );
      expect(result.type).toBe('auth/register/rejected');
      expect(store.getState().auth.error).toBe('用户名已存在');
    });
  });

  describe('login', () => {
    it('authenticates existing user', async () => {
      const store = makeStore();
      await store.dispatch(register({ username: 'alice', password: 'pw', confirmPassword: 'pw' }));
      // 清空 store + 重新构造(因为 register 后 state 已 authenticated)
      localStorage.clear();
      const newStore = makeStore();
      // 重新把用户塞进 secureStorage
      secureStorage.setItem('auth-users', [
        { id: '1', username: 'alice', email: 'a@e.com', password: 'pw' },
      ]);
      const result = await newStore.dispatch(login({ username: 'alice', password: 'pw' }));
      expect(result.type).toBe('auth/login/fulfilled');
      expect(newStore.getState().auth.isAuthenticated).toBe(true);
    });

    it('rejects with invalid credentials', async () => {
      const store = makeStore();
      const result = await store.dispatch(login({ username: 'nobody', password: 'wrong' }));
      expect(result.type).toBe('auth/login/rejected');
      expect(store.getState().auth.error).toBe('用户名或密码错误');
      expect(store.getState().auth.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears user and isAuthenticated', async () => {
      const store = makeStore();
      await store.dispatch(register({ username: 'alice', password: 'pw', confirmPassword: 'pw' }));
      expect(store.getState().auth.isAuthenticated).toBe(true);
      const result = await store.dispatch(logout());
      expect(result.type).toBe('auth/logout/fulfilled');
      expect(store.getState().auth.isAuthenticated).toBe(false);
      expect(store.getState().auth.user).toBeNull();
    });
  });

  describe('checkAuth', () => {
    it('sets authenticated when auth-user exists in storage', async () => {
      const user = { id: '1', username: 'alice', email: 'a@e.com' };
      secureStorage.setItem('auth-user', user);
      const store = makeStore();
      await store.dispatch(checkAuth());
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.username).toBe('alice');
    });

    it('sets not authenticated when auth-user missing', async () => {
      const store = makeStore();
      await store.dispatch(checkAuth());
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('rejected sets error', async () => {
      const store = makeStore();
      vi.spyOn(secureStorage, 'getItem').mockImplementationOnce(() => {
        throw new Error('storage fail');
      });
      await store.dispatch(checkAuth());
      const state = store.getState().auth;
      expect(state.error).toBeDefined();
    });
  });
});
