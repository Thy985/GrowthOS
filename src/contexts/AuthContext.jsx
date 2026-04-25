import React, { createContext, useState, useContext, useEffect } from 'react';
import secureStorage from '../utils/secureStorage';

// 创建Context
const AuthContext = createContext();

// 自定义Hook，方便组件使用Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider组件
export const AuthProvider = ({ children }) => {
  // 状态
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 从安全存储加载用户信息
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = secureStorage.getItem('growthos-user');
        if (savedUser) {
          setUser(savedUser);
        }
      } catch (err) {
        setError('加载用户信息失败');
        console.error('Error loading user:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // 登录
  const login = (username, password) => {
    // 简单的本地验证
    // 实际项目中应该调用后端API
    if (username && password) {
      const userData = {
        id: Date.now(),
        username,
        // 实际项目中应该存储token
        token: 'mock-token-' + Date.now()
      };
      setUser(userData);
      secureStorage.setItem('growthos-user', userData);
      return true;
    }
    return false;
  };

  // 注册
  const register = (username, password) => {
    // 简单的本地注册
    // 实际项目中应该调用后端API
    if (username && password) {
      const userData = {
        id: Date.now(),
        username,
        // 实际项目中应该存储token
        token: 'mock-token-' + Date.now()
      };
      setUser(userData);
      secureStorage.setItem('growthos-user', userData);
      return true;
    }
    return false;
  };

  // 登出
  const logout = () => {
    setUser(null);
    secureStorage.removeItem('growthos-user');
  };

  // 提供给子组件的值
  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};