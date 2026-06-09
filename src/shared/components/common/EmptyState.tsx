import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  illustration?: 'none' | 'simple';
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
  illustration = 'none',
}) {
  const { t } = useTranslation();

  const renderAction = (action: EmptyStateAction, variant: 'primary' | 'secondary') => {
    const baseClasses = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200';
    const variantClasses =
      variant === 'primary'
        ? 'bg-blue-500 hover:bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-gray-100';

    if (action.href) {
      return (
        <Link to={action.href} className={`${baseClasses} ${variantClasses}`}>
          {action.label}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={action.onClick}
        className={`${baseClasses} ${variantClasses}`}
      >
        {action.label}
      </button>
    );
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-12 bg-gray-50/50 rounded-2xl border border-gray-200 text-center ${className}`}
    >
      {illustration === 'simple' && (
        <div className="mb-6 flex items-center justify-center w-full max-w-xs">
          <svg
            className="w-full h-24 text-gray-200"
            viewBox="0 0 200 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="10" y="10" width="50" height="60" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <rect x="75" y="10" width="50" height="60" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <rect x="140" y="10" width="50" height="60" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        </div>
      )}

      <div className="flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-full text-2xl">
        {icon}
      </div>

      <h3 className="mt-4 text-xl font-semibold text-gray-900">
        {t(title, title)}
      </h3>

      {description && (
        <p className="mt-2 text-sm text-gray-500 max-w-sm">
          {t(description, description)}
        </p>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="flex gap-3 mt-6">
          {secondaryAction && renderAction(secondaryAction, 'secondary')}
          {primaryAction && renderAction(primaryAction, 'primary')}
        </div>
      )}
    </div>
  );
});

export default EmptyState;
