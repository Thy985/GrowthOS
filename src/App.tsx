import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './store';
import { AppDispatch } from './store';
import { loadData } from './store/slices/growthSlice';
import { checkAuth } from './store/slices/authSlice';
import { loadGoals } from './store/slices/goalSlice';
import { loadReminders } from './store/slices/reminderSlice';
import { loadAIConfig } from './store/slices/aiSlice';
import { loadSyncStatus } from './store/slices/syncSlice';
import { RootState } from './types';
// @ts-ignore - JS modules pending TS migration
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
// @ts-ignore - JS modules pending TS migration
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import { ChatWidget } from './components/ai/ChatWidget';
import { ToastProvider } from './components/Toast';
// @ts-ignore - JS modules pending TS migration
import OfflineIndicator from './components/OfflineIndicator';
import SyncPanel from './components/SyncPanel';
import ConflictModal from './components/ConflictModal';
import { initOfflineDB } from './utils/offlineStorage';
import { useI18n } from './i18n/useI18n';
import { performanceMonitor } from './utils/performanceMonitor';

const Dashboard = lazy(() => import('./pages/dashboard'));
// @ts-ignore - JS modules pending TS migration
const GrowthTree = lazy(() => import('./pages/growth-tree'));
// @ts-ignore - JS modules pending TS migration
const Analytics = lazy(() => import('./pages/analytics'));
const RecordList = lazy(() => import('./pages/records'));
// @ts-ignore - JS modules pending TS migration
const Goals = lazy(() => import('./pages/goals'));
// @ts-ignore - JS modules pending TS migration
const Reminders = lazy(() => import('./pages/reminders'));
// @ts-ignore - JS modules pending TS migration
const Tutorial = lazy(() => import('./components/Tutorial'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
// @ts-ignore - JS modules pending TS migration
const KeyboardShortcutsHelp = lazy(() => import('./components/KeyboardShortcutsHelp'));
// @ts-ignore - JS modules pending TS migration
const AISettingsPage = lazy(() => import('./pages/ai/AISettingsPage'));

const AppShortcuts: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useKeyboardShortcuts([]);
  return <>{children}</>;
};

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
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { t } = useI18n();

  const sync = useSelector((state: RootState) => state.sync);
  const [syncPanelOpen, setSyncPanelOpen] = React.useState(false);
  const [conflictModalOpen, setConflictModalOpen] = React.useState(false);

  useKeyboardShortcuts([]);

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

  useEffect(() => {
    if (sync.conflicts.length > 0) {
      setConflictModalOpen(true);
    }
  }, [sync.conflicts.length]);

  return (
    <Router>
      <div className="app">
        {isAuthenticated && <Navbar />}
        <main className="main">
          <Suspense fallback={
            <div className="loading-container">
              <div className="loading" />
              <p>{t('common.loading')}</p>
            </div>
          }>
            <Routes>
              <Route path="/auth" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/records" element={<RecordList />} />
                      <Route path="/goals" element={<Goals />} />
                      <Route path="/reminders" element={<Reminders />} />
                      <Route path="/growth-tree" element={<GrowthTree />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/ai-settings" element={<AISettingsPage />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                    <ChatWidget />
                    <OfflineIndicator />
                    <SyncPanel isOpen={syncPanelOpen} onClose={() => setSyncPanelOpen(false)} />
                    <ConflictModal conflict={null} onClose={() => setConflictModalOpen(false)} />
                  </>
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ToastProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ToastProvider>
    </Provider>
  );
};

export default App;
