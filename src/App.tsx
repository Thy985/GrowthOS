import React, { useState, lazy, Suspense, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './store/index';
import { loadData } from './store/slices/growthSlice';
import { checkAuth } from './store/slices/authSlice';
import { loadGoals } from './store/slices/goalSlice';
import { loadReminders } from './store/slices/reminderSlice';
import { loadAIConfig } from './store/slices/aiSlice';
import { loadSyncStatus } from './store/slices/syncSlice';
import { RootState } from './types';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import { ChatWidget } from './components/ai/ChatWidget';
import { ToastProvider } from './components/Toast';
import OfflineIndicator from './components/OfflineIndicator';
import SyncPanel from './components/SyncPanel';
import ConflictModal from './components/ConflictModal';
import { initOfflineDB } from './utils/offlineStorage';
import { useI18n } from './i18n/useI18n';

// Lazy load components
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const { t } = useI18n();

  if (isLoading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { conflicts } = useSelector((state: RootState) => state.sync);
  const navigate = useNavigate();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<unknown>(null);
  const { t } = useI18n();

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
          <Suspense fallback={<div className="loading-container"><div className="loading" /><span>{t('common.loading')}</span></div>}>
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
};

const App: React.FC = () => {
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
};

export default App;
