import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import type { RootState } from '../../../app/store';
import ReportCapabilitySection from '../components/ReportCapabilitySection';
import ReportHeader from '../components/ReportHeader';
import ReportInsightsSection from '../components/ReportInsightsSection';
import ReportSummary from '../components/ReportSummary';
import { exportReportToMarkdown, downloadMarkdown } from '../engine/markdownExporter';
import { generateReport } from '../engine/reportEngine';
import type { ReportPeriod, GrowthReport } from '../types/reportTypes';

const ReportPage: React.FC = React.memo(function ReportPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<ReportPeriod>('30d');
  const [isExporting, setIsExporting] = useState(false);

  const experiences = useSelector((state: RootState) => state.experiences.experiences);
  const links = useSelector((state: RootState) => state.experiences.links);
  const capabilities = useSelector((state: RootState) => state.capabilities.capabilities);
  const principles = useSelector((state: RootState) => state.principles.principles);
  const projects = useSelector((state: RootState) => state.projects.projects);
  const history = useSelector((state: RootState) => state.capabilities.history);

  const report: GrowthReport | null = useMemo(() => {
    if (experiences.length === 0) return null;
    return generateReport(experiences, capabilities, principles, projects, links, history, period);
  }, [experiences, capabilities, principles, projects, links, history, period]);

  const handleExport = useCallback(() => {
    if (!report) return;
    setIsExporting(true);
    try {
      const md = exportReportToMarkdown(report);
      const filename = `growthos-report-${report.startDate}-${report.endDate}.md`;
      downloadMarkdown(md, filename);
    } finally {
      setIsExporting(false);
    }
  }, [report]);

  const handlePeriodChange = useCallback((newPeriod: ReportPeriod) => {
    setPeriod(newPeriod);
  }, []);

  if (experiences.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <ReportHeader
          period={period}
          generatedAt={new Date().toISOString()}
          startDate=""
          endDate=""
          onPeriodChange={handlePeriodChange}
          onExport={handleExport}
          isExporting={isExporting}
        />
        <section className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-4xl mb-3">📊</p>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {t('reports.emptyTitle', '等待你的第一条经历')}
          </h2>
          <p className="text-sm text-gray-400">
            {t('reports.emptyMessage', '记录够一定数量的经历后，系统会为你生成成长报告。')}
          </p>
        </section>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <ReportHeader
        period={report.period}
        generatedAt={report.generatedAt}
        startDate={report.startDate}
        endDate={report.endDate}
        onPeriodChange={handlePeriodChange}
        onExport={handleExport}
        isExporting={isExporting}
      />
      <ReportSummary stats={report.stats} />
      <ReportCapabilitySection topGainers={report.topGainers} decliners={report.decliners} />
      <ReportInsightsSection diagnosis={report.diagnosis} />
    </div>
  );
});

export default ReportPage;
