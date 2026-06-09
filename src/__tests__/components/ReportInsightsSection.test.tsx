import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';

import ReportInsightsSection from '../../features/reports/components/ReportInsightsSection';
import type { CoachDiagnosis } from '../../features/coach/types/coachTypes';

function makeDiagnosis(overrides: Partial<CoachDiagnosis> = {}): CoachDiagnosis {
  return {
    summary: {
      headline: '整体稳步增长',
      highlights: ['TypeScript 本月 +15'],
      concerns: ['系统设计已停滞 60 天'],
      nextAction: '安排一次系统设计实践',
    },
    insights: [],
    recommendations: [],
    generatedAt: '2026-06-06T00:00:00Z',
    ...overrides,
  };
}

describe('ReportInsightsSection', () => {
  test('renders summary headline, highlights, concerns, nextAction', () => {
    render(<ReportInsightsSection diagnosis={makeDiagnosis()} />);
    expect(screen.getByText('诊断分析')).toBeInTheDocument();
    expect(screen.getByText('整体稳步增长')).toBeInTheDocument();
    expect(screen.getByText('TypeScript 本月 +15')).toBeInTheDocument();
    expect(screen.getByText('系统设计已停滞 60 天')).toBeInTheDocument();
    expect(screen.getByText('安排一次系统设计实践')).toBeInTheDocument();
  });

  test('renders insights with severity-based styling', () => {
    const diagnosis = makeDiagnosis({
      insights: [
        {
          severity: 'important',
          icon: '⚠️',
          title: '能力 A 已停滞',
          description: '30 天无进展',
        },
        { severity: 'notice', icon: '📌', title: '注意：能力 B 接近目标' },
        { severity: 'info', icon: 'ℹ️', title: '能力 C 有小幅提升' },
      ],
    });
    const { container } = render(<ReportInsightsSection diagnosis={diagnosis} />);
    expect(screen.getByText('能力 A 已停滞')).toBeInTheDocument();
    expect(screen.getByText('注意：能力 B 接近目标')).toBeInTheDocument();
    expect(screen.getByText('能力 C 有小幅提升')).toBeInTheDocument();
    expect(screen.getByText('30 天无进展')).toBeInTheDocument();
    // Check severity-based border classes
    expect(container.innerHTML).toContain('border-red-200');
    expect(container.innerHTML).toContain('border-orange-200');
    expect(container.innerHTML).toContain('border-blue-200');
  });

  test('limits insights to 8 items', () => {
    const insights = Array.from({ length: 10 }, (_, i) => ({
      severity: 'info' as const,
      icon: 'ℹ️',
      title: `Insight ${i + 1}`,
    }));
    const diagnosis = makeDiagnosis({ insights });
    render(<ReportInsightsSection diagnosis={diagnosis} />);
    expect(screen.getByText('Insight 1')).toBeInTheDocument();
    expect(screen.getByText('Insight 8')).toBeInTheDocument();
    expect(screen.queryByText('Insight 9')).not.toBeInTheDocument();
    expect(screen.queryByText('Insight 10')).not.toBeInTheDocument();
  });

  test('renders recommendations with priority-based styling', () => {
    const diagnosis = makeDiagnosis({
      recommendations: [
        { priority: 'high', title: '紧急任务', action: '立即执行' },
        { priority: 'medium', title: '一般任务', action: '本周完成' },
        { priority: 'low', title: '可选任务', action: '有空再做' },
      ],
    });
    const { container } = render(<ReportInsightsSection diagnosis={diagnosis} />);
    expect(screen.getByText(/紧急任务/)).toBeInTheDocument();
    expect(screen.getByText(/一般任务/)).toBeInTheDocument();
    expect(screen.getByText(/可选任务/)).toBeInTheDocument();
    expect(screen.getByText('立即执行')).toBeInTheDocument();
    expect(screen.getByText('本周完成')).toBeInTheDocument();
    expect(screen.getByText('有空再做')).toBeInTheDocument();
    expect(container.innerHTML).toContain('border-red-200');
    expect(container.innerHTML).toContain('border-yellow-200');
    expect(container.innerHTML).toContain('border-green-200');
  });

  test('empty diagnosis shows minimal structure', () => {
    const diagnosis = makeDiagnosis({
      summary: { headline: '', highlights: [], concerns: [], nextAction: '' },
      insights: [],
      recommendations: [],
    });
    render(<ReportInsightsSection diagnosis={diagnosis} />);
    expect(screen.getByText('诊断分析')).toBeInTheDocument();
    expect(screen.queryByText(/洞察/)).not.toBeInTheDocument();
    expect(screen.queryByText(/推荐/)).not.toBeInTheDocument();
  });
});
