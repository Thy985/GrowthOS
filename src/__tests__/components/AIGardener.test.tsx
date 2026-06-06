import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import AIGardener from '../../features/growth-tree/components/AIGardener.tsx';

describe('AIGardener', () => {
  it('renders heading', () => {
    render(<AIGardener />);
    expect(screen.getByText('AI 园丁模式')).toBeInTheDocument();
  });

  it('renders two suggestion cards', () => {
    const { container } = render(<AIGardener />);
    expect(container.querySelectorAll('.suggestion-card')).toHaveLength(2);
  });

  it('renders confirm/cancel buttons for each suggestion', () => {
    render(<AIGardener />);
    expect(screen.getAllByText('确认')).toHaveLength(2);
    expect(screen.getAllByText('取消')).toHaveLength(2);
  });

  it('renders primary and warning suggestions', () => {
    const { container } = render(<AIGardener />);
    expect(container.querySelector('.suggestion-card.primary')).toBeInTheDocument();
    expect(container.querySelector('.suggestion-card.warning')).toBeInTheDocument();
  });
});
