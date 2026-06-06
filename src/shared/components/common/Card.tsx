import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  headerAction?: ReactNode;
  className?: string;
}

const Card = ({ children, title, subtitle, headerAction, className = '', ...props }: CardProps) => {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-md
        border border-gray-100
        transition-all duration-200
        hover:shadow-lg
        ${className}
      `}
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
