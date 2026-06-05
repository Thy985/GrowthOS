import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import App from '../../app/App.tsx';

// Mock complex child modules
vi.mock('reactflow', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="reactflow">{children}</div>
  ),
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="reactflow">{children}</div>
  ),
  useNodesState: () => [[], () => {}],
  useEdgesState: () => [[], () => {}],
  Controls: () => null,
  Background: () => null,
  MiniMap: () => null,
  Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MarkerType: { Arrow: 'arrow' },
  Position: { Top: 'top' },
  Handle: () => null,
  ConnectionLineType: { Bezier: 'bezier' },
}));

vi.mock('recharts', () => ({
  BarChart: () => null,
  Bar: () => null,
  LineChart: () => null,
  Line: () => null,
  PieChart: () => null,
  Pie: () => null,
  Cell: () => null,
  AreaChart: () => null,
  Area: () => null,
  RadarChart: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  Radar: () => null,
  ScatterChart: () => null,
  Scatter: () => null,
  ZAxis: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: () => null,
}));

// Mock lazy imports for Tutorial and KeyboardShortcutsHelp
vi.mock('../../shared/components/Tutorial.tsx', () => ({
  default: () => null,
}));
vi.mock('../../shared/components/KeyboardShortcutsHelp.tsx', () => ({
  default: () => null,
}));

describe('App (smoke)', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock setTimeout for the delayed data loading
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the app without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    // App should render without throwing
    // Since we're not authenticated initially, it should show the auth route content
    expect(document.body).toBeTruthy();
  });
});
