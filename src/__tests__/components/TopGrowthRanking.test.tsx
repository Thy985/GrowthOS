import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, test, expect, vi } from 'vitest';

import capabilityReducer from '../../features/capabilities/store/capabilitySlice';
import TopGrowthRanking from '../../features/growth-curve/components/TopGrowthRanking';
import type { Capability, CapabilityHistory } from '../../shared/types';

vi.mock('../../shared/utils/secureStorage', () => ({
  secureStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

const FIXED_NOW = new Date('2026-06-06T00:00:00Z');

const makeCap = (id: string, name: string, currentLevel: number): Capability => ({
  id,
  userId: 'user1',
  name,
  category: 'mind',
  parentId: null,
  currentLevel,
  targetLevel: 100,
  growthRate: 0,
  lastUpdated: FIXED_NOW.toISOString(),
  createdAt: FIXED_NOW.toISOString(),
});

const makeHist = (capId: string, level: number, daysAgo: number): CapabilityHistory => {
  const date = new Date(FIXED_NOW);
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `${capId}-${level}-${daysAgo}`,
    capabilityId: capId,
    level,
    recordedAt: date.toISOString(),
  };
};

function makeStore(capabilities: Capability[], history: CapabilityHistory[]) {
  return configureStore({
    reducer: {
      capabilities: capabilityReducer,
    },
    preloadedState: {
      capabilities: {
        capabilities,
        history,
        isLoading: false,
        error: null,
      },
    },
  });
}

function renderRanking(
  capabilities: Capability[],
  history: CapabilityHistory[],
  range: '30d' | '90d' | '1y' | 'all' = '30d',
) {
  const store = makeStore(capabilities, history);
  return render(
    <Provider store={store}>
      <TopGrowthRanking range={range} limit={5} />
    </Provider>,
  );
}

describe('TopGrowthRanking', () => {
  test('shows empty state when no capabilities', () => {
    renderRanking([], []);
    expect(screen.getByText(/成长记录/)).toBeInTheDocument();
  });

  test('ranks capabilities by growth rate', () => {
    const caps = [
      makeCap('cap1', 'Top1', 80),
      makeCap('cap2', 'Top2', 70),
      makeCap('cap3', 'Down', 30),
    ];
    const history = [
      makeHist('cap1', 50, 30),
      makeHist('cap1', 80, 5),
      makeHist('cap2', 50, 30),
      makeHist('cap2', 70, 5),
      makeHist('cap3', 50, 30),
      makeHist('cap3', 30, 5),
    ];
    renderRanking(caps, history, '30d');
    expect(screen.getByText('Top1')).toBeInTheDocument();
    expect(screen.getByText('Top2')).toBeInTheDocument();
    expect(screen.getByText('Down')).toBeInTheDocument();
  });

  test('limits to top N', () => {
    const caps = [
      makeCap('cap1', 'A', 60),
      makeCap('cap2', 'B', 60),
      makeCap('cap3', 'C', 60),
      makeCap('cap4', 'D', 60),
      makeCap('cap5', 'E', 60),
      makeCap('cap6', 'F', 60),
    ];
    const history = caps.map((c) => [makeHist(c.id, 40, 30), makeHist(c.id, 60, 5)]).flat();
    renderRanking(caps, history, '30d');
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText('F')).not.toBeInTheDocument();
  });
});
