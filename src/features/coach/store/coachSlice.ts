import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState, AppDispatch } from '../../../app/store';
import type { CoachState, CoachDiagnosis } from '../types/coachTypes';

const initialState: CoachState = {
  diagnosis: null,
  history: [],
  lastAnalyzedAt: null,
  isAnalyzing: false,
  recommendationStatuses: {},
};

export const coachSlice = createSlice({
  name: 'coach',
  initialState,
  reducers: {
    setDiagnosis(state, action: PayloadAction<CoachDiagnosis>) {
      state.diagnosis = action.payload;
    },
    pushHistorySnapshot(state, action: PayloadAction<CoachDiagnosis>) {
      state.history.unshift(action.payload);
      if (state.history.length > 7) {
        state.history = state.history.slice(0, 7);
      }
    },
    setAnalyzing(state, action: PayloadAction<boolean>) {
      state.isAnalyzing = action.payload;
    },
    setLastAnalyzedAt(state, action: PayloadAction<string>) {
      state.lastAnalyzedAt = action.payload;
    },
    markRecommendationInProgress(state, action: PayloadAction<string>) {
      const id = action.payload;
      const existing = state.recommendationStatuses[id];
      if (!existing || existing.status !== 'completed') {
        state.recommendationStatuses[id] = {
          status: 'in_progress',
          updatedAt: new Date().toISOString(),
        };
      }
    },
    dismissRecommendation(state, action: PayloadAction<string>) {
      state.recommendationStatuses[action.payload] = {
        status: 'dismissed',
        updatedAt: new Date().toISOString(),
      };
    },
    clearDiagnosis(state) {
      state.diagnosis = null;
    },
  },
});

export const {
  setDiagnosis,
  pushHistorySnapshot,
  setAnalyzing,
  setLastAnalyzedAt,
  markRecommendationInProgress,
  dismissRecommendation,
  clearDiagnosis,
} = coachSlice.actions;

// Thunk — compute diagnosis from current state and persist to store
export function runDiagnosis() {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(setAnalyzing(true));
    // dynamic import to avoid circular dependency with coachEngine
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { analyze } = require('../engine/coachEngine');

    const state = getState();
    const { experiences, links } = state.experiences;
    const capabilities = state.capabilities.capabilities;
    const principles = state.principles.principles;
    const projects = state.projects.projects;

    const diagnosis = analyze(experiences, capabilities, principles, projects, links);
    dispatch(setDiagnosis(diagnosis));
    dispatch(pushHistorySnapshot(diagnosis));
    dispatch(setAnalyzing(false));
    dispatch(setLastAnalyzedAt(new Date().toISOString()));
  };
}

// Kept for backward compatibility (existing callers)
export const runCoachAnalysis = runDiagnosis;

export default coachSlice.reducer;