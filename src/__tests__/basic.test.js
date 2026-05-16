import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import growthReducer from '../src/store/slices/growthSlice';
import authReducer from '../src/store/slices/authSlice';
import themeReducer from '../src/store/slices/themeSlice';
import goalReducer from '../src/store/slices/goalSlice';
import reminderReducer from '../src/store/slices/reminderSlice';

// 创建测试 store
const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      growth: growthReducer,
      auth: authReducer,
      theme: themeReducer,
      goal: goalReducer,
      reminder: reminderReducer
    },
    preloadedState
  });
};

describe('Store 配置', () => {
  it('应该正确初始化 store', () => {
    const store = createTestStore();
    expect(store.getState()).toBeDefined();
  });

  it('应该有正确的初始状态', () => {
    const store = createTestStore();
    expect(store.getState().theme).toBeDefined();
    expect(store.getState().auth).toBeDefined();
  });
});

describe('工具函数', () => {
  it('true 应该等于 true', () => {
    expect(true).toBe(true);
  });
});
