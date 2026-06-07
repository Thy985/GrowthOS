import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi } from 'vitest';

import capabilityReducer from '../../features/capabilities/store/capabilitySlice';
import CoachDiagnosisCard from '../../features/coach/components/CoachDiagnosisCard';
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

function renderCard(store = makeStore()) {
  return render(
    <Provider store={store}>
      <CoachDiagnosisCard />
    </Provider>,
  );
}

describe('CoachDiagnosisCard', () => {
  it('shows empty state when no diagnosis', () => {
    renderCard();
    expect(screen.getByText(/成长诊断/)).toBeInTheDocument();
    expect(screen.getByText(/记录第一条经历/)).toBeInTheDocument();
  });

  it('shows summary when diagnosis exists', () => {
    const store = makeStore({
      coach: {
        diagnosis: {
          summary: {
            headline: '测试摘要内容',
            highlights: ['亮点一', '亮点二'],
            concerns: ['需关注的问题'],
            nextAction: '采取行动',
          },
          insights: [
            {
              type: 'stale',
              icon: '⚠️',
              title: '能力过期',
              description: '60天未更新',
              severity: 'important',
            },
          ],
          recommendations: [
            {
              id: 'rec-1',
              actionId: 'record_experience',
              icon: '📝',
              title: '记录经历',
              action: '去记录',
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
    renderCard(store);
    expect(screen.getByText(/测试摘要内容/)).toBeInTheDocument();
    expect(screen.getByText(/亮点一/)).toBeInTheDocument();
    expect(screen.getByText(/采取行动/)).toBeInTheDocument();
  });
});