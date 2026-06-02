import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import growthReducer from './slices/growthSlice';
import goalReducer from './slices/goalSlice';
import reminderReducer from './slices/reminderSlice';
import aiReducer from './slices/aiSlice';
import syncReducer from './slices/syncSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    growth: growthReducer,
    goals: goalReducer,
    reminders: reminderReducer,
    ai: aiReducer,
    sync: syncReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser', 'growth/setRecords'],
        ignoredPaths: ['auth.user', 'growth.records']
      }
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
