import type { HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'gradient';

const cardVariants: Record<CardVariant, string> = {
  default:
    'bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-gray-200',
  elevated:
    'bg-white rounded-2xl shadow-lg border-0 hover:shadow-xl',
  outlined:
    'bg-transparent rounded-xl border-2 border-gray-200 shadow-none hover:border-gray-300 hover:shadow-sm',
  filled:
    'bg-gray-50 rounded-xl shadow-none border-0 hover:shadow-sm',
  gradient:
    'bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 hover:shadow-md hover:border-indigo-200',
};

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  headerAction?: ReactNode;
  variant?: CardVariant;
  className?: string;
  'data-testid'?: string;
}

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  variant = 'default',
  className = '',
  'data-testid': dataTestId,
  ...props
}: CardProps) => {
  return (
    <div
      className={`
        transition-all duration-200
        ${cardVariants[variant]}
        ${className}
      `}
      data-testid={dataTestId}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </div>
      )}

      <div className="p-6">{children}</div>
    </div>
  );
};

export default Card;
