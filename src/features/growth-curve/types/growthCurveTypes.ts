/**
 * 成长曲线 V1 类型定义
 */

export type TimeRange = '7d' | '30d' | '90d' | 'all';

export type GrowthTrend = 'up' | 'down' | 'stable';

export type SnapshotTrigger = 'create' | 'manual_update' | 'auto_recalculate';

export interface GrowthMetric {
  capabilityId: string;
  name: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  growthRate: number;
  trend: GrowthTrend;
}

export interface ChartDataPoint {
  date: string;
  level: number;
}
