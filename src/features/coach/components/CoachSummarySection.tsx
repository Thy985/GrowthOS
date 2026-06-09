import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import type { RootState } from '../../../app/store';

const CoachSummarySection: React.FC = React.memo(function CoachSummarySection() {
  const { t } = useTranslation();
  const summary = useSelector((state: RootState) => state.coach.diagnosis?.summary ?? null);

  if (!summary) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">{t('coach.summaryTitle', '诊断摘要')}</h2>
        <p className="text-gray-400 text-sm">{t('coach.noData', '暂无数据')}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="text-lg font-semibold">{t('coach.summaryTitle', '诊断摘要')}</h2>

      {/* Completion Rate (V2) */}
      {summary.completionRate && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500">
            {t('coach.metrics.weeklyExecution', '本周执行力')}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{
                  width: `${summary.completionRate.totalThisWeek > 0
                    ? Math.round(
                        (summary.completionRate.completedThisWeek /
                          summary.completionRate.totalThisWeek) *
                          100,
                      )
                    : 0}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {summary.completionRate.completedThisWeek}/
              {summary.completionRate.totalThisWeek}
            </span>
          </div>
        </div>
      )}

      {/* Headline（占 40% 视觉权重） */}
      <p className="text-base font-semibold text-gray-900">{summary.headline}</p>

      {/* Highlights（占 20%） */}
      {summary.highlights.length > 0 && (
        <div>
          <p className="text-xs font-medium text-green-600 mb-1.5">
            {t('coach.highlights', '正在成长')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {summary.highlights.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Concerns（占 25%） */}
      {summary.concerns.length > 0 && (
        <div>
          <p className="text-xs font-medium text-red-600 mb-1.5">
            {t('coach.concerns', '需要关注')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {summary.concerns.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Next Action（占 15%） */}
      {summary.nextAction && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-sm font-medium text-blue-600">{summary.nextAction}</p>
        </div>
      )}
    </section>
  );
});

export default CoachSummarySection;