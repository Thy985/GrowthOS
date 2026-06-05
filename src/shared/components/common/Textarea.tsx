import type { TextareaHTMLAttributes, ReactNode } from 'react';

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> {
  label?: ReactNode;
  error?: string;
  helperText?: string;
  className?: string;
  containerClassName?: string;
  rows?: number;
}

const Textarea = ({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  rows = 4,
  ...props
}: TextareaProps) => {
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      <textarea
        rows={rows}
        className={`
          w-full px-4 py-2 rounded-lg
          border ${error ? 'border-red-300' : 'border-gray-300'}
          ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-green-500 focus:border-green-500'}
          transition-all duration-200
          bg-white
          placeholder-gray-400
          resize-none
          ${className}
        `}
        {...props}
      />

      {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Textarea;
