import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';

import ReportCapabilitySection from '../../features/reports/components/ReportCapabilitySection';
import type { ReportCapabilityChange } from '../../features/reports/types/reportTypes';

function makeChange(
  capabilityId: string,
  name: string,
  currentLevel: number,
  targetLevel: number,
  change: number,
): ReportCapabilityChange {
  return {
    metric: { capabilityId, name, currentLevel, targetLevel },
    change,
  };
}

describe('ReportCapabilitySection', () => {
  test('shows empty state when both arrays are empty', () => {
    render(<ReportCapabilitySection topGainers={[]} decliners={[]} />);
    expect(screen.getByText('能力变化')).toBeInTheDocument();
    expect(screen.getByText('本期暂无能力变化')).toBeInTheDocument();
  });

  test('renders top gainers with green styling and progress bars', () => {
    const gainers = [
      makeChange('cap1', 'TypeScript', 80, 100, 15),
      makeChange('cap2', 'React', 60, 100, 10),
    ];
    render(<ReportCapabilitySection topGainers={gainers} decliners={[]} />);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('+15')).toBeInTheDocument();
    expect(screen.getByText('+10')).toBeInTheDocument();
    expect(screen.getByText('增长 TOP 5')).toBeInTheDocument();
    // Check for green color class on the change values
    const gainChangeEls = screen.getAllByText(/\+15|\+10/);
    gainChangeEls.forEach((el) => {
      expect(el.className).toContain('text-green-600');
    });
  });

  test('renders decliners with red styling', () => {
    const decliners = [makeChange('cap3', '系统设计', 30, 100, -5)];
    render(<ReportCapabilitySection topGainers={[]} decliners={decliners} />);
    expect(screen.getByText('系统设计')).toBeInTheDocument();
    expect(screen.getByText('-5')).toBeInTheDocument();
    expect(screen.getByText('需关注')).toBeInTheDocument();
    const declineEl = screen.getByText('-5');
    expect(declineEl.className).toContain('text-red-600');
  });

  test('renders both gainers and decliners when both have data', () => {
    const gainers = [makeChange('cap1', 'TypeScript', 80, 100, 15)];
    const decliners = [makeChange('cap2', '系统设计', 30, 100, -5)];
    render(<ReportCapabilitySection topGainers={gainers} decliners={decliners} />);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('系统设计')).toBeInTheDocument();
    expect(screen.getByText('+15')).toBeInTheDocument();
    expect(screen.getByText('-5')).toBeInTheDocument();
    expect(screen.getByText('增长 TOP 5')).toBeInTheDocument();
    expect(screen.getByText('需关注')).toBeInTheDocument();
  });

  test('progress bar width calculation', () => {
    const gainers = [makeChange('cap1', 'TypeScript', 75, 100, 15)];
    render(<ReportCapabilitySection topGainers={gainers} decliners={[]} />);
    // currentLevel=75, targetLevel=100 => width=75%
    const progressBar = screen.getByText('+15')
      .closest('.flex')
      ?.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '75%' });
  });
});
