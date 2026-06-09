import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import Badge from '../../shared/components/common/Badge.tsx';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies default variant class', () => {
    const { container } = render(<Badge>x</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-surface-muted');
  });

  it('applies primary variant class', () => {
    const { container } = render(<Badge variant="primary">x</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-green-100');
  });

  it('applies secondary variant class', () => {
    const { container } = render(<Badge variant="secondary">x</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-blue-100');
  });

  it('applies success variant class', () => {
    const { container } = render(<Badge variant="success">x</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-green-100');
  });

  it('applies warning variant class', () => {
    const { container } = render(<Badge variant="warning">x</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-yellow-100');
  });

  it('applies danger variant class', () => {
    const { container } = render(<Badge variant="danger">x</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-red-100');
  });

  it('applies outline variant class', () => {
    const { container } = render(<Badge variant="outline">x</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('border');
  });

  it('applies small size class', () => {
    const { container } = render(<Badge size="small">x</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-xs');
  });

  it('applies large size class', () => {
    const { container } = render(<Badge size="large">x</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-sm');
  });

  it('forwards extra className', () => {
    const { container } = render(<Badge className="custom-class">x</Badge>);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('custom-class');
  });
});
