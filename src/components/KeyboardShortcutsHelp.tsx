import React from 'react';
import { useTranslation } from 'react-i18next';

interface KeyboardShortcutsHelpProps {
  onClose: () => void,
}

const shortcuts = [
  { key: 'Ctrl + /', description: '显示/隐藏快捷键帮助' },
  { key: 'Ctrl + T', description: '切换主题' },
  { key: 'Ctrl + H', description: '显示教程' },
  { key: 'Ctrl + N', description: '新建记录' },
  { key: 'Escape', description: '关闭弹窗' },
  { key: 'Ctrl + K', description: '搜索' },
  { key: 'Ctrl + D', description: '导航到仪表板' },
  { key: 'Ctrl + R', description: '导航到记录' },
  { key: 'Ctrl + G', description: '导航到目标' },
];

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{t('keyboardShortcuts.title', '键盘快捷键')}</h2>
        <div className="shortcuts-list">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="shortcut-item"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span>{shortcut.description}</span>
              <kbd
                style={{
                  padding: '4px 8px',
                  background: 'var(--color-gray-100)',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              >
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            {t('common.close', '关闭')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
