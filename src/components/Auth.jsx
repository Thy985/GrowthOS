import React, { useState } from 'react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // 模拟认证逻辑
    console.log(isLogin ? '登录' : '注册', { email, password, name });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">{isLogin ? '登录' : '注册'}</h1>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">姓名</label>
              <input 
                type="text" 
                className="input" 
                placeholder="请输入姓名" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input 
              type="email" 
              className="input" 
              placeholder="请输入邮箱" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input 
              type="password" 
              className="input" 
              placeholder="请输入密码" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full mb-4">
            {isLogin ? '登录' : '注册'}
          </button>
          <div className="text-center">
            <button 
              type="button" 
              className="text-secondary hover:underline" 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? '没有账号？点击注册' : '已有账号？点击登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;