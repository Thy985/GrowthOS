import React, { useEffect } from 'react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  callback: () => void;
}

const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 忽略输入框中的键盘事件
      const tagName = event.target instanceof Element ? event.target.tagName : '';
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
      if (isTyping) return;

      for (const shortcut of shortcuts) {
        const { key, ctrl, shift, alt, meta, callback } = shortcut;

        // 检查修饰键
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