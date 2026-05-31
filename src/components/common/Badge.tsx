import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const Badge = ({
  children,
  variant = 'default',
  size = 'medium',
  dot = false,
  removable = false,
  onRemove,
  className = '',
}: BadgeProps) => {
  const variantClasses = {
    default: 'bg-[var(--color-gray-100)] text-[var(--color-text-secondary)]',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    outline: 'bg-transparent border border-[var(--color-border)] text-[var(--color-text-secondary)]',
  };

  const dotColors = {
    default: 'bg-[var(--color-gray-400)]',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    outline: 'bg-[var(--color-gray-400)]',
  };

  const sizeClasses = {
    small: 'px-1.5 py-0.5 text-xs gap-1',
    medium: 'px-2 py-0.5 text-xs gap-1.5',
    large: 'px-2.5 py-1 text-sm gap-2',
  };

  const content = (
    <>
      {dot && (
        <span 
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}
        />
      )}
      <span>{children}</span>
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-0.5 hover:bg-black/10 rounded transition-colors p-0.5 -mr-1"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </>
  );

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={`
        inline-flex items-center
        font-medium
        rounded-full
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {content}
    </motion.span>
  );
};

export default Badge;
