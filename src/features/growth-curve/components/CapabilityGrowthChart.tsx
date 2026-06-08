/**
 * 单能力成长曲线图
 *
 * 使用 Recharts LineChart 展示能力历史等级变化。
 * 支持数据点 tooltip（日期 + 等级 + 来源触发）和点击快照显示详情面板。
 */

import React, { useMemo, useCallback, useState } from 'react';
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

import SnapshotDetailPanel from './SnapshotDetailPanel';

interface CapabilityGrowthChartProps {
  history: CapabilityHistory[];
  range: TimeRange;
  height?: number;
  color?: string;
  capabilityName?: string;
}

interface ChartDataPoint {
  date: string;
  level: number;
  recordedAt: string;
  triggerExperienceId?: string;
  raw: CapabilityHistory;
}

function CapabilityGrowthChartInner({
  history,
  range,
  height = 200,
  color = '#6366f1',
  capabilityName,
}: CapabilityGrowthChartProps) {
  const { t } = useTranslation();
  const [selectedSnapshot, setSelectedSnapshot] = useState<CapabilityHistory | null>(null);

  const data = useMemo((): ChartDataPoint[] => {
    const inRange = getHistoryInRange(history, range);
    return inRange.map((h) => ({
      date: new Date(h.recordedAt).toISOString().split('T')[0],
      level: h.level,
      recordedAt: h.recordedAt,
      triggerExperienceId: h.triggerExperienceId,
      raw: h,
    }));
  }, [history, range]);

  const CustomTooltip = useCallback(
    ({ active, payload }: { active?: boolean; payload?: { value: number }[] }) => {
      if (!active || !payload?.length) return null;
      const point = payload[0].payload as ChartDataPoint;
      const trigger = point.triggerExperienceId
        ? t('growthCurve.tooltip.trigger', '触发经历：{{id}}', { id: point.triggerExperienceId })
        : t('growthCurve.tooltip.manual', '手动更新');
      return (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {t('growthCurve.tooltip.level', '等级')}：{point.level}
          </div>
          <div style={{ color: '#6b7280' }}>
            {t('growthCurve.tooltip.date', '日期')}：{point.date}
          </div>
          <div style={{ color: '#6b7280' }}>{trigger}</div>
        </div>
      );
    },
    [t],
  );

  const handleDotClick = useCallback(
    (_data: unknown, index: number) => {
      setSelectedSnapshot(data[index].raw);
    },
    [data],
  );

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
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Tooltip content={CustomTooltip} />
          <Line
            type="monotone"
            dataKey="level"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4, cursor: 'pointer', fill: color, stroke: '#fff', strokeWidth: 1 }}
            activeDot={{
              r: 7,
              cursor: 'pointer',
              fill: color,
              stroke: '#fff',
              strokeWidth: 2,
              onClick: handleDotClick,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      {selectedSnapshot && (
        <SnapshotDetailPanel
          snapshot={selectedSnapshot}
          capabilityName={capabilityName}
          onClose={() => setSelectedSnapshot(null)}
        />
      )}
    </div>
  );
}

const CapabilityGrowthChart = React.memo(CapabilityGrowthChartInner);
CapabilityGrowthChart.displayName = 'CapabilityGrowthChart';

export default CapabilityGrowthChart;
