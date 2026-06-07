import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectCoachRecommendations } from '../utils/coachSelectors';
import { coachActionRegistry } from '../actions/coachActionRegistry';

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

function resolveRoute(rec: {
  linkTo?: { route: string; label: string };
  actionId?: string;
  actionParams?: Record<string, string>;
}): { route: string; label: string } | null {
  if (rec.linkTo) return rec.linkTo;
  if (rec.actionId) {
    const action = coachActionRegistry[rec.actionId];
    if (action) {
      return {
        route: action.buildRoute?.(rec.actionParams ?? {}) ?? action.route,
        label: action.label,
      };
    }
  }
  return null;
}

const RecommendationPanel: React.FC = React.memo(function RecommendationPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const recommendations = useSelector(selectCoachRecommendations);

  if (recommendations.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">
          {t('coach.recommendationsTitle', '推荐下一步')}
        </h2>
        <p className="text-gray-400 text-sm">{t('coach.emptyRecommendations', '暂无推荐建议')}</p>
      </section>
    );
  }

  const grouped = PRIORITY_ORDER.map((priority) => ({
    priority,
    items: recommendations.filter((r) => r.priority === priority),
  })).filter((g) => g.items.length > 0);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="text-lg font-semibold">{t('coach.recommendationsTitle', '推荐下一步')}</h2>

      <div className="space-y-3">
        {grouped.map(({ priority, items }) => (
          <div key={priority} className="space-y-2">
            {items.map((rec) => {
              const resolved = resolveRoute(rec);
              return (
                <div
                  key={rec.id}
                  className={`rounded-lg border p-3 ${PRIORITY_COLORS[priority]} ${
                    resolved ? 'hover:opacity-80 transition-opacity cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (resolved) {
                      navigate(resolved.route);
                    }
                  }}
                  role={resolved ? 'button' : undefined}
                  tabIndex={resolved ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (resolved && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      navigate(resolved.route);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {PRIORITY_ICONS[priority]} {rec.title}
                    </p>
                    {resolved && (
                      <span className="text-xs text-blue-500 font-medium ml-2 flex-shrink-0">
                        {resolved.label} →
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 opacity-75">{rec.action}</p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
});

export default RecommendationPanel;