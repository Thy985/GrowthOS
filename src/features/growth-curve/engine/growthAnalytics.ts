/**
 * 增长分析引擎
 *
 * 纯函数，无副作用，可独立测试。
 * 负责时间范围筛选、增长率计算、能力排序。
 */

import type { Capability, CapabilityHistory } from '../../../shared/types';
import type { GrowthMetric, TimeRange } from '../types/growthCurveTypes';
import { getCutoffDate } from '../utils/timeRangeUtils';

/**
 * 按时间范围筛选历史记录
 */
export function getHistoryInRange(
  history: CapabilityHistory[],
  range: TimeRange,
  now?: Date,
): CapabilityHistory[] {
  if (range === 'all') {
    return [...history];
  }

  const cutoff = getCutoffDate(range, now);
  return history.filter((h) => new Date(h.recordedAt) >= cutoff);
}

/**
 * 计算增长率（指定时间范围内的变化）
 *
 * 返回值：last - first
 * - 正数：增长
 * - 负数：下降
 * - 0：无变化或快照不足
 */
export function calculateGrowthRate(
  history: CapabilityHistory[],
  range: TimeRange,
  now?: Date,
): number {
  const rangeHistory = getHistoryInRange(history, range, now);
  if (rangeHistory.length < 2) {
    return 0;
  }

  // history 假设已按 recordedAt 升序排序
  const first = rangeHistory[0].level;
  const last = rangeHistory[rangeHistory.length - 1].level;
  return last - first;
}

/**
 * 计算总变化量（从最早到最新）
 */
export function calculateTotalChange(history: CapabilityHistory[]): number {
  if (history.length < 2) {
    return 0;
  }
  return history[history.length - 1].level - history[0].level;
}

/**
 * 按增长排序能力
 */
export function rankByGrowth(
  capabilities: Capability[],
  history: CapabilityHistory[],
  range: TimeRange,
  now?: Date,
): GrowthMetric[] {
  const metrics: GrowthMetric[] = capabilities.map((cap) => {
    const capHistory = history.filter((h) => h.capabilityId === cap.id);
    const growthRate = calculateGrowthRate(capHistory, range, now);
    return {
      capabilityId: cap.id,
      name: cap.name,
      category: cap.category,
      currentLevel: cap.currentLevel,
      targetLevel: cap.targetLevel,
      growthRate,
      trend: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable',
    };
  });

  // 按 growthRate 降序
  return metrics.sort((a, b) => b.growthRate - a.growthRate);
}
