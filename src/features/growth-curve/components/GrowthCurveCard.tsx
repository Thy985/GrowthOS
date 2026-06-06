/**
 * 增长率卡片
 *
 * 显示：能力名 + 当前等级 + 目标等级 + 增长率（带颜色和箭头）
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

import type { RootState } from '../../../shared/types';
import type { GrowthMetric } from '../types/growthCurveTypes';
import { selectCapabilityHistory } from '../utils/growthCurveSelectors';

interface GrowthCurveCardProps {
  metric: GrowthMetric;
}

const TREND_COLORS = {
  up: '#10B981',
  down: '#EF4444',
  stable: '#9CA3AF',
};

const TREND_ARROWS = {
  up: '↑',
  down: '↓',
  stable: '→',
};

function GrowthCurveCardInner({ metric }: GrowthCurveCardProps) {
  const { t } = useTranslation();
  const history = useSelector((state: RootState) =>
    selectCapabilityHistory(state, metric.capabilityId),
  );

  const sparkData = useMemo(
    () =>
      history.map((h) => ({
        date: new Date(h.recordedAt).getTime(),
        level: h.level,
      })),
    [history],
  );

  const color = TREND_COLORS[metric.trend];
  const arrow = TREND_ARROWS[metric.trend];
  const trendLabel = t(`growthCurve.trend.${metric.trend}`);
  const growthSign = metric.growthRate > 0 ? '+' : '';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm text-gray-900 truncate">{metric.name}</h3>
        <span
          data-testid="growth-value"
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {arrow} {growthSign}
          {metric.growthRate}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>
          Lv. {metric.currentLevel} / {metric.targetLevel}
        </span>
        <span>{trendLabel}</span>
      </div>
      {sparkData.length > 1 ? (
        <div style={{ height: 40 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <YAxis hide domain={[0, 100]} />
              <Line type="monotone" dataKey="level" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          className="flex items-center justify-center text-xs text-gray-300"
          style={{ height: 40 }}
        >
          {t('growthCurve.emptyState')}
        </div>
      )}
    </div>
  );
}

const GrowthCurveCard = React.memo(GrowthCurveCardInner);
GrowthCurveCard.displayName = 'GrowthCurveCard';

export default GrowthCurveCard;
