/**
 * 快照详情面板
 *
 * 展示点击数据点后快照的详细信息。
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

import type { CapabilityHistory } from '../../../shared/types';

interface SnapshotDetailPanelProps {
  snapshot: CapabilityHistory;
  capabilityName?: string;
  onClose: () => void;
}

function SnapshotDetailPanelInner({ snapshot, capabilityName, onClose }: SnapshotDetailPanelProps) {
  const { t } = useTranslation();

  const recordedDate = new Date(snapshot.recordedAt);
  const dateStr = recordedDate.toLocaleDateString();
  const timeStr = recordedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const triggerText = snapshot.triggerExperienceId
    ? t('growthCurve.detail.triggerExperience', '关联经历')
    : t('growthCurve.detail.manualUpdate', '手动更新');

  return (
    <div
      data-testid="snapshot-detail-panel"
      className="mt-3 bg-gray-50 rounded-lg p-3 text-xs space-y-2 border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-700">
          {t('growthCurve.detail.title', '快照详情')}
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={t('common.close', '关闭')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      {capabilityName && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{t('capabilities.name', '能力')}</span>
          <span className="font-medium text-gray-900">{capabilityName}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-gray-500">{t('growthCurve.detail.snapshotId', '快照 ID')}</span>
        <span className="font-mono text-gray-600 text-[10px]">{snapshot.id}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500">{t('growthCurve.detail.level', '等级')}</span>
        <span className="font-mono font-medium text-indigo-600">{snapshot.level}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500">{t('growthCurve.detail.recordedAt', '记录时间')}</span>
        <span>
          {dateStr} {timeStr}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500">{t('growthCurve.detail.trigger', '触发方式')}</span>
        <span>{triggerText}</span>
      </div>
      {snapshot.triggerExperienceId && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{t('growthCurve.detail.experienceId', '经历 ID')}</span>
          <span className="font-mono text-gray-600 text-[10px]">
            {snapshot.triggerExperienceId}
          </span>
        </div>
      )}
    </div>
  );
}

const SnapshotDetailPanel = React.memo(SnapshotDetailPanelInner);
SnapshotDetailPanel.displayName = 'SnapshotDetailPanel';

export default SnapshotDetailPanel;
