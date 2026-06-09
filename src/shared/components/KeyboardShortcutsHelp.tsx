import { useTranslation } from 'react-i18next';

import { Badge } from './common/index.ts';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  i18nKey: string;
}

const KeyboardShortcutsHelp = ({ isOpen, onClose }: KeyboardShortcutsHelpProps) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const shortcuts: Shortcut[] = [
    { keys: ['H'], i18nKey: 'keyboardShortcuts.h' },
    { keys: ['R'], i18nKey: 'keyboardShortcuts.r' },
    { keys: ['T'], i18nKey: 'keyboardShortcuts.t' },
    { keys: ['A'], i18nKey: 'keyboardShortcuts.a' },
    { keys: ['?'], i18nKey: 'keyboardShortcuts.question' },
    { keys: ['Ctrl', 'K'], i18nKey: 'keyboardShortcuts.k' },
    { keys: ['Esc'], i18nKey: 'keyboardShortcuts.escape' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-text-primary">
            {t('keyboardShortcuts.title', '键盘快捷键')}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl">
            ×
          </button>
        </div>

        <div className="space-y-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
            >
              <span className="text-text-primary">{t(shortcut.i18nKey, shortcut.i18nKey)}</span>
              <div className="flex gap-2">
                {shortcut.keys.map((key, i) => (
                  <Badge key={i} variant="outline" size="small">
                    <kbd className="font-mono">{key}</kbd>
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-sm text-text-secondary">
          {t('keyboardShortcuts.hint', '提示：在输入框中使用快捷键无效')}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
