import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode,
  title?: string,
  subtitle?: string,
  headerAction?: ReactNode,
  footer?: ReactNode,
  noPadding?: boolean,
  hoverable?: boolean,
  className?: string,
  onClick?: () => void,
}

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  noPadding = false,
  hoverable = false,
  className = '',
  onClick,
}: CardProps) => {
  const hoverableClasses = hoverable 
    ? 'cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5' 
    : '';
  
  const Component = onClick ? motion.div : 'div';
  const motionProps = onClick ? {
    whileHover: { y: -2 },
    whileTap: { scale: 0.99 },
  } : {};

  return (
    <Component
      className={`
        bg-[var(--color-surface)]
        border border-[var(--color-border)]
        rounded-2xl
        shadow-sm
        transition-all duration-200
        ${hoverableClasses}
        ${className}
      `}
      onClick={onClick}
      {...motionProps}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-5 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-[var(--font-display)]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] rounded-b-2xl">
          {footer}
        </div>
      )}
    </Component>
  );
};

export default Card;
