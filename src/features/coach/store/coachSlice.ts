import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '../../../app/store';
import { analyze } from '../engine/coachEngine';
import type { CoachState, CoachDiagnosis } from '../types/coachTypes';

const initialState: CoachState = {
  diagnosis: null,
  lastGeneratedAt: null,
};

export const coachSlice = createSlice({
  name: 'coach',
  initialState,
  reducers: {
    setDiagnosis(state, action: PayloadAction<CoachDiagnosis>) {
      state.diagnosis = action.payload;
      state.lastGeneratedAt = new Date().toISOString();
    },
    clearDiagnosis(state) {
      state.diagnosis = null;
      state.lastGeneratedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      (action) =>
        action.type.startsWith('experiences/') ||
        action.type.startsWith('capabilities/') ||
        action.type.startsWith('principles/') ||
        action.type.startsWith('projects/'),
      (state) => {
        state.diagnosis = null;
        state.lastGeneratedAt = null;
      },
    );
  },
});

export const { setDiagnosis, clearDiagnosis } = coachSlice.actions;

// Thunk to analyze and set diagnosis
export function runCoachAnalysis() {
  return (dispatch: (action: unknown) => unknown, getState: () => RootState) => {
    const state = getState();
    const { experiences, links } = state.experiences;
    const capabilities = state.capabilities.capabilities;
    const principles = state.principles.principles;
    const projects = state.projects.projects;

    const diagnosis = analyze(experiences, capabilities, principles, projects, links);
    dispatch(setDiagnosis(diagnosis));
    return diagnosis;
  };
}

export default coachSlice.reducer;
