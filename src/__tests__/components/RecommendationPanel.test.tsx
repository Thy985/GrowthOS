import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import capabilityReducer from '../../features/capabilities/store/capabilitySlice';
import RecommendationPanel from '../../features/coach/components/RecommendationPanel';
import coachReducer from '../../features/coach/store/coachSlice';
import experienceReducer from '../../features/experiences/store/experienceSlice';
import principleReducer from '../../features/principles/store/principleSlice';
import projectReducer from '../../features/projects/store/projectSlice';

vi.mock('../../shared/utils/secureStorage', () => ({
  secureStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const recentTs = new Date().toISOString();

function makeStore(preloadedState = {}) {
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

function renderPanel(store = makeStore()) {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <RecommendationPanel />
      </MemoryRouter>
    </Provider>,
  );
}

describe('RecommendationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no recommendations', () => {
    renderPanel();
    expect(screen.getByText(/推荐下一步/)).toBeInTheDocument();
    expect(screen.getByText(/暂无推荐建议/)).toBeInTheDocument();
  });

  it('renders recommendations grouped by priority', () => {
    const store = makeStore({
      coach: {
        diagnosis: {
          summary: { headline: 'Test', highlights: [], concerns: [], nextAction: '' },
          insights: [],
          recommendations: [
            {
              id: 'rec-high',
              actionId: 'record_experience',
              icon: '📝',
              title: 'High priority item',
              action: 'High action',
              priority: 'high',
              sourceRule: 'stale',
              status: 'pending',
              statusUpdatedAt: recentTs,
              linkTo: { route: '/experiences/new', label: '去记录' },
            },
            {
              id: 'rec-low',
              actionId: 'manage_capability',
              icon: '💎',
              title: 'Low priority item',
              action: 'Low action',
              priority: 'low',
              sourceRule: 'growth',
              status: 'pending',
              statusUpdatedAt: recentTs,
              linkTo: { route: '/capabilities', label: '去管理' },
            },
          ],
          generatedAt: recentTs,
        },
        history: [],
        lastAnalyzedAt: recentTs,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
      experiences: {
        experiences: [
          {
            id: '1',
            userId: 'test',
            event: 'Test event',
            reflection: '',
            principle: '',
            confidence: 0.8,
            occurredAt: '2026-06-01',
            createdAt: '2026-06-01',
            updatedAt: '2026-06-01',
          },
        ],
        links: [],
        isLoading: false,
        error: null,
      },
    });
    renderPanel(store);

    expect(screen.getByText(/High priority item/)).toBeInTheDocument();
    expect(screen.getByText(/Low priority item/)).toBeInTheDocument();
    // Verify priority icons are rendered
    expect(screen.getByText(/🔴 High priority item/)).toBeInTheDocument();
    expect(screen.getByText(/🟢 Low priority item/)).toBeInTheDocument();
  });

  it('navigates to route when recommendation with linkTo is clicked', () => {
    const store = makeStore({
      coach: {
        diagnosis: {
          summary: { headline: 'Test', highlights: [], concerns: [], nextAction: '' },
          insights: [],
          recommendations: [
            {
              id: 'rec-1',
              actionId: 'record_experience',
              icon: '📝',
              title: 'Record experience',
              action: 'Record a new experience',
              priority: 'high',
              sourceRule: 'stale',
              status: 'pending',
              statusUpdatedAt: recentTs,
              linkTo: { route: '/experiences/new', label: '去记录' },
            },
          ],
          generatedAt: recentTs,
        },
        history: [],
        lastAnalyzedAt: recentTs,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
      experiences: {
        experiences: [],
        links: [],
        isLoading: false,
        error: null,
      },
    });

    renderPanel(store);

    const button = screen.getByRole('button', { name: /🔴 Record experience/ });
    fireEvent.click(button);
    expect(navigateMock).toHaveBeenCalledWith('/experiences/new');
  });

  it('navigates to route when recommendation with actionId is clicked', () => {
    const store = makeStore({
      coach: {
        diagnosis: {
          summary: { headline: 'Test', highlights: [], concerns: [], nextAction: '' },
          insights: [],
          recommendations: [
            {
              id: 'rec-2',
              actionId: 'manage_capability',
              icon: '💎',
              title: 'Manage capability',
              action: 'Manage your capabilities',
              priority: 'medium',
              sourceRule: 'growth',
              status: 'pending',
              statusUpdatedAt: recentTs,
            },
          ],
          generatedAt: recentTs,
        },
        history: [],
        lastAnalyzedAt: recentTs,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
      experiences: {
        experiences: [],
        links: [],
        isLoading: false,
        error: null,
      },
    });

    renderPanel(store);

    const button = screen.getByRole('button', { name: /🟡 Manage capability/ });
    fireEvent.click(button);
    expect(navigateMock).toHaveBeenCalledWith('/capabilities');
  });

  it('button is disabled when no resolved route', () => {
    const store = makeStore({
      coach: {
        diagnosis: {
          summary: { headline: 'Test', highlights: [], concerns: [], nextAction: '' },
          insights: [],
          recommendations: [
            {
              id: 'rec-3',
              actionId: 'nonexistent_action',
              icon: '⚠️',
              title: 'No route available',
              action: 'This has no valid route',
              priority: 'low',
              sourceRule: 'stale',
              status: 'pending',
              statusUpdatedAt: recentTs,
            },
          ],
          generatedAt: recentTs,
        },
        history: [],
        lastAnalyzedAt: recentTs,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
      experiences: {
        experiences: [],
        links: [],
        isLoading: false,
        error: null,
      },
    });

    renderPanel(store);

    const button = screen.getByRole('button', { name: /🟢 No route available/ });
    expect(button).toBeDisabled();
  });
});
