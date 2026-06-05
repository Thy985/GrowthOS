import { configureStore } from '@reduxjs/toolkit';

import recordsReducer from '../../features/records/store/recordsSlice';
import treeReducer from '../../features/growth-tree/store/treeSlice';
import authReducer from '../../features/auth/store/authSlice';
import goalReducer from '../../features/goals/store/goalSlice';
import growthReducer from '../../store/slices/growthSlice';
import reminderReducer from '../../features/reminders/store/reminderSlice';
import themeReducer from '../../features/theme/store/themeSlice';

export const store = configureStore({
  reducer: {
    growth: growthReducer,
    records: recordsReducer,
    tree: treeReducer,
    auth: authReducer,
    theme: themeReducer,
    goal: goalReducer,
    reminder: reminderReducer,
  },
});

// 导出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
