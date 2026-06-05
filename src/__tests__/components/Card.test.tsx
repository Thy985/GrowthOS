import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import Card from '../../shared/components/common/Card.tsx';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>body</Card>);
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Card title="My Title">body</Card>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<Card title="t" subtitle="sub">body</Card>);
    expect(screen.getByText('sub')).toBeInTheDocument();
  });

  it('renders headerAction when provided', () => {
    render(<Card headerAction={<button>Action</button>}>body</Card>);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('forwards className', () => {
    const { container } = render(<Card className="my-card">body</Card>);
    expect(container.querySelector('.my-card')).toBeInTheDocument();
  });
});
