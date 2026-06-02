import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeState } from '../../types';

const initialState: ThemeState = {
  mode: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  primaryColor: localStorage.getItem('primaryColor') || '#22c55e',
  fontSize: (localStorage.getItem('fontSize') as 'small' | 'medium' | 'large') || 'medium',
  reducedMotion: localStorage.getItem('reducedMotion') === 'true',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.mode = action.payload;
      localStorage.setItem('theme', action.payload);
      if (action.payload === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    toggleTheme: (state) => {
      const newMode = state.mode === 'light' ? 'dark' : 'light';
      state.mode = newMode;
      localStorage.setItem('theme', newMode);
      if (newMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primaryColor = action.payload;
      localStorage.setItem('primaryColor', action.payload);
      document.documentElement.style.setProperty('--color-primary-500', action.payload);
    },
    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.fontSize = action.payload;
      localStorage.setItem('fontSize', action.payload);
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px',
      };
      document.documentElement.style.fontSize = fontSizeMap[action.payload];
    },
    setReducedMotion: (state, action: PayloadAction<boolean>) => {
      state.reducedMotion = action.payload;
      localStorage.setItem('reducedMotion', String(action.payload));
      if (action.payload) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    },
    initializeTheme: (state) => {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        state.mode = savedTheme;
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        state.mode = 'dark';
        document.documentElement.classList.add('dark');
      }
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  setPrimaryColor,
  setFontSize,
  setReducedMotion,
  initializeTheme,
} = themeSlice.actions;

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme);

  return {
    ...theme,
    setTheme: (mode: 'light' | 'dark') => dispatch(setTheme(mode)),
    toggleTheme: () => dispatch(toggleTheme()),
    setPrimaryColor: (color: string) => dispatch(setPrimaryColor(color)),
    setFontSize: (size: 'small' | 'medium' | 'large') => dispatch(setFontSize(size)),
    setReducedMotion: (enabled: boolean) => dispatch(setReducedMotion(enabled)),
    initializeTheme: () => dispatch(initializeTheme()),
  };
};

export default themeSlice.reducer;
