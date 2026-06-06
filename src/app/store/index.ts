import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../../features/auth/store/authSlice';
import capabilityReducer from '../../features/capabilities/store/capabilitySlice';
import experienceReducer from '../../features/experiences/store/experienceSlice';
import goalReducer from '../../features/goals/store/goalSlice';
import treeReducer from '../../features/growth-tree/store/treeSlice';
import principleReducer from '../../features/principles/store/principleSlice';
import projectReducer from '../../features/projects/store/projectSlice';
import recordsReducer from '../../features/records/store/recordsSlice';
import reminderReducer from '../../features/reminders/store/reminderSlice';
import themeReducer from '../../features/theme/store/themeSlice';
import growthReducer from '../../store/slices/growthSlice';

// 经验管理系统新 slices

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
  },
});

// 导出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
