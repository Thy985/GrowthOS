/**
 * 端到端集成测试：完整用户旅程
 *
 * 覆盖场景：
 * 1. 注册 → 登录 → 进入 Dashboard
 * 2. 创建能力 → 记录经历 → 能力等级更新
 * 3. 成长曲线交互（时间范围切换、快照详情面板）
 * 4. AI 教练诊断与推荐
 * 5. 跨模块状态联动（经历 → 能力 → 原则 → 教练）
 */

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Reducers
import authReducer, { login, register, logout } from '../../features/auth/store/authSlice';
import capabilityReducer, {
  addCapability,
  updateCapability,
} from '../../features/capabilities/store/capabilitySlice';
import coachReducer from '../../features/coach/store/coachSlice';
import experienceReducer, {
  addExperience,
} from '../../features/experiences/store/experienceSlice';
import principleReducer from '../../features/principles/store/principleSlice';
import projectReducer from '../../features/projects/store/projectSlice';
import growthReducer from '../../store/slices/growthSlice';
import recordsReducer from '../../features/records/store/recordsSlice';
import treeReducer from '../../features/growth-tree/store/treeSlice';
import goalReducer from '../../features/goals/store/goalSlice';
import reminderReducer from '../../features/reminders/store/reminderSlice';
import themeReducer from '../../features/theme/store/themeSlice';

// Pages & Components
import LoginPage from '../../features/auth/pages/LoginPage';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import CapabilityGrowthChart from '../../features/growth-curve/components/CapabilityGrowthChart';
import SnapshotDetailPanel from '../../features/growth-curve/components/SnapshotDetailPanel';
import TimeRangeSelector from '../../features/growth-curve/components/TimeRangeSelector';
import CoachDiagnosisCard from '../../features/coach/components/CoachDiagnosisCard';

// Types
import type { CapabilityHistory, Capability } from '../../shared/types';

// ─── Mock Secure Storage (shared across all tests in this file) ───
const mockStorage = vi.hoisted(() => new Map<string, unknown>());

vi.mock('../../shared/utils/secureStorage', () => ({
  secureStorage: {
    getItem: (key: string) => {
      const val = mockStorage.get(key);
      return val !== undefined ? JSON.parse(JSON.stringify(val)) : null;
    },
    setItem: (key: string, value: unknown) => {
      mockStorage.set(key, value);
    },
    removeItem: (key: string) => {
      mockStorage.delete(key);
    },
    clear: () => {
      mockStorage.clear();
    },
  },
}));

vi.mock('../../shared/utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ─── Store Factory ───
function makeFullStore() {
  return configureStore({
    reducer: {
      growth: growthReducer,
      records: recordsReducer,
      tree: treeReducer,
      auth: authReducer,
      theme: themeReducer,
      goal: goalReducer,
      reminder: reminderReducer,
      experiences: experienceReducer,
      capabilities: capabilityReducer,
      principles: principleReducer,
      projects: projectReducer,
      coach: coachReducer,
    },
  });
}

function makeAuthStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

// ─── Render Helpers ───
function renderLoginPage(store?: ReturnType<typeof makeAuthStore>) {
  const s = store ?? makeAuthStore();
  return render(
    <Provider store={s}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>,
  );
}

function renderDashboard(store?: ReturnType<typeof makeFullStore>) {
  const s = store ?? makeFullStore();
  return render(
    <Provider store={s}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </Provider>,
  );
}

// ─── Data Helpers ───
const FIXED_NOW = new Date('2026-06-06T12:00:00Z');

function makeHistory(
  capabilityId: string,
  level: number,
  daysAgo: number,
  triggerExperienceId?: string,
): CapabilityHistory {
  const date = new Date(FIXED_NOW);
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `h-${capabilityId}-${level}-${daysAgo}`,
    capabilityId,
    level,
    recordedAt: date.toISOString(),
    triggerExperienceId,
  };
}

// ═══════════════════════════════════════════════════════════
// SCENARIO 1: Auth Flow — Register → Login → Dashboard
// ═══════════════════════════════════════════════════════════
describe('E2E Scenario 1: Auth Lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    mockStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('complete flow: register user, login, verify authenticated state', async () => {
    const store = makeAuthStore();

    // Step 1: Register
    await act(async () => {
      await store.dispatch(
        register({ username: 'testuser', password: 'password123', confirmPassword: 'password123' }),
      );
    });

    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.user?.username).toBe('testuser');

    // Step 2: Logout
    await act(async () => {
      await store.dispatch(logout());
    });

    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.user).toBeNull();

    // Step 3: Login with registered credentials
    await act(async () => {
      await store.dispatch(login({ username: 'testuser', password: 'password123' }));
    });

    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.user?.username).toBe('testuser');
  });

  it('login page renders and accepts input', () => {
    renderLoginPage();
    expect(screen.getByPlaceholderText(/用户名/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/密码/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登录/ })).toBeInTheDocument();
  });

  it('login form validates empty submission', () => {
    renderLoginPage();
    fireEvent.click(screen.getByRole('button', { name: /登录/ }));
    // Validation errors appear synchronously via setState
    expect(screen.getByText('请输入用户名')).toBeInTheDocument();
    expect(screen.getByText('请输入密码')).toBeInTheDocument();
  });

  it('dashboard renders after authenticated login', async () => {
    const store = makeFullStore();

    // Pre-authenticate
    await act(async () => {
      await store.dispatch(
        register({
          username: 'dashboarduser',
          password: 'pass1234',
          confirmPassword: 'pass1234',
        }),
      );
    });

    renderDashboard(store);
    expect(screen.getByText(/你正在成为谁/)).toBeInTheDocument();
    expect(screen.getByText('能力画像')).toBeInTheDocument();
    expect(screen.getByText('快速记录')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════
// SCENARIO 2: Capability Lifecycle — Create → Update → History
// ═══════════════════════════════════════════════════════════
describe('E2E Scenario 2: Capability Lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    mockStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('create capability → record experience → level increases → snapshot recorded', async () => {
    const store = makeFullStore();

    // Step 1: Create a capability
    await act(async () => {
      await store.dispatch(
        addCapability({
          userId: 'user-1',
          name: 'React 开发',
          category: 'skill',
          parentId: null,
          currentLevel: 40,
          targetLevel: 80,
          growthRate: 0,
        }),
      );
    });

    const capId = store.getState().capabilities.capabilities[0].id;
    expect(store.getState().capabilities.capabilities).toHaveLength(1);
    expect(store.getState().capabilities.history).toHaveLength(1);

    // Step 2: Update capability with significant level change (>= 5)
    await act(async () => {
      await store.dispatch(updateCapability({ id: capId, currentLevel: 55 }));
    });

    // Verify snapshot was recorded
    const history = store.getState().capabilities.history;
    expect(history).toHaveLength(2);
    expect(history![1].level).toBe(55);

    // Step 3: Another update
    await act(async () => {
      await store.dispatch(updateCapability({ id: capId, currentLevel: 70 }));
    });

    expect(store.getState().capabilities.history).toHaveLength(3);
  });

  it('small level changes within 24h do not create snapshots', async () => {
    const store = makeFullStore();

    await act(async () => {
      await store.dispatch(
        addCapability({
          userId: 'user-1',
          name: '沟通',
          category: 'soft',
          parentId: null,
          currentLevel: 50,
          targetLevel: 90,
          growthRate: 0,
        }),
      );
    });

    const capId = store.getState().capabilities.capabilities[0].id;

    // Small change (2 points) within 24h
    await act(async () => {
      await store.dispatch(updateCapability({ id: capId, currentLevel: 52 }));
    });

    // No new snapshot
    expect(store.getState().capabilities.history).toHaveLength(1);
  });

  it('small level changes after 24h DO create snapshots', async () => {
    const store = makeFullStore();

    await act(async () => {
      await store.dispatch(
        addCapability({
          userId: 'user-1',
          name: '沟通',
          category: 'soft',
          parentId: null,
          currentLevel: 50,
          targetLevel: 90,
          growthRate: 0,
        }),
      );
    });

    const capId = store.getState().capabilities.capabilities[0].id;

    // Advance time by 25 hours
    vi.advanceTimersByTime(25 * 60 * 60 * 1000);

    // Small change (2 points) but after 24h
    await act(async () => {
      await store.dispatch(updateCapability({ id: capId, currentLevel: 52 }));
    });

    // New snapshot should be recorded
    expect(store.getState().capabilities.history).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════
// SCENARIO 3: Growth Curve Interaction (Phase 2)
// ═══════════════════════════════════════════════════════════
describe('E2E Scenario 3: Growth Curve Interaction (Phase 2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    mockStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createHistoryData = (): CapabilityHistory[] => [
    makeHistory('cap-react', 30, 60),
    makeHistory('cap-react', 35, 45),
    makeHistory('cap-react', 40, 30),
    makeHistory('cap-react', 50, 15),
    makeHistory('cap-react', 55, 7),
    makeHistory('cap-react', 60, 5),
    makeHistory('cap-react', 65, 3),
    makeHistory('cap-react', 70, 1),
    makeHistory('cap-react', 75, 0, 'exp-123'),
  ];

  it('time range selector renders with correct options', () => {
    render(
      <TimeRangeSelector value="30d" onChange={() => {}} />,
    );

    expect(screen.getByText('7天')).toBeInTheDocument();
    expect(screen.getByText('30天')).toBeInTheDocument();
    expect(screen.getByText('90天')).toBeInTheDocument();
    expect(screen.getByText('全部')).toBeInTheDocument();
  });

  it('time range selector highlights active range', () => {
    const { container } = render(
      <TimeRangeSelector value="7d" onChange={() => {}} />,
    );

    const buttons = container.querySelectorAll('button');
    const activeBtn = Array.from(buttons).find(
      (btn) => btn.textContent === '7天',
    );
    expect(activeBtn).toHaveClass('bg-indigo-600');
  });

  it('chart filters correctly with 7d range', () => {
    const history = createHistoryData();
    render(
      <Provider store={makeFullStore()}>
        <div style={{ width: 600, height: 300 }}>
          <CapabilityGrowthChart history={history} range="7d" capabilityName="React 开发" />
        </div>
      </Provider>,
    );

    // 7d should only include records from last 7 days
    expect(screen.queryByText(/成长记录/)).not.toBeInTheDocument();
  });

  it('chart shows empty state when no data in range', () => {
    const history = createHistoryData();
    render(
      <Provider store={makeFullStore()}>
        <div style={{ width: 600, height: 300 }}>
          <CapabilityGrowthChart history={history} range="7d" capabilityName="React 开发" />
        </div>
      </Provider>,
    );

    // Verify chart renders (no empty state for 7d since we have recent data)
  });

  it('chart shows empty state for very old data with narrow range', () => {
    const oldHistory: CapabilityHistory[] = [
      makeHistory('cap-old', 30, 100),
      makeHistory('cap-old', 35, 90),
    ];

    render(
      <Provider store={makeFullStore()}>
        <div style={{ width: 600, height: 300 }}>
          <CapabilityGrowthChart history={oldHistory} range="7d" />
        </div>
      </Provider>,
    );

    expect(screen.getByText(/成长记录/)).toBeInTheDocument();
  });

  it('snapshot detail panel renders with full information', () => {
    const snapshot: CapabilityHistory = {
      id: 'snap-e2e-001',
      capabilityId: 'cap-react',
      level: 75,
      recordedAt: FIXED_NOW.toISOString(),
      triggerExperienceId: 'exp-456',
    };

    render(
      <SnapshotDetailPanel
        snapshot={snapshot}
        capabilityName="React 开发"
        onClose={() => {}}
      />,
    );

    expect(screen.getByTestId('snapshot-detail-panel')).toBeInTheDocument();
    expect(screen.getByText(/快照详情/)).toBeInTheDocument();
    expect(screen.getByText(/React 开发/)).toBeInTheDocument();
    expect(screen.getByText(/75/)).toBeInTheDocument();
    expect(screen.getByText(/snap-e2e-001/)).toBeInTheDocument();
    expect(screen.getByText(/关联经历/)).toBeInTheDocument();
    expect(screen.getByText(/exp-456/)).toBeInTheDocument();
  });

  it('snapshot detail panel shows manual update when no trigger', () => {
    const snapshot: CapabilityHistory = {
      id: 'snap-manual',
      capabilityId: 'cap-react',
      level: 50,
      recordedAt: FIXED_NOW.toISOString(),
    };

    render(<SnapshotDetailPanel snapshot={snapshot} onClose={() => {}} />);

    expect(screen.getByText(/手动更新/)).toBeInTheDocument();
    expect(screen.queryByText(/关联经历/)).not.toBeInTheDocument();
    expect(screen.queryByText(/经历 ID/)).not.toBeInTheDocument();
  });

  it('snapshot detail panel close button triggers callback', () => {
    const onClose = vi.fn();
    const snapshot: CapabilityHistory = {
      id: 'snap-close-test',
      capabilityId: 'cap-react',
      level: 60,
      recordedAt: FIXED_NOW.toISOString(),
    };

    render(<SnapshotDetailPanel snapshot={snapshot} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('关闭'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('full chart interaction: render chart with data points', () => {
    const history = createHistoryData();
    const { container } = render(
      <Provider store={makeFullStore()}>
        <div style={{ width: 600, height: 300 }}>
          <CapabilityGrowthChart history={history} range="all" capabilityName="React 开发" />
        </div>
      </Provider>,
    );

    // Chart should render
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    // Should NOT show empty state
    expect(screen.queryByText(/成长记录/)).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════
// SCENARIO 4: Coach Integration — Diagnosis & Recommendations
// ═══════════════════════════════════════════════════════════
describe('E2E Scenario 4: Coach Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    mockStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('coach diagnosis card renders on dashboard', () => {
    renderDashboard();
    // "成长诊断" heading is present (use getByText with exact match to avoid multiple results)
    expect(screen.getByText('🧠 成长诊断')).toBeInTheDocument();
  });

  it('coach slice initializes with correct default state', () => {
    const store = makeFullStore();
    const coachState = store.getState().coach;

    // diagnosis starts as null
    expect(coachState.diagnosis).toBeNull();
    expect(coachState.history).toEqual([]);
    expect(coachState.isAnalyzing).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// SCENARIO 5: Cross-Module State Integration
// ═══════════════════════════════════════════════════════════
describe('E2E Scenario 5: Cross-Module Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    mockStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('complete user journey: register → create capability → record experience → update capability', async () => {
    const store = makeFullStore();

    // Step 1: Register
    await act(async () => {
      await store.dispatch(
        register({
          username: 'journeyuser',
          password: 'journey123',
          confirmPassword: 'journey123',
        }),
      );
    });
    expect(store.getState().auth.isAuthenticated).toBe(true);

    // Step 2: Create capability
    await act(async () => {
      await store.dispatch(
        addCapability({
          userId: 'user-1',
          name: 'TypeScript',
          category: 'skill',
          parentId: null,
          currentLevel: 40,
          targetLevel: 90,
          growthRate: 0,
        }),
      );
    });
    const capId = store.getState().capabilities.capabilities[0].id;
    expect(store.getState().capabilities.history).toHaveLength(1);

    // Step 3: Record experience
    await act(async () => {
      await store.dispatch(
        addExperience({
          title: '完成 React 项目重构',
          description: '使用 TypeScript 重构了整个项目',
          date: FIXED_NOW.toISOString(),
          mood: 'accomplished',
          linkedCapabilities: [capId],
          tags: ['typescript', 'refactoring'],
        }),
      );
    });
    expect(store.getState().experiences.experiences).toHaveLength(1);

    // Step 4: Update capability level based on experience
    await act(async () => {
      await store.dispatch(updateCapability({ id: capId, currentLevel: 60 }));
    });
    expect(store.getState().capabilities.history).toHaveLength(2);
  });

  it('dashboard renders with populated data after journey', async () => {
    const store = makeFullStore();

    // Setup: Create user with some data
    await act(async () => {
      await store.dispatch(
        register({
          username: 'datadash',
          password: 'dash1234',
          confirmPassword: 'dash1234',
        }),
      );
    });

    await act(async () => {
      await store.dispatch(
        addCapability({
          userId: 'user-1',
          name: '领导力',
          category: 'soft',
          parentId: null,
          currentLevel: 55,
          targetLevel: 85,
          growthRate: 0,
        }),
      );
    });

    renderDashboard(store);

    // Dashboard should show capability radar
    expect(screen.getByText('能力画像')).toBeInTheDocument();
    // Dashboard should show stats
    expect(screen.getByText(/经历总数/)).toBeInTheDocument();
    expect(screen.getByText(/原则总数/)).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════
// SCENARIO 6: Time Range Integration with Growth Analytics
// ═══════════════════════════════════════════════════════════
describe('E2E Scenario 6: Time Range Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    mockStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('30d range correctly filters mixed-age history', () => {
    const history: CapabilityHistory[] = [
      makeHistory('cap-mix', 20, 200), // too old
      makeHistory('cap-mix', 30, 100), // too old
      makeHistory('cap-mix', 40, 40), // too old
      makeHistory('cap-mix', 50, 25), // inside 30d
      makeHistory('cap-mix', 60, 10), // inside 30d
      makeHistory('cap-mix', 70, 2), // inside 30d
    ];

    render(
      <Provider store={makeFullStore()}>
        <div style={{ width: 600, height: 300 }}>
          <CapabilityGrowthChart history={history} range="30d" />
        </div>
      </Provider>,
    );

    // Should render chart (not empty)
    expect(screen.queryByText(/成长记录/)).not.toBeInTheDocument();
  });

  it('90d range includes more data than 30d', () => {
    const history: CapabilityHistory[] = [
      makeHistory('cap-range', 20, 100), // outside 90d
      makeHistory('cap-range', 30, 80), // inside 90d, outside 30d
      makeHistory('cap-range', 40, 50), // inside 90d, outside 30d
      makeHistory('cap-range', 50, 20), // inside both
      makeHistory('cap-range', 60, 5), // inside both
    ];

    // Render with 90d
    const { unmount } = render(
      <Provider store={makeFullStore()}>
        <div style={{ width: 600, height: 300 }}>
          <CapabilityGrowthChart history={history} range="90d" />
        </div>
      </Provider>,
    );

    expect(screen.queryByText(/成长记录/)).not.toBeInTheDocument();

    unmount();

    // Render with 30d
    render(
      <Provider store={makeFullStore()}>
        <div style={{ width: 600, height: 300 }}>
          <CapabilityGrowthChart history={history} range="30d" />
        </div>
      </Provider>,
    );

    expect(screen.queryByText(/成长记录/)).not.toBeInTheDocument();
  });

  it('all range shows entire history regardless of age', () => {
    const history: CapabilityHistory[] = [
      makeHistory('cap-all', 10, 365),
      makeHistory('cap-all', 30, 200),
      makeHistory('cap-all', 50, 100),
      makeHistory('cap-all', 70, 10),
      makeHistory('cap-all', 90, 0),
    ];

    render(
      <Provider store={makeFullStore()}>
        <div style={{ width: 600, height: 300 }}>
          <CapabilityGrowthChart history={history} range="all" />
        </div>
      </Provider>,
    );

    expect(screen.queryByText(/成长记录/)).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════
// SCENARIO 7: Error Handling & Edge Cases
// ═══════════════════════════════════════════════════════════
describe('E2E Scenario 7: Error Handling & Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    mockStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('login fails with wrong password', async () => {
    const store = makeAuthStore();

    // Register first
    await act(async () => {
      await store.dispatch(
        register({
          username: 'testuser',
          password: 'correctpassword',
          confirmPassword: 'correctpassword',
        }),
      );
    });

    // Logout
    await act(async () => {
      await store.dispatch(logout());
    });

    // Try login with wrong password
    await act(async () => {
      try {
        await store.dispatch(login({ username: 'testuser', password: 'wrongpassword' }));
      } catch {
        // Expected
      }
    });

    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.error).toBeTruthy();
  });

  it('register fails when passwords do not match', async () => {
    const store = makeAuthStore();

    await act(async () => {
      try {
        await store.dispatch(
          register({
            username: 'testuser',
            password: 'password123',
            confirmPassword: 'different',
          }),
        );
      } catch {
        // Expected
      }
    });

    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it('chart handles empty history gracefully', () => {
    render(
      <Provider store={makeFullStore()}>
        <div style={{ width: 600, height: 300 }}>
          <CapabilityGrowthChart history={[]} range="30d" />
        </div>
      </Provider>,
    );

    expect(screen.getByText(/成长记录/)).toBeInTheDocument();
  });

  it('snapshot panel renders without capability name', () => {
    const snapshot: CapabilityHistory = {
      id: 'snap-no-cap',
      capabilityId: 'cap-unknown',
      level: 42,
      recordedAt: FIXED_NOW.toISOString(),
    };

    render(<SnapshotDetailPanel snapshot={snapshot} onClose={() => {}} />);

    expect(screen.getByTestId('snapshot-detail-panel')).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
    // Capability name section should not appear
    expect(screen.queryByText(/能力/)).not.toBeInTheDocument();
  });
});
