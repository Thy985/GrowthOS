import React from 'react';
import { useTranslation } from 'react-i18next';

import type { CoachDiagnosis } from '../../coach/types/coachTypes';

const SEVERITY_COLORS: Record<string, string> = {
  important: 'border-red-200 bg-red-50 text-red-800',
  notice: 'border-orange-200 bg-orange-50 text-orange-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-yellow-200 bg-yellow-50',
  low: 'border-green-200 bg-green-50',
};

const PRIORITY_ICONS: Record<string, string> = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
};

interface ReportInsightsSectionProps {
  diagnosis: CoachDiagnosis;
}

const ReportInsightsSection: React.FC<ReportInsightsSectionProps> = React.memo(
  function ReportInsightsSection({ diagnosis }) {
    const { t } = useTranslation();
    const { summary, insights, recommendations } = diagnosis;

    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
        <h2 className="text-lg font-semibold">{t('reports.diagnosis', '诊断分析')}</h2>

        {/* Summary */}
        <div className="space-y-2">
          <p className="text-base font-semibold text-gray-900">{summary.headline}</p>

          {summary.highlights.length > 0 && (
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
          )}

          {summary.concerns.length > 0 && (
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
          )}

          {summary.nextAction && (
            <p className="text-sm font-medium text-blue-600">{summary.nextAction}</p>
          )}
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500">{t('reports.insights', '洞察')}</p>
            {insights.slice(0, 8).map((insight, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-lg border p-2.5 text-sm ${SEVERITY_COLORS[insight.severity]}`}
              >
                <span className="flex-shrink-0">{insight.icon}</span>
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

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500">
              {t('reports.recommendations', '推荐下一步')}
            </p>
            {recommendations.map((rec, i) => (
              <div key={i} className={`rounded-lg border p-2.5 ${PRIORITY_COLORS[rec.priority]}`}>
                <p className="text-sm font-semibold">
                  {PRIORITY_ICONS[rec.priority]} {rec.title}
                </p>
                <p className="text-xs mt-1 opacity-75">{rec.action}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  },
);

export default ReportInsightsSection;
