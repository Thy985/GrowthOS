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
          summary: '你的系统设计能力本月增长 13 分！',
          insights: [],
          recommendations: [],
          generatedAt: recentTs,
        },
        lastGeneratedAt: recentTs,
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
    expect(screen.getByText(/系统设计能力/)).toBeInTheDocument();
  });

  it('shows insights with severity colors', () => {
    const store = makeStore({
      coach: {
        diagnosis: {
          summary: 'Test summary',
          insights: [
            {
              type: 'stale',
              icon: '🔴',
              title: '战略思维已 62 天未更新',
              description: '',
              severity: 'important',
            },
          ],
          recommendations: [],
          generatedAt: recentTs,
        },
        lastGeneratedAt: recentTs,
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
    expect(screen.getByText(/战略思维/)).toBeInTheDocument();
  });
});
