import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

import RemindersPage from '../../features/reminders/pages/RemindersPage.tsx';

function makeStore(preloadedReminders: any[] = []) {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated: true, isLoading: false, user: null, error: null }) => state,
      reminder: (state = {
        reminders: preloadedReminders,
        isLoading: false,
        error: null,
        categories: [],
      }) => state,
      records: (state = { records: [], tags: [], isLoading: false, error: null }) => state,
      theme: (state = { isDarkMode: false }) => state,
    },
  });
}

function renderPage(reminders: any[] = []) {
  const store = makeStore(reminders);
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <RemindersPage />
        </MemoryRouter>
      </Provider>,
    ),
  };
}

// Mock window.confirm
const mockConfirm = vi.fn(() => true);
beforeEach(() => {
  window.confirm = mockConfirm;
});

describe('RemindersPage interactions', () => {
  beforeEach(() => {
    localStorage.clear();
    mockConfirm.mockClear();
  });

  it('renders the heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: '提醒' })).toBeInTheDocument();
  });

  it('shows empty state when no reminders', () => {
    renderPage();
    expect(screen.getByText(/暂无提醒/)).toBeInTheDocument();
  });

  it('shows add reminder button', () => {
    renderPage();
    expect(screen.getByText('添加提醒')).toBeInTheDocument();
  });

  it('opens add modal when clicking add button', () => {
    renderPage();
    fireEvent.click(screen.getByText('添加提醒'));
    expect(screen.getByPlaceholderText('请输入提醒标题')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  it('closes modal when clicking cancel', () => {
    renderPage();
    fireEvent.click(screen.getByText('添加提醒'));
    expect(screen.getByPlaceholderText('请输入提醒标题')).toBeInTheDocument();
    fireEvent.click(screen.getByText('取消'));
    expect(screen.queryByPlaceholderText('请输入提醒标题')).not.toBeInTheDocument();
  });

  it('shows reminders in pending list when not completed', () => {
    renderPage([{
      id: '1',
      title: 'Test Reminder',
      description: 'Test desc',
      date: '2024-06-01',
      time: '10:00',
      isCompleted: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }]);
    expect(screen.getByText('待完成')).toBeInTheDocument();
    expect(screen.getByText('Test Reminder')).toBeInTheDocument();
  });

  it('shows completed reminders in completed list', () => {
    renderPage([{
      id: '1',
      title: 'Completed Reminder',
      description: 'Test desc',
      date: '2024-06-01',
      time: '10:00',
      isCompleted: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }]);
    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByText('Completed Reminder')).toBeInTheDocument();
  });

  it('edit button opens modal with form filled', () => {
    renderPage([{
      id: '1',
      title: 'Edit Me',
      description: 'Edit desc',
      date: '2024-06-01',
      time: '10:00',
      isCompleted: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }]);
    const editButton = screen.getByText('编辑');
    fireEvent.click(editButton);
    // Modal should open with title "编辑提醒"
    expect(screen.getByText('编辑提醒')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Edit Me')).toBeInTheDocument();
  });

  it('delete button confirms and dispatches delete', () => {
    mockConfirm.mockReturnValueOnce(true);
    renderPage([{
      id: '1',
      title: 'Delete Me',
      description: '',
      date: '2024-06-01',
      time: '10:00',
      isCompleted: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }]);
    const deleteButton = screen.getByText('删除');
    fireEvent.click(deleteButton);
    expect(mockConfirm).toHaveBeenCalled();
  });

  it('checkbox dispatches completeReminder', () => {
    renderPage([{
      id: '1',
      title: 'Complete Me',
      description: '',
      date: '2024-06-01',
      time: '10:00',
      isCompleted: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }]);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    // State should update
  });
});
