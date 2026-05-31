import type { InputHTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  containerClassName?: string;
}

const Input = ({
  label,
  error,
  helperText,
  success,
  leftIcon,
  rightIcon,
  size = 'medium',
  className = '',
  containerClassName = '',
  ...props
}: InputProps) => {
  const sizeClasses = {
    small: 'py-1.5 text-sm',
    medium: 'py-2.5 text-sm',
    large: 'py-3 text-base',
  };

  const iconSizes = {
    small: 14,
    medium: 16,
    large: 18,
  };

  const hasError = Boolean(error);
  const hasSuccess = Boolean(success) && !hasError;

  const inputClasses = `
    ${sizeClasses[size]}
    w-full px-4
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon || hasError || hasSuccess ? 'pr-10' : ''}
    rounded-xl
    border-2
    ${hasError 
      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
      : hasSuccess 
        ? 'border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'
        : 'border-[var(--color-border)] focus:border-[var(--color-primary-500)] focus:ring-4 focus:ring-[var(--color-primary-100)]'
    }
    bg-[var(--color-surface)]
    text-[var(--color-text-primary)]
    placeholder-[var(--color-text-muted)]
    transition-all duration-200
    outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `;

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-primary)]">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div 
            className={`
              absolute left-3 top-1/2 -translate-y-1/2 
              text-[var(--color-text-muted)]
              pointer-events-none
            `}
          >
            {leftIcon}
          </div>
        )}

        <input
          className={inputClasses}
          {...props}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <AnimatePresence mode="wait">
            {hasError && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <AlertCircle 
                  size={iconSizes[size]} 
                  className="text-red-500" 
                />
              </motion.div>
            )}
            {hasSuccess && !hasError && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <svg
                  width={iconSizes[size]}
                  height={iconSizes[size]}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-500"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
            )}
            {!hasError && !hasSuccess && rightIcon && (
              <div className="text-[var(--color-text-muted)]">
                {rightIcon}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {(error || helperText || success) && (
          <motion.p
            key={error || success || helperText}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={`
              text-sm
              ${error ? 'text-red-600' : hasSuccess ? 'text-emerald-600' : 'text-[var(--color-text-secondary)]'}
            `}
          >
            {error || success || helperText}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Input;
