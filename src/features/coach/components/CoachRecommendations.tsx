import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import type { RootState } from '../../../app/store';
import { selectCoachRecommendations } from '../utils/coachSelectors';

const PRIORITY_COLORS: Record<string, { border: string; bg: string; badge: string; text: string }> = {
  high: {
    border: 'border-red-200',
    bg: 'bg-red-50/50',
    badge: 'bg-red-100 text-red-700',
    text: 'text-red-800',
  },
  medium: {
    border: 'border-amber-200',
    bg: 'bg-amber-50/50',
    badge: 'bg-amber-100 text-amber-700',
    text: 'text-amber-800',
  },
  low: {
    border: 'border-green-200',
    bg: 'bg-green-50/50',
    badge: 'bg-green-100 text-green-700',
    text: 'text-green-800',
  },
};

const PRIORITY_ICONS: Record<string, string> = {
  high: '🔥',
  medium: '💡',
  low: '✨',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: '紧急',
  medium: '建议',
  low: '可选',
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
    <section
      className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 animate-fade-in"
      data-testid="coach-recommendations"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          🎯 {t('coach.recommendationsTitle', '推荐下一步')}
        </h2>
        <Link
          to="/coach"
          className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
        >
          {t('coach.viewAll', '查看全部 →')}
        </Link>
      </div>

      {grouped.length > 0 ? (
        <div className="space-y-4">
          {grouped.map(({ priority, items }) => {
            const colors = PRIORITY_COLORS[priority];
            return (
              <div key={priority} className="space-y-2">
                {/* Priority Label */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                    {PRIORITY_LABELS[priority]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {items.length} {t('common.count', '条')}
                  </span>
                </div>

                {/* Recommendation Cards */}
                <div className="space-y-2">
                  {items.map((rec, i) => (
                    <div
                      key={`${priority}-${i}`}
                      className={`group rounded-xl border ${colors.border} ${colors.bg} p-3 hover:shadow-sm transition-all duration-200 cursor-pointer animate-fade-in stagger-${Math.min(i + 1, 4)}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 mt-0.5 text-base">
                          {PRIORITY_ICONS[priority]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${colors.text}`}>
                            {rec.title}
                          </p>
                          <p className="text-xs mt-1 text-gray-600 group-hover:text-gray-800 transition-colors">
                            {rec.action}
                          </p>
                        </div>
                        <span className="flex-shrink-0 text-gray-300 group-hover:text-blue-500 transition-colors mt-0.5">
                          →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">{t('coach.emptyRecommendations', '暂无推荐建议')}</p>
      )}
    </section>
  );
});

export default CoachRecommendations;
