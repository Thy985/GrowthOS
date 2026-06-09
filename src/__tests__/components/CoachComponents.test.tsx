/**
 * V2 Coach Component Tests
 *
 * Tests for:
 * - CoachHeader
 * - CoachSummarySection
 * - TopRecommendationCard
 * - OtherRecommendations
 * - EmptyStateChecklist
 * - InsightPanel
 * - RecommendationStatusBadge
 * - CompletedGrowth
 */

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';

import CoachHeader from '../../features/coach/components/CoachHeader';
import CoachSummarySection from '../../features/coach/components/CoachSummarySection';
import CompletedGrowth from '../../features/coach/components/CompletedGrowth';
import EmptyStateChecklist from '../../features/coach/components/EmptyStateChecklist';
import InsightPanel from '../../features/coach/components/InsightPanel';
import OtherRecommendations from '../../features/coach/components/OtherRecommendations';
import RecommendationStatusBadge from '../../features/coach/components/RecommendationStatusBadge';
import TopRecommendationCard from '../../features/coach/components/TopRecommendationCard';
import coachReducer from '../../features/coach/store/coachSlice';
import type {
  Recommendation,
  CoachDiagnosis,
  CoachState,
  Insight,
} from '../../features/coach/types/coachTypes';

vi.mock('../../shared/utils/secureStorage', () => ({
  secureStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('../../shared/utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function makeStore(preloaded?: { coach: CoachState }) {
  return configureStore({
    reducer: { coach: coachReducer },
    preloadedState: preloaded,
  });
}

function makeRec(overrides: Partial<Recommendation> = {}): Recommendation {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? 'rec-1',
    actionId: overrides.actionId ?? 'record_experience',
    actionParams: overrides.actionParams,
    title: overrides.title ?? 'Test Recommendation',
    action: overrides.action ?? 'Do something',
    icon: overrides.icon ?? '🎯',
    priority: overrides.priority ?? 'medium',
    sourceRule: overrides.sourceRule ?? 'stale',
    status: overrides.status ?? 'pending',
    statusUpdatedAt: overrides.statusUpdatedAt ?? now,
    evidence: overrides.evidence,
  };
}

function makeDiagnosis(overrides: Partial<CoachDiagnosis> = {}): CoachDiagnosis {
  return {
    summary: overrides.summary ?? {
      headline: 'Test',
      highlights: [],
      concerns: [],
      nextAction: 'Test',
    },
    insights: overrides.insights ?? [],
    recommendations: overrides.recommendations ?? [],
    generatedAt: overrides.generatedAt ?? new Date().toISOString(),
  };
}

function WrapperWithStore({
  children,
  store,
}: {
  children: React.ReactNode;
  store: ReturnType<typeof makeStore>;
}) {
  return (
    <Provider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );
}

const FIXED_NOW = new Date('2026-06-06T00:00:00Z');

// ─── CoachHeader ─────────────────────────────────────────────────────

describe('CoachHeader', () => {
  test('renders header title', () => {
    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });
    render(
      <WrapperWithStore store={store}>
        <CoachHeader />
      </WrapperWithStore>,
    );
    expect(screen.getByText('AI 成长教练')).toBeInTheDocument();
  });

  test('renders refresh button', () => {
    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });
    render(
      <WrapperWithStore store={store}>
        <CoachHeader />
      </WrapperWithStore>,
    );
    expect(screen.getByRole('button', { name: /重新分析/ })).toBeInTheDocument();
  });

  test('shows relative time when lastAnalyzedAt is set', () => {
    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: FIXED_NOW.toISOString(),
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });
    render(
      <WrapperWithStore store={store}>
        <CoachHeader />
      </WrapperWithStore>,
    );
    expect(screen.getByText(/上次更新/)).toBeInTheDocument();
  });
});

// ─── CoachSummarySection ─────────────────────────────────────────────

describe('CoachSummarySection', () => {
  test('renders summary sections', () => {
    const diagnosis = makeDiagnosis({
      summary: {
        headline: '系统设计停滞，TypeScript 持续增长',
        highlights: ['TypeScript 本月 +15', '完成了 2 次高质量复盘'],
        concerns: ['系统设计已 60 天未训练'],
        nextAction: '为「系统设计」安排一次实践练习',
        completionRate: { completedThisWeek: 3, totalThisWeek: 5 },
      },
    });
    const store = makeStore({
      coach: {
        diagnosis,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });
    render(
      <WrapperWithStore store={store}>
        <CoachSummarySection />
      </WrapperWithStore>,
    );
    expect(screen.getByText(/系统设计停滞/)).toBeInTheDocument();
    expect(screen.getByText(/TypeScript 本月/)).toBeInTheDocument();
    expect(screen.getByText(/系统设计.*60.*天/)).toBeInTheDocument();
    expect(screen.getByText(/为.*系统设计.*安排/)).toBeInTheDocument();
  });

  test('shows completion rate progress', () => {
    const diagnosis = makeDiagnosis({
      summary: {
        headline: 'Test',
        highlights: [],
        concerns: [],
        nextAction: '',
        completionRate: { completedThisWeek: 3, totalThisWeek: 5 },
      },
    });
    const store = makeStore({
      coach: {
        diagnosis,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });
    render(
      <WrapperWithStore store={store}>
        <CoachSummarySection />
      </WrapperWithStore>,
    );
    // Shows 3/5
    expect(screen.getByText(/3\/5/)).toBeInTheDocument();
  });
});

// ─── TopRecommendationCard ───────────────────────────────────────────

describe('TopRecommendationCard', () => {
  test('renders hero card with title and action', () => {
    const rec = makeRec({
      id: 'rec-top',
      title: '复盘「Flutter 重构」项目',
      action: '已活跃 60 天未复盘',
      actionId: 'review_project',
      actionParams: { projectId: 'p1' },
      priority: 'high',
    });
    render(
      <MemoryRouter>
        <TopRecommendationCard rec={rec} />
      </MemoryRouter>,
    );
    expect(screen.getByText('复盘「Flutter 重构」项目')).toBeInTheDocument();
    expect(screen.getByText('已活跃 60 天未复盘')).toBeInTheDocument();
  });

  test('renders as link with correct route', () => {
    const rec = makeRec({
      actionId: 'review_project',
      actionParams: { projectId: 'p-1' },
    });
    render(
      <MemoryRouter>
        <TopRecommendationCard rec={rec} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/projects/p-1/retrospect');
  });

  test('renders evidence section when present', () => {
    const rec = makeRec({
      title: 'Test Rec',
      evidence: ['rule-a', 'rule-b'],
    });
    const { container } = render(
      <MemoryRouter>
        <TopRecommendationCard rec={rec} />
      </MemoryRouter>,
    );
    // Evidence section is rendered in the card
    expect(container.textContent).toContain('rule-a');
    expect(container.textContent).toContain('rule-b');
  });
});

// ─── OtherRecommendations ────────────────────────────────────────────

describe('OtherRecommendations', () => {
  test('renders recommendation list', () => {
    const recs = [makeRec({ id: 'r1', title: '建议一' }), makeRec({ id: 'r2', title: '建议二' })];
    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });
    render(
      <WrapperWithStore store={store}>
        <OtherRecommendations recs={recs} />
      </WrapperWithStore>,
    );
    expect(screen.getByText('建议一')).toBeInTheDocument();
    expect(screen.getByText('建议二')).toBeInTheDocument();
  });

  test('completed recommendations are not shown', () => {
    const recs = [
      makeRec({ id: 'r1', title: '待处理', status: 'pending' }),
      makeRec({ id: 'r2', title: '已完成', status: 'completed' }),
    ];
    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });
    render(
      <WrapperWithStore store={store}>
        <OtherRecommendations recs={recs} />
      </WrapperWithStore>,
    );
    expect(screen.getByText('待处理')).toBeInTheDocument();
    expect(screen.queryByText('已完成')).not.toBeInTheDocument();
  });

  test('dismissed recommendations show dismiss button only for pending', () => {
    const recs = [
      makeRec({ id: 'r1', title: '待处理', status: 'pending' }),
      makeRec({ id: 'r2', title: '已忽略', status: 'dismissed' }),
    ];
    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });
    render(
      <WrapperWithStore store={store}>
        <OtherRecommendations recs={recs} />
      </WrapperWithStore>,
    );
    // Both are rendered (only 'completed' is filtered out)
    expect(screen.getByText('待处理')).toBeInTheDocument();
    expect(screen.getByText('已忽略')).toBeInTheDocument();
    // Only pending has dismiss button
    expect(screen.getByLabelText('忽略')).toBeInTheDocument();
  });
});

// ─── EmptyStateChecklist ─────────────────────────────────────────────

describe('EmptyStateChecklist', () => {
  test('shows 3-step checklist when completely empty', () => {
    const { container } = render(
      <MemoryRouter>
        <EmptyStateChecklist
          hasCapabilities={false}
          hasExperiences={false}
          hasRetrospectives={false}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('开启你的成长教练')).toBeInTheDocument();
    // Check for progress bar elements (i18n not initialized → returns key)
    const textContent = container.textContent;
    expect(textContent).toContain('0/3');
    expect(textContent).toContain('0%');
    // Check the rendered text content contains step labels
    expect(textContent).toContain('创建你的第一个能力');
    expect(textContent).toContain('记录第一段经历');
    expect(textContent).toContain('完成第一次复盘');
  });

  test('shows partial progress when capability exists', () => {
    const { container } = render(
      <MemoryRouter>
        <EmptyStateChecklist
          hasCapabilities={true}
          hasExperiences={false}
          hasRetrospectives={false}
        />
      </MemoryRouter>,
    );
    // Check progress bar shows 1/3
    const textContent = container.textContent;
    expect(textContent).toContain('1/3');
    expect(textContent).toContain('33%');
  });

  test('shows all completed when everything exists', () => {
    const { container } = render(
      <MemoryRouter>
        <EmptyStateChecklist
          hasCapabilities={true}
          hasExperiences={true}
          hasRetrospectives={true}
        />
      </MemoryRouter>,
    );
    const textContent = container.textContent;
    expect(textContent).toContain('3/3');
    expect(textContent).toContain('100%');
    expect(textContent).toContain('全部完成');
  });

  test('navigates to correct page on step click', () => {
    render(
      <MemoryRouter>
        <EmptyStateChecklist
          hasCapabilities={false}
          hasExperiences={false}
          hasRetrospectives={false}
        />
      </MemoryRouter>,
    );
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute('href', '/capabilities');
  });
});

// ─── InsightPanel ────────────────────────────────────────────────────

describe('InsightPanel', () => {
  test('renders empty state when no insights', () => {
    const store = makeStore({
      coach: {
        diagnosis: makeDiagnosis({ insights: [] }),
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });
    render(
      <WrapperWithStore store={store}>
        <InsightPanel />
      </WrapperWithStore>,
    );
    // Empty state shows "洞察分析" heading and "暂无洞察" message
    expect(screen.getByText('洞察分析')).toBeInTheDocument();
    expect(screen.getByText('暂无洞察')).toBeInTheDocument();
  });

  test('renders insight groups', () => {
    const insights: Insight[] = [
      { type: 'stale', icon: '⚠️', title: '能力 A 已停滞', description: '', severity: 'important' },
      { type: 'growth', icon: '📈', title: '能力 B 在增长', description: '', severity: 'info' },
    ];
    const store = makeStore({
      coach: {
        diagnosis: makeDiagnosis({ insights }),
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });
    render(
      <WrapperWithStore store={store}>
        <InsightPanel />
      </WrapperWithStore>,
    );
    // Stale group is expanded (important), so its title is visible
    expect(screen.getByText(/能力 A 已停滞/)).toBeInTheDocument();
    // Growth group header shows "增长信号" (not "能力趋势" — growth maps to "增长信号")
    expect(screen.getByText(/增长信号/)).toBeInTheDocument();
    // Expand/collapse button
    expect(screen.getByText(/折叠全部/)).toBeInTheDocument();
  });
});

// ─── RecommendationStatusBadge ───────────────────────────────────────

describe('RecommendationStatusBadge', () => {
  test('renders pending badge', () => {
    render(<RecommendationStatusBadge status="pending" />);
    expect(screen.getByText(/待处理|pending/i)).toBeInTheDocument();
  });

  test('renders in_progress badge', () => {
    render(<RecommendationStatusBadge status="in_progress" />);
    expect(screen.getByText(/进行中|in_progress/i)).toBeInTheDocument();
  });

  test('renders completed badge', () => {
    render(<RecommendationStatusBadge status="completed" />);
    expect(screen.getByText(/已完成|completed/i)).toBeInTheDocument();
  });

  test('renders dismissed badge', () => {
    render(<RecommendationStatusBadge status="dismissed" />);
    expect(screen.getByText(/已忽略|dismissed/i)).toBeInTheDocument();
  });
});

// ─── CompletedGrowth ─────────────────────────────────────────────────

describe('CompletedGrowth', () => {
  test('renders empty when no completed recommendations', () => {
    render(<CompletedGrowth completedRecs={[]} />);
    expect(screen.queryByText(/已完成的成长/)).not.toBeInTheDocument();
  });

  test('renders completed recommendations count', () => {
    const completed = [makeRec({ id: 'c1', title: '已完成任务 1', status: 'completed' })];
    render(<CompletedGrowth completedRecs={completed} />);
    expect(screen.getByText(/已完成的成长/)).toBeInTheDocument();
  });
});
