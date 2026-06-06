/**
 * 成长曲线 Redux Selector
 */

import { createSelector } from '@reduxjs/toolkit';

import type { CapabilityHistory, RootState } from '../../../shared/types';
import { rankByGrowth, getHistoryInRange } from '../engine/growthAnalytics';
import type { GrowthMetric, TimeRange } from '../types/growthCurveTypes';

// React-Redux stable empty array reference
const EMPTY_ARRAY: never[] = [];

/**
 * 获取指定能力的历史记录（按 recordedAt 升序）
 */
export const selectCapabilityHistory = (
  state: RootState,
  capabilityId: string,
): CapabilityHistory[] => {
  const history = state.capabilities.history;
  if (!history || history.length === 0) {
    return EMPTY_ARRAY as unknown as CapabilityHistory[];
  }
  return history
    .filter((h) => h.capabilityId === capabilityId)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
};

/**
 * 获取所有能力的增长排行
 */
export const selectGrowthRanking = createSelector(
  [
    (state: RootState) => state.capabilities.capabilities,
    (state: RootState) => state.capabilities.history,
    (_state: RootState, range: TimeRange) => range,
  ],
  (capabilities, history, range): GrowthMetric[] => {
    if (!capabilities || capabilities.length === 0) {
      return [];
    }
    return rankByGrowth(capabilities, history ?? [], range);
  },
);

/**
 * 获取指定能力在指定时间范围内的历史
 */
export const selectCapabilityHistoryInRange = createSelector(
  [
    (_state: RootState, _capabilityId: string, range: TimeRange) => range,
    (state: RootState) => state.capabilities.history,
    (_state: RootState, capabilityId: string) => capabilityId,
  ],
  (range, history, capabilityId): CapabilityHistory[] => {
    if (!history) return [];
    const capHistory = history.filter((h) => h.capabilityId === capabilityId);
    return getHistoryInRange(capHistory, range);
  },
);
