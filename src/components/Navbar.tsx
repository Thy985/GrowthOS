import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../types';
import { logout } from '../store/slices/authSlice';
import { toggleTheme } from '../store/slices/themeSlice';
import { useI18n } from '../i18n/useI18n';

const Navbar: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { isDarkMode } = useSelector((state: RootState) => state.theme);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useI18n();

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

  const navLinks = [
    { path: '/', key: 'common.dashboard' },
    { path: '/records', key: 'common.records' },
    { path: '/goals', key: 'common.goals' },
    { path: '/reminders', key: 'common.reminders' },
    { path: '/growth-tree', key: 'common.growthTree' },
    { path: '/analytics', key: 'common.analytics' },
  ];

  return (
    <nav className="nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">GrowthOS</Link>
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              {navLinks.map(({ path, key }) => (
                <Link
                  key={path}
                  to={path}
                  className={`nav-link ${location.pathname === path ? 'active' : ''}`}
                >
                  {t(key)}
                </Link>
              ))}
              <Link to="/ai-settings" className="nav-link">🤖 AI</Link>
              <button
                onClick={handleOpenShortcuts}
                className="nav-shortcuts-hint"
                aria-label={t('common.keyboardShortcuts')}
                title={t('common.keyboardShortcuts')}
              >
                ⌨️
              </button>
              <button
                onClick={handleToggleTheme}
                className={`theme-toggle ${isDarkMode ? 'dark' : ''}`}
                aria-label={t('common.theme')}
              />
              <div className="nav-user">
                <span className="nav-username">{user?.username}</span>
                <button onClick={handleLogout} className="nav-logout">
                  {t('common.logout')}
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}>
                {t('common.login')}
              </Link>
              <Link to="/register" className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}>
                {t('common.register')}
              </Link>
              <button
                onClick={handleToggleTheme}
                className={`theme-toggle ${isDarkMode ? 'dark' : ''}`}
                aria-label={t('common.theme')}
              />
            </>
          )}
        </div>
        <button
          className="nav-mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={t('common.toggleMenu')}
        >
          <div className={`nav-mobile-icon ${isMobileMenuOpen ? 'open' : ''}`}>
            <span />
            <span />
            <span />
          </div>
        </button>
      </div>
      {isMobileMenuOpen && (
        <div className="nav-mobile-menu">
          {isAuthenticated ? (
            <>
              {navLinks.map(({ path, key }) => (
                <Link
                  key={path}
                  to={path}
                  className={`nav-mobile-link ${location.pathname === path ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t(key)}
                </Link>
              ))}
              <Link
                to="/ai-settings"
                className="nav-mobile-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🤖 AI
              </Link>
              <div className="nav-mobile-theme-toggle">
                <span>{t('common.theme')}</span>
                <button
                  onClick={handleToggleTheme}
                  className={`theme-toggle ${isDarkMode ? 'dark' : ''}`}
                  aria-label={t('common.theme')}
                />
              </div>
              <div className="nav-mobile-user">
                <span className="nav-username">{user?.username}</span>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="nav-logout"
                >
                  {t('common.logout')}
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`nav-mobile-link ${location.pathname === '/login' ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('common.login')}
              </Link>
              <Link
                to="/register"
                className={`nav-mobile-link ${location.pathname === '/register' ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('common.register')}
              </Link>
              <div className="nav-mobile-theme-toggle">
                <span>{t('common.theme')}</span>
                <button
                  onClick={handleToggleTheme}
                  className={`theme-toggle ${isDarkMode ? 'dark' : ''}`}
                  aria-label={t('common.theme')}
                />
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
