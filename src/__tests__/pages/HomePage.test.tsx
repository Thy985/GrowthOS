import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import HomePage from '../../features/dashboard/pages/HomePage.tsx';

describe('HomePage', () => {
  it('renders dashboard heading', () => {
    render(<HomePage />);
    expect(screen.getByText('仪表盘')).toBeInTheDocument();
  });

  it('renders growth tree preview section', () => {
    render(<HomePage />);
    expect(screen.getByText('成长树预览')).toBeInTheDocument();
  });

  it('renders daily record form', () => {
    render(<HomePage />);
    expect(screen.getByText('日常记录')).toBeInTheDocument();
    expect(screen.getByText(/做了什么/)).toBeInTheDocument();
    expect(screen.getByText(/学了什么/)).toBeInTheDocument();
  });
});
