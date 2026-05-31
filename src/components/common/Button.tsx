import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'success';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode,
  variant?: ButtonVariant,
  size?: ButtonSize,
  disabled?: boolean,
  fullWidth?: boolean,
  loading?: boolean,
  leftIcon?: ReactNode,
  rightIcon?: ReactNode,
  className?: string,
}

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}: ButtonProps) => {
  const variantClasses = {
    primary: 'bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white shadow-sm',
    secondary: 'bg-[var(--color-secondary-500)] hover:bg-[var(--color-secondary-600)] text-white shadow-sm',
    danger: 'bg-[var(--color-error)] hover:bg-red-600 text-white shadow-sm',
    success: 'bg-[var(--color-success)] hover:bg-emerald-600 text-white shadow-sm',
    outline: 'border-2 border-[var(--color-border)] hover:border-[var(--color-gray-300)] hover:bg-[var(--color-gray-50)] text-[var(--color-text-primary)]',
    ghost: 'hover:bg-[var(--color-gray-100)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm gap-1.5',
    medium: 'px-4 py-2.5 text-sm gap-2',
    large: 'px-6 py-3 text-base gap-2',
  };

  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const widthClasses = fullWidth ? 'w-full' : '';
  const activeClasses = !disabled && !loading ? 'active:scale-[0.98]' : '';

  return (
    <button
      disabled={disabled || loading}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${widthClasses}
        ${activeClasses}
        ${className}
        rounded-xl font-medium transition-all duration-200 ease-out
        flex items-center justify-center
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-500)]
      `}
      {...props}
    >
      {loading ? (
        <Loader className="animate-spin" size={size === 'small' ? 14 : size === 'large' ? 20 : 16} />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {rightIcon && !loading && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
