import { createSlice } from '@reduxjs/toolkit';

// 从localStorage读取初始主题
const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : false;
  } catch (error) {
    return false;
  }
};

// 初始状态
const initialState = {
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
    setTheme: (state, action) => {
      state.isDarkMode = action.payload;
      // 保存到localStorage
      localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');
    }
  }
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
