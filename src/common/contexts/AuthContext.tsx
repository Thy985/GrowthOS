import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import secureStorage from '../utils/secureStorage';

// 用户类型定义
interface User {
  id: number;
  username: string;
  token: string;
  role?: 'admin' | 'user'; // 添加角色字段，用于权限控制
}

// AuthContext类型定义
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => boolean;
  register: (username: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (requiredRole: 'admin' | 'user') => boolean;
}

// 创建Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 自定义Hook，方便组件使用Context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider组件
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // 状态
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从安全存储加载用户信息
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = secureStorage.getItem<User>('growthos-user');
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
  const login = (username: string, password: string): boolean => {
    // 简单的本地验证
    // 实际项目中应该调用后端API
    if (username && password) {
      const userData: User = {
        id: Date.now(),
        username,
        // 实际项目中应该存储token
        token: 'mock-token-' + Date.now(),
        role: username === 'admin' ? 'admin' : 'user' // 简单的角色分配
      };
      setUser(userData);
      secureStorage.setItem('growthos-user', userData);
      return true;
    }
    return false;
  };

  // 注册
  const register = (username: string, password: string): boolean => {
    // 简单的本地注册
    // 实际项目中应该调用后端API
    if (username && password) {
      const userData: User = {
        id: Date.now(),
        username,
        // 实际项目中应该存储token
        token: 'mock-token-' + Date.now(),
        role: 'user' // 新注册用户默认为普通用户
      };
      setUser(userData);
      secureStorage.setItem('growthos-user', userData);
      return true;
    }
    return false;
  };

  // 登出
  const logout = (): void => {
    setUser(null);
    secureStorage.removeItem('growthos-user');
  };

  // 权限检查
  const hasPermission = (requiredRole: 'admin' | 'user'): boolean => {
    if (!user) return false;
    if (requiredRole === 'user') return true; // 所有登录用户都有user权限
    return user.role === 'admin'; // 只有admin用户有admin权限
  };

  // 提供给子组件的值
  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};