import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, test, expect, vi } from 'vitest';

import capabilityReducer from '../../features/capabilities/store/capabilitySlice';
import CapabilityGrowthChart from '../../features/growth-curve/components/CapabilityGrowthChart';
import type { CapabilityHistory } from '../../shared/types';

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
  });
}

function renderChart(history: CapabilityHistory[], range: '30d' | '90d' | '1y' | 'all' = '30d') {
  const store = makeStore();
  return render(
    <Provider store={store}>
      <CapabilityGrowthChart history={history} range={range} />
    </Provider>,
  );
}

const makeHist = (id: string, level: number, daysAgo: number): CapabilityHistory => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id,
    capabilityId: 'cap1',
    level,
    recordedAt: date.toISOString(),
  };
};

describe('CapabilityGrowthChart', () => {
  test('shows empty state when no history', () => {
    renderChart([]);
    expect(screen.getByText(/成长记录/)).toBeInTheDocument();
  });

  test('renders single data point', () => {
    const history = [makeHist('h1', 50, 5)];
    renderChart(history, '30d');
    // Chart renders without empty state
    expect(screen.queryByText(/成长记录/)).not.toBeInTheDocument();
  });

  test('filters by 30d range', () => {
    const history = [
      makeHist('h1', 30, 100), // outside 30d
      makeHist('h2', 50, 10), // inside
    ];
    renderChart(history, '30d');
    // Should not show empty state (one data point inside range)
    expect(screen.queryByText(/成长记录/)).not.toBeInTheDocument();
  });

  test('all range shows all history', () => {
    const history = [makeHist('h1', 30, 200), makeHist('h2', 50, 100)];
    renderChart(history, 'all');
    expect(screen.queryByText(/成长记录/)).not.toBeInTheDocument();
  });
});
