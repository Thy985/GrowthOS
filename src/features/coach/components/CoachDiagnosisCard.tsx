import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import type { RootState, AppDispatch } from '../../../app/store';
import { runCoachAnalysis } from '../store/coachSlice';
import { selectCoachDiagnosis, selectIsCoachCacheValid } from '../utils/coachSelectors';

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
  const dispatch = useDispatch<AppDispatch>();
  const diagnosis = useSelector(selectCoachDiagnosis);
  const isCacheValid = useSelector(selectIsCoachCacheValid);
  const experiences = useSelector((state: RootState) => state.experiences.experiences);

  useMemo(() => {
    if (!isCacheValid && experiences.length > 0) {
      dispatch(runCoachAnalysis());
    }
  }, [isCacheValid, experiences.length, dispatch]);

  if (!diagnosis || experiences.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">🧠 {t('coach.title', '成长诊断')}</h2>
        <p className="text-gray-400 text-sm">
          {t('coach.emptyMessage', '记录第一条经历后，成长教练会为你生成诊断。')}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="text-lg font-semibold">🧠 {t('coach.title', '成长诊断')}</h2>

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
              className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${SEVERITY_COLORS[insight.severity]}`}
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
