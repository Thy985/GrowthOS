import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

import capabilityReducer, {
  setCapabilities,
} from '../../features/capabilities/store/capabilitySlice';
import coachReducer, {
  setDiagnosis,
  clearDiagnosis,
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

  test('initial state is { diagnosis: null, lastGeneratedAt: null }', () => {
    const store = makeStore({
      coach: { diagnosis: null, lastGeneratedAt: null },
    });
    expect(store.getState().coach.diagnosis).toBeNull();
    expect(store.getState().coach.lastGeneratedAt).toBeNull();
  });

  test('setDiagnosis sets diagnosis and timestamp', () => {
    const store = makeStore({
      coach: { diagnosis: null, lastGeneratedAt: null },
    });

    const diagnosis: CoachDiagnosis = {
      summary: 'Test summary',
      insights: [],
      recommendations: [],
      generatedAt: '2026-06-06T00:00:00.000Z',
    };

    store.dispatch(setDiagnosis(diagnosis));
    const state = store.getState().coach;

    expect(state.diagnosis).toEqual(diagnosis);
    expect(state.lastGeneratedAt).toBe('2026-06-06T00:00:00.000Z');
  });

  test('clearDiagnosis clears both fields', () => {
    const diagnosis: CoachDiagnosis = {
      summary: 'Test summary',
      insights: [],
      recommendations: [],
      generatedAt: '2026-06-06T00:00:00.000Z',
    };

    const store = makeStore({
      coach: { diagnosis, lastGeneratedAt: '2026-06-06T00:00:00.000Z' },
    });

    store.dispatch(clearDiagnosis());
    const state = store.getState().coach;

    expect(state.diagnosis).toBeNull();
    expect(state.lastGeneratedAt).toBeNull();
  });

  test('extraReducers matcher clears cache on experiences action', () => {
    const diagnosis: CoachDiagnosis = {
      summary: 'Test summary',
      insights: [],
      recommendations: [],
      generatedAt: '2026-06-06T00:00:00.000Z',
    };

    const store = makeStore({
      coach: { diagnosis, lastGeneratedAt: '2026-06-06T00:00:00.000Z' },
    });

    // Dispatch an experiences action
    store.dispatch({ type: 'experiences/addExperience/pending' });
    const state = store.getState().coach;

    expect(state.diagnosis).toBeNull();
    expect(state.lastGeneratedAt).toBeNull();
  });

  test('extraReducers matcher clears cache on capabilities action', () => {
    const diagnosis: CoachDiagnosis = {
      summary: 'Test summary',
      insights: [],
      recommendations: [],
      generatedAt: '2026-06-06T00:00:00.000Z',
    };

    const store = makeStore({
      coach: { diagnosis, lastGeneratedAt: '2026-06-06T00:00:00.000Z' },
    });

    store.dispatch({ type: 'capabilities/addCapability/pending' });
    const state = store.getState().coach;

    expect(state.diagnosis).toBeNull();
    expect(state.lastGeneratedAt).toBeNull();
  });

  test('extraReducers matcher clears cache on principles action', () => {
    const diagnosis: CoachDiagnosis = {
      summary: 'Test summary',
      insights: [],
      recommendations: [],
      generatedAt: '2026-06-06T00:00:00.000Z',
    };

    const store = makeStore({
      coach: { diagnosis, lastGeneratedAt: '2026-06-06T00:00:00.000Z' },
    });

    store.dispatch({ type: 'principles/addPrinciple/pending' });
    const state = store.getState().coach;

    expect(state.diagnosis).toBeNull();
    expect(state.lastGeneratedAt).toBeNull();
  });

  test('extraReducers matcher clears cache on projects action', () => {
    const diagnosis: CoachDiagnosis = {
      summary: 'Test summary',
      insights: [],
      recommendations: [],
      generatedAt: '2026-06-06T00:00:00.000Z',
    };

    const store = makeStore({
      coach: { diagnosis, lastGeneratedAt: '2026-06-06T00:00:00.000Z' },
    });

    store.dispatch({ type: 'projects/addProject/pending' });
    const state = store.getState().coach;

    expect(state.diagnosis).toBeNull();
    expect(state.lastGeneratedAt).toBeNull();
  });

  test('extraReducers does NOT clear cache on coach action', () => {
    const diagnosis: CoachDiagnosis = {
      summary: 'Test summary',
      insights: [],
      recommendations: [],
      generatedAt: '2026-06-06T00:00:00.000Z',
    };

    const store = makeStore({
      coach: { diagnosis, lastGeneratedAt: '2026-06-06T00:00:00.000Z' },
    });

    store.dispatch({ type: 'coach/someAction' });
    const state = store.getState().coach;

    expect(state.diagnosis).toEqual(diagnosis);
    expect(state.lastGeneratedAt).toBe('2026-06-06T00:00:00.000Z');
  });

  test('runCoachAnalysis thunk generates and sets diagnosis', () => {
    // Seed data that will produce insights
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
      occurredAt: '2026-04-01T00:00:00.000Z', // stale
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
      coach: { diagnosis: null, lastGeneratedAt: null },
    });

    // Seed data via synchronous actions
    store.dispatch(setExperiences([exp]));
    store.dispatch(setLinks([link]));
    store.dispatch(setCapabilities([cap]));

    store.dispatch(runCoachAnalysis() as never);
    const state = store.getState().coach;

    expect(state.diagnosis).not.toBeNull();
    expect(state.lastGeneratedAt).toBe('2026-06-06T00:00:00.000Z');
    expect(state.diagnosis!.insights.length).toBeGreaterThan(0);
    expect(state.diagnosis!.recommendations.length).toBeGreaterThan(0);
    expect(state.diagnosis!.summary.length).toBeGreaterThan(0);
  });
});
