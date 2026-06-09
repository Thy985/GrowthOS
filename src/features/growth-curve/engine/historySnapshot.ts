/**
 * 历史快照生成引擎
 *
 * 纯函数，无副作用，可独立测试。
 * 负责判断何时记录快照以及如何创建/合并快照。
 */

import type { CapabilityHistory } from '../../../shared/types';

const MIN_LEVEL_CHANGE = 5;
const MIN_TIME_BETWEEN_SNAPSHOTS_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * 判断是否需要记录新快照
 *
 * 规则：
 * 1. 新能力（lastSnapshot 为 undefined）→ 记录
 * 2. level 未变 → 跳过
 * 3. level 变化 >= 5 → 记录
 * 4. level 变化 < 5 但距离上次记录超过 24 小时 → 记录
 * 5. 其他情况 → 跳过
 */
export function shouldRecordSnapshot(
  oldLevel: number,
  newLevel: number,
  lastSnapshot?: CapabilityHistory,
): boolean {
  // 新能力：必须记录
  if (!lastSnapshot) {
    return true;
  }

  // level 未变：跳过
  if (oldLevel === newLevel) {
    return false;
  }

  // level 变化显著：记录
  if (Math.abs(oldLevel - newLevel) >= MIN_LEVEL_CHANGE) {
    return true;
  }

  // level 变化小但时间间隔长：记录
  const lastTime = new Date(lastSnapshot.recordedAt).getTime();
  const timePassed = Date.now() - lastTime;
  if (timePassed > MIN_TIME_BETWEEN_SNAPSHOTS_MS) {
    return true;
  }

  return false;
}

/**
 * 创建快照记录
 */
export function createSnapshot(
  capabilityId: string,
  level: number,
  recordedAt?: string,
): CapabilityHistory {
  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    capabilityId,
    level,
    recordedAt: recordedAt || new Date().toISOString(),
  };
}

/**
 * 合并快照列表（按 recordedAt 升序，去重同时间戳）
 */
export function mergeSnapshots(
  existing: CapabilityHistory[],
  newSnapshots: CapabilityHistory[],
): CapabilityHistory[] {
  const map = new Map<string, CapabilityHistory>();

  for (const snap of existing) {
    map.set(snap.id, snap);
  }
  for (const snap of newSnapshots) {
    map.set(snap.id, snap);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
}
