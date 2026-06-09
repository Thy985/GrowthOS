import React from 'react';
import { useTranslation } from 'react-i18next';

import type { ReportStats } from '../types/reportTypes';

interface ReportSummaryProps {
  stats: ReportStats;
}

const ReportSummary: React.FC<ReportSummaryProps> = React.memo(function ReportSummary({ stats }) {
  const { t } = useTranslation();

  const items = [
    { label: t('reports.totalExperiences', '总经历'), value: stats.totalExperiences },
    { label: t('reports.newExperiences', '本期新增'), value: stats.newExperiences },
    { label: t('reports.activeCapabilities', '活跃能力'), value: stats.activeCapabilities },
    { label: t('reports.totalProjects', '项目总数'), value: stats.totalProjects },
    { label: t('reports.activeProjects', '进行中'), value: stats.activeProjects },
    { label: t('reports.completedProjects', '已完成'), value: stats.completedProjects },
    { label: t('reports.totalPrinciples', '原则总数'), value: stats.totalPrinciples },
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-semibold mb-3">{t('reports.overview', '概览')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{item.value}</p>
            <p className="text-xs text-gray-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
});

export default ReportSummary;
