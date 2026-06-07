import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi } from 'vitest';

import capabilityReducer from '../../features/capabilities/store/capabilitySlice';
import CoachRecommendations from '../../features/coach/components/CoachRecommendations';
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

function renderRecs(store = makeStore()) {
  return render(
    <Provider store={store}>
      <CoachRecommendations />
    </Provider>,
  );
}

describe('CoachRecommendations', () => {
  it('shows empty state when no recommendations', () => {
    renderRecs();
    expect(screen.getByText(/推荐下一步/)).toBeInTheDocument();
    expect(screen.getByText(/暂无推荐/)).toBeInTheDocument();
  });

  it('shows recommendations when they exist', () => {
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
              title: '记录相关经历',
              action: '该能力已 62 天未更新',
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
    renderRecs(store);
    expect(screen.getByText(/记录相关经历/)).toBeInTheDocument();
  });

  it('groups recommendations by priority', () => {
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
              title: 'High priority item',
              action: 'High action',
              priority: 'high',
              sourceRule: 'stale',
              status: 'pending',
              statusUpdatedAt: recentTs,
              linkTo: { route: '/experiences/new', label: '去记录' },
            },
            {
              id: 'rec-2',
              actionId: 'record_experience',
              icon: '💎',
              title: 'Low priority item',
              action: 'Low action',
              priority: 'low',
              sourceRule: 'growth',
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
    renderRecs(store);
    expect(screen.getByText(/High priority item/)).toBeInTheDocument();
    expect(screen.getByText(/Low priority item/)).toBeInTheDocument();
  });
});