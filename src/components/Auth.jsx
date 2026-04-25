import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  // 表单验证
  const validateForm = () => {
    const newErrors = {};
    
    if (!username.trim()) {
      newErrors.username = '请输入用户名';
    } else if (username.length < 3) {
      newErrors.username = '用户名至少需要3个字符';
    } else if (username.length > 20) {
      newErrors.username = '用户名最多20个字符';
    }
    
    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6) {
      newErrors.password = '密码至少需要6个字符';
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      newErrors.password = '密码需要包含字母和数字';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // 验证表单
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    let success;
    if (isLogin) {
      success = login(username, password);
    } else {
      success = register(username, password);
    }

    if (!success) {
      setError(isLogin ? '登录失败，请检查用户名和密码' : '注册失败，用户名可能已存在');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isLogin ? '登录' : '注册'}
          </h2>
          <p className="text-gray-600">
            {isLogin ? '欢迎回来' : '创建新账户'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) {
                  setErrors(prev => ({
                    ...prev,
                    username: ''
                  }));
                }
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${errors.username ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
              placeholder="请输入用户名"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors(prev => ({
                    ...prev,
                    password: ''
                  }));
                }
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
              placeholder="请输入密码"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            {isLogin ? '登录' : '注册'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            {isLogin ? '没有账户？立即注册' : '已有账户？立即登录'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;