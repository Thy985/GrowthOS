import React, { createContext, useState, useContext, useEffect } from 'react';

// 创建Context
const ThemeContext = createContext();

// 自定义Hook，方便组件使用Context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Provider组件
export const ThemeProvider = ({ children }) => {
  // 状态
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 从localStorage加载主题设置
  useEffect(() => {
    const savedTheme = localStorage.getItem('growthos-theme');
    if (savedTheme) {
      const isDark = savedTheme === 'dark';
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    } else {
      // 检测系统主题
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // 切换主题
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('growthos-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('growthos-theme', 'light');
    }
  };

  // 提供给子组件的值
  const value = {
    isDarkMode,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};