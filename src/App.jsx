import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import GrowthTree from './components/GrowthTree';
import Analytics from './components/Analytics';
import Auth from './components/Auth';
import { GrowthProvider } from './contexts/GrowthContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <nav className="nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">GrowthOS</Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            仪表盘
          </Link>
          <Link to="/growth-tree" className={`nav-link ${location.pathname === '/growth-tree' ? 'active' : ''}`}>
            成长树
          </Link>
          <Link to="/analytics" className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}>
            分析
          </Link>
          <button 
            onClick={toggleTheme} 
            className={`theme-toggle ${isDarkMode ? 'dark' : ''}`}
            aria-label="切换主题"
          ></button>
          {user && (
            <div className="nav-user">
              <span className="nav-username">{user.username}</span>
              <button 
                onClick={logout} 
                className="nav-logout"
              >
                登出
              </button>
            </div>
          )}
        </div>
        <button 
          className="nav-mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="切换菜单"
        >
          <div className={`nav-mobile-icon ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>
      {isMobileMenuOpen && (
        <div className="nav-mobile-menu">
          <Link to="/" className={`nav-mobile-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            仪表盘
          </Link>
          <Link to="/growth-tree" className={`nav-mobile-link ${location.pathname === '/growth-tree' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            成长树
          </Link>
          <Link to="/analytics" className={`nav-mobile-link ${location.pathname === '/analytics' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            分析
          </Link>
          <div className="nav-mobile-theme-toggle">
            <span>主题</span>
            <button 
              onClick={toggleTheme} 
              className={`theme-toggle ${isDarkMode ? 'dark' : ''}`}
              aria-label="切换主题"
            ></button>
          </div>
          {user && (
            <div className="nav-mobile-user">
              <span className="nav-username">{user.username}</span>
              <button 
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }} 
                className="nav-logout"
              >
                登出
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GrowthProvider>
          <Router>
            <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
              <AppContent />
            </div>
          </Router>
        </GrowthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <>
      {user && <Navbar />}
      <div className="main">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/growth-tree" element={<ProtectedRoute><GrowthTree /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </>
  );
}

export default App;