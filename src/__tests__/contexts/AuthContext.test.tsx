import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AuthProvider, useAuth } from '../../features/auth/contexts/AuthContext.tsx';
import { secureStorage } from '../../shared/utils/secureStorage.ts';

const Probe = () => {
  const { user, isLoading, error, login, register, logout, hasPermission } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.username : 'none'}</span>
      <span data-testid="role">{user ? (user.role ?? 'norole') : 'norole'}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="error">{error ?? 'noerror'}</span>
      <button onClick={() => login('alice', 'pw')}>loginAlice</button>
      <button onClick={() => login('admin', 'pw')}>loginAdmin</button>
      <button onClick={() => login('', '')}>loginEmpty</button>
      <button onClick={() => register('bob', 'pw')}>regBob</button>
      <button onClick={() => register('', '')}>regEmpty</button>
      <button onClick={logout}>logout</button>
      <span data-testid="adminPerm">{String(hasPermission('admin'))}</span>
      <span data-testid="userPerm">{String(hasPermission('user'))}</span>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    secureStorage.removeItem('growthos-user');
  });

  it('useAuth throws when used outside provider', () => {
    const ProbeOutside = () => {
      useAuth();
      return null;
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<ProbeOutside />)).toThrow(/AuthProvider/);
    spy.mockRestore();
  });

  it('initial state has no user, isLoading flips to false', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    // useEffect 完成后 isLoading 变 false
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('loads existing user from secureStorage on mount', async () => {
    secureStorage.setItem('growthos-user', {
      id: 1,
      username: 'prev',
      token: 't',
      role: 'admin',
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('user').textContent).toBe('prev');
    expect(screen.getByTestId('role').textContent).toBe('admin');
  });

  it('handles error from secureStorage gracefully', async () => {
    const spy = vi.spyOn(secureStorage, 'getItem').mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('error').textContent).toBe('加载用户信息失败');
    spy.mockRestore();
    errSpy.mockRestore();
  });

  it('login with valid credentials sets user, assigns admin role for admin username', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      fireEvent.click(screen.getByText('loginAdmin'));
    });
    expect(screen.getByTestId('user').textContent).toBe('admin');
    expect(screen.getByTestId('role').textContent).toBe('admin');
    expect(screen.getByTestId('adminPerm').textContent).toBe('true');
    expect(screen.getByTestId('userPerm').textContent).toBe('true');
  });

  it('login with non-admin username assigns user role', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      fireEvent.click(screen.getByText('loginAlice'));
    });
    expect(screen.getByTestId('role').textContent).toBe('user');
    expect(screen.getByTestId('adminPerm').textContent).toBe('false');
    expect(screen.getByTestId('userPerm').textContent).toBe('true');
  });

  it('login with empty credentials returns false', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      fireEvent.click(screen.getByText('loginEmpty'));
    });
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('register with valid credentials sets user as user role', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      fireEvent.click(screen.getByText('regBob'));
    });
    expect(screen.getByTestId('user').textContent).toBe('bob');
    expect(screen.getByTestId('role').textContent).toBe('user');
  });

  it('register with empty credentials returns false', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      fireEvent.click(screen.getByText('regEmpty'));
    });
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('logout clears user and removes from storage', async () => {
    secureStorage.setItem('growthos-user', { id: 1, username: 'x', token: 't' });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('user').textContent).toBe('x');
    act(() => {
      fireEvent.click(screen.getByText('logout'));
    });
    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(secureStorage.getItem('growthos-user')).toBeNull();
  });

  it('hasPermission returns false when no user', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('adminPerm').textContent).toBe('false');
    expect(screen.getByTestId('userPerm').textContent).toBe('false');
  });
});
