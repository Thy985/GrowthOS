import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

import type { RootState, Capability } from '../../../shared/types';
import type { AppDispatch } from '../../../app/store';
import { calculateCapabilityLevel } from '../../capabilities/store/capabilitySlice';
import CoachDiagnosisCard from '../../coach/components/CoachDiagnosisCard';
import CoachRecommendations from '../../coach/components/CoachRecommendations';
import GrowthOverviewSection from '../../growth-curve/components/GrowthOverviewSection';
import { InsightCards } from '../components/InsightCards';
import { QuickRecordForm } from '../components/QuickRecordForm';
import EmptyState from '../../../shared/components/common/EmptyState';
import { runCoachAnalysis } from '../../coach/store/coachSlice';

const PRINCIPLE_CATEGORY_LABELS: Record<string, string> = {
  learning: '学习',
  work: '工作',
  communication: '沟通',
  life: '生活',
  other: '其他',
};

/* ─── Radar Chart Section ─── */

interface RadarChartSectionProps {
  capabilities: Capability[];
}

const RadarChartSection: React.FC<RadarChartSectionProps> = React.memo(function RadarChartSection({
  capabilities,
}) {
  const { t } = useTranslation();
  const experiences = useSelector((state: RootState) => state.experiences.experiences);
  const links = useSelector((state: RootState) => state.experiences.links);

  const radarData = useMemo(() => {
    const scored = capabilities
      .map((cap) => ({
        ...cap,
        computedLevel: calculateCapabilityLevel(cap.id, experiences, links),
      }))
      .sort((a, b) => b.computedLevel - a.computedLevel)
      .slice(0, 6);

    return scored.map((cap) => ({
      name: cap.name,
      value: cap.computedLevel,
      fullMark: 100,
    }));
  }, [capabilities, experiences, links]);

  if (radarData.length === 0) {
    return (
      <EmptyState
        icon="🎯"
        title={t('dashboard.noRadarTitle', '构建你的能力画像')}
        description={t('dashboard.noRadarDesc', '创建能力并记录经历后，这里将展示你的能力雷达图')}
        primaryAction={{
          label: t('dashboard.createCapability', '创建第一个能力'),
          href: '/capabilities',
        }}
      />
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
      <h2 className="text-base sm:text-lg font-semibold mb-2">{t('dashboard.portraitTitle', '能力画像')}</h2>
      <div className="h-56 sm:h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={5} />
            <Radar
              name={t('dashboard.capabilityValue', '能力值')}
              dataKey="value"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
});

/* ─── Principles Section ─── */

interface PrinciplesSectionProps {
  principles: NonNullable<RootState['principles']>['principles'];
}

const PrinciplesSection: React.FC<PrinciplesSectionProps> = React.memo(function PrinciplesSection({
  principles,
}) {
  const { t } = useTranslation();
  const topPrinciples = useMemo(
    () =>
      [...principles]
        .sort((a, b) => b.confidence * b.usageCount - a.confidence * a.usageCount)
        .slice(0, 5),
    [principles],
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 space-y-3">
      <h2 className="text-base sm:text-lg font-semibold">
        {t('dashboard.topPrinciplesTitle', '核心原则（Top 5）')}
      </h2>
      {topPrinciples.length > 0 ? (
        <ol className="space-y-2">
          {topPrinciples.map((p, i) => {
            const score = Math.round(p.confidence * p.usageCount * 10) / 10;
            const catLabel = p.category
              ? (PRINCIPLE_CATEGORY_LABELS[p.category] ??
                t(`principles.categories.${p.category}`, p.category))
              : t('dashboard.uncategorized', '未分类');
            return (
              <li key={p.id} className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
                <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.content}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {catLabel} · {t('common.confidence', '确信度')} {Math.round(p.confidence * 100)}
                    % · {t('common.usageCount', '使用')} {p.usageCount}{' '}
                    {t('common.usageCount', '次')} · {t('dashboard.rating', '评分')} {score}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-gray-400 text-sm">
          {t('dashboard.noPrinciples', '尚未沉淀原则，持续记录会自然浮现。')}
        </p>
      )}
    </section>
  );
});

/* ─── Main Page ─── */

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const experiences = useSelector((state: RootState) => state.experiences.experiences);
  const capabilities = useSelector((state: RootState) => state.capabilities.capabilities);
  const principles = useSelector((state: RootState) => state.principles.principles);
  const projects = useSelector((state: RootState) => state.projects.projects);

  const totalExperiences = experiences.length;
  const totalPrinciples = principles.length;
  const hasData = capabilities.length > 0 || experiences.length > 0;

  const handleRecordSubmitted = useCallback(() => {
    dispatch(runCoachAnalysis());
  }, [dispatch]);

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* ── Greeting ── */}
      <section className="mb-1 sm:mb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('dashboard.greeting', '你好')}</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          {t('dashboard.whoAreYouBecoming', '你正在成为谁？')}
        </p>
      </section>

      {/* ── Tier 1: Coach (Hero) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <CoachDiagnosisCard />
          <div className="text-right mt-2">
            <Link
              to="/coach"
              className="text-sm text-blue-500 hover:text-blue-700 font-medium transition-colors"
            >
              {t('coach.viewFullReport', '查看完整报告 →')}
            </Link>
          </div>
        </div>
        <div className="lg:col-span-1">
          <QuickStatsCard totalExperiences={totalExperiences} totalPrinciples={totalPrinciples} />
        </div>
      </div>

      {/* ── Tier 2: Radar + Insights ── */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <RadarChartSection capabilities={capabilities} />
          <div className="space-y-4 sm:space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 space-y-3">
              <h2 className="text-base sm:text-lg font-semibold">{t('dashboard.insightsTitle', '本周洞察')}</h2>
              <InsightCards capabilities={capabilities} />
            </section>
          </div>
        </div>
      )}

      {/* ── Growth Trajectory ── */}
      <GrowthOverviewSection defaultRange="30d" />

      {/* ── Tier 3: Supporting Content ── */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <PrinciplesSection principles={principles} />
          <CoachRecommendations />
        </div>
      )}

      {/* ── Quick Actions ── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 space-y-3">
        <h2 className="text-base sm:text-lg font-semibold">{t('dashboard.quickRecordTitle', '快速记录')}</h2>
        <QuickRecordForm onSubmitted={handleRecordSubmitted} />
      </section>

      {/* ── Footer: Reports ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <ReportLinkCard />
        <CoachRecommendations />
      </div>
    </div>
  );
};

/* ─── Quick Stats Card ─── */

interface QuickStatsCardProps {
  totalExperiences: number;
  totalPrinciples: number;
}

const QuickStatsCard: React.FC<QuickStatsCardProps> = React.memo(function QuickStatsCard({
  totalExperiences,
  totalPrinciples,
}) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        {t('dashboard.statsOverview', '成长概览')}
      </h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-indigo-600">{totalExperiences}</span>
          <span className="text-xs text-gray-500">
            {t('dashboard.totalExperiences', '经历总数')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-purple-600">{totalPrinciples}</span>
          <span className="text-xs text-gray-500">
            {t('dashboard.totalPrinciples', '原则总数')}
          </span>
        </div>
      </div>
    </section>
  );
});

/* ─── Report Link Card ─── */

const ReportLinkCard: React.FC = React.memo(function ReportLinkCard() {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
      <Link to="/reports" className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('reports.title', '成长报告')}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('reports.overview', '查看你的成长数据分析和趋势报告')}
          </p>
        </div>
        <span className="text-blue-500 text-lg flex-shrink-0 ml-3">→</span>
      </Link>
    </section>
  );
});

export default React.memo(DashboardPage);
