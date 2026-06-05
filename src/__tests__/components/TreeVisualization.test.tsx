import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import TreeVisualization from '../../features/growth-tree/components/TreeVisualization.tsx';

// Mock reactflow
vi.mock('reactflow', () => ({
  __esModule: true,
  default: ({ children, nodes, edges, onConnect }: { children: React.ReactNode; nodes: any[]; edges: any[]; onConnect: (p: any) => void }) => (
    <div data-testid="reactflow" data-nodes={JSON.stringify(nodes.map(n => n.id))} data-edges={JSON.stringify(edges.map(e => e.id))}>
      {children}
    </div>
  ),
  ReactFlow: ({ children, nodes, edges }: { children: React.ReactNode; nodes: any[]; edges: any[] }) => (
    <div data-testid="reactflow" data-nodes={JSON.stringify(nodes.map(n => n.id))} data-edges={JSON.stringify(edges.map(e => e.id))}>
      {children}
    </div>
  ),
  addEdge: (params: any, eds: any[]) => [...eds, params],
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
}));

describe('TreeVisualization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with null treeData', () => {
    render(<TreeVisualization treeData={null} />);
    expect(screen.getByTestId('reactflow')).toBeInTheDocument();
  });

  it('renders with treeData containing nodes', () => {
    const treeData = {
      id: 'root',
      name: 'Root',
      type: 'skill',
      children: [
        { id: 'child1', name: 'Child 1', type: 'cognition' },
        { id: 'child2', name: 'Child 2', type: 'habit', children: [] },
      ],
    };
    render(<TreeVisualization treeData={treeData} />);
    const reactflow = screen.getByTestId('reactflow');
    const nodeIds = JSON.parse(reactflow.getAttribute('data-nodes') || '[]');
    expect(nodeIds).toContain('root');
    expect(nodeIds).toContain('child1');
    expect(nodeIds).toContain('child2');
  });

  it('renders background, controls, and minimap', () => {
    render(<TreeVisualization treeData={null} />);
    expect(screen.getByTestId('background')).toBeInTheDocument();
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
  });
});
