import { describe, test, expect } from 'vitest';

import {
  getHistoryInRange,
  calculateGrowthRate,
  calculateTotalChange,
  rankByGrowth,
} from '../../features/growth-curve/engine/growthAnalytics';
import type { Capability, CapabilityHistory } from '../../shared/types';

const FIXED_NOW = new Date('2026-06-06T00:00:00Z');

const makeHistory = (
  capabilityId: string,
  levels: Array<{ level: number; daysAgo: number }>,
): CapabilityHistory[] =>
  levels.map(({ level, daysAgo }, idx) => {
    const date = new Date(FIXED_NOW);
    date.setDate(date.getDate() - daysAgo);
    return {
      id: `${capabilityId}-${idx}`,
      capabilityId,
      level,
      recordedAt: date.toISOString(),
    };
  });

const makeCap = (id: string, name: string, currentLevel: number): Capability => ({
  id,
  userId: 'user1',
  name,
  category: 'mind',
  parentId: null,
  currentLevel,
  targetLevel: 100,
  growthRate: 0,
  lastUpdated: FIXED_NOW.toISOString(),
  createdAt: FIXED_NOW.toISOString(),
});

describe('growthAnalytics', () => {
  // ─── getHistoryInRange ──────────────────────────────────

  describe('getHistoryInRange', () => {
    const history: CapabilityHistory[] = [
      ...makeHistory('cap1', [
        { level: 10, daysAgo: 100 },
        { level: 20, daysAgo: 50 },
        { level: 30, daysAgo: 10 },
        { level: 40, daysAgo: 3 },
      ]),
    ];

    test('30天筛选：返回最近 30 天的快照', () => {
      const result = getHistoryInRange(history, '30d', FIXED_NOW);
      expect(result).toHaveLength(2);
      expect(result[0].level).toBe(30);
    });

    test('7天筛选：返回最近 7 天的快照', () => {
      const result = getHistoryInRange(history, '7d', FIXED_NOW);
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe(40);
    });

    test('全部：返回所有快照', () => {
      const result = getHistoryInRange(history, 'all', FIXED_NOW);
      expect(result).toHaveLength(4);
    });

    test('空历史 → 返回空', () => {
      expect(getHistoryInRange([], '30d', FIXED_NOW)).toEqual([]);
    });
  });

  // ─── calculateGrowthRate ────────────────────────────────

  describe('calculateGrowthRate', () => {
    test('2 个快照：last - first', () => {
      const history = makeHistory('cap1', [
        { level: 10, daysAgo: 30 },
        { level: 30, daysAgo: 10 },
      ]);
      // 都在 30 天范围内
      expect(calculateGrowthRate(history, '30d', FIXED_NOW)).toBe(20);
    });

    test('多个快照：取首末', () => {
      const history = makeHistory('cap1', [
        { level: 10, daysAgo: 60 },
        { level: 20, daysAgo: 40 },
        { level: 25, daysAgo: 20 },
        { level: 30, daysAgo: 5 },
      ]);
      expect(calculateGrowthRate(history, '90d', FIXED_NOW)).toBe(20);
    });

    test('1 个快照 → 0', () => {
      const history = makeHistory('cap1', [{ level: 10, daysAgo: 5 }]);
      expect(calculateGrowthRate(history, '30d', FIXED_NOW)).toBe(0);
    });

    test('0 快照 → 0', () => {
      expect(calculateGrowthRate([], '30d', FIXED_NOW)).toBe(0);
    });

    test('负增长', () => {
      const history = makeHistory('cap1', [
        { level: 50, daysAgo: 30 },
        { level: 30, daysAgo: 5 },
      ]);
      expect(calculateGrowthRate(history, '30d', FIXED_NOW)).toBe(-20);
    });

    test('时间范围外不计入', () => {
      const history = makeHistory('cap1', [
        { level: 10, daysAgo: 100 },
        { level: 20, daysAgo: 50 },
      ]);
      // 30天范围内只有一个快照 → 0
      expect(calculateGrowthRate(history, '30d', FIXED_NOW)).toBe(0);
    });
  });

  // ─── calculateTotalChange ───────────────────────────────

  describe('calculateTotalChange', () => {
    test('上升', () => {
      const history = makeHistory('cap1', [
        { level: 10, daysAgo: 100 },
        { level: 30, daysAgo: 50 },
      ]);
      expect(calculateTotalChange(history)).toBe(20);
    });

    test('下降', () => {
      const history = makeHistory('cap1', [
        { level: 50, daysAgo: 100 },
        { level: 30, daysAgo: 50 },
      ]);
      expect(calculateTotalChange(history)).toBe(-20);
    });

    test('不变', () => {
      const history = makeHistory('cap1', [
        { level: 30, daysAgo: 100 },
        { level: 30, daysAgo: 50 },
      ]);
      expect(calculateTotalChange(history)).toBe(0);
    });

    test('不足 2 个快照 → 0', () => {
      expect(calculateTotalChange([])).toBe(0);
      const one = makeHistory('cap1', [{ level: 10, daysAgo: 5 }]);
      expect(calculateTotalChange(one)).toBe(0);
    });
  });

  // ─── rankByGrowth ───────────────────────────────────────

  describe('rankByGrowth', () => {
    test('按 growthRate 降序排序', () => {
      const caps: Capability[] = [
        makeCap('cap1', 'A', 50),
        makeCap('cap2', 'B', 70),
        makeCap('cap3', 'C', 30),
      ];
      const history: CapabilityHistory[] = [
        ...makeHistory('cap1', [
          { level: 30, daysAgo: 30 },
          { level: 50, daysAgo: 5 },
        ]),
        ...makeHistory('cap2', [
          { level: 50, daysAgo: 30 },
          { level: 70, daysAgo: 5 },
        ]),
        ...makeHistory('cap3', [
          { level: 50, daysAgo: 30 },
          { level: 30, daysAgo: 5 },
        ]),
      ];
      const result = rankByGrowth(caps, history, '30d', FIXED_NOW);
      expect(result[0].name).toBe('A');
      expect(result[0].growthRate).toBe(20);
      expect(result[0].trend).toBe('up');
      expect(result[1].name).toBe('B');
      expect(result[1].growthRate).toBe(20);
      expect(result[2].name).toBe('C');
      expect(result[2].growthRate).toBe(-20);
      expect(result[2].trend).toBe('down');
    });

    test('无历史的能力 → 增长率 0', () => {
      const caps: Capability[] = [makeCap('cap1', 'A', 50)];
      const result = rankByGrowth(caps, [], '30d', FIXED_NOW);
      expect(result[0].growthRate).toBe(0);
      expect(result[0].trend).toBe('stable');
    });

    test('空能力列表 → 返回空', () => {
      const result = rankByGrowth([], [], '30d', FIXED_NOW);
      expect(result).toEqual([]);
    });

    test('trend 字段：up / down / stable', () => {
      const caps: Capability[] = [
        makeCap('cap1', 'UpCap', 50),
        makeCap('cap2', 'DownCap', 30),
        makeCap('cap3', 'StableCap', 50),
      ];
      const history: CapabilityHistory[] = [
        ...makeHistory('cap1', [
          { level: 30, daysAgo: 30 },
          { level: 50, daysAgo: 5 },
        ]),
        ...makeHistory('cap2', [
          { level: 50, daysAgo: 30 },
          { level: 30, daysAgo: 5 },
        ]),
        ...makeHistory('cap3', [
          { level: 50, daysAgo: 30 },
          { level: 50, daysAgo: 5 },
        ]),
      ];
      const result = rankByGrowth(caps, history, '30d', FIXED_NOW);
      const trends = result.map((m) => m.trend);
      expect(trends).toContain('up');
      expect(trends).toContain('down');
      expect(trends).toContain('stable');
    });
  });
});
