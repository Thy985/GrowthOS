import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { store } from './store';
import i18n from './i18n';
import { useTranslation } from 'react-i18next';
import Layout from './components/Layout';
import Dashboard from './pages/dashboard';
import Records from './pages/records';
import Goals from './pages/goals';
import Reminders from './pages/reminders';
import Analytics from './pages/analytics';
import Auth from './pages/auth';
import GrowthTreePage from './pages/growth-tree';
import Tutorial from './components/Tutorial';
import ErrorBoundary from './components/ErrorBoundary';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './store/slices/themeSlice';
import { useAuth } from './store/slices/authSlice';

function AppContent() {
  const { t: _t } = useTranslation();
  const { isDarkMode: _isDarkMode } = useTheme();
  const { isAuthenticated, checkAuth } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useKeyboardShortcuts({
    onToggleTheme: () => document.documentElement.classList.toggle('dark'),
    onToggleTutorial: () => setShowTutorial(prev => !prev),
    onToggleShortcuts: () => setShowShortcuts(prev => !prev)
  });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial && isAuthenticated) {
      setShowTutorial(true);
    }
  }, [isAuthenticated]);

  const handleTutorialClose = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/records" element={<Records />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/growth-tree" element={<GrowthTreePage />} />
      </Routes>
      {showTutorial && <Tutorial onClose={handleTutorialClose} />}
      {showShortcuts && <KeyboardShortcutsHelp onClose={() => setShowShortcuts(false)} />}
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <HashRouter>
            <AppContent />
          </HashRouter>
        </I18nextProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
