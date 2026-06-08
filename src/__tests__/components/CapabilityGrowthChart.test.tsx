import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, test, expect, vi } from 'vitest';

import capabilityReducer from '../../features/capabilities/store/capabilitySlice';
import CapabilityGrowthChart from '../../features/growth-curve/components/CapabilityGrowthChart';
import SnapshotDetailPanel from '../../features/growth-curve/components/SnapshotDetailPanel';
import { getHistoryInRange } from '../../features/growth-curve/engine/growthAnalytics';
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

function renderChart(
  history: CapabilityHistory[],
  range: '7d' | '30d' | '90d' | 'all' = '30d',
  capabilityName?: string,
) {
  const store = makeStore();
  return render(
    <Provider store={store}>
      <div style={{ width: 600, height: 300 }}>
        <CapabilityGrowthChart history={history} range={range} capabilityName={capabilityName} />
      </div>
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

  test('renders chart container when history exists', () => {
    const { container } = renderChart([makeHist('h1', 50, 5)], '30d');
    expect(screen.queryByText(/成长记录/)).not.toBeInTheDocument();
    // Recharts renders ResponsiveContainer div (SVG not rendered in jsdom)
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  test('filters by 30d range', () => {
    const history = [
      makeHist('h1', 30, 100), // outside 30d
      makeHist('h2', 50, 10), // inside
    ];
    renderChart(history, '30d');
    expect(screen.queryByText(/成长记录/)).not.toBeInTheDocument();
  });

  test('all range shows all history', () => {
    const history = [makeHist('h1', 30, 200), makeHist('h2', 50, 100)];
    renderChart(history, 'all');
    expect(screen.queryByText(/成长记录/)).not.toBeInTheDocument();
  });

  test('filters by 7d range', () => {
    const history = [
      makeHist('h1', 30, 20), // outside 7d
      makeHist('h2', 50, 3), // inside
    ];
    renderChart(history, '7d');
    expect(screen.queryByText(/成长记录/)).not.toBeInTheDocument();
  });

  test('shows chart with single data point', () => {
    const history = [makeHist('h1', 75, 2)];
    renderChart(history, '30d');
    expect(screen.queryByText(/成长记录/)).not.toBeInTheDocument();
  });
});

describe('SnapshotDetailPanel', () => {
  test('renders correctly with manual update', () => {
    const snapshot: CapabilityHistory = {
      id: 'h-detail',
      capabilityId: 'cap1',
      level: 80,
      recordedAt: new Date().toISOString(),
    };
    render(
      <SnapshotDetailPanel snapshot={snapshot} capabilityName="React 开发" onClose={() => {}} />,
    );
    expect(screen.getByTestId('snapshot-detail-panel')).toBeInTheDocument();
    expect(screen.getByText(/快照详情/)).toBeInTheDocument();
    expect(screen.getByText(/React 开发/)).toBeInTheDocument();
    expect(screen.getByText(/80/)).toBeInTheDocument();
    expect(screen.getByText(/手动更新/)).toBeInTheDocument();
  });

  test('shows experience id when present', () => {
    const snapshot: CapabilityHistory = {
      id: 'h-exp',
      capabilityId: 'cap1',
      level: 60,
      recordedAt: new Date().toISOString(),
      triggerExperienceId: 'exp-abc',
    };
    render(
      <SnapshotDetailPanel
        snapshot={snapshot}
        capabilityName="TypeScript 开发"
        onClose={() => {}}
      />,
    );
    expect(screen.getByTestId('snapshot-detail-panel')).toBeInTheDocument();
    expect(screen.getByText(/关联经历/)).toBeInTheDocument();
    expect(screen.getByText(/exp-abc/)).toBeInTheDocument();
    expect(screen.queryByText(/手动更新/)).not.toBeInTheDocument();
  });

  test('shows snapshot id and recorded time', () => {
    const snapshot: CapabilityHistory = {
      id: 'snap-123',
      capabilityId: 'cap1',
      level: 42,
      recordedAt: '2026-06-08T10:30:00.000Z',
    };
    render(<SnapshotDetailPanel snapshot={snapshot} onClose={() => {}} />);
    expect(screen.getByTestId('snapshot-detail-panel')).toBeInTheDocument();
    expect(screen.getByText(/snap-123/)).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  test('can be closed via button', () => {
    const mockClose = vi.fn();
    const snapshot: CapabilityHistory = {
      id: 'snap-close',
      capabilityId: 'cap1',
      level: 50,
      recordedAt: new Date().toISOString(),
    };
    render(<SnapshotDetailPanel snapshot={snapshot} onClose={mockClose} />);
    screen.getByLabelText('关闭').click();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});

describe('getHistoryInRange - 7d support', () => {
  test('filters history by 7d range', () => {
    const history: CapabilityHistory[] = [
      {
        id: 'h-old',
        capabilityId: 'cap1',
        level: 30,
        recordedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'h-recent',
        capabilityId: 'cap1',
        level: 50,
        recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    const result = getHistoryInRange(history, '7d');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('h-recent');
  });

  test('all range returns all history', () => {
    const history: CapabilityHistory[] = [
      {
        id: 'h1',
        capabilityId: 'cap1',
        level: 30,
        recordedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'h2',
        capabilityId: 'cap1',
        level: 50,
        recordedAt: new Date().toISOString(),
      },
    ];
    const result = getHistoryInRange(history, 'all');
    expect(result).toHaveLength(2);
  });
});
