import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { type ThemeState } from '../../types';

const getInitialState = (): ThemeState => {
  const savedTheme = localStorage.getItem('theme');
  return {
    isDarkMode: savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches),
  };
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: getInitialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.isDarkMode = action.payload === 'dark';
      localStorage.setItem('theme', action.payload);
      if (action.payload === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    toggleTheme: (state) => {
      state.isDarkMode = !state.isDarkMode;
      const mode = state.isDarkMode ? 'dark' : 'light';
      localStorage.setItem('theme', mode);
      if (state.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    initializeTheme: (state) => {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        state.isDarkMode = savedTheme === 'dark';
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        state.isDarkMode = true;
        document.documentElement.classList.add('dark');
      }
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  initializeTheme,
} = themeSlice.actions;

export const useTheme = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: { theme: ThemeState }) => state.theme);

  return {
    ...theme,
    setTheme: (mode: 'light' | 'dark') => dispatch(setTheme(mode)),
    toggleTheme: () => dispatch(toggleTheme()),
    initializeTheme: () => dispatch(initializeTheme()),
  };
};

export default themeSlice.reducer;
