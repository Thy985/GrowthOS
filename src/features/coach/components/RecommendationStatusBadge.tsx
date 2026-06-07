import React from 'react';
import { useTranslation } from 'react-i18next';

import type { RecommendationStatus } from '../types/coachTypes';

interface RecommendationStatusBadgeProps {
  status: RecommendationStatus;
}

const STATUS_STYLES: Record<RecommendationStatus, string> = {
  pending: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-blue-100 text-blue-600',
  completed: 'bg-green-100 text-green-600',
  dismissed: 'bg-gray-100 text-gray-400 line-through',
};

const STATUS_ICONS: Record<RecommendationStatus, string> = {
  pending: '○',
  in_progress: '◐',
  completed: '✓',
  dismissed: '✗',
};

const RecommendationStatusBadge: React.FC<RecommendationStatusBadgeProps> = React.memo(
  function RecommendationStatusBadge({ status }) {
    const { t } = useTranslation();

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
      >
        <span>{STATUS_ICONS[status]}</span>
        {t(`coach.status.${status}`, status)}
      </span>
    );
  },
);

export default RecommendationStatusBadge;