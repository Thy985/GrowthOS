import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';

import ReportSummary from '../../features/reports/components/ReportSummary';
import type { ReportStats } from '../../features/reports/types/reportTypes';

function makeStats(overrides: Partial<ReportStats> = {}): ReportStats {
  return {
    totalExperiences: 42,
    newExperiences: 12,
    activeCapabilities: 8,
    totalProjects: 5,
    activeProjects: 3,
    completedProjects: 2,
    totalPrinciples: 15,
    ...overrides,
  };
}

describe('ReportSummary', () => {
  test('renders all 7 stat cards with correct values', () => {
    render(<ReportSummary stats={makeStats()} />);
    expect(screen.getByText('概览')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('总经历')).toBeInTheDocument();
    expect(screen.getByText('本期新增')).toBeInTheDocument();
    expect(screen.getByText('活跃能力')).toBeInTheDocument();
    expect(screen.getByText('项目总数')).toBeInTheDocument();
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByText('原则总数')).toBeInTheDocument();
  });

  test('renders zero values correctly', () => {
    render(<ReportSummary stats={makeStats({ totalExperiences: 0, newExperiences: 0 })} />);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });
});
