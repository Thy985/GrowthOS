import React, { createContext, useContext, useState, useCallback, memo } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem = memo<{
  toast: Toast;
  onClose: () => void;
}>(({ toast, onClose }) => {
  const typeStyles: Record<ToastType, string> = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  };

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };

  React.useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(onClose, toast.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-white shadow-lg ${typeStyles[toast.type]}`}
      role="alert"
    >
      <span className="text-lg">{icons[toast.type]}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors"
        aria-label="关闭"
      >
        ✕
      </button>
    </div>
  );
});

ToastItem.displayName = 'ToastItem';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => hideToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
});

ToastProvider.displayName = 'ToastProvider';

export const toast = {
  success: (message: string, duration?: number) => {
    console.log(`[Toast Success] ${message}`);
  },
  error: (message: string, duration?: number) => {
    console.error(`[Toast Error] ${message}`);
  },
  info: (message: string, duration?: number) => {
    console.info(`[Toast Info] ${message}`);
  },
  warning: (message: string, duration?: number) => {
    console.warn(`[Toast Warning] ${message}`);
  }
};
