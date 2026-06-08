import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState, AppDispatch } from '../../../app/store';
import { analyze } from '../engine/coachEngine';
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

    const state = getState();
    const { experiences, links } = state.experiences;
    const capabilities = state.capabilities.capabilities;
    const principles = state.principles.principles;
    const projects = state.projects.projects;
    const now = new Date();

    const diagnosis = analyze(experiences, capabilities, principles, projects, links, now);

    // Compute completionRate from recommendation statuses
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const completedThisWeek = diagnosis.recommendations.reduce((count, rec) => {
      const stored = state.coach.recommendationStatuses[rec.id];
      if (stored?.status === 'completed' && new Date(stored.updatedAt) >= weekStart) {
        return count + 1;
      }
      return count;
    }, 0);
    const totalThisWeek = diagnosis.recommendations.length;

    const diagnosisWithRate: CoachDiagnosis = {
      ...diagnosis,
      summary: {
        ...diagnosis.summary,
        completionRate: {
          completedThisWeek,
          totalThisWeek: totalThisWeek || 1,
        },
      },
    };

    dispatch(setDiagnosis(diagnosisWithRate));
    dispatch(pushHistorySnapshot(diagnosisWithRate));
    dispatch(setAnalyzing(false));
    dispatch(setLastAnalyzedAt(now.toISOString()));
  };
}

// Kept for backward compatibility (existing callers)
export const runCoachAnalysis = runDiagnosis;

export default coachSlice.reducer;
