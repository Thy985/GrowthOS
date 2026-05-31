import React, { memo, useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loadSyncStatus, performSync } from '../store/slices/syncSlice';
import { useNetworkStatus } from '../utils/networkDetector';
import { useI18n } from '../i18n/useI18n';
import { AppDispatch } from '../store';
import type { RootState } from '../types';
import type { SyncQueueItem } from '../utils/syncQueue';

interface SyncPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SyncPanel: React.FC<SyncPanelProps> = memo(({ isOpen, onClose }) => {
  const { t } = useI18n();
  const dispatch = useDispatch<AppDispatch>();

  const ENTITY_LABELS: Record<string, string> = {
    record: t('common.records'),
    goal: t('common.goals'),
    reminder: t('common.reminders'),
    tree: t('common.growthTree'),
    treeNode: t('common.node')
  };

  const OPERATION_LABELS: Record<string, string> = {
    create: t('common.create'),
    update: t('common.update'),
    delete: t('common.delete')
  };
  const { queue, pendingCount, isSyncing, lastSyncTime } = useSelector((state: RootState) => state.sync);
  const { isOnline } = useNetworkStatus();
  const [expandedItems, setExpandedItems] = useState(new Set<string>());

  useEffect(() => {
    if (isOpen) {
      dispatch(loadSyncStatus());
    }
  }, [isOpen, dispatch]);

  const handleSync = useCallback(async () => {
    if (!isOnline) return;
    await dispatch(performSync());
  }, [isOnline, dispatch]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const formatTime = useCallback((isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getPayloadPreview = useCallback((item: SyncQueueItem) => {
    const payload = item.payload as { title?: string; name?: string; content?: string } || {};
    if (payload.title) return payload.title;
    if (payload.name) return payload.name;
    if (payload.content) return payload.content.substring(0, 50);
    return item.entityId;
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{t('common.syncManagement')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600">{t('common.pendingItems')}</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing || !isOnline || pendingCount === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isSyncing || !isOnline || pendingCount === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isSyncing ? t('common.syncing') : t('common.syncAll')}
            </button>
          </div>

          {!isOnline && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
              <span>📴</span>
              <span>{t('common.networkUnavailable')}</span>
            </div>
          )}

          {lastSyncTime && (
            <p className="text-xs text-gray-500 mt-2">
              {t('common.lastSync')}: {formatTime(lastSyncTime)}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <span className="text-4xl mb-2">✅</span>
              <p>{t('common.allSynced')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {queue.map((item: SyncQueueItem) => (
                <div key={item.id} className="p-4">
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className={`mt-1 ${
                      item.operation === 'create' ? 'text-green-500' :
                      item.operation === 'update' ? 'text-blue-500' :
                      'text-red-500'
                    }`}>
                      {item.operation === 'create' ? '➕' :
                       item.operation === 'update' ? '✏️' : '🗑️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {ENTITY_LABELS[item.entityType] || item.entityType}
                        </span>
                        <span className="text-sm font-medium">
                          {OPERATION_LABELS[item.operation]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mt-1 truncate">
                        {getPayloadPreview(item)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(item.createdAt)}
                      </p>
                    </div>
                    <span className="text-gray-400">
                      {expandedItems.has(item.id) ? '▼' : '▶'}
                    </span>
                  </div>

                  {expandedItems.has(item.id) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs">
                      <div className="space-y-1">
                        <p><span className="text-gray-500">ID:</span> {item.entityId}</p>
                        <p><span className="text-gray-500">重试次数:</span> {item.retryCount}</p>
                        <p><span className="text-gray-500">时间:</span> {item.createdAt}</p>
                      </div>
                      {item.payload !== undefined && item.payload !== null && (
                        <pre className="mt-2 p-2 bg-white rounded overflow-x-auto">
                          {JSON.stringify(item.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
});

SyncPanel.displayName = 'SyncPanel';

export default SyncPanel;
