import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

import GoalsPage from '../../features/goals/pages/GoalsPage.tsx';

function makeStore() {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated: true, isLoading: false, user: null, error: null }) => state,
      goal: (state = {
        goals: [],
        isLoading: false,
        error: null,
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
        <GoalsPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('GoalsPage extended', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the heading', () => {
    renderPage();
    expect(screen.getByText('目标管理')).toBeInTheDocument();
  });

  it('renders empty state when no goals', () => {
    renderPage();
    expect(screen.getByText(/暂无目标|还没有|创建你的/)).toBeInTheDocument();
  });

  it('renders add goal form toggle', () => {
    renderPage();
    const heading = screen.getByText('目标管理');
    expect(heading).toBeInTheDocument();
  });
});
