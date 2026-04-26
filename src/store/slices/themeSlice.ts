import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeState } from '../../types';

// 从localStorage读取初始主题
const getInitialTheme = (): boolean => {
  try {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : false;
  } catch (error) {
    return false;
  }
};

// 初始状态
const initialState: ThemeState = {
  isDarkMode: getInitialTheme()
};

// 创建theme slice
const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.isDarkMode = !state.isDarkMode;
      // 保存到localStorage
      localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');
    },
    setTheme: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
      // 保存到localStorage
      localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');
    }
  }
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;