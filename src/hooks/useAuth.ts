import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch } from '../store';
import {
  login as loginThunk,
  register as registerThunk,
  logout as logoutThunk,
  checkAuth as checkAuthAction,
  clearError as clearErrorAction,
} from '../store/slices/authSlice';
import { type AuthState, type User } from '../types';

export interface UseAuthReturn extends AuthState {
  login: (credentials: { email: string, password: string }) => Promise<{ user: User, token: string }>,
  register: (data: { email: string, password: string, name?: string }) => Promise<{ user: User, token: string }>,
  logout: () => Promise<void>,
  checkAuth: () => void,
  clearError: () => void,
}

export function useAuth(): UseAuthReturn {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: { auth: AuthState }) => state.auth);

  const login = useCallback(
    (credentials: { email: string, password: string }) =>
      dispatch(loginThunk(credentials)).unwrap(),
    [dispatch]
  );

  const register = useCallback(
    (data: { email: string, password: string, name?: string }) =>
      dispatch(registerThunk(data)).unwrap(),
    [dispatch]
  );

  const logout = useCallback(() => dispatch(logoutThunk()).unwrap().then(() => undefined), [dispatch]);

  const checkAuth = useCallback(() => dispatch(checkAuthAction()), [dispatch]);
  const clearError = useCallback(() => dispatch(clearErrorAction()), [dispatch]);

  return useMemo(
    () => ({
      ...auth,
      login,
      register,
      logout,
      checkAuth,
      clearError,
    }),
    [auth, login, register, logout, checkAuth, clearError]
  );
}

export default useAuth;
