import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import authReducer from '../../features/auth/store/authSlice';
import capabilityReducer, {
  addCapability,
  updateCapability,
  deleteCapability,
} from '../../features/capabilities/store/capabilitySlice';
import coachReducer, { runDiagnosis } from '../../features/coach/store/coachSlice';
import experienceReducer, {
  addExperience,
  updateExperience,
  deleteExperience,
} from '../../features/experiences/store/experienceSlice';
import goalReducer from '../../features/goals/store/goalSlice';
import treeReducer from '../../features/growth-tree/store/treeSlice';
import principleReducer from '../../features/principles/store/principleSlice';
import projectReducer, {
  addProject,
  updateProject,
  deleteProject,
} from '../../features/projects/store/projectSlice';
import recordsReducer from '../../features/records/store/recordsSlice';
import reminderReducer from '../../features/reminders/store/reminderSlice';
import themeReducer from '../../features/theme/store/themeSlice';
import growthReducer from '../../store/slices/growthSlice';

export const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  matcher: isAnyOf(
    addExperience.fulfilled,
    updateExperience.fulfilled,
    deleteExperience.fulfilled,
    addCapability.fulfilled,
    updateCapability.fulfilled,
    deleteCapability.fulfilled,
    addProject.fulfilled,
    updateProject.fulfilled,
    deleteProject.fulfilled,
  ),
  effect: (_, api) => {
    const state = (api.getState as () => RootState)();
    if (state.coach.isAnalyzing) return;
    (api.dispatch as AppDispatch)(runDiagnosis());
  },
});

export const store = configureStore({
  reducer: {
    growth: growthReducer,
    records: recordsReducer,
    tree: treeReducer,
    auth: authReducer,
    theme: themeReducer,
    goal: goalReducer,
    reminder: reminderReducer,
    // 经验管理系统
    experiences: experienceReducer,
    capabilities: capabilityReducer,
    principles: principleReducer,
    projects: projectReducer,
    // 成长教练
    coach: coachReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});

// 导出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
