import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import type { RootState } from '../../../app/store';
import { selectCoachDiagnosis } from '../utils/coachSelectors';

const SEVERITY_COLORS: Record<string, string> = {
  important: 'border-red-200 bg-red-50 text-red-800',
  notice: 'border-orange-200 bg-orange-50 text-orange-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

const SEVERITY_ICONS: Record<string, string> = {
  important: '🔴',
  notice: '🟡',
  info: '🔵',
};

const CoachDiagnosisCard: React.FC = React.memo(function CoachDiagnosisCard() {
  const { t } = useTranslation();
  const diagnosis = useSelector(selectCoachDiagnosis);
  const experiences = useSelector((state: RootState) => state.experiences.experiences);

  if (!diagnosis || experiences.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl">
            🧠
          </div>
          <h2 className="text-lg font-semibold">{t('coach.title', '成长诊断')}</h2>
        </div>
        <p className="text-gray-500 text-sm">
          {t('coach.emptyMessage', '记录第一条经历后，成长教练会为你生成诊断。')}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl">
          🧠
        </div>
        <h2 className="text-lg font-semibold">{t('coach.title', '成长诊断')}</h2>
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <p className="text-base font-medium text-gray-900 leading-relaxed">
          {diagnosis.summary.headline}
        </p>
        {diagnosis.summary.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {diagnosis.summary.highlights.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700"
              >
                {h}
              </span>
            ))}
          </div>
        )}
        {diagnosis.summary.nextAction && (
          <p className="text-sm text-blue-600">{diagnosis.summary.nextAction}</p>
        )}
      </div>

      {/* Insights list */}
      {diagnosis.insights.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          {diagnosis.insights.map((insight, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-lg border p-3 text-sm animate-fade-in stagger-${Math.min(i + 1, 4)} ${SEVERITY_COLORS[insight.severity]}`}
            >
              <span className="flex-shrink-0">{SEVERITY_ICONS[insight.severity]}</span>
              <div>
                <p className="font-medium">{insight.title}</p>
                {insight.description && (
                  <p className="text-xs mt-0.5 opacity-80">{insight.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
});

export default CoachDiagnosisCard;
