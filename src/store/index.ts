import { configureStore } from '@reduxjs/toolkit';
import growthReducer from './slices/growthSlice';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import goalReducer from './slices/goalSlice';
import reminderReducer from './slices/reminderSlice';

export const store = configureStore({
  reducer: {
    growth: growthReducer,
    auth: authReducer,
    theme: themeReducer,
    goal: goalReducer,
    reminder: reminderReducer
  }
});

export type AppDispatch = typeof store.dispatch;
export default store;