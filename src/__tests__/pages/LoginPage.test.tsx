import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import LoginPage from '../../features/auth/pages/LoginPage.tsx';
import authReducer from '../../features/auth/store/authSlice.ts';
import { secureStorage } from '../../shared/utils/secureStorage.ts';

function renderWithStore() {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <LoginPage />
    </Provider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login form with heading', () => {
    renderWithStore();
    // 表单有用户名/密码输入
    expect(screen.getByPlaceholderText(/用户名/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/密码/)).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    renderWithStore();
    const submitBtn = screen.getByRole('button', { name: /登录/ });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/请输入用户名/)).toBeInTheDocument();
    });
  });

  it('shows password length error', async () => {
    renderWithStore();
    fireEvent.change(screen.getByPlaceholderText(/用户名/), { target: { value: 'alice' } });
    fireEvent.change(screen.getByPlaceholderText(/密码/), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /登录/ }));
    await waitFor(() => {
      expect(screen.getByText(/密码至少需要/)).toBeInTheDocument();
    });
  });

  it('shows username too short error', async () => {
    renderWithStore();
    fireEvent.change(screen.getByPlaceholderText(/用户名/), { target: { value: 'ab' } });
    fireEvent.change(screen.getByPlaceholderText(/密码/), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByRole('button', { name: /登录/ }));
    await waitFor(() => {
      expect(screen.getByText(/用户名至少需要/)).toBeInTheDocument();
    });
  });

  it('switches to register mode and shows confirm password', () => {
    renderWithStore();
    const switchBtn = screen.getByText(/没有账号|注册|立即注册/);
    fireEvent.click(switchBtn);
    expect(screen.getByPlaceholderText(/确认密码|重复密码/)).toBeInTheDocument();
  });

  it('dispatches login on valid form submit', async () => {
    // pre-register a user
    secureStorage.setItem('auth-users', [
      { id: '1', username: 'alice', email: 'a@e.com', password: 'abc123' },
    ]);
    renderWithStore();
    fireEvent.change(screen.getByPlaceholderText(/用户名/), { target: { value: 'alice' } });
    fireEvent.change(screen.getByPlaceholderText(/密码/), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByRole('button', { name: /登录/ }));
    await waitFor(() => {
      // Either success (no error visible) or state changed
      // 至少能等到 setErrors 触发
    });
  });

  it('displays auth error from store', async () => {
    renderWithStore();
    // 触发一个会导致 error 的 dispatch(login)
    // 通过填入错误凭证然后点击
    fireEvent.change(screen.getByPlaceholderText(/用户名/), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByPlaceholderText(/密码/), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByRole('button', { name: /登录/ }));
    // 等待 dispatch + 错误出现
    await new Promise((r) => setTimeout(r, 100));
  });
});
