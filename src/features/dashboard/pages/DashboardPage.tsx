import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

import type { AppDispatch } from '../../../app/store';
import type { RootState, Capability } from '../../../shared/types';
import { calculateCapabilityLevel } from '../../capabilities/store/capabilitySlice';
import { addExperience } from '../../experiences/store/experienceSlice';

/* ─── helpers ─── */

const CATEGORY_LABELS: Record<string, string> = {
  mind: '心智',
  skill: '技能',
  cognition: '认知',
  body: '体能',
  social: '社交',
};

/* ─── sub-components ─── */

function InsightCards({ capabilities }: { capabilities: Capability[] }) {
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
            <span className="text-amber-600 ml-2">{days} 天未更新</span>
          </div>
        );
      })}
      {insights.highestGrowth && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm">
          <span className="font-medium text-emerald-800">🚀 {insights.highestGrowth.name}</span>
          <span className="text-emerald-600 ml-2">
            本月增长 +{Math.round(insights.highestGrowth.growthRate)}%
          </span>
        </div>
      )}
      {insights.staleCapabilities.length === 0 && !insights.highestGrowth && (
        <p className="text-gray-400 text-sm">暂无洞察，开始记录你的经历吧。</p>
      )}
    </div>
  );
}

function QuickRecordForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [event, setEvent] = useState('');
  const [reflection, setReflection] = useState('');
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event.trim()) return;
    await dispatch(
      addExperience({
        userId: '',
        event: event.trim(),
        reflection: reflection.trim() || undefined,
        confidence: 0.5,
        occurredAt: new Date().toISOString(),
      }),
    );
    setEvent('');
    setReflection('');
    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="text"
        placeholder="今天发生了什么？"
        value={event}
        onChange={(e) => setEvent(e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <input
        type="text"
        placeholder="反思（可选）"
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <button
        type="submit"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        记录
      </button>
    </form>
  );
}

/* ─── main page ─── */

const DashboardPage: React.FC = () => {
  const experiences = useSelector((state: RootState) => state.experiences.experiences);
  const links = useSelector((state: RootState) => state.experiences.links);
  const capabilities = useSelector((state: RootState) => state.capabilities.capabilities);
  const principles = useSelector((state: RootState) => state.principles.principles);
  const projects = useSelector((state: RootState) => state.projects.projects);
  const dispatch = useDispatch<AppDispatch>();

  /* radar data — top 6 by calculated level */
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

  /* stats */
  const totalExperiences = experiences.length;
  const totalPrinciples = principles.length;

  /* recent principle (most recent) */
  const recentPrinciple = useMemo(
    () =>
      [...principles].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0] ?? null,
    [principles],
  );

  /* top 5 principles by confidence * usageCount */
  const topPrinciples = useMemo(
    () =>
      [...principles]
        .sort((a, b) => b.confidence * b.usageCount - a.confidence * a.usageCount)
        .slice(0, 5),
    [principles],
  );

  /* recommended next actions */
  const recommendations = useMemo(() => {
    const recs: { icon: string; title: string; action: string }[] = [];
    const activeProjects = projects.filter((p) => p.status === 'active');
    if (activeProjects.length > 0) {
      recs.push({
        icon: '🎯',
        title: '回顾项目',
        action: `回顾 "${activeProjects[0].name}" 进展`,
      });
    }
    const lowCapabilities = capabilities
      .filter((c) => c.currentLevel < 30)
      .sort((a, b) => a.currentLevel - b.currentLevel)
      .slice(0, 2);
    for (const cap of lowCapabilities) {
      recs.push({
        icon: '📈',
        title: '提升能力',
        action: `为 ${cap.name} 收集更多经历`,
      });
    }
    if (
      recentPrinciple &&
      (!recentPrinciple.lastUsedAt ||
        new Date(recentPrinciple.lastUsedAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    ) {
      recs.push({
        icon: '💎',
        title: '应用原则',
        action: `尝试运用「${recentPrinciple.content.slice(0, 20)}…」`,
      });
    }
    if (recs.length === 0) {
      recs.push({ icon: '📝', title: '记录新经历', action: '写下今天的反思' });
    }
    return recs;
  }, [projects, capabilities, recentPrinciple]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-8">
      {/* ── Greeting ── */}
      <section>
        <h1 className="text-2xl font-bold text-gray-900">你好</h1>
        <p className="text-lg text-gray-500 mt-1">你正在成为谁？</p>
      </section>

      {/* ── Radar Chart ── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">能力画像</h2>
        <div className="h-64 sm:h-80">
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={5} />
                <Radar
                  name="能力值"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400 text-sm">
              记录经历后将在此展示能力画像
            </div>
          )}
        </div>
      </section>

      {/* ── Insights ── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
        <h2 className="text-lg font-semibold">本周洞察</h2>
        <InsightCards capabilities={capabilities} />

        {/* Stats overview */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{totalExperiences}</p>
            <p className="text-xs text-gray-500 mt-1">经历总数</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{totalPrinciples}</p>
            <p className="text-xs text-gray-500 mt-1">原则总数</p>
          </div>
        </div>
      </section>

      {/* ── Quick Record ── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold">快速记录</h2>
        <QuickRecordForm onSubmitted={() => dispatch({ type: '@@force-refresh' } as never)} />
      </section>

      {/* ── Top Principles ── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold">核心原则（Top 5）</h2>
        {topPrinciples.length > 0 ? (
          <ol className="space-y-2">
            {topPrinciples.map((p, i) => {
              const score = Math.round(p.confidence * p.usageCount * 10) / 10;
              return (
                <li key={p.id} className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
                  <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.content}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {CATEGORY_LABELS[p.category ?? ''] ?? p.category ?? '未分类'} · 确信度{' '}
                      {Math.round(p.confidence * 100)}% · 使用 {p.usageCount} 次 · 评分 {score}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-gray-400 text-sm">尚未沉淀原则，持续记录会自然浮现。</p>
        )}
      </section>

      {/* ── Recommendations ── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold">推荐下一步</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <p className="text-sm font-semibold text-indigo-800">
                {rec.icon} {rec.title}
              </p>
              <p className="text-xs text-indigo-600 mt-1">{rec.action}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default React.memo(DashboardPage);
