import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

import DashboardPage from '../../features/dashboard/pages/DashboardPage.tsx';

const mockRecords = [
  {
    id: '1',
    activity: '学习React',
    learning: 'hooks',
    reflection: '很棒',
    mood: '很好' as const,
    tags: ['React'],
    createdAt: new Date().toISOString(),
  },
];

function makeStore() {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated: true, isLoading: false, user: null, error: null }) => state,
      records: (state = { records: mockRecords, tags: ['React'], isLoading: false, error: null }) => state,
      tree: (state = { trees: [], isLoading: false, error: null }) => state,
      goal: (state = { goals: [], isLoading: false, error: null }) => state,
      theme: (state = { isDarkMode: false }) => state,
      reminder: (state = { reminders: [], isLoading: false, error: null }) => state,
    },
  });
}

function renderPage(store?: ReturnType<typeof makeStore>) {
  const s = store ?? makeStore();
  return render(
    <Provider store={s}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByText('仪表盘')).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    renderPage();
    expect(screen.getByText('总记录')).toBeInTheDocument();
    expect(screen.getByText('本周记录')).toBeInTheDocument();
    expect(screen.getByText('成长进度')).toBeInTheDocument();
  });

  it('shows record count from state', () => {
    renderPage();
    // The totalRecords value is rendered in a stats card; check that the value "1" 
    // appears among the stat numbers (totalRecords = 1 with mockRecords)
    const statElements = screen.getAllByText('1');
    expect(statElements.length).toBeGreaterThan(0);
  });

  it('renders the daily record form', () => {
    renderPage();
    expect(screen.getByPlaceholderText(/今天做了什么/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/今天学了什么/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/今天的反思/)).toBeInTheDocument();
  });

  it('renders mood selector', () => {
    renderPage();
    expect(screen.getByText('很好')).toBeInTheDocument();
    expect(screen.getByText('一般')).toBeInTheDocument();
    expect(screen.getByText('不太好')).toBeInTheDocument();
  });
});
