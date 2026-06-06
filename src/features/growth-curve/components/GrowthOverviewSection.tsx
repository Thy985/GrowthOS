/**
 * 整体成长概览区块
 *
 * 首页底部展示：Top 5 增长排行 + 时间范围切换。
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { TimeRange } from '../types/growthCurveTypes';

import TimeRangeSelector from './TimeRangeSelector';
import TopGrowthRanking from './TopGrowthRanking';

interface GrowthOverviewSectionProps {
  defaultRange?: TimeRange;
}

function GrowthOverviewSectionInner({ defaultRange = '30d' }: GrowthOverviewSectionProps) {
  const { t } = useTranslation();
  const [range, setRange] = useState<TimeRange>(defaultRange);

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{t('growthCurve.title')}</h2>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>
      <TopGrowthRanking range={range} limit={5} />
    </section>
  );
}

const GrowthOverviewSection = React.memo(GrowthOverviewSectionInner);
GrowthOverviewSection.displayName = 'GrowthOverviewSection';

export default GrowthOverviewSection;
