import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Sparkles } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import { useSelector } from 'react-redux';
import type { RootState } from '../../types';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  useSelector((state: RootState) => state.ai);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          fixed bottom-6 right-6 w-14 h-14 rounded-2xl
          shadow-lg flex items-center justify-center
          z-50 transition-all duration-300
          ${isOpen 
            ? 'bg-gray-600 hover:bg-gray-700 rotate-0' 
            : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
          }
          text-white
        `}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <Bot size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
      </AnimatePresence>

      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="fixed bottom-24 right-6 z-40"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg px-4 py-2 flex items-center gap-2 border border-gray-100 dark:border-gray-700">
            <Sparkles size={16} className="text-violet-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">AI 助手随时待命</span>
          </div>
        </motion.div>
      )}
    </>
  );
};
