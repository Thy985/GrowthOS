import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import Button from '../../shared/components/common/Button.tsx';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click</Button>);
    expect(screen.getByText('Click')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Click
      </Button>,
    );
    const btn = screen.getByText('Click');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies primary variant', () => {
    const { container } = render(<Button variant="primary">x</Button>);
    expect(container.querySelector('button')?.className).toContain('bg-green-500');
  });

  it('applies secondary variant', () => {
    const { container } = render(<Button variant="secondary">x</Button>);
    expect(container.querySelector('button')?.className).toContain('bg-blue-500');
  });

  it('applies outline variant', () => {
    const { container } = render(<Button variant="outline">x</Button>);
    expect(container.querySelector('button')?.className).toContain('border');
  });

  it('applies ghost variant', () => {
    const { container } = render(<Button variant="ghost">x</Button>);
    expect(container.querySelector('button')?.className).toContain('hover:bg-gray-100');
  });

  it('applies danger variant', () => {
    const { container } = render(<Button variant="danger">x</Button>);
    expect(container.querySelector('button')?.className).toContain('bg-red-600');
  });

  it('applies small size', () => {
    const { container } = render(<Button size="small">x</Button>);
    expect(container.querySelector('button')?.className).toContain('px-3');
  });

  it('applies large size', () => {
    const { container } = render(<Button size="large">x</Button>);
    expect(container.querySelector('button')?.className).toContain('text-lg');
  });

  it('forwards type=submit', () => {
    render(<Button type="submit">x</Button>);
    expect(screen.getByText('x')).toHaveAttribute('type', 'submit');
  });
});
