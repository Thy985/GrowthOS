import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('themeSlice', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  async function loadSlice() {
    const mod = await import('../../features/theme/store/themeSlice.ts');
    return mod.default;
  }

  it('initial state defaults to light mode when localStorage empty', async () => {
    const reducer = await loadSlice();
    const store = configureStore({ reducer: { theme: reducer } });
    expect(store.getState().theme.isDarkMode).toBe(false);
  });

  it('initial state reads dark from localStorage when set', async () => {
    localStorage.setItem('growthos-theme', 'dark');
    const reducer = await loadSlice();
    const store = configureStore({ reducer: { theme: reducer } });
    expect(store.getState().theme.isDarkMode).toBe(true);
  });

  it('initial state reads light from localStorage when set', async () => {
    localStorage.setItem('growthos-theme', 'light');
    const reducer = await loadSlice();
    const store = configureStore({ reducer: { theme: reducer } });
    expect(store.getState().theme.isDarkMode).toBe(false);
  });

  it('initial state returns false when localStorage throws', async () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error('storage error');
    };
    try {
      const reducer = await loadSlice();
      const store = configureStore({ reducer: { theme: reducer } });
      expect(store.getState().theme.isDarkMode).toBe(false);
    } finally {
      Storage.prototype.getItem = original;
    }
  });

  it('toggleTheme flips isDarkMode and persists to localStorage', async () => {
    const reducer = await loadSlice();
    const { toggleTheme } = await import('../../features/theme/store/themeSlice.ts');
    const store = configureStore({ reducer: { theme: reducer } });
    expect(store.getState().theme.isDarkMode).toBe(false);
    store.dispatch(toggleTheme());
    expect(store.getState().theme.isDarkMode).toBe(true);
    expect(localStorage.getItem('growthos-theme')).toBe('dark');
    store.dispatch(toggleTheme());
    expect(store.getState().theme.isDarkMode).toBe(false);
    expect(localStorage.getItem('growthos-theme')).toBe('light');
  });

  it('setTheme explicitly sets isDarkMode and persists', async () => {
    const reducer = await loadSlice();
    const { setTheme } = await import('../../features/theme/store/themeSlice.ts');
    const store = configureStore({ reducer: { theme: reducer } });
    store.dispatch(setTheme(true));
    expect(store.getState().theme.isDarkMode).toBe(true);
    expect(localStorage.getItem('growthos-theme')).toBe('dark');
    store.dispatch(setTheme(false));
    expect(store.getState().theme.isDarkMode).toBe(false);
    expect(localStorage.getItem('growthos-theme')).toBe('light');
  });
});
