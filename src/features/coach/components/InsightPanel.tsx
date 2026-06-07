import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import type { Insight, InsightGroup } from '../types/coachTypes';
import { selectCoachInsights } from '../utils/coachSelectors';

const SEVERITY_COLORS: Record<string, string> = {
  important: 'border-red-200 bg-red-50 text-red-800',
  notice: 'border-orange-200 bg-orange-50 text-orange-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

const SEVERITY_ICONS: Record<string, string> = {
  important: '🔴',
  notice: '🟡',
  info: '🔵',
};

const GROUP_LABELS: Record<string, string> = {
  stale: 'coach.insightGroup.stale',
  growth: 'coach.insightGroup.growth',
  pattern: 'coach.insightGroup.pattern',
  warning: 'coach.insightGroup.warning',
  retrospective: 'coach.insightGroup.retrospective',
  trend: 'coach.insightGroup.trend',
  gap: 'coach.insightGroup.gap',
  project: 'coach.insightGroup.project',
};

const GROUP_DEFAULTS: Record<string, string> = {
  stale: '能力维护',
  growth: '增长信号',
  pattern: '行为模式',
  warning: '预警',
  retrospective: '复盘洞察',
  trend: '能力趋势',
  gap: '经验断层',
  project: '项目健康',
};

const GROUP_ICONS: Record<string, string> = {
  stale: '⏰',
  growth: '📈',
  pattern: '🎯',
  warning: '⚠️',
  retrospective: '🔄',
  trend: '📊',
  gap: '📭',
  project: '📋',
};

function groupInsights(insights: Insight[]): InsightGroup[] {
  const map = new Map<string, Insight[]>();
  for (const insight of insights) {
    const group = map.get(insight.type) || [];
    group.push(insight);
    map.set(insight.type, group);
  }
  const result: InsightGroup[] = [];
  for (const [type, items] of map.entries()) {
    result.push({
      type: type as InsightGroup['type'],
      label: GROUP_DEFAULTS[type] || type,
      icon: GROUP_ICONS[type] || '📌',
      insights: items,
    });
  }
  return result;
}

const InsightPanel: React.FC = React.memo(function InsightPanel() {
  const { t } = useTranslation();
  const insights = useSelector(selectCoachInsights);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    // Default: only first group with important insights is expanded
    const groups = groupInsights(insights);
    const collapsed = new Set<string>();
    let foundImportant = false;
    for (const group of groups) {
      const hasImportant = group.insights.some(
        (i) => i.severity === 'important',
      );
      if (!foundImportant && hasImportant) {
        foundImportant = true;
        continue;
      }
      collapsed.add(group.type);
    }
    return collapsed;
  });

  const toggleGroup = (type: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  if (insights.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">{t('coach.insightsTitle', '洞察分析')}</h2>
        <p className="text-gray-400 text-sm">{t('coach.noInsights', '暂无洞察')}</p>
      </section>
    );
  }

  const groups = groupInsights(insights);
  const allCollapsed = collapsedGroups.size === groups.length;
  const allExpanded = collapsedGroups.size === 0;

  const expandAll = () => setCollapsedGroups(new Set());
  const collapseAll = () => setCollapsedGroups(new Set(groups.map((g) => g.type)));

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t('coach.insightsTitle', '洞察分析')}
          <span className="ml-1.5 text-xs text-gray-400">({insights.length})</span>
        </h2>
        <button
          onClick={allCollapsed ? expandAll : collapseAll}
          className="text-xs text-blue-500 hover:text-blue-600"
        >
          {allCollapsed
            ? t('coach.expandAll', '展开全部')
            : t('coach.collapseAll', '折叠全部')}
        </button>
      </div>

      {groups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.type);
        return (
          <div key={group.type} className="border border-gray-100 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleGroup(group.type)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <span className="text-sm font-medium text-gray-700">
                {group.icon} {t(GROUP_LABELS[group.type], group.label)}
                <span className="ml-1.5 text-xs text-gray-400">({group.insights.length})</span>
              </span>
              <span className="text-xs text-gray-400">{isCollapsed ? '▶' : '▼'}</span>
            </button>

            {!isCollapsed && (
              <div className="divide-y divide-gray-50">
                {group.insights.map((insight, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-3 text-sm ${SEVERITY_COLORS[insight.severity]}`}
                  >
                    <span className="flex-shrink-0">{SEVERITY_ICONS[insight.severity]}</span>
                    <div>
                      <p className="font-medium">{insight.title}</p>
                      {insight.description && (
                        <p className="text-xs mt-0.5 opacity-80">{insight.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
});

export default InsightPanel;
