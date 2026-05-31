import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './store';
import { loadData } from './store/slices/growthSlice';
import { checkAuth } from './store/slices/authSlice';
import { loadGoals } from './store/slices/goalSlice';
import { loadReminders } from './store/slices/reminderSlice';
import { loadAIConfig } from './store/slices/aiSlice';
import { loadSyncStatus } from './store/slices/syncSlice';
import { initOfflineDB } from './utils/offlineStorage';
import { performanceMonitor } from './utils/performanceMonitor';
import useKeyboardShortcuts, { KeyboardShortcutsShortcut } from './hooks/useKeyboardShortcuts';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import { ChatWidget } from './components/ai/ChatWidget';
import { ToastProvider } from './components/Toast';
import OfflineIndicator from './components/OfflineIndicator';
import SyncPanel from './components/SyncPanel';

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

const LoadingFallback: React.FC = () => (
  <div className="loading-container">
    <div className="loading" />
    <p>加载中...</p>
  </div>
);

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const _sync = useSelector((state: RootState) => state.sync);
  const [syncPanelOpen, setSyncPanelOpen] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const shortcuts = useMemo<KeyboardShortcutsShortcut[]>(() => [
    {
      key: '?',
      shift: true,
      callback: () => setShowShortcutsHelp(true),
    },
    {
      key: 'Escape',
      callback: () => {
        setShowShortcutsHelp(false);
        setSyncPanelOpen(false);
      },
    },
  ], []);

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="app">
      <Navbar />
      <main className="main">
        <ErrorBoundary fallback={<LoadingFallback />}>
          <Suspense fallback={<LoadingFallback />}>
            <Tutorial />
            <KeyboardShortcutsHelp
              isOpen={showShortcutsHelp}
              onClose={() => setShowShortcutsHelp(false)}
            />
            {children}
            <ChatWidget />
            <OfflineIndicator />
            <SyncPanel isOpen={syncPanelOpen} onClose={() => setSyncPanelOpen(false)} />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    performanceMonitor.initialize();
  }, []);

  useEffect(() => {
    dispatch(checkAuth());
    initOfflineDB().catch(console.error);
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(loadData());
      dispatch(loadGoals());
      dispatch(loadReminders());
      dispatch(loadAIConfig());
      dispatch(loadSyncStatus());
    }
  }, [isAuthenticated, dispatch]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/records"
          element={
            <ProtectedRoute>
              <AppLayout>
                <RecordList />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Goals />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reminders"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Reminders />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/growth-tree"
          element={
            <ProtectedRoute>
              <AppLayout>
                <GrowthTree />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Analytics />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AISettingsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ToastProvider>
        <ErrorBoundary fallback={<div className="loading-container"><div className="loading" /><p>应用加载失败</p></div>}>
          <Router>
            <AppContent />
          </Router>
        </ErrorBoundary>
      </ToastProvider>
    </Provider>
  );
};

import store from './store';

export default App;
