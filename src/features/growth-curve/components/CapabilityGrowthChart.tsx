/**
 * 单能力成长曲线图
 *
 * 使用 Recharts LineChart 展示能力历史等级变化。
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import type { CapabilityHistory } from '../../../shared/types';
import { getHistoryInRange } from '../engine/growthAnalytics';
import type { TimeRange } from '../types/growthCurveTypes';

interface CapabilityGrowthChartProps {
  history: CapabilityHistory[];
  range: TimeRange;
  height?: number;
  color?: string;
}

function CapabilityGrowthChartInner({
  history,
  range,
  height = 200,
  color = '#6366f1',
}: CapabilityGrowthChartProps) {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const inRange = getHistoryInRange(history, range);
    return inRange.map((h) => ({
      date: new Date(h.recordedAt).toISOString().split('T')[0],
      level: h.level,
    }));
  }, [history, range]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-lg"
        style={{ height }}
      >
        {t('growthCurve.emptyState')}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 6 }}
          formatter={(value: number) => [`${value}`, t('capabilities.currentLevel')]}
        />
        <Line
          type="monotone"
          dataKey="level"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

const CapabilityGrowthChart = React.memo(CapabilityGrowthChartInner);
CapabilityGrowthChart.displayName = 'CapabilityGrowthChart';

export default CapabilityGrowthChart;
