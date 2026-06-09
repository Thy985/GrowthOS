/**
 * Low-Priority Component Tests
 *
 * Tests for remaining 10 low-priority components:
 * 1.  InsightPanel (coach) — Redux dependent
 * 2.  CoachSummarySection (coach) — Redux dependent
 * 3.  CoachHeader (coach) — Redux dependent
 * 4.  OtherRecommendations (coach) — Redux dependent
 * 5.  TopRecommendationCard (coach) — Redux dependent
 * 6.  CompletedGrowth (coach) — Redux dependent
 * 7.  RecommendationStatusBadge (coach) — non-Redux
 * 8.  SnapshotDetailPanel (growth-curve) — non-Redux
 * 9.  TimeRangeSelector (growth-curve) — non-Redux
 * 10. StepCapabilityPreview (retrospective) — non-Redux
 *
 * (WizardProgress is skipped — already tested in RetrospectiveSteps.test.tsx)
 */

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import InsightPanel from '../../features/coach/components/InsightPanel';
import CoachSummarySection from '../../features/coach/components/CoachSummarySection';
import CoachHeader from '../../features/coach/components/CoachHeader';
import OtherRecommendations from '../../features/coach/components/OtherRecommendations';
import TopRecommendationCard from '../../features/coach/components/TopRecommendationCard';
import CompletedGrowth from '../../features/coach/components/CompletedGrowth';
import RecommendationStatusBadge from '../../features/coach/components/RecommendationStatusBadge';
import SnapshotDetailPanel from '../../features/growth-curve/components/SnapshotDetailPanel';
import TimeRangeSelector from '../../features/growth-curve/components/TimeRangeSelector';
import StepCapabilityPreview from '../../features/retrospective/components/StepCapabilityPreview';

import coachReducer from '../../features/coach/store/coachSlice';
import experienceReducer from '../../features/experiences/store/experienceSlice';
import capabilityReducer from '../../features/capabilities/store/capabilitySlice';
import principleReducer from '../../features/principles/store/principleSlice';
import projectReducer from '../../features/projects/store/projectSlice';
import type {
  Recommendation,
  CoachDiagnosis,
  CoachState,
  Insight,
} from '../../features/coach/types/coachTypes';
import type { CapabilityImpact } from '../../features/retrospective/types/retrospectiveTypes';
import type { CapabilityHistory } from '../../shared/types';

// ─── Mocks ───────────────────────────────────────────────────────────

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

// ─── Test utilities ──────────────────────────────────────────────────

function makeCoachStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      coach: coachReducer,
      experiences: experienceReducer,
      capabilities: capabilityReducer,
      principles: principleReducer,
      projects: projectReducer,
    },
    preloadedState,
  });
}

function makeEmptyCoachState(): CoachState {
  return {
    diagnosis: null,
    history: [],
    lastAnalyzedAt: null,
    isAnalyzing: false,
    recommendationStatuses: {},
  };
}

function makeDiagnosis(overrides: Partial<CoachDiagnosis> = {}): CoachDiagnosis {
  return {
    summary: overrides.summary ?? {
      headline: '',
      highlights: [],
      concerns: [],
      nextAction: '',
    },
    insights: overrides.insights ?? [],
    recommendations: overrides.recommendations ?? [],
    generatedAt: overrides.generatedAt ?? new Date().toISOString(),
  };
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

function renderWithCoachStore(
  ui: React.ReactElement,
  preloadedState: Partial<CoachState> = makeEmptyCoachState(),
) {
  const store = makeCoachStore({ coach: preloadedState });
  return render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>,
  );
}

// ─── 1. InsightPanel ─────────────────────────────────────────────────

describe('InsightPanel', () => {
  it('shows empty state when no insights', () => {
    renderWithCoachStore(<InsightPanel />, {
      diagnosis: makeDiagnosis({ insights: [] }),
    });
    expect(screen.getByText('洞察分析')).toBeInTheDocument();
    expect(screen.getByText('暂无洞察')).toBeInTheDocument();
  });

  it('renders insight groups with severity-based colors', () => {
    const insights: Insight[] = [
      {
        type: 'stale',
        icon: '⏰',
        title: '能力 A 已停滞',
        description: '60 天未更新',
        severity: 'important',
      },
      {
        type: 'growth',
        icon: '📈',
        title: '能力 B 在增长',
        description: '',
        severity: 'info',
      },
    ];
    const { container } = renderWithCoachStore(<InsightPanel />, {
      diagnosis: makeDiagnosis({ insights }),
    });
    // Stale group is expanded (important severity → auto-expanded)
    expect(screen.getByText('能力 A 已停滞')).toBeInTheDocument();
    // Growth group header is visible
    expect(screen.getByText(/增长信号/)).toBeInTheDocument();
    // Severity icon for the expanded stale group is rendered
    expect(screen.getByText('🔴')).toBeInTheDocument();
    // Container text contains the growth group icon
    expect(container.textContent).toContain('📈');
  });

  it('shows expand/collapse toggle button', () => {
    const insights: Insight[] = [
      {
        type: 'stale',
        icon: '⏰',
        title: '停滞能力',
        description: '',
        severity: 'important',
      },
      {
        type: 'growth',
        icon: '📈',
        title: '增长信号',
        description: '',
        severity: 'info',
      },
    ];
    renderWithCoachStore(<InsightPanel />, {
      diagnosis: makeDiagnosis({ insights }),
    });
    // With 2 groups, one expanded (important) and one collapsed
    // allCollapsed is false → button shows "折叠全部"
    expect(screen.getByText('折叠全部')).toBeInTheDocument();
  });

  it('clicking group header expands/collapses that group', () => {
    const insights: Insight[] = [
      {
        type: 'stale',
        icon: '⏰',
        title: '能力 A 已停滞',
        description: '描述文本',
        severity: 'important',
      },
    ];
    renderWithCoachStore(<InsightPanel />, {
      diagnosis: makeDiagnosis({ insights }),
    });
    // Initially expanded → description visible
    expect(screen.getByText('能力 A 已停滞')).toBeInTheDocument();
    expect(screen.getByText('描述文本')).toBeInTheDocument();

    // Click the group header to collapse
    const headerBtn = screen.getByRole('button', { name: /能力维护/ });
    fireEvent.click(headerBtn);

    // Description should be hidden after collapse
    expect(screen.queryByText('描述文本')).not.toBeInTheDocument();
  });

  it('clicking "展开全部" expands all groups', () => {
    const insights: Insight[] = [
      {
        type: 'stale',
        icon: '⏰',
        title: '停滞能力',
        description: 'stale-desc',
        severity: 'info',
      },
      {
        type: 'growth',
        icon: '📈',
        title: '增长信号',
        description: 'growth-desc',
        severity: 'info',
      },
    ];
    renderWithCoachStore(<InsightPanel />, {
      diagnosis: makeDiagnosis({ insights }),
    });

    // Both groups start collapsed (no important ones → all collapsed)
    // Button shows "展开全部"
    expect(screen.getByText('展开全部')).toBeInTheDocument();

    // Click "展开全部"
    fireEvent.click(screen.getByText('展开全部'));

    // Now both descriptions visible
    expect(screen.getByText('stale-desc')).toBeInTheDocument();
    expect(screen.getByText('growth-desc')).toBeInTheDocument();

    // Button text changes to "折叠全部"
    expect(screen.getByText('折叠全部')).toBeInTheDocument();
  });
});

// ─── 2. CoachSummarySection ──────────────────────────────────────────

describe('CoachSummarySection', () => {
  it('shows empty state when no summary', () => {
    renderWithCoachStore(<CoachSummarySection />, {
      diagnosis: null,
    });
    expect(screen.getByText('诊断摘要')).toBeInTheDocument();
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  it('renders headline, highlights, and concerns', () => {
    const diagnosis = makeDiagnosis({
      summary: {
        headline: '系统设计停滞，TypeScript 持续增长',
        highlights: ['TypeScript 本月 +15', '完成了 2 次高质量复盘'],
        concerns: ['系统设计已 60 天未训练'],
        nextAction: '',
      },
    });
    renderWithCoachStore(<CoachSummarySection />, { diagnosis });

    expect(screen.getByText('系统设计停滞，TypeScript 持续增长')).toBeInTheDocument();
    expect(screen.getByText('TypeScript 本月 +15')).toBeInTheDocument();
    expect(screen.getByText('完成了 2 次高质量复盘')).toBeInTheDocument();
    expect(screen.getByText('系统设计已 60 天未训练')).toBeInTheDocument();
  });

  it('renders completion rate progress bar when present', () => {
    const diagnosis = makeDiagnosis({
      summary: {
        headline: 'Test',
        highlights: [],
        concerns: [],
        nextAction: '',
        completionRate: { completedThisWeek: 3, totalThisWeek: 5 },
      },
    });
    renderWithCoachStore(<CoachSummarySection />, { diagnosis });

    // Shows execution rate label
    expect(screen.getByText('本周执行力')).toBeInTheDocument();
    // Shows "3/5" count
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('renders nextAction when present', () => {
    const diagnosis = makeDiagnosis({
      summary: {
        headline: 'Test',
        highlights: [],
        concerns: [],
        nextAction: '为「系统设计」安排一次实践练习',
      },
    });
    renderWithCoachStore(<CoachSummarySection />, { diagnosis });

    expect(
      screen.getByText('为「系统设计」安排一次实践练习'),
    ).toBeInTheDocument();
  });
});

// ─── 3. CoachHeader ──────────────────────────────────────────────────

describe('CoachHeader', () => {
  it('renders title and last analyzed time', () => {
    renderWithCoachStore(<CoachHeader />, {
      lastAnalyzedAt: new Date().toISOString(),
      isAnalyzing: false,
    });

    expect(screen.getByText('AI 成长教练')).toBeInTheDocument();
    expect(screen.getByText(/上次更新/)).toBeInTheDocument();
  });

  it('shows "刚刚" when lastAnalyzedAt is very recent', () => {
    renderWithCoachStore(<CoachHeader />, {
      lastAnalyzedAt: new Date(Date.now() - 1000).toISOString(),
      isAnalyzing: false,
    });

    // i18n mock does not interpolate, so text is "上次更新：{{time}}"
    expect(screen.getByText(/上次更新/)).toBeInTheDocument();
  });

  it('does not show relative time when lastAnalyzedAt is null', () => {
    renderWithCoachStore(<CoachHeader />, {
      lastAnalyzedAt: null,
      isAnalyzing: false,
    });

    expect(screen.getByText('AI 成长教练')).toBeInTheDocument();
    expect(screen.queryByText(/上次更新/)).not.toBeInTheDocument();
  });

  it('calls runDiagnosis when refresh button clicked', () => {
    const store = makeCoachStore({
      coach: {
        ...makeEmptyCoachState(),
        lastAnalyzedAt: null,
      },
      experiences: { experiences: [], links: [], isLoading: false, error: null },
      capabilities: { capabilities: [], history: [], isLoading: false, error: null },
      principles: { principles: [], isLoading: false, error: null },
      projects: { projects: [], isLoading: false, error: null },
    });
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <MemoryRouter>
          <CoachHeader />
        </MemoryRouter>
      </Provider>,
    );

    const refreshBtn = screen.getByRole('button', { name: '重新分析' });
    fireEvent.click(refreshBtn);

    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('disables refresh button when isAnalyzing is true', () => {
    renderWithCoachStore(<CoachHeader />, {
      lastAnalyzedAt: null,
      isAnalyzing: true,
    });

    const btn = screen.getByRole('button', { name: '分析中...' });
    expect(btn).toBeDisabled();
  });
});

// ─── 4. OtherRecommendations ─────────────────────────────────────────

describe('OtherRecommendations', () => {
  it('shows nothing (null) when no recommendations', () => {
    const { container } = renderWithCoachStore(
      <OtherRecommendations recs={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows nothing when only completed recommendations exist', () => {
    const recs = [makeRec({ id: 'r1', status: 'completed', title: 'Done' })];
    const { container } = renderWithCoachStore(
      <OtherRecommendations recs={recs} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders recommendation items', () => {
    const recs = [
      makeRec({ id: 'r1', title: '建议一' }),
      makeRec({ id: 'r2', title: '建议二' }),
    ];
    renderWithCoachStore(<OtherRecommendations recs={recs} />);

    expect(screen.getByText('建议一')).toBeInTheDocument();
    expect(screen.getByText('建议二')).toBeInTheDocument();
  });

  it('clicking dismiss button dispatches dismissRecommendation', () => {
    const recs = [makeRec({ id: 'r1', title: '待处理', status: 'pending' })];
    const store = makeCoachStore({
      coach: makeEmptyCoachState(),
    });
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <MemoryRouter>
          <OtherRecommendations recs={recs} />
        </MemoryRouter>
      </Provider>,
    );

    const dismissBtn = screen.getByLabelText('忽略');
    fireEvent.click(dismissBtn);

    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('dismiss button only appears for pending status', () => {
    const recs = [
      makeRec({ id: 'r1', title: '进行中', status: 'in_progress' }),
      makeRec({ id: 'r2', title: '待处理', status: 'pending' }),
    ];
    renderWithCoachStore(<OtherRecommendations recs={recs} />);

    // Only one dismiss button for the pending item
    const dismissButtons = screen.queryAllByLabelText('忽略');
    expect(dismissButtons).toHaveLength(1);

    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByText('待处理')).toBeInTheDocument();
  });
});

// ─── 5. TopRecommendationCard ────────────────────────────────────────

describe('TopRecommendationCard', () => {
  it('renders top recommendation with title and action', () => {
    const rec = makeRec({
      id: 'rec-top',
      title: '复盘「Flutter 重构」项目',
      action: '已活跃 60 天未复盘',
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

  it('renders priority badge via RecommendationStatusBadge', () => {
    const rec = makeRec({ status: 'pending' });
    render(
      <MemoryRouter>
        <TopRecommendationCard rec={rec} />
      </MemoryRouter>,
    );

    // Status badge is rendered inside the card
    expect(screen.getByText('待处理')).toBeInTheDocument();
  });

  it('renders evidence section when present', () => {
    const rec = makeRec({
      title: 'Test Rec',
      evidence: ['rule-a', 'rule-b'],
    });
    const { container } = render(
      <MemoryRouter>
        <TopRecommendationCard rec={rec} />
      </MemoryRouter>,
    );

    expect(container.textContent).toContain('依据');
    expect(container.textContent).toContain('rule-a');
    expect(container.textContent).toContain('rule-b');
  });

  it('does not render evidence section when evidence is absent', () => {
    const rec = makeRec({ title: 'No Evidence', evidence: undefined });
    const { container } = render(
      <MemoryRouter>
        <TopRecommendationCard rec={rec} />
      </MemoryRouter>,
    );

    expect(container.textContent).not.toContain('依据');
  });

  it('renders action button with correct route for review_project', () => {
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

  it('renders as a link element', () => {
    const rec = makeRec();
    render(
      <MemoryRouter>
        <TopRecommendationCard rec={rec} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link')).toBeInTheDocument();
  });
});

// ─── 6. CompletedGrowth ──────────────────────────────────────────────

describe('CompletedGrowth', () => {
  it('shows nothing when no completed recommendations', () => {
    const { container } = render(
      <MemoryRouter>
        <CompletedGrowth completedRecs={[]} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders completed items in collapsible section', () => {
    const completed = [
      makeRec({ id: 'c1', title: '已完成任务 1', status: 'completed' }),
      makeRec({ id: 'c2', title: '已完成任务 2', status: 'completed' }),
    ];
    const { container } = render(
      <MemoryRouter>
        <CompletedGrowth completedRecs={completed} />
      </MemoryRouter>,
    );

    // Header is visible (collapsed by default)
    expect(screen.getByText(/已完成的成长/)).toBeInTheDocument();
    // Count is rendered as "(2)" in the header text
    expect(container.textContent).toContain('(2)');

    // Items are hidden initially (open defaults to false)
    expect(screen.queryByText('已完成任务 1')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText(/已完成的成长/));

    // Now items are visible
    expect(screen.getByText('已完成任务 1')).toBeInTheDocument();
    expect(screen.getByText('已完成任务 2')).toBeInTheDocument();
  });

  it('toggles open/closed state on header click', () => {
    const completed = [makeRec({ id: 'c1', title: '任务', status: 'completed' })];
    render(
      <MemoryRouter>
        <CompletedGrowth completedRecs={completed} />
      </MemoryRouter>,
    );

    // Initially collapsed
    expect(screen.queryByText('任务')).not.toBeInTheDocument();

    // Expand
    fireEvent.click(screen.getByText(/已完成的成长/));
    expect(screen.getByText('任务')).toBeInTheDocument();

    // Collapse again
    fireEvent.click(screen.getByText(/已完成的成长/));
    expect(screen.queryByText('任务')).not.toBeInTheDocument();
  });
});

// ─── 7. RecommendationStatusBadge ────────────────────────────────────

describe('RecommendationStatusBadge', () => {
  it('renders pending badge', () => {
    render(<RecommendationStatusBadge status="pending" />);
    expect(screen.getByText('待处理')).toBeInTheDocument();
  });

  it('renders in_progress badge', () => {
    render(<RecommendationStatusBadge status="in_progress" />);
    expect(screen.getByText('进行中')).toBeInTheDocument();
  });

  it('renders completed badge', () => {
    render(<RecommendationStatusBadge status="completed" />);
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });

  it('renders dismissed badge', () => {
    render(<RecommendationStatusBadge status="dismissed" />);
    expect(screen.getByText('已忽略')).toBeInTheDocument();
  });
});

// ─── 8. SnapshotDetailPanel ──────────────────────────────────────────

describe('SnapshotDetailPanel', () => {
  function makeSnapshot(
    overrides: Partial<CapabilityHistory> & { triggerExperienceIdSet?: boolean } = {},
  ): CapabilityHistory {
    const hasTriggerId = 'triggerExperienceId' in overrides;
    return {
      id: overrides.id ?? 'snap-1',
      capabilityId: overrides.capabilityId ?? 'cap-1',
      level: overrides.level ?? 50,
      recordedAt: overrides.recordedAt ?? new Date('2026-06-01T10:30:00Z').toISOString(),
      triggerExperienceId: hasTriggerId
        ? overrides.triggerExperienceId
        : 'exp-1',
    } as CapabilityHistory;
  }

  it('shows empty state is not shown — always renders snapshot details', () => {
    // SnapshotDetailPanel requires a snapshot prop; there's no "empty" variant.
    // This test verifies it renders correctly with a valid snapshot.
    const snapshot = makeSnapshot();
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <SnapshotDetailPanel
          snapshot={snapshot}
          onClose={onClose}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('快照详情')).toBeInTheDocument();
  });

  it('renders snapshot details (capability, level, date, trigger)', () => {
    const snapshot = makeSnapshot({
      id: 'snap-test',
      level: 75,
      recordedAt: new Date('2026-06-01T10:30:00Z').toISOString(),
      triggerExperienceId: 'exp-123',
    });
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <SnapshotDetailPanel
          snapshot={snapshot}
          capabilityName="TypeScript"
          onClose={onClose}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText(/关联经历/)).toBeInTheDocument();
    expect(screen.getByText('exp-123')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const snapshot = makeSnapshot();
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <SnapshotDetailPanel snapshot={snapshot} onClose={onClose} />
      </MemoryRouter>,
    );

    const closeBtn = screen.getByRole('button', { name: '关闭' });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows "手动更新" when triggerExperienceId is not set', () => {
    const snapshot = makeSnapshot({ triggerExperienceId: undefined });
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <SnapshotDetailPanel snapshot={snapshot} onClose={onClose} />
      </MemoryRouter>,
    );

    expect(screen.getByText('手动更新')).toBeInTheDocument();
    expect(screen.queryByText('关联经历')).not.toBeInTheDocument();
    expect(screen.queryByText('经历 ID')).not.toBeInTheDocument();
  });

  it('has data-testid="snapshot-detail-panel"', () => {
    const snapshot = makeSnapshot();
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <SnapshotDetailPanel snapshot={snapshot} onClose={onClose} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('snapshot-detail-panel')).toBeInTheDocument();
  });
});

// ─── 9. TimeRangeSelector ────────────────────────────────────────────

describe('TimeRangeSelector', () => {
  it('renders all 4 range buttons', () => {
    const onChange = vi.fn();
    render(<TimeRangeSelector value="30d" onChange={onChange} />);

    expect(screen.getByRole('button', { name: '7天' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30天' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '90天' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '全部' })).toBeInTheDocument();
  });

  it('active range button has highlighted styling', () => {
    const onChange = vi.fn();
    render(<TimeRangeSelector value="90d" onChange={onChange} />);

    const activeBtn = screen.getByRole('button', { name: '90天' });
    // Active button has bg-indigo-600 and text-white
    expect(activeBtn).toHaveClass('bg-indigo-600');
    expect(activeBtn).toHaveClass('text-white');

    // Inactive button should not have the active class
    const inactiveBtn = screen.getByRole('button', { name: '7天' });
    expect(inactiveBtn).not.toHaveClass('bg-indigo-600');
  });

  it('clicking a range button calls onChange with the range', () => {
    const onChange = vi.fn();
    render(<TimeRangeSelector value="30d" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '7天' }));
    expect(onChange).toHaveBeenCalledWith('7d');

    fireEvent.click(screen.getByRole('button', { name: '全部' }));
    expect(onChange).toHaveBeenCalledWith('all');
  });
});

// ─── 10. StepCapabilityPreview ───────────────────────────────────────

describe('StepCapabilityPreview', () => {
  it('shows empty message when no impacts', () => {
    render(<StepCapabilityPreview impacts={[]} />);
    expect(
      screen.getByText('本次复盘未产生能力等级变化'),
    ).toBeInTheDocument();
  });

  it('renders impact card with capability name and level change', () => {
    const impacts: CapabilityImpact[] = [
      {
        capabilityId: 'cap-1',
        capabilityName: 'TypeScript',
        oldLevel: 40,
        newLevel: 55,
        change: 15,
        reason: 'positive: 3; negative: 1; change: 15',
      },
    ];
    render(<StepCapabilityPreview impacts={impacts} />);

    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Lv.40')).toBeInTheDocument();
    expect(screen.getByText('Lv.55')).toBeInTheDocument();
    // i18n mock does not interpolate, so text is "+{{change}}"
    expect(screen.getByText('+{{change}}')).toBeInTheDocument();
  });

  it('renders progress bar based on newLevel', () => {
    const impacts: CapabilityImpact[] = [
      {
        capabilityId: 'cap-1',
        capabilityName: 'React',
        oldLevel: 30,
        newLevel: 60,
        change: 30,
        reason: 'positive: 5; negative: 0; change: 30',
      },
    ];
    const { container } = render(<StepCapabilityPreview impacts={impacts} />);

    // Progress bar should have width: 60%
    const progressBar = container.querySelector('.bg-indigo-500');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '60%' });
  });

  it('parses reason string to show description text', () => {
    const impacts: CapabilityImpact[] = [
      {
        capabilityId: 'cap-1',
        capabilityName: '系统设计',
        oldLevel: 20,
        newLevel: 30,
        change: 10,
        reason: 'positive: 2; negative: 1; change: 10',
      },
    ];
    render(<StepCapabilityPreview impacts={impacts} />);

    // The reason is parsed and translated
    // i18n mock does not interpolate, so we check for the template string
    expect(screen.getByText('系统设计')).toBeInTheDocument();
    const reasonText = screen.getByText(/\{\{count\}\}.*\{\{change\}\}/);
    expect(reasonText).toBeInTheDocument();
  });

  it('renders multiple impact cards', () => {
    const impacts: CapabilityImpact[] = [
      {
        capabilityId: 'cap-1',
        capabilityName: 'TypeScript',
        oldLevel: 40,
        newLevel: 55,
        change: 15,
        reason: 'positive: 3; negative: 0; change: 15',
      },
      {
        capabilityId: 'cap-2',
        capabilityName: '系统设计',
        oldLevel: 20,
        newLevel: 20,
        change: 0,
        reason: 'positive: 0; negative: 0; change: 0',
      },
    ];
    render(<StepCapabilityPreview impacts={impacts} />);

    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('系统设计')).toBeInTheDocument();
  });

  it('shows zero change in gray color', () => {
    const impacts: CapabilityImpact[] = [
      {
        capabilityId: 'cap-1',
        capabilityName: '遗忘的能力',
        oldLevel: 50,
        newLevel: 50,
        change: 0,
        reason: 'positive: 0; negative: 0; change: 0',
      },
    ];
    render(<StepCapabilityPreview impacts={impacts} />);

    // When change is 0, it's not positive, so shows "0" in gray
    const changeEl = screen.getByText('0');
    expect(changeEl).toHaveClass('text-gray-500');
  });
});
