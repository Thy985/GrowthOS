import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Capability } from '../../../shared/types';

interface InsightCardsProps {
  capabilities: Capability[];
}

export const InsightCards: React.FC<InsightCardsProps> = React.memo(function InsightCards({
  capabilities,
}) {
  const { t } = useTranslation();
  const insights = useMemo(() => {
    const now = new Date();
    const staleCapabilities: Capability[] = [];
    let highestGrowth: Capability | null = null;
    let maxGrowth = -Infinity;

    for (const cap of capabilities) {
      const daysSinceUpdate =
        (now.getTime() - new Date(cap.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 30) staleCapabilities.push(cap);
      if (cap.growthRate > maxGrowth) {
        maxGrowth = cap.growthRate;
        highestGrowth = cap;
      }
    }

    return { staleCapabilities, highestGrowth };
  }, [capabilities]);

  return (
    <div className="space-y-3">
      {insights.staleCapabilities.map((cap) => {
        const days = Math.floor(
          (new Date().getTime() - new Date(cap.lastUpdated).getTime()) / (1000 * 60 * 60 * 24),
        );
        return (
          <div
            key={`stale-${cap.id}`}
            className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm"
          >
            <span className="font-medium text-amber-800">⏳ {cap.name}</span>
            <span className="text-amber-600 ml-2">
              {days} {t('common.daysNotUpdated', '天未更新')}
            </span>
          </div>
        );
      })}
      {insights.highestGrowth && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm">
          <span className="font-medium text-emerald-800">🚀 {insights.highestGrowth.name}</span>
          <span className="text-emerald-600 ml-2">
            {t('common.monthGrowth', '本月增长')} +{Math.round(insights.highestGrowth.growthRate)}%
          </span>
        </div>
      )}
      {insights.staleCapabilities.length === 0 && !insights.highestGrowth && (
        <p className="text-gray-400 text-sm">
          {t('common.noInsights', '暂无洞察，开始记录你的经历吧。')}
        </p>
      )}
    </div>
  );
});
