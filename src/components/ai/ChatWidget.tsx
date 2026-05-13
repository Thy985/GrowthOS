import React, { useState, useEffect } from 'react';
import { ChatWindow } from './ChatWindow';
import { useSelector } from 'react-redux';
import type { RootState } from '../../types';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { config } = useSelector((state: RootState) => state.ai);
  const [hasSuggestions, setHasSuggestions] = useState(false);

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl z-40 transition-transform ${
          isOpen ? 'rotate-45 bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
      >
        {isOpen ? '×' : '🤖'}
        {hasSuggestions && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
        )}
      </button>

      {/* 聊天窗口 */}
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
    </>
  );
};
