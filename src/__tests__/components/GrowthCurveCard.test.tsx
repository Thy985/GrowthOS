import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, test, expect, vi } from 'vitest';

import capabilityReducer from '../../features/capabilities/store/capabilitySlice';
import GrowthCurveCard from '../../features/growth-curve/components/GrowthCurveCard';
import type { GrowthMetric } from '../../features/growth-curve/types/growthCurveTypes';
import type { CapabilityHistory } from '../../shared/types';

vi.mock('../../shared/utils/secureStorage', () => ({
  secureStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

const makeMetric = (overrides: Partial<GrowthMetric> = {}): GrowthMetric => ({
  capabilityId: 'cap1',
  name: 'Test Capability',
  category: 'mind',
  currentLevel: 50,
  targetLevel: 100,
  growthRate: 10,
  trend: 'up',
  ...overrides,
});

const makeHist = (level: number, daysAgo: number): CapabilityHistory => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `h-${level}-${daysAgo}`,
    capabilityId: 'cap1',
    level,
    recordedAt: date.toISOString(),
  };
};

function makeStore(history: CapabilityHistory[] = []) {
  return configureStore({
    reducer: {
      capabilities: capabilityReducer,
    },
    preloadedState: {
      capabilities: {
        capabilities: [],
        history,
        isLoading: false,
        error: null,
      },
    },
  });
}

function renderCard(metric: GrowthMetric, history: CapabilityHistory[] = []) {
  const store = makeStore(history);
  return render(
    <Provider store={store}>
      <GrowthCurveCard metric={metric} />
    </Provider>,
  );
}

describe('GrowthCurveCard', () => {
  test('shows empty state when no history', () => {
    const metric = makeMetric();
    renderCard(metric, []);
    expect(screen.getByText(/成长记录/)).toBeInTheDocument();
  });

  test('up trend shows positive growth', () => {
    const metric = makeMetric({ growthRate: 15, trend: 'up' });
    const history = [makeHist(30, 30), makeHist(45, 5)];
    renderCard(metric, history);
    expect(screen.getByTestId('growth-value').textContent).toContain('+15');
  });

  test('down trend shows negative growth', () => {
    const metric = makeMetric({ growthRate: -10, trend: 'down' });
    const history = [makeHist(50, 30), makeHist(40, 5)];
    renderCard(metric, history);
    expect(screen.getByTestId('growth-value').textContent).toContain('-10');
  });

  test('stable trend shows 0 growth', () => {
    const metric = makeMetric({ growthRate: 0, trend: 'stable' });
    const history = [makeHist(50, 30), makeHist(50, 5)];
    renderCard(metric, history);
    expect(screen.getByTestId('growth-value').textContent).toContain('0');
  });
});
