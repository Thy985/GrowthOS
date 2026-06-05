import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import RecordsPage from '../../features/records/pages/RecordsPage.tsx';
import recordsReducer from '../../features/records/store/recordsSlice.ts';
import growthReducer from '../../store/slices/growthSlice.ts';

function renderWithStore(preloaded?: { records: { records: never[]; tags: never[]; isLoading: false; error: null } }) {
  const store = configureStore({
    reducer: { records: recordsReducer, growth: growthReducer },
    preloadedState: preloaded as never,
  });
  return render(
    <Provider store={store}>
      <RecordsPage />
    </Provider>,
  );
}

describe('RecordsPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the records heading', () => {
    renderWithStore();
    expect(screen.getByText('记录列表')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderWithStore();
    expect(screen.getByPlaceholderText(/搜索/)).toBeInTheDocument();
  });

  it('shows clear button only when filter is active', () => {
    renderWithStore();
    expect(screen.queryByText('清除过滤')).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/搜索/), { target: { value: 'foo' } });
    expect(screen.getByText('清除过滤')).toBeInTheDocument();
    fireEvent.click(screen.getByText('清除过滤'));
    expect(screen.queryByText('清除过滤')).not.toBeInTheDocument();
  });

  it('renders mood filter chips', () => {
    renderWithStore();
    expect(screen.getByText('很好')).toBeInTheDocument();
    expect(screen.getByText('一般')).toBeInTheDocument();
    expect(screen.getByText('不太好')).toBeInTheDocument();
  });

  it('toggles mood selection', () => {
    renderWithStore();
    const mood = screen.getByText('很好');
    fireEvent.click(mood);
    // 至少清除过滤按钮出现
    expect(screen.getByText('清除过滤')).toBeInTheDocument();
  });
});
