import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import type { AppDispatch } from '../../../app/store';
import { coachActionRegistry } from '../actions/coachActionRegistry';
import { markRecommendationInProgress, dismissRecommendation } from '../store/coachSlice';
import type { Recommendation } from '../types/coachTypes';

interface OtherRecommendationsProps {
  recs: Recommendation[];
}

const OtherRecommendations: React.FC<OtherRecommendationsProps> = React.memo(
  function OtherRecommendations({ recs }) {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();

    const activeRecs = recs.filter((r) => r.status !== 'completed');

    if (activeRecs.length === 0) return null;

    return (
      <ul className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
        {activeRecs.map((rec) => {
          const action = coachActionRegistry[rec.actionId];
          const href = action?.buildRoute?.(rec.actionParams ?? {}) ?? action?.route ?? '#';
          const label = t(`coach.actions.${rec.actionId}.label`, action?.label ?? '查看');

          return (
            <li key={rec.id} className="flex items-center justify-between px-4 py-3">
              <Link
                to={href}
                onClick={() => dispatch(markRecommendationInProgress(rec.id))}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <span className="flex-shrink-0 text-base">
                  {rec.status === 'completed'
                    ? '✓'
                    : rec.status === 'in_progress'
                      ? '◐'
                      : rec.icon}
                </span>
                <span className="text-sm text-gray-900 truncate">{rec.title}</span>
                <span className="text-xs text-blue-500 flex-shrink-0 ml-auto">
                  {label} →
                </span>
              </Link>
              {rec.status === 'pending' && (
                <button
                  onClick={() => dispatch(dismissRecommendation(rec.id))}
                  className="ml-2 text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
                  aria-label={t('coach.dismiss', '忽略')}
                >
                  {t('coach.dismiss', '忽略')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    );
  },
);

export default OtherRecommendations;