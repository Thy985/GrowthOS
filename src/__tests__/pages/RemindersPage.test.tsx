import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import RemindersPage from '../../features/reminders/pages/RemindersPage.tsx';
import reminderReducer from '../../features/reminders/store/reminderSlice.ts';

function renderWithStore() {
  const store = configureStore({ reducer: { reminder: reminderReducer } });
  return render(
    <Provider store={store}>
      <RemindersPage />
    </Provider>,
  );
}

describe('RemindersPage', () => {
  beforeEach(() => {
    localStorage.clear();
    // mock Notification to avoid jsdom issues
    vi.stubGlobal(
      'Notification',
      class {
        static permission = 'default';
        static requestPermission = vi.fn().mockResolvedValue('denied');
      },
    );
  });

  it('renders the reminders page heading', () => {
    renderWithStore();
    // 标题元素 h1.page-title "提醒"
    expect(screen.getByRole('heading', { level: 1, name: '提醒' })).toBeInTheDocument();
  });

  it('shows empty state when no reminders', () => {
    renderWithStore();
    expect(screen.getByText(/暂无提醒|没有提醒|添加/)).toBeInTheDocument();
  });
});
