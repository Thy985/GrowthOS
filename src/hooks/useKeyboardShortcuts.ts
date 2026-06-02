import { useEffect } from 'react';

export interface KeyboardShortcutsShortcut {
  key: string,
  ctrl?: boolean,
  shift?: boolean,
  alt?: boolean,
  meta?: boolean,
  callback: () => void,
}

export interface UseKeyboardShortcutsOptions {
  onToggleTheme?: () => void,
  onToggleTutorial?: () => void,
  onToggleShortcuts?: () => void,
}

const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions = {}) => {
  const { onToggleTheme, onToggleTutorial, onToggleShortcuts } = options;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const tagName = (event.target as HTMLElement).tagName;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
      if (isTyping) return;

      // Ctrl/Cmd + Shift + T: Toggle theme
      if (onToggleTheme && (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 't') {
        event.preventDefault();
        onToggleTheme();
      }

      // Ctrl/Cmd + ?: Show shortcuts help
      if (onToggleShortcuts && event.key === '?') {
        event.preventDefault();
        onToggleShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleTheme, onToggleTutorial, onToggleShortcuts]);
};

export { useKeyboardShortcuts };
export default useKeyboardShortcuts;
