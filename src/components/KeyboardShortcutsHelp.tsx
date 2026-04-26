import React from 'react';
import { Badge } from './common/index.ts';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

const KeyboardShortcutsHelp = ({ isOpen, onClose }: KeyboardShortcutsHelpProps) => {
  if (!isOpen) return null;

  const shortcuts: Shortcut[] = [
    { keys: ['H'], description: '回到首页' },
    { keys: ['R'], description: '查看记录列表' },
    { keys: ['T'], description: '查看成长树' },
    { keys: ['A'], description: '查看数据分析' },
    { keys: ['?'], description: '显示/隐藏快捷键帮助' },
    { keys: ['Ctrl', 'K'], description: '快速搜索' },
    { keys: ['Esc'], description: '关闭弹窗' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">键盘快捷键</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <span className="text-gray-700">{shortcut.description}</span>
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
        
        <div className="mt-6 text-sm text-gray-500">
          提示：在输入框中使用快捷键无效
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;