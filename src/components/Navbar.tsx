import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FileText,
  Target,
  Bell,
  GitBranch,
  BarChart3,
  Bot,
  Keyboard,
  Moon,
  Sun,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react';
import { type RootState } from '../types';
import { type AppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { toggleTheme } from '../store/slices/themeSlice';
import { useI18n } from '../i18n/useI18n';

const Navbar: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { isDarkMode } = useSelector((state: RootState) => state.theme);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useI18n();

  const handleOpenShortcuts = () => {
    const event = new CustomEvent('openShortcutsHelp');
    window.dispatchEvent(event);
  };

  const handleLogout = () => {
    void dispatch(logout());
  };

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  const navItems = [
    { path: '/', key: 'common.dashboard', icon: Home },
    { path: '/records', key: 'common.records', icon: FileText },
    { path: '/goals', key: 'common.goals', icon: Target },
    { path: '/reminders', key: 'common.reminders', icon: Bell },
    { path: '/growth-tree', key: 'common.growthTree', icon: GitBranch },
    { path: '/analytics', key: 'common.analytics', icon: BarChart3 },
  ];

  return (
    <>
      <nav className="nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span>GrowthOS</span>
          </Link>

          <div className="nav-links">
            {isAuthenticated && (
              <>
                {navItems.map(({ path, key, icon: Icon }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={`nav-link group ${isActive ? 'active' : ''}`}
                    >
                      <Icon 
                        size={18} 
                        className={`
                          transition-transform duration-200 
                          group-hover:scale-110
                          ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}
                        `}
                      />
                      <span>{t(key)}</span>
                      {isActive && (
                        <motion.div 
                          layoutId="activeNav"
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full"
                        />
                      )}
                    </Link>
                  );
                })}
                
                <div className="w-px h-6 bg-[var(--color-border)] mx-2" />
                
                <Link
                  to="/ai-settings"
                  className={`nav-link ${location.pathname === '/ai-settings' ? 'active' : ''}`}
                >
                  <Bot size={18} className="text-violet-500" />
                  <span>AI</span>
                </Link>

                <button
                  onClick={handleOpenShortcuts}
                  className="nav-link"
                  aria-label={t('common.keyboardShortcuts')}
                  title={`${t('common.keyboardShortcuts')} (?)`}
                >
                  <Keyboard size={18} />
                </button>

                <button
                  onClick={handleToggleTheme}
                  className="theme-toggle ml-1"
                  aria-label={t('common.theme')}
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div className="nav-user">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                      <User size={16} />
                    </div>
                    <span className="nav-username max-w-[100px] truncate">{user?.username}</span>
                  </div>
                  <button onClick={handleLogout} className="nav-logout flex items-center gap-1.5">
                    <LogOut size={14} />
                    <span className="hidden sm:inline">{t('common.logout')}</span>
                  </button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <>
                <Link to="/login" className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}>
                  <User size={18} />
                  <span>{t('common.login')}</span>
                </Link>
                <Link to="/register" className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}>
                  <span>{t('common.register')}</span>
                </Link>
                <button
                  onClick={handleToggleTheme}
                  className="theme-toggle ml-1"
                  aria-label={t('common.theme')}
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </>
            )}
          </div>

          <button
            className="nav-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={t('common.toggleMenu')}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="nav-mobile-menu"
          >
            {isAuthenticated ? (
              <>
                {navItems.map(({ path, key, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`nav-mobile-link flex items-center gap-3 ${location.pathname === path ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{t(key)}</span>
                  </Link>
                ))}
                <Link
                  to="/ai-settings"
                  className="nav-mobile-link flex items-center gap-3"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Bot size={20} className="text-violet-500" />
                  <span>AI 设置</span>
                </Link>
                <div className="border-t border-[var(--color-border)] my-3" />
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                      <User size={16} />
                    </div>
                    <span className="font-medium">{user?.username}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="nav-mobile-link flex items-center gap-3 w-full text-left text-red-500"
                >
                  <LogOut size={20} />
                  <span>{t('common.logout')}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="nav-mobile-link flex items-center gap-3"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User size={20} />
                  <span>{t('common.login')}</span>
                </Link>
                <Link
                  to="/register"
                  className="nav-mobile-link flex items-center gap-3"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>{t('common.register')}</span>
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
