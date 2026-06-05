/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, lazy, useMemo, useEffect, useRef, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Link, useLocation, useNavigate } from 'react-router-dom';

import '../App.css';
import { checkAuth, logout } from '../features/auth/store/authSlice.ts';
import { loadGoals } from '../features/goals/store/goalSlice.ts';
import { loadReminders } from '../features/reminders/store/reminderSlice.ts';
import { toggleTheme } from '../features/theme/store/themeSlice.ts';
import ErrorBoundary from '../shared/components/ErrorBoundary.tsx';
import useKeyboardShortcuts from '../shared/hooks/useKeyboardShortcuts.ts';
import type { RootState } from '../shared/types/index.ts';
import { loadData } from '../store/slices/growthSlice.ts';

import { AppRoutes } from './router.tsx';
import store from './store/index.ts';

const Tutorial = lazy(() => import('../shared/components/Tutorial.tsx'));
const KeyboardShortcutsHelp = lazy(() => import('../shared/components/KeyboardShortcutsHelp.tsx'));

function Navbar() {
  const location = useLocation();
  const dispatch = useDispatch<any>();
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
        <Link to="/" className="nav-logo">
          GrowthOS
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            {t('common.dashboard')}
          </Link>
          <Link
            to="/records"
            className={`nav-link ${location.pathname === '/records' ? 'active' : ''}`}
          >
            {t('common.records')}
          </Link>
          <Link
            to="/goals"
            className={`nav-link ${location.pathname === '/goals' ? 'active' : ''}`}
          >
            {t('common.goals')}
          </Link>
          <Link
            to="/reminders"
            className={`nav-link ${location.pathname === '/reminders' ? 'active' : ''}`}
          >
            {t('common.reminders')}
          </Link>
          <Link
            to="/growth-tree"
            className={`nav-link ${location.pathname === '/growth-tree' ? 'active' : ''}`}
          >
            {t('common.growthTree')}
          </Link>
          <Link
            to="/analytics"
            className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}
          >
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
              <button onClick={handleLogout} className="nav-logout">
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
          <Link
            to="/"
            className={`nav-mobile-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('common.dashboard')}
          </Link>
          <Link
            to="/records"
            className={`nav-mobile-link ${location.pathname === '/records' ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('common.records')}
          </Link>
          <Link
            to="/goals"
            className={`nav-mobile-link ${location.pathname === '/goals' ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('common.goals')}
          </Link>
          <Link
            to="/reminders"
            className={`nav-mobile-link ${location.pathname === '/reminders' ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('common.reminders')}
          </Link>
          <Link
            to="/growth-tree"
            className={`nav-mobile-link ${location.pathname === '/growth-tree' ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t('common.growthTree')}
          </Link>
          <Link
            to="/analytics"
            className={`nav-mobile-link ${location.pathname === '/analytics' ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
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

// 底部导航栏（仅移动端显示）
function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', label: t('common.dashboard'), icon: '📊' },
    { path: '/records', label: t('common.records'), icon: '📝' },
    { path: '/goals', label: t('common.goals'), icon: '🎯' },
    { path: '/growth-tree', label: t('common.growthTree'), icon: '🌳' },
    { path: '/analytics', label: t('common.analytics'), icon: '📈' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function AppContent() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  // 使用 ref 存储状态值，避免 useMemo 依赖频繁变化
  const showShortcutsHelpRef = useRef(showShortcutsHelp);
  const showSearchRef = useRef(showSearch);
  useEffect(() => {
    showShortcutsHelpRef.current = showShortcutsHelp;
    showSearchRef.current = showSearch;
  }, [showShortcutsHelp, showSearch]);

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
  const shortcuts = useMemo(
    () => [
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
        callback: () => setShowShortcutsHelp(!showShortcutsHelpRef.current),
      },
      {
        key: 'k',
        ctrl: true,
        callback: () => isAuthenticated && setShowSearch(!showSearchRef.current),
      },
      {
        key: 'Escape',
        callback: () => {
          setShowShortcutsHelp(false);
          setShowSearch(false);
        },
      },
    ],
    [isAuthenticated, navigate],
  );

  useKeyboardShortcuts(shortcuts);

  return (
    <>
      {isAuthenticated && <Navbar />}
      <div className="main">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="loading-container">
                <div className="loading"></div>
                <span>加载中...</span>
              </div>
            }
          >
            {isAuthenticated && <Tutorial />}
          </Suspense>
          <KeyboardShortcutsHelp
            isOpen={showShortcutsHelp}
            onClose={() => setShowShortcutsHelp(false)}
          />
          <AppRoutes />
        </ErrorBoundary>
      </div>
      {isAuthenticated && <BottomNav />}
    </>
  );
}

export default App;
