// StepFreeRetrospective - 步骤 2：自由回顾
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface StepFreeRetrospectiveProps {
  whatWentWell: string[];
  whatWentWrong: string[];
  nextTime: string[];
  onChange: (data: { whatWentWell: string[]; whatWentWrong: string[]; nextTime: string[] }) => void;
}

const StepFreeRetrospective: React.FC<StepFreeRetrospectiveProps> = ({
  whatWentWell,
  whatWentWrong,
  nextTime,
  onChange,
}) => {
  const { t } = useTranslation();
  const [wellText, setWellText] = useState(whatWentWell.join('\n'));
  const [wrongText, setWrongText] = useState(whatWentWrong.join('\n'));
  const [nextText, setNextText] = useState(nextTime.join('\n'));

  const handleBlur = () => {
    onChange({
      whatWentWell: wellText.split('\n').filter(Boolean),
      whatWentWrong: wrongText.split('\n').filter(Boolean),
      nextTime: nextText.split('\n').filter(Boolean),
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('projects.whatWentWellLabel')}
        </label>
        <textarea
          value={wellText}
          onChange={(e) => setWellText(e.target.value)}
          onBlur={handleBlur}
          rows={3}
          placeholder={t('projects.whatWentWellPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          {wellText.split('\n').filter(Boolean).length} 条
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('projects.whatWentWrongLabel')}
        </label>
        <textarea
          value={wrongText}
          onChange={(e) => setWrongText(e.target.value)}
          onBlur={handleBlur}
          rows={3}
          placeholder={t('projects.whatWentWrongPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          {wrongText.split('\n').filter(Boolean).length} 条
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('projects.nextTimeLabel')}
        </label>
        <textarea
          value={nextText}
          onChange={(e) => setNextText(e.target.value)}
          onBlur={handleBlur}
          rows={3}
          placeholder={t('projects.nextTimePlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          {nextText.split('\n').filter(Boolean).length} 条
        </p>
      </div>
    </div>
  );
};

export default React.memo(StepFreeRetrospective);
