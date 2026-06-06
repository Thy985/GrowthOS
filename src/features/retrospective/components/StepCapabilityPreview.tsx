// StepCapabilityPreview - 步骤 4：能力变化预览
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { CapabilityImpact } from '../types/retrospectiveTypes';

interface StepCapabilityPreviewProps {
  impacts: CapabilityImpact[];
}

const StepCapabilityPreview: React.FC<StepCapabilityPreviewProps> = ({ impacts }) => {
  const { t } = useTranslation();

  if (impacts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-lg">{t('retrospective.noImpact', '本次复盘未产生能力等级变化')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {impacts.map((impact) => (
        <div key={impact.capabilityId} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-800">{impact.capabilityName}</span>
            <span
              className={`text-sm font-semibold ${
                impact.change > 0 ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              {impact.change > 0
                ? t('retrospective.levelChange', { change: impact.change })
                : impact.change}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Lv.{impact.oldLevel}</span>
            <span className="text-gray-300">→</span>
            <span className="text-indigo-600 font-medium">Lv.{impact.newLevel}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${impact.newLevel}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{impact.reason}</p>
        </div>
      ))}
    </div>
  );
};

export default React.memo(StepCapabilityPreview);
