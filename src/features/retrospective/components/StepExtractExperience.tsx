// StepExtractExperience - 步骤 3：提炼经验
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { WizardExperience, WizardCapabilityLink } from '../types/retrospectiveTypes';

interface StepExtractExperienceProps {
  experiences: WizardExperience[];
  capabilitiesUsed: string[];
  capabilityNames: Map<string, string>;
  onChange: (experiences: WizardExperience[]) => void;
}

const emptyExperience = (): WizardExperience => ({
  event: '',
  reflection: '',
  principle: '',
  capabilityLinks: [],
});

const StepExtractExperience: React.FC<StepExtractExperienceProps> = ({
  experiences,
  capabilitiesUsed,
  capabilityNames,
  onChange,
}) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<WizardExperience[]>(
    experiences.length > 0 ? experiences : [emptyExperience()],
  );

  const updateItem = (index: number, updates: Partial<WizardExperience>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...updates } : item));
    setItems(next);
    onChange(next);
  };

  const addItem = () => {
    const next = [...items, emptyExperience()];
    setItems(next);
    onChange(next);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    onChange(next);
  };

  const toggleCapabilityLink = (index: number, capId: string) => {
    const item = items[index];
    const existing = item.capabilityLinks.find((l) => l.capabilityId === capId);
    const nextLinks: WizardCapabilityLink[] = existing
      ? item.capabilityLinks.filter((l) => l.capabilityId !== capId)
      : [...item.capabilityLinks, { capabilityId: capId, contribution: 0.5 }];
    updateItem(index, { capabilityLinks: nextLinks });
  };

  const updateContribution = (index: number, capId: string, contribution: number) => {
    const item = items[index];
    const nextLinks = item.capabilityLinks.map((l) =>
      l.capabilityId === capId ? { ...l, contribution } : l,
    );
    updateItem(index, { capabilityLinks: nextLinks });
  };

  return (
    <div className="space-y-4">
      {items.map((exp, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-lg leading-none"
            >
              &times;
            </button>
          )}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('retrospective.experienceEvent', '经验描述')} *
              </label>
              <input
                type="text"
                value={exp.event}
                onChange={(e) => updateItem(index, { event: e.target.value })}
                placeholder={t(
                  'retrospective.experienceEventPlaceholder',
                  '例如：通过充分的代码评审发现了3个潜在bug',
                )}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('experiences.reflection', '反思')}
              </label>
              <textarea
                value={exp.reflection || ''}
                onChange={(e) => updateItem(index, { reflection: e.target.value })}
                rows={2}
                placeholder={t('experiences.reflectionPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('experiences.principle', '原则')}
              </label>
              <input
                type="text"
                value={exp.principle || ''}
                onChange={(e) => updateItem(index, { principle: e.target.value })}
                placeholder={t('experiences.principlePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
              />
            </div>
            {capabilitiesUsed.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('experiences.linkCapabilities', '关联能力')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {capabilitiesUsed.map((capId) => {
                    const linked = exp.capabilityLinks.find((l) => l.capabilityId === capId);
                    return (
                      <div key={capId} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleCapabilityLink(index, capId)}
                          className={`text-xs px-2 py-1 rounded-full transition-colors ${
                            linked
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          {capabilityNames.get(capId) || capId}
                        </button>
                        {linked && (
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={linked.contribution}
                            onChange={(e) =>
                              updateContribution(index, capId, parseFloat(e.target.value))
                            }
                            className="w-16 h-1 accent-indigo-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors text-sm"
      >
        + {t('retrospective.addMoreExperience', '添加更多经验')}
      </button>
    </div>
  );
};

export default React.memo(StepExtractExperience);
