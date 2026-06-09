import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, test, expect, vi } from 'vitest';

import capabilityReducer from '../../features/capabilities/store/capabilitySlice';
import GrowthOverviewSection from '../../features/growth-curve/components/GrowthOverviewSection';

vi.mock('../../shared/utils/secureStorage', () => ({
  secureStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

function makeStore() {
  return configureStore({
    reducer: {
      capabilities: capabilityReducer,
    },
    preloadedState: {
      capabilities: {
        capabilities: [],
        history: [],
        isLoading: false,
        error: null,
      },
    },
  });
}

function renderOverview(props: { defaultRange?: '7d' | '30d' | '90d' | 'all' } = {}) {
  const store = makeStore();
  return render(
    <Provider store={store}>
      <GrowthOverviewSection {...props} />
    </Provider>,
  );
}

describe('GrowthOverviewSection', () => {
  test('renders with default range of 30d', () => {
    renderOverview();
    expect(screen.getByText('成长轨迹')).toBeInTheDocument();
  });

  test('renders with custom defaultRange', () => {
    renderOverview({ defaultRange: '7d' });
    expect(screen.getByText('成长轨迹')).toBeInTheDocument();
  });

  test('contains TimeRangeSelector buttons (7d, 30d, 90d, 全部)', () => {
    renderOverview();
    expect(screen.getByRole('button', { name: '7天' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30天' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '90天' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '全部' })).toBeInTheDocument();
  });

  test('renders TopGrowthRanking component', () => {
    renderOverview();
    expect(screen.getByText(/成长记录/)).toBeInTheDocument();
  });
});
