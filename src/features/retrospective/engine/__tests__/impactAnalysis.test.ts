// impactAnalysis 纯函数测试
import { describe, it, expect } from 'vitest';

import type { Capability } from '../../../../shared/types';
import { analyzeCapabilityImpact, buildReason } from '../impactAnalysis';

const makeCapability = (overrides: Partial<Capability> = {}): Capability => ({
  id: 'cap-1',
  userId: 'default',
  name: '系统设计',
  category: 'skill',
  parentId: null,
  currentLevel: 50,
  targetLevel: 80,
  growthRate: 0,
  lastUpdated: '2024-01-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

describe('analyzeCapabilityImpact', () => {
  it('should return empty array when no capabilities used', () => {
    const result = analyzeCapabilityImpact([], [makeCapability()], [], []);
    expect(result).toEqual([]);
  });

  it('should return empty array when no capabilities exist', () => {
    const result = analyzeCapabilityImpact(['cap-1'], [], [], []);
    expect(result).toEqual([]);
  });

  it('should calculate base impact with no retrospective data', () => {
    const result = analyzeCapabilityImpact(['cap-1'], [makeCapability()], [], []);
    expect(result).toHaveLength(1);
    expect(result[0].change).toBe(3);
    expect(result[0].newLevel).toBe(53);
  });

  it('should add bonus for whatWentWell', () => {
    const result = analyzeCapabilityImpact(
      ['cap-1'],
      [makeCapability()],
      ['item1', 'item2', 'item3'],
      [],
    );
    expect(result[0].change).toBe(6); // 3 + min(3, 3)
    expect(result[0].newLevel).toBe(56);
  });

  it('should cap bonus at 3 for whatWentWell', () => {
    const result = analyzeCapabilityImpact(
      ['cap-1'],
      [makeCapability()],
      ['a', 'b', 'c', 'd', 'e'],
      [],
    );
    expect(result[0].change).toBe(6); // 3 + 3 (capped)
  });

  it('should halve impact when whatWentWrong exists', () => {
    const result = analyzeCapabilityImpact(['cap-1'], [makeCapability()], [], ['wrong1']);
    expect(result[0].change).toBe(1); // floor(3/2) = 1
    expect(result[0].newLevel).toBe(51);
  });

  it('should combine well and wrong effects', () => {
    const result = analyzeCapabilityImpact(
      ['cap-1'],
      [makeCapability()],
      ['good1', 'good2'],
      ['wrong1'],
    );
    // 3 + min(2,3) = 5, floor(5/2) = 2
    expect(result[0].change).toBe(2);
    expect(result[0].newLevel).toBe(52);
  });

  it('should cap newLevel at 100', () => {
    const result = analyzeCapabilityImpact(
      ['cap-1'],
      [makeCapability({ currentLevel: 99 })],
      ['a', 'b', 'c'],
      [],
    );
    expect(result[0].newLevel).toBe(100);
    expect(result[0].change).toBe(1);
  });

  it('should skip unknown capability IDs', () => {
    const result = analyzeCapabilityImpact(['cap-1', 'cap-unknown'], [makeCapability()], [], []);
    expect(result).toHaveLength(1);
    expect(result[0].capabilityId).toBe('cap-1');
  });

  it('should handle multiple capabilities', () => {
    const caps = [
      makeCapability({ id: 'cap-1', name: '系统设计', currentLevel: 50 }),
      makeCapability({ id: 'cap-2', name: '编程', currentLevel: 30 }),
    ];
    const result = analyzeCapabilityImpact(['cap-1', 'cap-2'], caps, ['good'], []);
    expect(result).toHaveLength(2);
    expect(result[0].change).toBe(4); // 3 + 1
    expect(result[1].change).toBe(4);
  });

  it('should include reason in impact', () => {
    const result = analyzeCapabilityImpact(
      ['cap-1'],
      [makeCapability()],
      ['good1', 'good2'],
      ['wrong1'],
    );
    expect(result[0].reason).toContain('positive:2');
    expect(result[0].reason).toContain('negative:1');
    expect(result[0].reason).toContain('change:2');
  });
});

describe('buildReason', () => {
  it('should include well count when positive', () => {
    const reason = buildReason(5, 3, 0);
    expect(reason).toContain('positive:3');
    expect(reason).not.toContain('negative');
  });

  it('should include wrong count when positive', () => {
    const reason = buildReason(2, 0, 2);
    expect(reason).toContain('negative:2');
    expect(reason).not.toContain('positive');
  });

  it('should include both when both exist', () => {
    const reason = buildReason(3, 2, 1);
    expect(reason).toContain('positive:2');
    expect(reason).toContain('negative:1');
  });

  it('should include change value', () => {
    const reason = buildReason(1, 0, 0);
    expect(reason).toContain('change:1');
  });
});
