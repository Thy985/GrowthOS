import type {
  Experience,
  Capability,
  Principle,
  Project,
  ExperienceCapabilityLink,
  CapabilityHistory,
} from '../../../shared/types';
import { analyze } from '../../coach/engine/coachEngine';
import { rankByGrowth } from '../../growth-curve/engine/growthAnalytics';
import type {
  GrowthReport,
  ReportPeriod,
  ReportStats,
  ReportCapabilityChange,
} from '../types/reportTypes';

const PERIOD_DAYS: Record<ReportPeriod, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export function getCutoffDate(period: ReportPeriod, now?: Date): Date {
  const current = now || new Date();
  const days = PERIOD_DAYS[period];
  const cutoff = new Date(current.getTime() - days * 24 * 60 * 60 * 1000);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function calculateStats(
  experiences: Experience[],
  capabilities: Capability[],
  projects: Project[],
  principles: Principle[],
  period: ReportPeriod,
  now?: Date,
): ReportStats {
  const cutoff = getCutoffDate(period, now);
  const allExperiences = experiences;

  const newExperiences = allExperiences.filter((exp) => new Date(exp.occurredAt) >= cutoff);

  const activeCapabilities = capabilities.filter((cap) => cap.currentLevel > 0);

  const activeProjects = projects.filter((p) => p.status === 'active');
  const completedProjects = projects.filter((p) => p.status === 'completed');

  const topPrinciples = [...principles]
    .sort((a, b) => b.usageCount * b.confidence - a.usageCount * a.confidence)
    .slice(0, 5)
    .map((p) => p.content);

  return {
    totalExperiences: allExperiences.length,
    newExperiences: newExperiences.length,
    activeCapabilities: activeCapabilities.length,
    totalProjects: projects.length,
    completedProjects: completedProjects.length,
    activeProjects: activeProjects.length,
    totalPrinciples: principles.length,
    topPrinciples,
  };
}

export function getCapabilityChanges(
  capabilities: Capability[],
  history: CapabilityHistory[],
  period: ReportPeriod,
  now?: Date,
): {
  topGainers: ReportCapabilityChange[];
  decliners: ReportCapabilityChange[];
} {
  const metrics = rankByGrowth(capabilities, history, mapPeriodToRange(period), now);

  const gainers = metrics
    .filter((m) => m.growthRate > 0)
    .slice(0, 5)
    .map((m) => ({
      metric: m,
      change: m.growthRate,
      trend: 'up' as const,
    }));

  const decliners = metrics
    .filter((m) => m.growthRate < 0)
    .slice(0, 3)
    .map((m) => ({
      metric: m,
      change: m.growthRate,
      trend: 'down' as const,
    }));

  return { topGainers: gainers, decliners };
}

function mapPeriodToRange(period: ReportPeriod): '30d' | '90d' | '1y' | 'all' {
  switch (period) {
    case '7d':
      return '30d';
    case '30d':
      return '30d';
    case '90d':
      return '90d';
  }
}

export function generateReport(
  experiences: Experience[],
  capabilities: Capability[],
  principles: Principle[],
  projects: Project[],
  links: ExperienceCapabilityLink[],
  history: CapabilityHistory[],
  period: ReportPeriod,
  now?: Date,
): GrowthReport {
  const currentDate = now || new Date();
  const cutoff = getCutoffDate(period, now);

  const periodExperiences = experiences.filter((exp) => new Date(exp.occurredAt) >= cutoff);

  const stats = calculateStats(experiences, capabilities, projects, principles, period, now);
  const { topGainers, decliners } = getCapabilityChanges(capabilities, history, period, now);
  const diagnosis = analyze(periodExperiences, capabilities, principles, projects, links, now);

  return {
    generatedAt: currentDate.toISOString(),
    period,
    startDate: toISODate(cutoff),
    endDate: toISODate(currentDate),
    stats,
    topGainers,
    decliners,
    diagnosis,
  };
}
