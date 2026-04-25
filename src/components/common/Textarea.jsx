import React from 'react';

const Textarea = ({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  rows = 4,
  ...props
}) => {
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {/* 标签 */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* 文本域 */}
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

      {/* 辅助文本 */}
      {helperText && !error && (
        <p className="text-sm text-gray-500">
          {helperText}
        </p>
      )}

      {/* 错误信息 */}
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default Textarea;
