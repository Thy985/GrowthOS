import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import UncategorizedNodes from '../../features/growth-tree/components/UncategorizedNodes.tsx';

describe('UncategorizedNodes', () => {
  it('renders heading', () => {
    render(<UncategorizedNodes />);
    expect(screen.getByText('未分类节点（影子节点）')).toBeInTheDocument();
  });

  it('renders all node names', () => {
    render(<UncategorizedNodes />);
    expect(screen.getByText('#Python')).toBeInTheDocument();
    expect(screen.getByText('#阅读')).toBeInTheDocument();
    expect(screen.getByText('#React')).toBeInTheDocument();
    expect(screen.getByText('#跑步')).toBeInTheDocument();
    expect(screen.getByText('#王者荣耀')).toBeInTheDocument();
  });

  it('applies status classes to nodes', () => {
    const { container } = render(<UncategorizedNodes />);
    expect(container.querySelector('.tree-node.normal')).toBeInTheDocument();
    expect(container.querySelector('.tree-node.wilting')).toBeInTheDocument();
    expect(container.querySelector('.tree-node.wilted')).toBeInTheDocument();
  });

  it('renders confirm and delete buttons for each node', () => {
    render(<UncategorizedNodes />);
    expect(screen.getAllByText('确认')).toHaveLength(5);
    expect(screen.getAllByText('删除')).toHaveLength(5);
  });

  it('renders view more button at bottom', () => {
    render(<UncategorizedNodes />);
    expect(screen.getByText('查看更多')).toBeInTheDocument();
  });

  it('renders tip text', () => {
    render(<UncategorizedNodes />);
    expect(screen.getByText(/未分类的节点如果 7 天内未被确认/)).toBeInTheDocument();
  });
});
