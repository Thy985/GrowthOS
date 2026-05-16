import { configureStore } from '@reduxjs/toolkit';
import growthReducer from './slices/growthSlice';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import goalReducer from './slices/goalSlice';
import reminderReducer from './slices/reminderSlice';
import aiReducer from './slices/aiSlice';
import syncReducer from './slices/syncSlice';
import type { RootState as TRootState } from '../types';

export const store = configureStore({
  reducer: {
    growth: growthReducer,
    auth: authReducer,
    theme: themeReducer,
    goal: goalReducer,
    reminder: reminderReducer,
    ai: aiReducer,
    sync: syncReducer
  }
});

export type RootState = TRootState;
export type AppDispatch = typeof store.dispatch;
export default store;