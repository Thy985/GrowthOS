import React, { useState, lazy, Suspense, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import './App.css';
import store from './store/index.ts';
import { loadData } from './store/slices/growthSlice.ts';
import { checkAuth, logout } from './store/slices/authSlice.ts';
import { toggleTheme } from './store/slices/themeSlice.ts';
import { loadGoals } from './store/slices/goalSlice.ts';
import { loadReminders } from './store/slices/reminderSlice.ts';
import useKeyboardShortcuts from './common/hooks/useKeyboardShortcuts.ts';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { RootState } from './common/types/index.ts';

// 使用React.lazy实现代码分割
const Dashboard = lazy(() => import('./pages/dashboard/index.tsx'));
const GrowthTree = lazy(() => import('./pages/growth-tree/index.tsx'));
const Analytics = lazy(() => import('./pages/analytics/index.tsx'));
const RecordList = lazy(() => import('./pages/records/index.tsx'));
const Goals = lazy(() => import('./pages/goals/index.tsx'));
const Reminders = lazy(() => import('./pages/reminders/index.tsx'));
const Tutorial = lazy(() => import('./components/Tutorial.tsx'));
const Auth = lazy(() => import('./pages/auth/index.tsx'));
const KeyboardShortcutsHelp = lazy(() => import('./components/KeyboardShortcutsHelp.tsx'));

function Navbar() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { isDarkMode } = useSelector((state: RootState) => state.theme);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  
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
            {t('common.dashboard')}
          </Link>
          <Link to="/records" className={`nav-link ${location.pathname === '/records' ? 'active' : ''}`}>
            {t('common.records')}
          </Link>
          <Link to="/goals" className={`nav-link ${location.pathname === '/goals' ? 'active' : ''}`}>
            {t('common.goals')}
          </Link>
          <Link to="/reminders" className={`nav-link ${location.pathname === '/reminders' ? 'active' : ''}`}>
            {t('common.reminders')}
          </Link>
          <Link to="/growth-tree" className={`nav-link ${location.pathname === '/growth-tree' ? 'active' : ''}`}>
            {t('common.growthTree')}
          </Link>
          <Link to="/analytics" className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}>
            {t('common.analytics')}
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
          {isAuthenticated && user && (
            <div className="nav-user">
              <span className="nav-username">{user.username}</span>
              <button 
                onClick={handleLogout} 
                className="nav-logout"
              >
                {t('common.logout')}
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
            {t('common.dashboard')}
          </Link>
          <Link to="/records" className={`nav-mobile-link ${location.pathname === '/records' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            {t('common.records')}
          </Link>
          <Link to="/goals" className={`nav-mobile-link ${location.pathname === '/goals' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            {t('common.goals')}
          </Link>
          <Link to="/reminders" className={`nav-mobile-link ${location.pathname === '/reminders' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            {t('common.reminders')}
          </Link>
          <Link to="/growth-tree" className={`nav-mobile-link ${location.pathname === '/growth-tree' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            {t('common.growthTree')}
          </Link>
          <Link to="/analytics" className={`nav-mobile-link ${location.pathname === '/analytics' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            {t('common.analytics')}
          </Link>
          <div className="nav-mobile-theme-toggle">
            <span>主题</span>
            <button 
              onClick={handleToggleTheme} 
              className={`theme-toggle ${isDarkMode ? 'dark' : ''}`}
              aria-label="切换主题"
            ></button>
          </div>
          {isAuthenticated && user && (
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

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  
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
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // 初始化数据
  useEffect(() => {
    // 检查认证状态
    dispatch(checkAuth());
  }, [dispatch]);
  
  // 延迟加载非关键数据
  useEffect(() => {
    if (isAuthenticated) {
      // 延迟加载数据，让应用先渲染
      const timer = setTimeout(() => {
        // 加载数据
        dispatch(loadData());
        // 加载目标数据
        dispatch(loadGoals());
        // 加载提醒数据
        dispatch(loadReminders());
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [dispatch, isAuthenticated]);

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
            <Route path="/goals" element={<ProtectedRoute><ErrorBoundary><Goals /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><ErrorBoundary><Reminders /></ErrorBoundary></ProtectedRoute>} />
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