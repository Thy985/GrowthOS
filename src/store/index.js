import { configureStore } from '@reduxjs/toolkit';
import growthReducer from './slices/growthSlice';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    growth: growthReducer,
    auth: authReducer,
    theme: themeReducer
  }
});

export default store;
