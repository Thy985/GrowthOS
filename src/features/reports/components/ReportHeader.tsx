import React from 'react';
import { useTranslation } from 'react-i18next';

import type { ReportPeriod } from '../types/reportTypes';

interface ReportHeaderProps {
  period: ReportPeriod;
  generatedAt: string;
  startDate: string;
  endDate: string;
  onPeriodChange: (period: ReportPeriod) => void;
  onExport: () => void;
  isExporting: boolean;
}

const PERIODS: { key: ReportPeriod; labelKey: string; defaultLabel: string }[] = [
  { key: '7d', labelKey: 'reports.period7d', defaultLabel: '7天' },
  { key: '30d', labelKey: 'reports.period30d', defaultLabel: '30天' },
  { key: '90d', labelKey: 'reports.period90d', defaultLabel: '90天' },
];

const ReportHeader: React.FC<ReportHeaderProps> = React.memo(function ReportHeader({
  period,
  generatedAt,
  startDate,
  endDate,
  onPeriodChange,
  onExport,
  isExporting,
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('reports.pageTitle', '成长报告')}</h1>
        <button
          onClick={onExport}
          disabled={isExporting}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {isExporting
            ? t('reports.exporting', '导出中...')
            : t('reports.exportMarkdown', '导出 Markdown')}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => onPeriodChange(p.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(p.labelKey, p.defaultLabel)}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {startDate} ~ {endDate}
        </span>
      </div>

      <p className="text-xs text-gray-400">
        {t('reports.generatedAt', '生成时间：{{time}}', {
          time: new Date(generatedAt).toLocaleString(),
        })}
      </p>
    </div>
  );
});

export default ReportHeader;
