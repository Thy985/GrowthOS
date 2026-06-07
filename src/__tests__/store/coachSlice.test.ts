import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

import capabilityReducer, {
  setCapabilities,
} from '../../features/capabilities/store/capabilitySlice';
import coachReducer, {
  setDiagnosis,
  clearDiagnosis,
  pushHistorySnapshot,
  setAnalyzing,
  setLastAnalyzedAt,
  markRecommendationInProgress,
  dismissRecommendation,
  runCoachAnalysis,
} from '../../features/coach/store/coachSlice';
import type { CoachDiagnosis, CoachState } from '../../features/coach/types/coachTypes';
import experienceReducer, {
  setExperiences,
  setLinks,
} from '../../features/experiences/store/experienceSlice';
import principleReducer from '../../features/principles/store/principleSlice';
import projectReducer from '../../features/projects/store/projectSlice';
import type { Experience, Capability, ExperienceCapabilityLink } from '../../shared/types';

// ─── Helper ────────────────────────────────────────────────

function makeStore(preloaded?: {
  coach: CoachState;
  experiences?: Record<string, unknown>;
  capabilities?: Record<string, unknown>;
  principles?: Record<string, unknown>;
  projects?: Record<string, unknown>;
}) {
  return configureStore({
    reducer: {
      coach: coachReducer,
      experiences: experienceReducer as never,
      capabilities: capabilityReducer as never,
      principles: principleReducer as never,
      projects: projectReducer as never,
    },
    preloadedState: preloaded,
  });
}

// ─── Tests ────────────────────────────────────────────────

describe('coachSlice', () => {
  const FIXED_NOW = new Date('2026-06-06T00:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('initial state has diagnosis, history, analyzing, recommendationStatuses', () => {
    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });
    expect(store.getState().coach.diagnosis).toBeNull();
    expect(store.getState().coach.history).toEqual([]);
    expect(store.getState().coach.isAnalyzing).toBe(false);
    expect(store.getState().coach.recommendationStatuses).toEqual({});
  });

  test('setDiagnosis sets diagnosis', () => {
    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });

    const diagnosis: CoachDiagnosis = {
      summary: { headline: 'Test summary', highlights: [], concerns: [], nextAction: '' },
      insights: [],
      recommendations: [],
      generatedAt: '2026-06-06T00:00:00.000Z',
    };

    store.dispatch(setDiagnosis(diagnosis));
    const state = store.getState().coach;

    expect(state.diagnosis).toEqual(diagnosis);
  });

  test('pushHistorySnapshot pushes and caps at 7', () => {
    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });

    const diagnosis: CoachDiagnosis = {
      summary: { headline: 'Test', highlights: [], concerns: [], nextAction: '' },
      insights: [],
      recommendations: [],
      generatedAt: '2026-06-06T00:00:00.000Z',
    };

    // Push 10 snapshots — only 7 should remain
    for (let i = 0; i < 10; i++) {
      store.dispatch(
        pushHistorySnapshot({ ...diagnosis, generatedAt: `day-${i}` }),
      );
    }
    expect(store.getState().coach.history.length).toBe(7);
    expect(store.getState().coach.history[0].generatedAt).toBe('day-9');
  });

  test('clearDiagnosis clears diagnosis field', () => {
    const diagnosis: CoachDiagnosis = {
      summary: { headline: 'Test summary', highlights: [], concerns: [], nextAction: '' },
      insights: [],
      recommendations: [],
      generatedAt: '2026-06-06T00:00:00.000Z',
    };

    const store = makeStore({
      coach: {
        diagnosis,
        history: [],
        lastAnalyzedAt: '2026-06-06T00:00:00.000Z',
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });

    store.dispatch(clearDiagnosis());
    expect(store.getState().coach.diagnosis).toBeNull();
  });

  test('setAnalyzing toggles isAnalyzing', () => {
    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });

    store.dispatch(setAnalyzing(true));
    expect(store.getState().coach.isAnalyzing).toBe(true);

    store.dispatch(setAnalyzing(false));
    expect(store.getState().coach.isAnalyzing).toBe(false);
  });

  test('setLastAnalyzedAt records timestamp', () => {
    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });

    store.dispatch(setLastAnalyzedAt('2026-06-06T00:00:00.000Z'));
    expect(store.getState().coach.lastAnalyzedAt).toBe('2026-06-06T00:00:00.000Z');
  });

  test('markRecommendationInProgress sets status', () => {
    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });

    store.dispatch(markRecommendationInProgress('rec-1'));
    expect(store.getState().coach.recommendationStatuses['rec-1'].status).toBe('in_progress');
  });

  test('markRecommendationInProgress does not change completed', () => {
    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {
          'rec-1': { status: 'completed', updatedAt: '2026-06-06T00:00:00.000Z' },
        },
      },
    });

    store.dispatch(markRecommendationInProgress('rec-1'));
    expect(store.getState().coach.recommendationStatuses['rec-1'].status).toBe('completed');
  });

  test('dismissRecommendation sets dismissed status', () => {
    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });

    store.dispatch(dismissRecommendation('rec-1'));
    expect(store.getState().coach.recommendationStatuses['rec-1'].status).toBe('dismissed');
  });

  test('runCoachAnalysis thunk generates and sets diagnosis', () => {
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

    const store = makeStore({
      coach: {
        diagnosis: null,
        history: [],
        lastAnalyzedAt: null,
        isAnalyzing: false,
        recommendationStatuses: {},
      },
    });

    store.dispatch(setExperiences([exp]));
    store.dispatch(setLinks([link]));
    store.dispatch(setCapabilities([cap]));

    store.dispatch(runCoachAnalysis() as never);
    const state = store.getState().coach;

    expect(state.diagnosis).not.toBeNull();
    expect(state.lastAnalyzedAt).toBe('2026-06-06T00:00:00.000Z');
    expect(state.history.length).toBeGreaterThan(0);
    expect(state.diagnosis!.insights.length).toBeGreaterThan(0);
    expect(state.diagnosis!.recommendations.length).toBeGreaterThan(0);
    expect(state.diagnosis!.summary.headline.length).toBeGreaterThan(0);
  });
});