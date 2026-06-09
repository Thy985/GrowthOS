/**
 * Top 5 增长排行
 *
 * 展示增长最快的能力。
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import type { RootState } from '../../../shared/types';
import type { TimeRange } from '../types/growthCurveTypes';
import { selectGrowthRanking } from '../utils/growthCurveSelectors';

import GrowthCurveCard from './GrowthCurveCard';

interface TopGrowthRankingProps {
  range: TimeRange;
  limit?: number;
}

function TopGrowthRankingInner({ range, limit = 5 }: TopGrowthRankingProps) {
  const { t } = useTranslation();
  const ranking = useSelector((state: RootState) => selectGrowthRanking(state, range));
  const topN = ranking.slice(0, limit);

  if (topN.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-lg">
        {t('growthCurve.emptyState')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {topN.map((metric, index) => (
        <div key={metric.capabilityId} className="flex items-start gap-2">
          <span
            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              index === 0
                ? 'bg-yellow-100 text-yellow-700'
                : index === 1
                  ? 'bg-gray-100 text-gray-700'
                  : index === 2
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-50 text-gray-500'
            }`}
          >
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <GrowthCurveCard metric={metric} />
          </div>
        </div>
      ))}
    </div>
  );
}

const TopGrowthRanking = React.memo(TopGrowthRankingInner);
TopGrowthRanking.displayName = 'TopGrowthRanking';

export default TopGrowthRanking;
