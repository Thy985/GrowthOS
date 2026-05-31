import themeReducer, { toggleTheme, setTheme } from '../../store/slices/themeSlice';

describe('themeSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    test('should return the initial state when no localStorage', () => {
      const result = themeReducer(undefined, { type: 'unknown' });
      expect(result.isDarkMode).toBe(false);
    });

    test('should return light mode for invalid saved value', () => {
      localStorage.setItem('theme', 'invalid');
      
      const result = themeReducer(undefined, { type: 'unknown' });
      expect(result.isDarkMode).toBe(false);
    });
  });

  describe('toggleTheme', () => {
    test('should toggle from light to dark', () => {
      const initialState = { isDarkMode: false };
      const result = themeReducer(initialState, toggleTheme());
      expect(result.isDarkMode).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    test('should toggle from dark to light', () => {
      const darkState = { isDarkMode: true };
      const result = themeReducer(darkState, toggleTheme());
      expect(result.isDarkMode).toBe(false);
      expect(localStorage.getItem('theme')).toBe('light');
    });

    test('should persist theme change to localStorage', () => {
      const initialState = { isDarkMode: false };
      themeReducer(initialState, toggleTheme());
      expect(localStorage.getItem('theme')).toBe('dark');
      
      themeReducer({ isDarkMode: true }, toggleTheme());
      expect(localStorage.getItem('theme')).toBe('light');
    });
  });

  describe('setTheme', () => {
    test('should set dark mode', () => {
      const initialState = { isDarkMode: false };
      const result = themeReducer(initialState, setTheme(true));
      expect(result.isDarkMode).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    test('should set light mode', () => {
      const darkState = { isDarkMode: true };
      const result = themeReducer(darkState, setTheme(false));
      expect(result.isDarkMode).toBe(false);
      expect(localStorage.getItem('theme')).toBe('light');
    });

    test('should persist theme change to localStorage', () => {
      const initialState = { isDarkMode: false };
      themeReducer(initialState, setTheme(true));
      expect(localStorage.getItem('theme')).toBe('dark');
      
      themeReducer({ isDarkMode: true }, setTheme(false));
      expect(localStorage.getItem('theme')).toBe('light');
    });

    test('should handle setting same theme', () => {
      const initialState = { isDarkMode: false };
      themeReducer(initialState, setTheme(false));
      expect(localStorage.getItem('theme')).toBe('light');
      
      const result = themeReducer({ isDarkMode: true }, setTheme(true));
      expect(result.isDarkMode).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');
    });
  });
});
