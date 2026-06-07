import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect } from 'vitest';

import { coachActionRegistry } from '../../features/coach/actions/coachActionRegistry';
import coachReducer from '../../features/coach/store/coachSlice';
import projectReducer from '../../features/projects/store/projectSlice';

const MOCK_COACH_STATE = {
  diagnosis: null,
  history: [],
  lastAnalyzedAt: null,
  isAnalyzing: false,
  recommendationStatuses: {},
};

describe('coachActionRegistry', () => {
  it('all entries have required fields', () => {
    for (const [key, action] of Object.entries(coachActionRegistry)) {
      expect(action.id).toBe(key);
      expect(typeof action.label).toBe('string');
      expect(typeof action.route).toBe('string');
      expect(['project', 'experience', 'capability', 'principle', 'goal']).toContain(
        action.category,
      );
    }
  });

  it('review_project has buildRoute and isCompleted', () => {
    const action = coachActionRegistry.review_project;
    expect(action.buildRoute).toBeDefined();
    expect(action.isCompleted).toBeDefined();

    expect(action.buildRoute!({ projectId: 'p-1' })).toBe('/projects/p-1/retrospect');
    expect(action.buildRoute!({})).toBe('/projects');
  });

  it('record_experience has buildRoute', () => {
    const action = coachActionRegistry.record_experience;
    expect(action.buildRoute).toBeDefined();

    expect(action.buildRoute!({ capabilityId: 'c-3' })).toBe(
      '/experiences/new?capability=c-3',
    );
    expect(action.buildRoute!({})).toBe('/experiences/new');
  });

  it('isCompleted returns true when project has retrospective', () => {
    const store = configureStore({
      reducer: {
        coach: coachReducer,
        projects: projectReducer,
      },
      preloadedState: {
        coach: MOCK_COACH_STATE,
        projects: {
          projects: [
            {
              id: 'p-1',
              name: 'Test Project',
              userId: 'user-1',
              status: 'active',
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
              retrospective: {
                whatWentWell: 'Good stuff',
                whatWentWrong: 'Bad stuff',
                nextTime: 'Improve',
                capabilitiesUsed: {},
                completedAt: '2026-06-01',
              },
            },
          ],
          isLoading: false,
          error: null,
        },
      },
    });

    const action = coachActionRegistry.review_project;
    const result = action.isCompleted!(store.getState(), { projectId: 'p-1' });
    expect(result).toBe(true);
  });

  it('isCompleted returns false when project has no retrospective', () => {
    const store = configureStore({
      reducer: {
        coach: coachReducer,
        projects: projectReducer,
      },
      preloadedState: {
        coach: MOCK_COACH_STATE,
        projects: {
          projects: [
            {
              id: 'p-2',
              name: 'No Retro',
              userId: 'user-1',
              status: 'active',
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
          ],
          isLoading: false,
          error: null,
        },
      },
    });

    const action = coachActionRegistry.review_project;
    const result = action.isCompleted!(store.getState(), { projectId: 'p-2' });
    expect(result).toBe(false);
  });

  it('registry has 8 actions', () => {
    expect(Object.keys(coachActionRegistry).length).toBe(8);
  });

  it('does not crash with unknown actionId', () => {
    const unknown = coachActionRegistry['nonexistent'];
    expect(unknown).toBeUndefined();
  });
});