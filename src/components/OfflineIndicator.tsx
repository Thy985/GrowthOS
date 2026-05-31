import React, { memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNetworkStatus } from '../utils/networkDetector';
import { performSync } from '../store/slices/syncSlice';
import { useI18n } from '../i18n/useI18n';
import { AppDispatch } from '../store';
import type { RootState } from '../types';

interface OfflineIndicatorProps {
  onOpenSyncPanel?: () => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = memo(({ onOpenSyncPanel }) => {
  const { t } = useI18n();
  const dispatch = useDispatch<AppDispatch>();
  const { isOnline } = useNetworkStatus();
  const { pendingCount, isSyncing } = useSelector((state: RootState) => state.sync);

  const handleSync = () => {
    if (onOpenSyncPanel) {
      onOpenSyncPanel();
    } else {
      dispatch(performSync());
    }
  };

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm font-medium transition-colors ${
        !isOnline
          ? 'bg-gray-500 text-white'
          : pendingCount > 0
          ? 'bg-amber-500 text-white'
          : 'bg-green-500 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <span>📴</span>
              <span>{t('common.offline')}</span>
              {pendingCount > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                  {t('common.pendingItems', { count: pendingCount })}
                </span>
              )}
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>{t('common.pendingItems', { count: pendingCount })}</span>
            </>
          )}
        </div>

        {pendingCount > 0 && (
          <button
            onClick={handleSync}
            disabled={isSyncing || !isOnline}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              isSyncing
                ? 'bg-white/30 text-white/70 cursor-not-allowed'
                : !isOnline
                ? 'bg-white/20 text-white/70 cursor-not-allowed'
                : 'bg-white text-amber-600 hover:bg-white/90'
            }`}
          >
            {isSyncing ? t('common.syncing') : t('common.sync')}
          </button>
        )}
      </div>
    </div>
  );
});

OfflineIndicator.displayName = 'OfflineIndicator';

export default OfflineIndicator;
