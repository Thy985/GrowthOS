import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import authReducer from '../../features/auth/store/authSlice';
import capabilityReducer from '../../features/capabilities/store/capabilitySlice';
import coachReducer from '../../features/coach/store/coachSlice';
import DashboardPage from '../../features/dashboard/pages/DashboardPage.tsx';
import experienceReducer from '../../features/experiences/store/experienceSlice';
import goalReducer from '../../features/goals/store/goalSlice';
import treeReducer from '../../features/growth-tree/store/treeSlice';
import principleReducer from '../../features/principles/store/principleSlice';
import projectReducer from '../../features/projects/store/projectSlice';
import recordsReducer from '../../features/records/store/recordsSlice';
import reminderReducer from '../../features/reminders/store/reminderSlice';
import themeReducer from '../../features/theme/store/themeSlice';
import growthReducer from '../../store/slices/growthSlice';

vi.mock('../../shared/utils/logger.ts', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function makeStore() {
  return configureStore({
    reducer: {
      growth: growthReducer,
      records: recordsReducer,
      tree: treeReducer,
      auth: authReducer,
      theme: themeReducer,
      goal: goalReducer,
      reminder: reminderReducer,
      experiences: experienceReducer,
      capabilities: capabilityReducer,
      principles: principleReducer,
      projects: projectReducer,
      coach: coachReducer,
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

describe('DashboardPage (Growth Portrait)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the growth portrait heading', () => {
    renderPage();
    expect(screen.getByText(/你正在成为谁/)).toBeInTheDocument();
  });

  it('renders the capability radar chart section', () => {
    renderPage();
    expect(screen.getByText('能力画像')).toBeInTheDocument();
  });

  it('renders the quick record form', () => {
    renderPage();
    expect(screen.getByText('快速记录')).toBeInTheDocument();
  });

  it('renders the principles section', () => {
    renderPage();
    expect(screen.getByText(/核心原则/)).toBeInTheDocument();
  });

  it('renders the recommendations section', () => {
    renderPage();
    const elements = screen.getAllByText(/推荐下一步/);
    expect(elements.length).toBeGreaterThan(0);
  });
});
