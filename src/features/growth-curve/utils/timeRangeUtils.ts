/**
 * 时间范围工具
 *
 * 纯函数，负责 TimeRange 与 Date 之间的转换。
 */

import type { TimeRange } from '../types/growthCurveTypes';

const RANGE_DAYS: Record<Exclude<TimeRange, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

/**
 * 计算指定范围的截止日期
 *
 * - 'all' 返回 null（不限时间）
 * - 其他返回 (now - N天) 的 Date 对象
 */
export function getCutoffDate(range: TimeRange, now?: Date): Date {
  if (range === 'all') {
    return new Date(0); // 最早时间
  }

  const reference = now || new Date();
  const days = RANGE_DAYS[range];
  const cutoff = new Date(reference);
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

/**
 * 验证 TimeRange 值是否合法
 */
export function isValidRange(range: unknown): range is TimeRange {
  return range === '7d' || range === '30d' || range === '90d' || range === 'all';
}
