import React, { memo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { resolveConflict as resolveConflictAction, removeConflict } from '../store/slices/syncSlice';

const ENTITY_LABELS = {
  record: '记录',
  goal: '目标',
  reminder: '提醒',
  tree: '成长树',
  treeNode: '节点'
};

const ConflictModal = memo(({ conflict, onClose }) => {
  const dispatch = useDispatch();
  const [isResolving, setIsResolving] = useState(false);

  if (!conflict) return null;

  const localData = conflict.localData || {};
  const serverData = conflict.serverData || {};

  const getDisplayValue = (data, key) => {
    const value = data[key];
    if (value === undefined || value === null) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const allKeys = Array.from(
    new Set([...Object.keys(localData), ...Object.keys(serverData)])
  ).filter(k => !k.startsWith('_') && !['id', 'localVersion', 'serverVersion'].includes(k));

  const handleResolve = async (resolution) => {
    setIsResolving(true);
    try {
      if (resolution === 'merge') {
        const mergedData = { ...serverData, ...localData };
        await dispatch(
          resolveConflictAction({
            entityType: conflict.entityType,
            entityId: conflict.entityId,
            resolution: 'merge',
            mergedData
          })
        );
      } else {
        await dispatch(
          resolveConflictAction({
            entityType: conflict.entityType,
            entityId: conflict.entityId,
            resolution
          })
        );
      }
      dispatch(removeConflict(conflict.entityId));
      onClose();
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-amber-50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-lg font-semibold text-amber-800">同步冲突</h2>
          </div>
          <p className="text-sm text-amber-600 mt-1">
            {ENTITY_LABELS[conflict.entityType] || conflict.entityType} 存在版本冲突，请选择保留哪个版本
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-xl overflow-hidden">
              <div className="bg-blue-50 p-3 border-b">
                <h3 className="font-medium text-blue-700 flex items-center gap-2">
                  <span>📱</span> 本地版本
                </h3>
              </div>
              <div className="p-3 space-y-2 text-sm">
                {allKeys.map(key => (
                  <div key={key} className="flex flex-col">
                    <span className="text-gray-500 text-xs">{key}</span>
                    <span className="font-medium break-all">
                      {getDisplayValue(localData, key)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <div className="bg-purple-50 p-3 border-b">
                <h3 className="font-medium text-purple-700 flex items-center gap-2">
                  <span>☁️</span> 服务器版本
                </h3>
              </div>
              <div className="p-3 space-y-2 text-sm">
                {allKeys.map(key => {
                  const isDifferent = JSON.stringify(localData[key]) !== JSON.stringify(serverData[key]);
                  return (
                    <div key={key} className="flex flex-col">
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        {key}
                        {isDifferent && <span className="text-amber-500">*</span>}
                      </span>
                      <span className={`font-medium break-all ${isDifferent ? 'text-purple-700' : ''}`}>
                        {getDisplayValue(serverData, key)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
            <p className="flex items-start gap-2">
              <span className="text-gray-400">💡</span>
              <span>* 表示该字段在两个版本中不同。如果选择"合并"，本地版本的更改将覆盖服务器版本的不同字段。</span>
            </p>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={() => handleResolve('local')}
              disabled={isResolving}
              className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              保留本地
            </button>
            <button
              onClick={() => handleResolve('server')}
              disabled={isResolving}
              className="flex-1 py-3 px-4 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              使用服务器
            </button>
            <button
              onClick={() => handleResolve('merge')}
              disabled={isResolving}
              className="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              合并
            </button>
          </div>
          <button
            onClick={onClose}
            disabled={isResolving}
            className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            稍后处理
          </button>
        </div>
      </div>
    </div>
  );
});

ConflictModal.displayName = 'ConflictModal';

export default ConflictModal;
