import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../../features/auth/store/authSlice';
import goalReducer from '../../features/goals/store/goalSlice';
import growthReducer from '../../store/slices/growthSlice';
import reminderReducer from '../../features/reminders/store/reminderSlice';
import themeReducer from '../../features/theme/store/themeSlice';

export const store = configureStore({
  reducer: {
    growth: growthReducer,
    auth: authReducer,
    theme: themeReducer,
    goal: goalReducer,
    reminder: reminderReducer
  }
});

// 导出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;