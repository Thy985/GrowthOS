// StepSelectCapabilities - 步骤 1：选择涉及的能力
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import type { RootState, Capability } from '../../../shared/types';

interface StepSelectCapabilitiesProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

const categoryLabels: Record<string, string> = {
  mind: '思维',
  skill: '技能',
  cognition: '认知',
  body: '体能',
  social: '社交',
};

const StepSelectCapabilities: React.FC<StepSelectCapabilitiesProps> = ({ selected, onChange }) => {
  const { t } = useTranslation();
  const capabilities = useSelector((state: RootState) => state.capabilities.capabilities);

  const grouped = useMemo(() => {
    const map: Record<string, Capability[]> = {};
    for (const cap of capabilities) {
      const cat = cap.category || 'other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(cap);
    }
    return map;
  }, [capabilities]);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  if (capabilities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-lg">{t('retrospective.noCapabilities', '暂无能力')}</p>
        <p className="text-sm mt-1">
          {t('retrospective.noCapabilitiesHint', '请先在能力管理中创建能力')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">
        {t('retrospective.selectedCount', { count: selected.length })}
      </p>
      {Object.entries(grouped).map(([category, caps]) => (
        <div key={category} className="mb-4">
          <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
            {categoryLabels[category] || category}
          </h4>
          <div className="space-y-1">
            {caps.map((cap) => (
              <label
                key={cap.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  selected.includes(cap.id)
                    ? 'bg-indigo-50 border border-indigo-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(cap.id)}
                  onChange={() => toggle(cap.id)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="flex-1 text-sm text-gray-700">{cap.name}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  Lv.{cap.currentLevel}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(StepSelectCapabilities);
