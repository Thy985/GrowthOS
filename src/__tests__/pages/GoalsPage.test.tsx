import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, beforeEach } from 'vitest';

import GoalsPage from '../../features/goals/pages/GoalsPage.tsx';
import goalReducer from '../../features/goals/store/goalSlice.ts';

function renderWithStore() {
  const store = configureStore({ reducer: { goal: goalReducer } });
  return render(
    <Provider store={store}>
      <GoalsPage />
    </Provider>,
  );
}

describe('GoalsPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the goals heading', () => {
    renderWithStore();
    expect(screen.getByRole('heading', { level: 1, name: '目标管理' })).toBeInTheDocument();
  });

  it('opens add form on add button click', async () => {
    renderWithStore();
    const addBtn = screen.getByRole('button', { name: '添加目标' });
    fireEvent.click(addBtn);
    await waitFor(() => {
      expect(screen.getByText('添加新目标')).toBeInTheDocument();
    });
  });

  it('shows validation errors on empty submit', async () => {
    renderWithStore();
    fireEvent.click(screen.getByRole('button', { name: '添加目标' }));
    await waitFor(() => {
      expect(screen.getByText('添加新目标')).toBeInTheDocument();
    });
    // 通过 form.submit() 触发原生 submit 事件
    const form = document.querySelector('form') as HTMLFormElement;
    expect(form).not.toBeNull();
    fireEvent.submit(form);
    await waitFor(() => {
      // 至少有一个错误信息(标题/目标值/日期)
      const errs = screen.queryAllByText(/请输入/);
      expect(errs.length).toBeGreaterThan(0);
    });
  });
});
