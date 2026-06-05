import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect } from 'vitest';

import DashboardPage from '../../features/dashboard/pages/DashboardPage.tsx';
import recordsReducer from '../../features/records/store/recordsSlice.ts';
import growthReducer from '../../store/slices/growthSlice.ts';

function renderWithStore() {
  const store = configureStore({
    reducer: { records: recordsReducer, growth: growthReducer },
  });
  return render(
    <Provider store={store}>
      <DashboardPage />
    </Provider>,
  );
}

describe('DashboardPage', () => {
  it('renders dashboard with form', () => {
    renderWithStore();
    // 表单有 activity 字段(label "活动" 或 placeholder)
    expect(screen.getByText(/仪表盘|添加成长记录/)).toBeInTheDocument();
  });

  it('shows stats section', () => {
    renderWithStore();
    // 至少包含"总记录"或"本周记录"等
    expect(screen.getAllByText(/总记录|本周记录|成长进度/).length).toBeGreaterThan(0);
  });
});
