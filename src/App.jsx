import React, { useState, lazy, Suspense, useCallback, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import './App.css';
import store from './store';
import { loadData } from './store/slices/growthSlice';
import { checkAuth, logout } from './store/slices/authSlice';
import { toggleTheme } from './store/slices/themeSlice';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import ErrorBoundary from './components/ErrorBoundary';

// 使用React.lazy实现代码分割
const Dashboard = lazy(() => import('./pages/dashboard'));
const GrowthTree = lazy(() => import('./pages/growth-tree'));
const Analytics = lazy(() => import('./pages/analytics'));
const RecordList = lazy(() => import('./pages/records'));
const Tutorial = lazy(() => import('./components/Tutorial'));
const Auth = lazy(() => import('./pages/auth'));
const KeyboardShortcutsHelp = lazy(() => import('./components/KeyboardShortcutsHelp'));

function Navbar() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { isDarkMode } = useSelector(state => state.theme);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 打开快捷键帮助的回调
  const handleOpenShortcuts = () => {
    const event = new CustomEvent('openShortcutsHelp');
    window.dispatchEvent(event);
  };
  
  // 处理登出
  const handleLogout = () => {
    dispatch(logout());
  };
  
  // 处理主题切换
  const handleToggleTheme = () => {
    dispatch(toggleTheme());
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
            onClick={handleToggleTheme} 
            className={`theme-toggle ${isDarkMode ? 'dark' : ''}`}
            aria-label="切换主题"
          ></button>
          {isAuthenticated && (
            <div className="nav-user">
              <span className="nav-username">{user.username}</span>
              <button 
                onClick={handleLogout} 
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
              onClick={handleToggleTheme} 
              className={`theme-toggle ${isDarkMode ? 'dark' : ''}`}
              aria-label="切换主题"
            ></button>
          </div>
          {isAuthenticated && (
            <div className="nav-mobile-user">
              <span className="nav-username">{user.username}</span>
              <button 
                onClick={() => {
                  handleLogout();
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
  const { isAuthenticated, isLoading } = useSelector(state => state.auth);
  
  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <Router>
          <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
            <AppContent />
          </div>
        </Router>
      </Provider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // 初始化数据
  useEffect(() => {
    // 检查认证状态
    dispatch(checkAuth());
    // 加载数据
    dispatch(loadData());
  }, [dispatch]);

  // 监听自定义事件
  useEffect(() => {
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
      callback: () => isAuthenticated && navigate('/'),
    },
    {
      key: 'r',
      callback: () => isAuthenticated && navigate('/records'),
    },
    {
      key: 't',
      callback: () => isAuthenticated && navigate('/growth-tree'),
    },
    {
      key: 'a',
      callback: () => isAuthenticated && navigate('/analytics'),
    },
    {
      key: '?',
      callback: () => setShowShortcutsHelp(!showShortcutsHelp),
    },
    {
      key: 'k',
      ctrl: true,
      callback: () => isAuthenticated && setShowSearch(!showSearch),
    },
    {
      key: 'Escape',
      callback: () => {
        setShowShortcutsHelp(false);
        setShowSearch(false);
      },
    },
  ], [isAuthenticated, navigate, showShortcutsHelp, showSearch]);

  useKeyboardShortcuts(shortcuts);
  
  return (
    <>
      {isAuthenticated && <Navbar />}
      <div className="main">
        <ErrorBoundary>
          <Suspense fallback={<div className="loading-container"><div className="loading"></div><span>加载中...</span></div>}>
            {isAuthenticated && <Tutorial />}
            <KeyboardShortcutsHelp 
              isOpen={showShortcutsHelp} 
              onClose={() => setShowShortcutsHelp(false)} 
            />
            <Routes>
              <Route path="/" element={<ProtectedRoute><ErrorBoundary><Dashboard /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/records" element={<ProtectedRoute><ErrorBoundary><RecordList /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/growth-tree" element={<ProtectedRoute><ErrorBoundary><GrowthTree /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><ErrorBoundary><Analytics /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/auth" element={<ErrorBoundary><Auth /></ErrorBoundary>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}

export default App;