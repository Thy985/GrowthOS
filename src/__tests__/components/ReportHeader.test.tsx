import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

import ReportHeader from '../../features/reports/components/ReportHeader';
import type { ReportPeriod } from '../../features/reports/types/reportTypes';

function makeProps(overrides: Partial<React.ComponentProps<typeof ReportHeader>> = {}) {
  return {
    period: '7d' as ReportPeriod,
    generatedAt: '2026-06-06T00:00:00Z',
    startDate: '2026-05-30',
    endDate: '2026-06-06',
    onPeriodChange: vi.fn(),
    onExport: vi.fn(),
    isExporting: false,
    ...overrides,
  };
}

function renderHeader(props: Partial<React.ComponentProps<typeof ReportHeader>> = {}) {
  return render(<ReportHeader {...makeProps(props)} />);
}

describe('ReportHeader', () => {
  test('renders page title, date range, and generated time', () => {
    renderHeader();
    expect(screen.getByText('成长报告')).toBeInTheDocument();
    expect(screen.getByText(/2026-05-30.*2026-06-06/)).toBeInTheDocument();
    expect(screen.getByText(/生成时间/)).toBeInTheDocument();
  });

  test('calls onPeriodChange when period button clicked', () => {
    const onPeriodChange = vi.fn();
    renderHeader({ onPeriodChange });
    screen.getByRole('button', { name: '30天' }).click();
    expect(onPeriodChange).toHaveBeenCalledWith('30d');
  });

  test('calls onExport when export button clicked', () => {
    const onExport = vi.fn();
    renderHeader({ onExport });
    screen.getByRole('button', { name: '导出 Markdown' }).click();
    expect(onExport).toHaveBeenCalled();
  });

  test('export button is disabled when isExporting is true', () => {
    renderHeader({ isExporting: true });
    const button = screen.getByRole('button', { name: '导出中...' });
    expect(button).toBeDisabled();
  });

  test('shows "导出中..." when isExporting is true', () => {
    renderHeader({ isExporting: true });
    expect(screen.getByText('导出中...')).toBeInTheDocument();
  });
});
