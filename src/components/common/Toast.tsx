import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />,
  };
  return icons[type];
};

const ToastItem = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  const typeStyles = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: 'text-emerald-500',
      text: 'text-emerald-800',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      text: 'text-red-800',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-500',
      text: 'text-amber-800',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      text: 'text-blue-800',
    },
  };

  const style = typeStyles[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`${style.bg} ${style.border} border rounded-xl shadow-lg overflow-hidden`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={style.icon}>
          <ToastIcon type={toast.type} />
        </div>
        <p className={`flex-1 text-sm font-medium ${style.text}`}>
          {toast.message}
        </p>
        <button
          onClick={onClose}
          className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${style.text}`}
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: Toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
