import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import type { RootState } from '../../../app/store';
import { selectCoachRecommendations } from '../utils/coachSelectors';

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

const PRIORITY_ORDER = ['high', 'medium', 'low'] as const;

const CoachRecommendations: React.FC = React.memo(function CoachRecommendations() {
  const { t } = useTranslation();
  const recommendations = useSelector(selectCoachRecommendations);
  const experiences = useSelector((state: RootState) => state.experiences.experiences);

  if (recommendations.length === 0 && experiences.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold">
          🎯 {t('coach.recommendationsTitle', '推荐下一步')}
        </h2>
        <p className="text-gray-400 text-sm">{t('coach.emptyRecommendations', '暂无推荐建议')}</p>
      </section>
    );
  }

  // Group by priority
  const grouped = PRIORITY_ORDER.map((priority) => ({
    priority,
    items: recommendations.filter((r) => r.priority === priority),
  })).filter((g) => g.items.length > 0);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="text-lg font-semibold">🎯 {t('coach.recommendationsTitle', '推荐下一步')}</h2>

      {grouped.length > 0 ? (
        <div className="space-y-3">
          {grouped.map(({ priority, items }) => (
            <div key={priority} className="space-y-2">
              {items.map((rec, i) => (
                <div
                  key={`${priority}-${i}`}
                  className={`rounded-lg border p-3 ${PRIORITY_COLORS[priority]} hover:opacity-80 transition-opacity cursor-pointer`}
                >
                  <p className="text-sm font-semibold">
                    {PRIORITY_ICONS[priority]} {rec.title}
                  </p>
                  <p className="text-xs mt-1 opacity-75">{rec.action}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">{t('coach.emptyRecommendations', '暂无推荐建议')}</p>
      )}
    </section>
  );
});

export default CoachRecommendations;
