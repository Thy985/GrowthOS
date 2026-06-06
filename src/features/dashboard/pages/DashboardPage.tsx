import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

import type { RootState, Capability } from '../../../shared/types';
import { calculateCapabilityLevel } from '../../capabilities/store/capabilitySlice';
import CoachDiagnosisCard from '../../coach/components/CoachDiagnosisCard';
import CoachRecommendations from '../../coach/components/CoachRecommendations';
import GrowthOverviewSection from '../../growth-curve/components/GrowthOverviewSection';
import { InsightCards } from '../components/InsightCards';
import { QuickRecordForm } from '../components/QuickRecordForm';

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

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-semibold mb-2">{t('dashboard.portraitTitle', '能力画像')}</h2>
      <div className="h-64 sm:h-80">
        {radarData.length > 0 ? (
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
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            {t('dashboard.noRadarData', '记录经历后将在此展示能力画像')}
          </div>
        )}
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
    <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="text-lg font-semibold">
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
  const experiences = useSelector((state: RootState) => state.experiences.experiences);
  const capabilities = useSelector((state: RootState) => state.capabilities.capabilities);
  const principles = useSelector((state: RootState) => state.principles.principles);

  const totalExperiences = experiences.length;
  const totalPrinciples = principles.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-8">
      {/* ── Greeting ── */}
      <section>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.greeting', '你好')}</h1>
        <p className="text-lg text-gray-500 mt-1">
          {t('dashboard.whoAreYouBecoming', '你正在成为谁？')}
        </p>
      </section>

      {/* ── Coach Diagnosis ── */}
      <CoachDiagnosisCard />

      {/* ── Radar Chart ── */}
      <RadarChartSection capabilities={capabilities} />

      {/* ── Insights + Stats ── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
        <h2 className="text-lg font-semibold">{t('dashboard.insightsTitle', '本周洞察')}</h2>
        <InsightCards capabilities={capabilities} />

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{totalExperiences}</p>
            <p className="text-xs text-gray-500 mt-1">
              {t('dashboard.totalExperiences', '经历总数')}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{totalPrinciples}</p>
            <p className="text-xs text-gray-500 mt-1">
              {t('dashboard.totalPrinciples', '原则总数')}
            </p>
          </div>
        </div>
      </section>

      {/* ── Quick Record ── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold">{t('dashboard.quickRecordTitle', '快速记录')}</h2>
        <QuickRecordForm onSubmitted={() => window.location.reload()} />
      </section>

      {/* ── Principles ── */}
      <PrinciplesSection principles={principles} />

      {/* ── Coach Recommendations ── */}
      <CoachRecommendations />

      {/* ── Growth Trajectory ── */}
      <GrowthOverviewSection defaultRange="30d" />
    </div>
  );
};

export default React.memo(DashboardPage);
