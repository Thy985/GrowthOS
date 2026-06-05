import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock reactflow to avoid jsdom issues with SVG/canvas rendering
vi.mock('reactflow', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  Controls: () => <div data-testid="controls" />,
  Background: () => <div data-testid="background" />,
  MiniMap: () => <div data-testid="minimap" />,
  Panel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="panel">{children}</div>
  ),
  NodeToolbar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="node-toolbar">{children}</div>
  ),
  useNodesState: (initial: unknown[]) => [initial, vi.fn(), vi.fn()],
  useEdgesState: (initial: unknown[]) => [initial, vi.fn(), vi.fn()],
  addEdge: vi.fn(),
  ConnectionLineType: { SmoothStep: 'smoothstep' },
}));

import GrowthTreePage from '../../features/growth-tree/pages/GrowthTreePage.tsx';
import recordsReducer from '../../features/records/store/recordsSlice.ts';
import treeReducer from '../../features/growth-tree/store/treeSlice.ts';
import growthReducer from '../../store/slices/growthSlice.ts';

function renderWithStore() {
  const store = configureStore({
    reducer: {
      records: recordsReducer,
      tree: treeReducer,
      growth: growthReducer,
    },
  });
  return render(
    <Provider store={store}>
      <GrowthTreePage />
    </Provider>,
  );
}

describe('GrowthTreePage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders reactflow container', () => {
    renderWithStore();
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('renders controls and minimap', () => {
    renderWithStore();
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
  });
});
