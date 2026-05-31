import { useEffect } from 'react';

export interface KeyboardShortcutsShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  callback: () => void;
}

const useKeyboardShortcuts = (shortcuts: KeyboardShortcutsShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const tagName = (event.target as HTMLElement).tagName;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
      if (isTyping) return;

      for (const shortcut of shortcuts) {
        const { key, ctrl, shift, alt, meta, callback } = shortcut;

        const hasCtrl = !ctrl || event.ctrlKey;
        const hasShift = !shift || event.shiftKey;
        const hasAlt = !alt || event.altKey;
        const hasMeta = !meta || event.metaKey;

        if (
          event.key.toLowerCase() === key.toLowerCase() &&
          hasCtrl && hasShift && hasAlt && hasMeta
        ) {
          event.preventDefault();
          callback();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export default useKeyboardShortcuts;
