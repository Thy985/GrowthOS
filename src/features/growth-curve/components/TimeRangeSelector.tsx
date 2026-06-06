/**
 * 时间范围选择器
 *
 * 受控组件：value + onChange 模式
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

import type { TimeRange } from '../types/growthCurveTypes';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const RANGES: TimeRange[] = ['30d', '90d', '1y', 'all'];

function TimeRangeSelectorInner({ value, onChange }: TimeRangeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 gap-1">
      {RANGES.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            value === range ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {t(`growthCurve.range.${range}`)}
        </button>
      ))}
    </div>
  );
}

const TimeRangeSelector = React.memo(TimeRangeSelectorInner);
TimeRangeSelector.displayName = 'TimeRangeSelector';

export default TimeRangeSelector;
