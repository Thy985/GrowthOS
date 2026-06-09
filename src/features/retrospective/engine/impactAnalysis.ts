// impactAnalysis - 复盘能力影响分析（纯函数）
import type { Capability } from '../../../shared/types';
import type { CapabilityImpact } from '../types/retrospectiveTypes';

/**
 * 计算每个被选择的能力的等级变化。
 *
 * 算法：
 *   基础增长 = 3（每个参与项目的能力至少获得基础增长）
 *   + 正面回顾奖励 = min(whatWentWell.length, 3)（最多 +3 奖励）
 *   - 如果有改进项，总增长减半（floor），但至少保留 1（避免负增长）
 *   最终等级不超过 100 上限
 */
export function analyzeCapabilityImpact(
  capabilitiesUsed: string[],
  capabilities: Capability[],
  whatWentWell: string[],
  whatWentWrong: string[],
): CapabilityImpact[] {
  if (!capabilitiesUsed.length || !capabilities.length) return [];

  const capMap = new Map(capabilities.map((c) => [c.id, c]));
  const impacts: CapabilityImpact[] = [];

  for (const capId of capabilitiesUsed) {
    const cap = capMap.get(capId);
    if (!cap) continue;

    // 基础增长：每个参与项目的能力 +3
    let change = 3;

    // 正面回顾越多，增长越快（上限 3 条）
    if (whatWentWell.length > 0) {
      change += Math.min(whatWentWell.length, 3);
    }

    // 存在改进项时，增长减半，但至少保留 1 点
    if (whatWentWrong.length > 0) {
      change = Math.max(1, Math.floor(change / 2));
    }

    const newLevel = Math.min(100, cap.currentLevel + change);

    impacts.push({
      capabilityId: cap.id,
      capabilityName: cap.name,
      oldLevel: cap.currentLevel,
      newLevel,
      change: newLevel - cap.currentLevel,
      reason: buildReason(change, whatWentWell.length, whatWentWrong.length),
    });
  }

  return impacts;
}

/**
 * 构建能力变化原因描述（内部使用，数据层保持中性语言）
 */
export function buildReason(change: number, wellCount: number, wrongCount: number): string {
  const parts: string[] = [];
  if (wellCount > 0) parts.push(`positive:${wellCount}`);
  if (wrongCount > 0) parts.push(`negative:${wrongCount}`);
  parts.push(`change:${change}`);
  return parts.join('; ');
}
