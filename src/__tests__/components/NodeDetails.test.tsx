import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import NodeDetails from '../../features/growth-tree/components/NodeDetails.tsx';

describe('NodeDetails', () => {
  it('renders the heading', () => {
    render(<NodeDetails />);
    expect(screen.getByText('节点详情')).toBeInTheDocument();
  });

  it('renders the default name', () => {
    render(<NodeDetails />);
    expect(screen.getByDisplayValue('React 技能')).toBeInTheDocument();
  });

  it('renders mastery percentage', () => {
    render(<NodeDetails />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders status select with default', () => {
    render(<NodeDetails />);
    const select = screen.getByDisplayValue('进行中');
    expect(select).toBeInTheDocument();
  });

  it('changes name when input changes', () => {
    render(<NodeDetails />);
    const input = screen.getByDisplayValue('React 技能');
    fireEvent.change(input, { target: { name: 'name', value: 'Vue 技能' } });
    expect(screen.getByDisplayValue('Vue 技能')).toBeInTheDocument();
  });

  it('changes status when select changes', () => {
    render(<NodeDetails />);
    const select = screen.getByDisplayValue('进行中') as HTMLSelectElement;
    fireEvent.change(select, { target: { name: 'status', value: '深入' } });
    expect((screen.getByDisplayValue('深入') as HTMLSelectElement).value).toBe('深入');
  });

  it('renders save button', () => {
    render(<NodeDetails />);
    expect(screen.getByText('保存更改')).toBeInTheDocument();
  });
});
