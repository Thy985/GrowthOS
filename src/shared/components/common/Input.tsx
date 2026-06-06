import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label?: ReactNode;
  error?: string;
  helperText?: string;
  className?: string;
  containerClassName?: string;
}

const Input = ({ label, error, helperText, className = '', containerClassName = '', ...props }: InputProps) => {
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      <input
        className={`
          w-full px-4 py-2 rounded-lg
          border ${error ? 'border-red-300' : 'border-gray-300'}
          ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-green-500 focus:border-green-500'}
          transition-all duration-200
          bg-white
          placeholder-gray-400
          ${className}
        `}
        {...props}
      />

      {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
