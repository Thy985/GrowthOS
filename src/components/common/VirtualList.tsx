import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, MessageSquare } from 'lucide-react';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
  overscanCount?: number;
  width?: string | number;
}

function VirtualListInner<T>({
  items,
  height,
  itemHeight,
  renderItem,
  keyExtractor,
  emptyMessage = '暂无数据',
  loading = false,
  className = '',
  width = '100%'
}: VirtualListProps<T>) {

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-2" size={32} />
          <p className="text-[var(--color-text-secondary)]">加载中...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center py-12">
          <MessageSquare size={48} className="mx-auto mb-4 text-[var(--color-gray-300)]" />
          <p className="text-[var(--color-text-secondary)]">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`overflow-y-auto ${className}`} 
      style={{ height, width }}
    >
      {items.map((item, index) => (
        <div 
          key={keyExtractor(item)}
          style={{ height: itemHeight }}
          className="px-4"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={keyExtractor(item)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {renderItem(item, index)}
            </motion.div>
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export const VirtualList = memo(VirtualListInner) as <T>(
  props: VirtualListProps<T>
) => JSX.Element;

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = ''
}) => {
  const defaultIcon = <MessageSquare size={64} className="text-[var(--color-gray-300)]" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <div className="w-20 h-20 rounded-full bg-[var(--color-gray-100)] flex items-center justify-center mb-6">
        {icon || defaultIcon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </motion.div>
  );
};

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = '加载中...',
  size = 'medium',
  className = ''
}) => {
  const sizeConfig = {
    small: { loader: 20, text: 'text-sm' },
    medium: { loader: 32, text: 'text-base' },
    large: { loader: 48, text: 'text-lg' }
  };

  const { loader, text } = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Loader className="animate-spin mb-4" size={loader} />
      <p className={`${text} text-[var(--color-text-secondary)]`}>{message}</p>
    </div>
  );
};

export default VirtualList;
