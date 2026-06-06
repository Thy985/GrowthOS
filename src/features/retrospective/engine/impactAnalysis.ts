// impactAnalysis - 复盘能力影响分析（纯函数）
import type { Capability } from '../../../shared/types';
import type { CapabilityImpact } from '../types/retrospectiveTypes';

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

    let change = 3;

    if (whatWentWell.length > 0) {
      change += Math.min(whatWentWell.length, 3);
    }

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

export function buildReason(change: number, wellCount: number, wrongCount: number): string {
  const parts: string[] = [];
  if (wellCount > 0) parts.push(`复盘中有 ${wellCount} 条正面回顾`);
  if (wrongCount > 0) parts.push(`${wrongCount} 条改进项`);
  parts.push(`能力等级 +${change}`);
  return parts.join('，');
}
