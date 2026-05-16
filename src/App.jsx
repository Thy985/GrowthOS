import React, { useState, lazy, Suspense, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import './App.css';
import store from './store/index';
import { loadData } from './store/slices/growthSlice';
import { checkAuth, logout } from './store/slices/authSlice';
import { toggleTheme } from './store/slices/themeSlice';
import { loadGoals } from './store/slices/goalSlice';
import { loadReminders } from './store/slices/reminderSlice';
import { loadAIConfig } from './store/slices/aiSlice';
import { loadSyncStatus } from './store/slices/syncSlice';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import ErrorBoundary from './components/ErrorBoundary';
import { ChatWidget } from './components/ai/ChatWidget';
import { ToastProvider } from './components/Toast';
import OfflineIndicator from './components/OfflineIndicator';
import SyncPanel from './components/SyncPanel';
import ConflictModal from './components/ConflictModal';
import { initOfflineDB } from './utils/offlineStorage';

const Dashboard = lazy(() => import('./pages/dashboard'));
const GrowthTree = lazy(() => import('./pages/growth-tree'));
const Analytics = lazy(() => import('./pages/analytics'));
const RecordList = lazy(() => import('./pages/records'));
const Goals = lazy(() => import('./pages/goals'));
const Reminders = lazy(() => import('./pages/reminders'));
const Tutorial = lazy(() => import('./components/Tutorial'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const KeyboardShortcutsHelp = lazy(() => import('./components/KeyboardShortcutsHelp'));
const AISettingsPage = lazy(() => import('./pages/ai/AISettingsPage'));

function Navbar() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { isDarkMode } = useSelector(state => state.theme);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  
  const handleOpenShortcuts = () => {
    const event = new CustomEvent('openShortcutsHelp');
    window.dispatchEvent(event);
  };
  
  const handleLogout = () => {
    dispatch(logout());
  };
  
  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };
  
  return (
    <nav className="nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">GrowthOS</Link>
        <div className="nav-links">
          {isAuthenticated ? (
            <>
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
              <Link to="/ai-settings" className={`nav-link ${location.pathname === '/ai-settings' ? 'active' : ''}`}>
                🤖 AI
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
              <div className="nav-user">
                <span className="nav-username">{user.username}</span>
                <button 
                  onClick={handleLogout} 
                  className="nav-logout"
                >
                  {t('common.logout')}
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}>
                登录
              </Link>
              <Link to="/register" className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}>
                注册
              </Link>
              <button 
                onClick={handleToggleTheme} 
                className={`theme-toggle ${isDarkMode ? 'dark' : ''}`}
                aria-label="切换主题"
              ></button>
            </>
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
            {isAuthenticated ? (
              <>
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
                <Link to="/ai-settings" className={`nav-mobile-link ${location.pathname === '/ai-settings' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  🤖 AI 设置
                </Link>
                <div className="nav-mobile-theme-toggle">
                  <span>主题</span>
                  <button 
                    onClick={handleToggleTheme} 
                    className={`theme-toggle ${isDarkMode ? 'dark' : ''}`}
                    aria-label="切换主题"
                  ></button>
                </div>
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
              </>
            ) : (
              <>
                <Link to="/login" className={`nav-mobile-link ${location.pathname === '/login' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  登录
                </Link>
                <Link to="/register" className={`nav-mobile-link ${location.pathname === '/register' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  注册
                </Link>
                <div className="nav-mobile-theme-toggle">
                  <span>主题</span>
                  <button 
                    onClick={handleToggleTheme} 
                    className={`theme-toggle ${isDarkMode ? 'dark' : ''}`}
                    aria-label="切换主题"
                  ></button>
                </div>
              </>
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
        <ToastProvider>
          <Router>
            <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
              <AppContent />
            </div>
          </Router>
        </ToastProvider>
      </Provider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const { conflicts } = useSelector(state => state.sync);

  useEffect(() => {
    initOfflineDB().catch(console.error);
  }, []);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);
  
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        dispatch(loadData());
        dispatch(loadGoals());
        dispatch(loadReminders());
        dispatch(loadAIConfig());
        dispatch(loadSyncStatus());
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    const handleOpenShortcuts = () => {
      setShowShortcutsHelp(true);
    };
    
    window.addEventListener('openShortcutsHelp', handleOpenShortcuts);
    return () => window.removeEventListener('openShortcutsHelp', handleOpenShortcuts);
  }, []);

  useEffect(() => {
    if (conflicts.length > 0 && !selectedConflict) {
      setSelectedConflict(conflicts[0]);
    }
  }, [conflicts, selectedConflict]);

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
      key: 's',
      ctrl: true,
      callback: () => isAuthenticated && setShowSyncPanel(true),
    },
    {
      key: 'Escape',
      callback: () => {
        setShowShortcutsHelp(false);
        setShowSyncPanel(false);
      },
    },
  ], [isAuthenticated, navigate, showShortcutsHelp]);

  useKeyboardShortcuts(shortcuts);
  
  return (
    <>
      <OfflineIndicator onOpenSyncPanel={() => setShowSyncPanel(true)} />
      
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
              <Route path="/ai-settings" element={<ProtectedRoute><ErrorBoundary><AISettingsPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
              <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
              <Route path="/auth" element={<Navigate to="/login" />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
      {isAuthenticated && <ChatWidget />}
      
      <SyncPanel 
        isOpen={showSyncPanel} 
        onClose={() => setShowSyncPanel(false)} 
      />
      
      <ConflictModal 
        conflict={selectedConflict}
        onClose={() => setSelectedConflict(null)}
      />
    </>
  );
}

export default App;
