import type { CoachDiagnosis } from '../../coach/types/coachTypes';
import type { GrowthMetric } from '../../growth-curve/types/growthCurveTypes';

export type ReportPeriod = '7d' | '30d' | '90d';

export interface ReportPeriodInfo {
  key: ReportPeriod;
  label: string;
  labelEn: string;
}

export interface ReportStats {
  totalExperiences: number;
  newExperiences: number;
  activeCapabilities: number;
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  totalPrinciples: number;
  topPrinciples: string[];
}

export interface ReportCapabilityChange {
  metric: GrowthMetric;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface GrowthReport {
  generatedAt: string;
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  stats: ReportStats;
  topGainers: ReportCapabilityChange[];
  decliners: ReportCapabilityChange[];
  diagnosis: CoachDiagnosis;
}
