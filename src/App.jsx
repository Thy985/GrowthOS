import React, { useState, lazy, Suspense, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { GrowthProvider } from './contexts/GrowthContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';

// 使用React.lazy实现代码分割
const Dashboard = lazy(() => import('./components/Dashboard'));
const GrowthTree = lazy(() => import('./components/GrowthTree'));
const Analytics = lazy(() => import('./components/Analytics'));
const RecordList = lazy(() => import('./components/RecordList'));
const Tutorial = lazy(() => import('./components/Tutorial'));
const Auth = lazy(() => import('./components/Auth'));
const KeyboardShortcutsHelp = lazy(() => import('./components/KeyboardShortcutsHelp'));

function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 打开快捷键帮助的回调
  const handleOpenShortcuts = () => {
    const event = new CustomEvent('openShortcutsHelp');
    window.dispatchEvent(event);
  };
  
  return (
    <nav className="nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">GrowthOS</Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            仪表盘
          </Link>
          <Link to="/records" className={`nav-link ${location.pathname === '/records' ? 'active' : ''}`}>
            记录
          </Link>
          <Link to="/growth-tree" className={`nav-link ${location.pathname === '/growth-tree' ? 'active' : ''}`}>
            成长树
          </Link>
          <Link to="/analytics" className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}>
            分析
          </Link>
          <button 
            onClick={handleOpenShortcuts}
            className="nav-shortcuts-hint"
            aria-label="快捷键帮助"
            title="查看快捷键 (按?)"
          >
            ⌨️
          </button>
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
          <Link to="/records" className={`nav-mobile-link ${location.pathname === '/records' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            记录
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
  const navigate = useNavigate();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // 监听自定义事件
  React.useEffect(() => {
    const handleOpenShortcuts = () => {
      setShowShortcutsHelp(true);
    };
    
    window.addEventListener('openShortcutsHelp', handleOpenShortcuts);
    return () => window.removeEventListener('openShortcutsHelp', handleOpenShortcuts);
  }, []);

  // 使用useMemo来避免每次渲染都重新创建shortcuts数组
  const shortcuts = useMemo(() => [
    {
      key: 'h',
      callback: () => user && navigate('/'),
    },
    {
      key: 'r',
      callback: () => user && navigate('/records'),
    },
    {
      key: 't',
      callback: () => user && navigate('/growth-tree'),
    },
    {
      key: 'a',
      callback: () => user && navigate('/analytics'),
    },
    {
      key: '?',
      callback: () => setShowShortcutsHelp(!showShortcutsHelp),
    },
    {
      key: 'k',
      ctrl: true,
      callback: () => user && setShowSearch(!showSearch),
    },
    {
      key: 'Escape',
      callback: () => {
        setShowShortcutsHelp(false);
        setShowSearch(false);
      },
    },
  ], [user, navigate, showShortcutsHelp, showSearch]);

  useKeyboardShortcuts(shortcuts);
  
  return (
    <>
      {user && <Navbar />}
      <div className="main">
        <Suspense fallback={<div className="loading-container"><div className="loading"></div><span>加载中...</span></div>}>
          {user && <Tutorial />}
          <KeyboardShortcutsHelp 
            isOpen={showShortcutsHelp} 
            onClose={() => setShowShortcutsHelp(false)} 
          />
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/records" element={<ProtectedRoute><RecordList /></ProtectedRoute>} />
            <Route path="/growth-tree" element={<ProtectedRoute><GrowthTree /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}

export default App;