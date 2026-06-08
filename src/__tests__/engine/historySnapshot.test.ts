import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  shouldRecordSnapshot,
  createSnapshot,
  mergeSnapshots,
} from '../../features/growth-curve/engine/historySnapshot';
import type { CapabilityHistory } from '../../shared/types';

describe('historySnapshot', () => {
  const FIXED_NOW = new Date('2026-06-06T00:00:00Z');
  const FIXED_NOW_MS = FIXED_NOW.getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── shouldRecordSnapshot ───────────────────────────────

  describe('shouldRecordSnapshot', () => {
    test('新能力（无 lastSnapshot）→ 记录', () => {
      expect(shouldRecordSnapshot(0, 0, undefined)).toBe(true);
      expect(shouldRecordSnapshot(0, 50, undefined)).toBe(true);
    });

    test('level 未变 → 不记录', () => {
      const last: CapabilityHistory = {
        id: 'h1',
        capabilityId: 'cap1',
        level: 50,
        recordedAt: FIXED_NOW.toISOString(),
      };
      expect(shouldRecordSnapshot(50, 50, last)).toBe(false);
    });

    test('level 增长 >= 5 → 记录', () => {
      const last: CapabilityHistory = {
        id: 'h1',
        capabilityId: 'cap1',
        level: 50,
        recordedAt: FIXED_NOW.toISOString(),
      };
      expect(shouldRecordSnapshot(50, 55, last)).toBe(true);
      expect(shouldRecordSnapshot(50, 60, last)).toBe(true);
    });

    test('level 下降 >= 5 → 记录（负增长也记录）', () => {
      const last: CapabilityHistory = {
        id: 'h1',
        capabilityId: 'cap1',
        level: 50,
        recordedAt: FIXED_NOW.toISOString(),
      };
      expect(shouldRecordSnapshot(50, 40, last)).toBe(true);
      expect(shouldRecordSnapshot(50, 30, last)).toBe(true);
    });

    test('level 变化 < 5 但时间 > 24h → 记录', () => {
      const oneDayAgo = new Date(FIXED_NOW_MS - 25 * 60 * 60 * 1000).toISOString();
      const last: CapabilityHistory = {
        id: 'h1',
        capabilityId: 'cap1',
        level: 50,
        recordedAt: oneDayAgo,
      };
      expect(shouldRecordSnapshot(50, 52, last)).toBe(true);
    });

    test('level 变化 < 5 且时间 < 24h → 不记录', () => {
      const oneHourAgo = new Date(FIXED_NOW_MS - 60 * 60 * 1000).toISOString();
      const last: CapabilityHistory = {
        id: 'h1',
        capabilityId: 'cap1',
        level: 50,
        recordedAt: oneHourAgo,
      };
      expect(shouldRecordSnapshot(50, 52, last)).toBe(false);
    });

    test('level 变化 = 4（边界）→ 时间不够则不记录', () => {
      const oneHourAgo = new Date(FIXED_NOW_MS - 60 * 60 * 1000).toISOString();
      const last: CapabilityHistory = {
        id: 'h1',
        capabilityId: 'cap1',
        level: 50,
        recordedAt: oneHourAgo,
      };
      expect(shouldRecordSnapshot(50, 54, last)).toBe(false);
    });
  });

  // ─── createSnapshot ─────────────────────────────────────

  describe('createSnapshot', () => {
    test('生成唯一 ID 的快照', () => {
      const snap = createSnapshot('cap1', 50);
      expect(snap.id).toMatch(/^hist-\d+-[a-z0-9]+$/);
      expect(snap.capabilityId).toBe('cap1');
      expect(snap.level).toBe(50);
    });

    test('默认时间为当前时间', () => {
      const snap = createSnapshot('cap1', 50);
      expect(snap.recordedAt).toBe(FIXED_NOW.toISOString());
    });

    test('支持自定义时间', () => {
      const customTime = '2026-01-01T00:00:00.000Z';
      const snap = createSnapshot('cap1', 50, customTime);
      expect(snap.recordedAt).toBe(customTime);
    });
  });

  // ─── mergeSnapshots ─────────────────────────────────────

  describe('mergeSnapshots', () => {
    test('合并两个不相交的快照列表', () => {
      const a: CapabilityHistory[] = [
        { id: 'h1', capabilityId: 'cap1', level: 10, recordedAt: '2026-01-01T00:00:00.000Z' },
      ];
      const b: CapabilityHistory[] = [
        { id: 'h2', capabilityId: 'cap1', level: 20, recordedAt: '2026-02-01T00:00:00.000Z' },
      ];
      const result = mergeSnapshots(a, b);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('h1');
      expect(result[1].id).toBe('h2');
    });

    test('去重（相同 id）', () => {
      const snap: CapabilityHistory = {
        id: 'h1',
        capabilityId: 'cap1',
        level: 10,
        recordedAt: '2026-01-01T00:00:00.000Z',
      };
      const result = mergeSnapshots([snap], [snap]);
      expect(result).toHaveLength(1);
    });

    test('按 recordedAt 升序排序', () => {
      const a: CapabilityHistory[] = [
        { id: 'h2', capabilityId: 'cap1', level: 20, recordedAt: '2026-02-01T00:00:00.000Z' },
      ];
      const b: CapabilityHistory[] = [
        { id: 'h1', capabilityId: 'cap1', level: 10, recordedAt: '2026-01-01T00:00:00.000Z' },
      ];
      const result = mergeSnapshots(a, b);
      expect(result[0].id).toBe('h1');
      expect(result[1].id).toBe('h2');
    });

    test('空列表合并', () => {
      const snap: CapabilityHistory = {
        id: 'h1',
        capabilityId: 'cap1',
        level: 10,
        recordedAt: '2026-01-01T00:00:00.000Z',
      };
      expect(mergeSnapshots([], [snap])).toEqual([snap]);
      expect(mergeSnapshots([snap], [])).toEqual([snap]);
      expect(mergeSnapshots([], [])).toEqual([]);
    });
  });

  // ─── Edge cases ─────────────────────────────────────────

  describe('edge cases', () => {
    test('level 变化恰好 = 5（边界值）→ 记录', () => {
      const last: CapabilityHistory = {
        id: 'h1',
        capabilityId: 'cap1',
        level: 50,
        recordedAt: new Date(FIXED_NOW_MS - 60 * 60 * 1000).toISOString(),
      };
      expect(shouldRecordSnapshot(50, 55, last)).toBe(true);
    });

    test('level 变化 = -5（下降边界值）→ 记录', () => {
      const last: CapabilityHistory = {
        id: 'h1',
        capabilityId: 'cap1',
        level: 50,
        recordedAt: new Date(FIXED_NOW_MS - 60 * 60 * 1000).toISOString(),
      };
      expect(shouldRecordSnapshot(50, 45, last)).toBe(true);
    });
  });
});
