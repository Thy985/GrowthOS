import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ThemeProvider, useTheme } from '../../features/theme/contexts/ThemeContext.tsx';

const Probe = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="dark">{String(isDarkMode)}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
};

// jsdom 没有 matchMedia,默认 mock 成"非深色"
const installMatchMedia = (matches: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? matches : false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    installMatchMedia(false);
  });

  it('useTheme throws when used outside provider', () => {
    const ProbeOutside = () => {
      useTheme();
      return null;
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<ProbeOutside />)).toThrow(/ThemeProvider/);
    spy.mockRestore();
  });

  it('initial state is light when no localStorage and not prefers-dark', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('dark').textContent).toBe('false');
  });

  it('reads dark from localStorage on mount', () => {
    localStorage.setItem('growthos-theme', 'dark');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('dark').textContent).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('reads light from localStorage on mount', () => {
    localStorage.setItem('growthos-theme', 'light');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('dark').textContent).toBe('false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('falls back to matchMedia prefers-color-scheme dark', () => {
    installMatchMedia(true);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('dark').textContent).toBe('true');
  });

  it('toggleTheme flips state and adds dark class', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('dark').textContent).toBe('false');
    act(() => {
      fireEvent.click(screen.getByText('toggle'));
    });
    expect(screen.getByTestId('dark').textContent).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('growthos-theme')).toBe('dark');
    act(() => {
      fireEvent.click(screen.getByText('toggle'));
    });
    expect(screen.getByTestId('dark').textContent).toBe('false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('growthos-theme')).toBe('light');
  });
});
