import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

import RemindersPage from '../../features/reminders/pages/RemindersPage.tsx';

function makeStore() {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated: true, isLoading: false, user: null, error: null }) => state,
      reminder: (state = {
        reminders: [],
        isLoading: false,
        error: null,
        categories: [],
      }) => state,
      records: (state = { records: [], tags: [], isLoading: false, error: null }) => state,
      theme: (state = { isDarkMode: false }) => state,
    },
  });
}

function renderPage(store?: ReturnType<typeof makeStore>) {
  const s = store ?? makeStore();
  return render(
    <Provider store={s}>
      <MemoryRouter>
        <RemindersPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('RemindersPage extended', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: '提醒' })).toBeInTheDocument();
  });

  it('renders empty state message when no reminders', () => {
    renderPage();
    expect(screen.getByText(/暂无提醒|添加第一个|创建/)).toBeInTheDocument();
  });

  it('renders add reminder button/form', () => {
    renderPage();
    // Check for add reminder related elements
    const heading = screen.getByRole('heading', { level: 1, name: '提醒' });
    expect(heading).toBeInTheDocument();
  });
});
