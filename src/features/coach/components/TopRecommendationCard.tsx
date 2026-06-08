import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { coachActionRegistry } from '../actions/coachActionRegistry';
import type { Recommendation } from '../types/coachTypes';

import RecommendationStatusBadge from './RecommendationStatusBadge';

interface TopRecommendationCardProps {
  rec: Recommendation;
}

const TopRecommendationCard: React.FC<TopRecommendationCardProps> = React.memo(
  function TopRecommendationCard({ rec }) {
    const { t } = useTranslation();
    const action = coachActionRegistry[rec.actionId];
    const href = action?.buildRoute?.(rec.actionParams ?? {}) ?? action?.route ?? '#';
    const label = t(`coach.actions.${rec.actionId}.label`, action?.label ?? '查看');

    return (
      <Link
        to={href}
        className={`block rounded-2xl border-2 p-4 transition-shadow hover:shadow-md ${
          rec.priority === 'high'
            ? 'border-blue-200 bg-blue-50'
            : rec.priority === 'medium'
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{rec.icon}</span>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{rec.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{rec.action}</p>
            </div>
          </div>
          <RecommendationStatusBadge status={rec.status} />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium">
            {label} →
          </span>
        </div>

        {rec.evidence && rec.evidence.length > 0 && (
          <div className="mt-2 text-xs text-gray-400">
            {t('coach.evidence', '依据')}：{rec.evidence.join(' / ')}
          </div>
        )}
      </Link>
    );
  },
);

export default TopRecommendationCard;
