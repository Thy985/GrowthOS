import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import coachReducer, {
  markRecommendationInProgress,
  dismissRecommendation,
  runCoachAnalysis,
} from '../../features/coach/store/coachSlice';
import capabilityReducer, {
  setCapabilities,
} from '../../features/capabilities/store/capabilitySlice';
import experienceReducer, {
  setExperiences,
  setLinks,
} from '../../features/experiences/store/experienceSlice';
import principleReducer from '../../features/principles/store/principleSlice';
import projectReducer from '../../features/projects/store/projectSlice';
import type { CoachState } from '../../features/coach/types/coachTypes';
import type { Experience, Capability, ExperienceCapabilityLink } from '../../shared/types';

const MOCK_COACH_STATE: CoachState = {
  diagnosis: null,
  history: [],
  lastAnalyzedAt: null,
  isAnalyzing: false,
  recommendationStatuses: {},
};

function makeStore(coach?: CoachState) {
  return configureStore({
    reducer: {
      coach: coachReducer,
      experiences: experienceReducer,
      capabilities: capabilityReducer,
      principles: principleReducer,
      projects: projectReducer,
    },
    preloadedState: {
      coach: coach ?? MOCK_COACH_STATE,
    },
  });
}

describe('Coach Lifecycle', () => {
  const FIXED_NOW = new Date('2026-06-06T00:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('pending → in_progress via markRecommendationInProgress', () => {
    const store = makeStore();
    store.dispatch(markRecommendationInProgress('rec-1'));
    const statuses = store.getState().coach.recommendationStatuses;
    expect(statuses['rec-1'].status).toBe('in_progress');
  });

  it('does not transition completed → in_progress', () => {
    const store = makeStore({
      diagnosis: null,
      history: [],
      lastAnalyzedAt: null,
      isAnalyzing: false,
      recommendationStatuses: {
        'rec-1': { status: 'completed', updatedAt: '2026-06-06T00:00:00.000Z' },
      },
    });
    store.dispatch(markRecommendationInProgress('rec-1'));
    expect(store.getState().coach.recommendationStatuses['rec-1'].status).toBe('completed');
  });

  it('any status → dismissed', () => {
    const store = makeStore({
      diagnosis: null,
      history: [],
      lastAnalyzedAt: null,
      isAnalyzing: false,
      recommendationStatuses: {
        'rec-1': { status: 'in_progress', updatedAt: '2026-06-06T00:00:00.000Z' },
      },
    });
    store.dispatch(dismissRecommendation('rec-1'));
    expect(store.getState().coach.recommendationStatuses['rec-1'].status).toBe('dismissed');
  });

  it('dismissed can be re-dismissed', () => {
    const store = makeStore({
      diagnosis: null,
      history: [],
      lastAnalyzedAt: null,
      isAnalyzing: false,
      recommendationStatuses: {
        'rec-1': { status: 'dismissed', updatedAt: '2026-06-01T00:00:00.000Z' },
      },
    });
    store.dispatch(dismissRecommendation('rec-1'));
    expect(store.getState().coach.recommendationStatuses['rec-1'].status).toBe('dismissed');
    expect(store.getState().coach.recommendationStatuses['rec-1'].updatedAt).toBe(
      '2026-06-06T00:00:00.000Z',
    );
  });

  it('recommendations are generated with pending status', () => {
    const cap: Capability = {
      id: 'cap-1',
      userId: 'user-1',
      name: 'Test Capability',
      category: 'cognition',
      parentId: null,
      currentLevel: 50,
      targetLevel: 80,
      growthRate: 0,
      lastUpdated: '2026-06-06T00:00:00.000Z',
      createdAt: '2026-06-06T00:00:00.000Z',
    };
    const exp: Experience = {
      id: 'exp-1',
      userId: 'user-1',
      event: 'Test event',
      confidence: 0.5,
      occurredAt: '2026-04-01T00:00:00.000Z',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    };
    const link: ExperienceCapabilityLink = {
      id: 'link-1',
      experienceId: 'exp-1',
      capabilityId: 'cap-1',
      contribution: 0.5,
    };

    const store = makeStore();
    store.dispatch(setExperiences([exp]));
    store.dispatch(setLinks([link]));
    store.dispatch(setCapabilities([cap]));
    store.dispatch(runCoachAnalysis() as never);

    const recs = store.getState().coach.diagnosis!.recommendations;
    expect(recs.length).toBeGreaterThan(0);
    for (const rec of recs) {
      expect(rec.status).toBe('pending');
      expect(rec.id).toBeDefined();
      expect(rec.actionId).toBeDefined();
      expect(rec.sourceRule).toBeDefined();
    }
  });
});