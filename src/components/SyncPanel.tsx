import React, { memo, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loadSyncStatus, performSync } from '../store/slices/syncSlice';
import { useNetworkStatus } from '../utils/networkDetector';

const ENTITY_LABELS = {
  record: '记录',
  goal: '目标',
  reminder: '提醒',
  tree: '成长树',
  treeNode: '节点'
};

const OPERATION_LABELS = {
  create: '创建',
  update: '更新',
  delete: '删除'
};

const SyncPanel = memo(({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { queue, pendingCount, isSyncing, lastSyncTime } = useSelector(state => state.sync);
  const { isOnline } = useNetworkStatus();
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      dispatch(loadSyncStatus());
    }
  }, [isOpen, dispatch]);

  const handleSync = async () => {
    if (!isOnline) return;
    await dispatch(performSync());
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPayloadPreview = (item) => {
    const payload = item.payload || {};
    if (payload.title) return payload.title;
    if (payload.name) return payload.name;
    if (payload.content) return payload.content.substring(0, 50);
    return item.entityId;
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">同步管理</h2>
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
              <p className="text-sm text-gray-600">待同步项目</p>
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
              {isSyncing ? '同步中...' : '全部同步'}
            </button>
          </div>

          {!isOnline && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
              <span>📴</span>
              <span>网络不可用，请检查连接后重试</span>
            </div>
          )}

          {lastSyncTime && (
            <p className="text-xs text-gray-500 mt-2">
              上次同步: {formatTime(lastSyncTime)}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <span className="text-4xl mb-2">✅</span>
              <p>所有数据已同步</p>
            </div>
          ) : (
            <div className="divide-y">
              {queue.map(item => (
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
                        {formatTime(item.timestamp)}
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
                        <p><span className="text-gray-500">时间:</span> {item.timestamp}</p>
                      </div>
                      {item.payload && (
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
