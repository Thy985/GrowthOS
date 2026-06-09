import type {
  Experience,
  Capability,
  Principle,
  Project,
  ExperienceCapabilityLink,
} from '../../../shared/types';
import { calculateCapabilityLevel } from '../../capabilities/store/capabilitySlice';
import type { Insight, Recommendation, CoachSummary } from '../types/coachTypes';

// Helper: match a capability name in text using word boundaries
function matchCapabilityInText(text: string, capability: Capability): boolean {
  const escaped = capability.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordBoundary = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`);
  return wordBoundary.test(text);
}

// Constants
const STALE_DAYS_INFO = 14;
const STALE_DAYS_NOTICE = 30;
const STALE_DAYS_IMPORTANT = 60;
const GROWTH_INFO = 5;
const GROWTH_NOTICE = 15;
const CONCENTRATION_THRESHOLD = 0.8;
const MANY_PROJECTS_THRESHOLD = 3;
const PROJECT_RETRO_DAYS = 30;

export const SEVERITY_ORDER: Record<string, number> = {
  important: 0,
  notice: 1,
  info: 2,
};

export const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// ─── Rule 1: Detect stale capabilities ──────────────────────────

export function detectStaleCapabilities(
  capabilities: Capability[],
  experiences: Experience[],
  links: ExperienceCapabilityLink[],
  now?: Date,
): Insight[] {
  const currentDate = now || new Date();
  const insights: Insight[] = [];

  const expMap = new Map<string, Experience>();
  for (const exp of experiences) {
    expMap.set(exp.id, exp);
  }

  for (const capability of capabilities) {
    const capLinks = links.filter((link) => link.capabilityId === capability.id);
    if (capLinks.length === 0) continue;

    let mostRecentDate: Date | null = null;
    for (const link of capLinks) {
      const exp = expMap.get(link.experienceId);
      if (!exp) continue;
      const expDate = new Date(exp.occurredAt);
      if (!mostRecentDate || expDate > mostRecentDate) {
        mostRecentDate = expDate;
      }
    }

    if (!mostRecentDate) continue;

    const daysSince = Math.floor(
      (currentDate.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSince > STALE_DAYS_IMPORTANT) {
      insights.push({
        type: 'stale',
        icon: '⚠️',
        title: `你的「${capability.name}」已 ${daysSince} 天未更新`,
        description: `最后更新是在 ${daysSince} 天前，能力可能正在退化`,
        severity: 'important',
      });
    } else if (daysSince > STALE_DAYS_NOTICE) {
      insights.push({
        type: 'stale',
        icon: '⏳',
        title: `你的「${capability.name}」已超过一个月未更新`,
        description: `最后更新是在 ${daysSince} 天前`,
        severity: 'notice',
      });
    } else if (daysSince > STALE_DAYS_INFO) {
      insights.push({
        type: 'stale',
        icon: 'ℹ️',
        title: `你的「${capability.name}」两周没有新经历了`,
        description: `最后更新是在 ${daysSince} 天前`,
        severity: 'info',
      });
    }
  }

  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

// ─── Rule 2: Detect growth capabilities ──────────────────────────

export function detectGrowthCapabilities(
  capabilities: Capability[],
  experiences: Experience[],
  links: ExperienceCapabilityLink[],
  now?: Date,
): Insight[] {
  const currentDate = now || new Date();
  const insights: Insight[] = [];

  for (const capability of capabilities) {
    const currentLevel = calculateCapabilityLevel(capability.id, experiences, links);

    const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oldExperiences = experiences.filter((exp) => new Date(exp.occurredAt) <= thirtyDaysAgo);
    const oldLevel = calculateCapabilityLevel(capability.id, oldExperiences, links);

    const change = currentLevel - oldLevel;

    if (change > GROWTH_NOTICE) {
      insights.push({
        type: 'growth',
        icon: '🚀',
        title: `你的「${capability.name}」本月增长 ${change} 分，势头很好！`,
        description: `能力水平从 ${oldLevel} 提升到 ${currentLevel}`,
        severity: 'notice',
      });
    } else if (change > GROWTH_INFO) {
      insights.push({
        type: 'growth',
        icon: '📈',
        title: `你的「${capability.name}」本月增长 ${change} 分，继续保持`,
        description: `能力水平从 ${oldLevel} 提升到 ${currentLevel}`,
        severity: 'info',
      });
    }
  }

  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

// ─── Rule 3: Detect patterns ─────────────────────────────────────

export function detectPatterns(
  experiences: Experience[],
  capabilities: Capability[],
  principles: Principle[],
  projects: Project[],
  links: ExperienceCapabilityLink[],
  now?: Date,
): Insight[] {
  const currentDate = now || new Date();
  const insights: Insight[] = [];

  const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentExperiences = experiences.filter((exp) => new Date(exp.occurredAt) >= thirtyDaysAgo);

  if (recentExperiences.length > 0) {
    const expMap = new Map<string, Experience>();
    for (const exp of recentExperiences) {
      expMap.set(exp.id, exp);
    }

    const capCounts = new Map<string, number>();
    for (const link of links) {
      const exp = expMap.get(link.experienceId);
      if (!exp) continue;
      const count = capCounts.get(link.capabilityId) || 0;
      capCounts.set(link.capabilityId, count + 1);
    }

    for (const [capId, count] of capCounts.entries()) {
      const ratio = count / recentExperiences.length;
      if (ratio >= CONCENTRATION_THRESHOLD) {
        const capability = capabilities.find((c) => c.id === capId);
        if (capability) {
          insights.push({
            type: 'pattern',
            icon: '🎯',
            title: `本月你 ${Math.round(ratio * 100)}% 经历都贡献给了「${capability.name}」`,
            description: `共 ${count} 条相关经历，建议关注其他能力发展`,
            severity: 'info',
          });
        }
      }
    }
  }

  const activeProjects = projects.filter((p) => p.status === 'active');
  if (activeProjects.length > MANY_PROJECTS_THRESHOLD) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: `你有 ${activeProjects.length} 个项目在进行中，注意合理分配精力`,
      description: '同时处理太多项目可能导致注意力分散',
      severity: 'notice',
    });
  }

  const unusedPrinciples = principles.filter((p) => p.usageCount === 0);
  if (unusedPrinciples.length > 0) {
    insights.push({
      type: 'pattern',
      icon: '💡',
      title: `你有 ${unusedPrinciples.length} 条原则从未在实践中使用`,
      description: '尝试将这些原则应用到日常工作中',
      severity: 'info',
    });
  }

  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

// ─── Rule 4: Detect retrospective insights (V2) ──────────────────

export function detectRetrospectiveInsights(
  projects: Project[],
  capabilities: Capability[],
): Insight[] {
  const insights: Insight[] = [];
  const projectsWithRetro = projects.filter(
    (p) =>
      p.retrospective &&
      (p.retrospective.whatWentWell.length > 0 || p.retrospective.whatWentWrong.length > 0),
  );

  if (projectsWithRetro.length === 0) return insights;

  const capMap = new Map(capabilities.map((c) => [c.id, c]));

  // 统计每个能力在 whatWentWell 中出现的频率
  const wellMentions = new Map<string, number>();
  const wrongMentions = new Map<string, number>();

  for (const project of projectsWithRetro) {
    const retro = project.retrospective!;
    const capsUsed = project.capabilitiesUsed || [];

    for (const capId of capsUsed) {
      // 正面提及：只要该能力在使用的项目中且有正面回顾
      if (retro.whatWentWell.length > 0) {
        wellMentions.set(capId, (wellMentions.get(capId) || 0) + 1);
      }
      if (retro.whatWentWrong.length > 0) {
        wrongMentions.set(capId, (wrongMentions.get(capId) || 0) + 1);
      }
    }
  }

  // 正面信号
  for (const [capId, count] of wellMentions.entries()) {
    if (count >= 2) {
      const cap = capMap.get(capId);
      if (cap) {
        insights.push({
          type: 'retrospective',
          icon: '🌟',
          title: `你的「${cap.name}」能力在 ${count} 个项目中表现良好`,
          description: '多次复盘中都获得正面反馈',
          severity: 'info',
        });
      }
    }
  }

  // 需关注信号
  for (const [capId, count] of wrongMentions.entries()) {
    if (count >= 2) {
      const cap = capMap.get(capId);
      if (cap) {
        insights.push({
          type: 'retrospective',
          icon: '🔍',
          title: `「${cap.name}」在 ${count} 次复盘改进项中重复出现`,
          description: '建议对该能力进行重点突破',
          severity: 'notice',
        });
      }
    }
  }

  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

// ─── Rule 5: Detect capability trends (V2) ───────────────────────

export function detectCapabilityTrends(capabilities: Capability[], projects: Project[]): Insight[] {
  const insights: Insight[] = [];
  const projectsWithRetro = projects.filter(
    (p) => p.retrospective && p.retrospective.whatWentWell.length > 0,
  );

  if (projectsWithRetro.length < 2) return insights;

  for (const cap of capabilities) {
    // 统计该能力涉及的项目复盘数
    const projectCount = projectsWithRetro.filter(
      (p) => p.capabilitiesUsed && p.capabilitiesUsed.includes(cap.id),
    ).length;

    if (projectCount >= 2) {
      // 检查能力等级是否在增长
      const growthRate = cap.growthRate || 0;
      if (growthRate > 0 && cap.currentLevel < cap.targetLevel) {
        insights.push({
          type: 'trend',
          icon: '📈',
          title: `「${cap.name}」能力持续增长中`,
          description: `已参与 ${projectCount} 次复盘，当前等级 ${cap.currentLevel}/${cap.targetLevel}`,
          severity: 'info',
        });
      } else if (growthRate === 0 && projectCount >= 3) {
        insights.push({
          type: 'trend',
          icon: '➡️',
          title: `「${cap.name}」已参与 ${projectCount} 次复盘但等级未变化`,
          description: '可能进入平台期，建议尝试新的训练方式',
          severity: 'notice',
        });
      }
    }

    // 退化检测
    if (cap.growthRate && cap.growthRate < 0) {
      insights.push({
        type: 'trend',
        icon: '📉',
        title: `「${cap.name}」能力等级出现下降`,
        description: '建议增加相关实践以恢复增长',
        severity: 'important',
      });
    }
  }

  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

// ─── Rule 6: Detect experience gaps (V2) ─────────────────────────

export function detectExperienceGaps(
  capabilities: Capability[],
  links: ExperienceCapabilityLink[],
): Insight[] {
  const insights: Insight[] = [];

  const linkedCapIds = new Set(links.map((l) => l.capabilityId));
  const gapped = capabilities.filter((c) => !linkedCapIds.has(c.id));

  if (gapped.length === 0) return insights;

  if (gapped.length === 1) {
    insights.push({
      type: 'gap',
      icon: '📭',
      title: `你的「${gapped[0].name}」能力从未关联任何经历`,
      description: '创建能力后建议补充实践经验',
      severity: 'info',
    });
  } else {
    const names = gapped.map((c) => `「${c.name}」`).join('、');
    insights.push({
      type: 'gap',
      icon: '📭',
      title: `你有 ${gapped.length} 个能力处于未训练状态`,
      description: `${names} 从未关联经历`,
      severity: 'notice',
    });
  }

  return insights;
}

// ─── Rule 7: Detect project health (V2) ──────────────────────────

export function detectProjectHealth(
  projects: Project[],
  experiences: Experience[],
  now?: Date,
): Insight[] {
  const currentDate = now || new Date();
  const insights: Insight[] = [];

  for (const project of projects) {
    // 活跃项目 > 30 天未复盘
    if (project.status === 'active' && project.startDate && !project.retrospective) {
      const startDate = new Date(project.startDate);
      const daysSince = Math.floor(
        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSince > PROJECT_RETRO_DAYS) {
        insights.push({
          type: 'project',
          icon: '⏰',
          title: `「${project.name}」已活跃 ${daysSince} 天未复盘`,
          description: '建议安排一次复盘回顾项目进展',
          severity: 'important',
        });
      }
    }

    // 已完成项目未复盘
    if (project.status === 'completed' && !project.retrospective) {
      insights.push({
        type: 'project',
        icon: '📋',
        title: `「${project.name}」已完成但缺少复盘记录`,
        description: '完成的复盘能帮助提炼经验',
        severity: 'notice',
      });
    }

    // 活跃项目无关联经历
    if (project.status === 'active') {
      const projectExps = experiences.filter((exp) => exp.projectId === project.id);
      if (projectExps.length === 0) {
        insights.push({
          type: 'project',
          icon: '📝',
          title: `「${project.name}」还没有任何经历记录`,
          description: '建议在项目中记录实践经历',
          severity: 'notice',
        });
      }
    }
  }

  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

// ─── Rule 4 (enhanced): Generate recommendations ─────────────────

export function generateRecommendations(
  insights: Insight[],
  capabilities: Capability[],
  projects: Project[],
  principles: Principle[],
  _experiences: Experience[],
  _links: ExperienceCapabilityLink[],
  now?: Date,
): Recommendation[] {
  const currentDate = now || new Date();
  const currentISO = currentDate.toISOString();
  const recommendations: Recommendation[] = [];

  // HIGH: Stale capability > 60 days
  const importantStale = insights.filter((i) => i.type === 'stale' && i.severity === 'important');
  for (const insight of importantStale) {
    const capability = capabilities.find((c) => matchCapabilityInText(insight.title, c));
    if (capability) {
      recommendations.push({
        id: `rec-stale-${capability.id}`,
        actionId: 'record_experience',
        actionParams: { capabilityId: capability.id },
        icon: '📝',
        title: `记录「${capability.name}」相关经历`,
        action: '该能力已超过 60 天未更新，建议补充新的实践经历',
        priority: 'high',
        relatedCapability: capability.id,
        sourceRule: 'stale',
        status: 'pending',
        statusUpdatedAt: currentISO,
      });
    }
  }

  // HIGH: Project needs retrospective
  const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const longActiveProjects = projects.filter(
    (p) =>
      p.status === 'active' &&
      p.startDate &&
      new Date(p.startDate) <= thirtyDaysAgo &&
      !p.retrospective,
  );
  for (const project of longActiveProjects) {
    const daysSince = Math.floor(
      (currentDate.getTime() - new Date(project.startDate!).getTime()) / (1000 * 60 * 60 * 24),
    );
    recommendations.push({
      id: `rec-project-retro-${project.id}`,
      actionId: 'review_project',
      actionParams: { projectId: project.id },
      icon: '🔄',
      title: `复盘「${project.name}」项目`,
      action: `已活跃 ${daysSince} 天，建议进行一次回顾总结`,
      priority: 'high',
      relatedProjectId: project.id,
      sourceRule: 'project',
      status: 'pending',
      statusUpdatedAt: currentISO,
    });
  }

  // HIGH: Retrospective pattern → focus on improvement
  const retroBad = insights.filter((i) => i.type === 'retrospective' && i.severity === 'notice');
  for (const insight of retroBad) {
    const capability = capabilities.find((c) => matchCapabilityInText(insight.title, c));
    if (capability) {
      recommendations.push({
        id: `rec-retro-${capability.id}`,
        actionId: 'manage_capability',
        actionParams: { capabilityId: capability.id },
        icon: '🎯',
        title: `重点突破「${capability.name}」`,
        action: '该能力在多次复盘中出现改进项，建议专项训练',
        priority: 'high',
        relatedCapability: capability.id,
        sourceRule: 'retrospective',
        status: 'pending',
        statusUpdatedAt: currentISO,
      });
    }
  }

  // MEDIUM: Fastest growing capability
  const growthInsights = insights.filter((i) => i.type === 'growth');
  if (growthInsights.length > 0) {
    let bestGrowth = growthInsights[0];
    let maxChange = 0;
    for (const insight of growthInsights) {
      const match = insight.title.match(/增长 (\d+) 分/);
      if (match) {
        const change = parseInt(match[1], 10);
        if (change > maxChange) {
          maxChange = change;
          bestGrowth = insight;
        }
      }
    }
    const capability = capabilities.find((c) => matchCapabilityInText(bestGrowth.title, c));
    if (capability) {
      recommendations.push({
        id: `rec-growth-${capability.id}`,
        actionId: 'record_experience',
        actionParams: { capabilityId: capability.id },
        icon: '🚀',
        title: `继续保持「${capability.name}」的增长势头`,
        action: '该能力本月增长显著，继续投入时间实践',
        priority: 'medium',
        relatedCapability: capability.id,
        sourceRule: 'growth',
        status: 'pending',
        statusUpdatedAt: currentISO,
      });
    }
  }

  // MEDIUM: Experience gap → fill it
  const gapInsights = insights.filter((i) => i.type === 'gap');
  if (gapInsights.length > 0) {
    const gapCap = capabilities.find((c) => matchCapabilityInText(gapInsights[0].title, c));
    if (gapCap) {
      recommendations.push({
        id: `rec-gap-${gapCap.id}`,
        actionId: 'record_experience',
        actionParams: { capabilityId: gapCap.id },
        icon: '🏗️',
        title: `为「${gapCap.name}」补充实践经历`,
        action: '该能力还没有任何实践经验，从第一小步开始',
        priority: 'medium',
        relatedCapability: gapCap.id,
        sourceRule: 'gap',
        status: 'pending',
        statusUpdatedAt: currentISO,
      });
    }
  }

  // MEDIUM: New project with no experiences
  const projectsWithNoExperiences = projects.filter((p) => {
    const projectExps = _experiences.filter((exp) => exp.projectId === p.id);
    return projectExps.length === 0;
  });
  for (const project of projectsWithNoExperiences.slice(0, 1)) {
    recommendations.push({
      id: `rec-project-new-${project.id}`,
      actionId: 'record_experience',
      actionParams: { projectId: project.id },
      icon: '🏁',
      title: `开始记录「${project.name}」的相关经历`,
      action: '该项目还没有相关经历记录，从第一次实践开始吧',
      priority: 'medium',
      relatedProjectId: project.id,
      sourceRule: 'project',
      status: 'pending',
      statusUpdatedAt: currentISO,
    });
  }

  // LOW: Unused principles
  const unusedPrinciples = principles.filter((p) => p.usageCount === 0);
  if (unusedPrinciples.length > 0) {
    const principle = unusedPrinciples[0];
    recommendations.push({
      id: `rec-principle-${principle.id}`,
      actionId: 'apply_principle',
      icon: '💡',
      title: `尝试运用「${principle.content}」`,
      action: '这条原则还没有被实践过，试试在工作中应用它',
      priority: 'low',
      sourceRule: 'pattern',
      status: 'pending',
      statusUpdatedAt: currentISO,
    });
  }

  // LOW: Default
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-default',
      actionId: 'record_experience',
      icon: '✏️',
      title: '记录新经历，开始你的成长之旅',
      action: '每一次经历都是成长的机会',
      priority: 'low',
      sourceRule: 'fallback',
      status: 'pending',
      statusUpdatedAt: currentISO,
    });
  }

  return deduplicateRecommendations(recommendations);
}

// ─── Deduplicate recommendations ─────────────────────────────────

export function deduplicateRecommendations(
  recommendations: Recommendation[],
): Recommendation[] {
  const dedupMap = new Map<string, Recommendation>();

  for (const rec of recommendations) {
    const key = `${rec.actionId}:${JSON.stringify(rec.actionParams ?? {})}`;
    const existing = dedupMap.get(key);

    if (!existing) {
      dedupMap.set(key, rec);
    } else {
      // Keep higher priority; merge evidence
      if (PRIORITY_ORDER[rec.priority] < PRIORITY_ORDER[existing.priority]) {
        // Current rec has higher priority → use it as primary, push existing to evidence
        rec.evidence = [
          ...(existing.evidence ?? []),
          `${existing.title}（${existing.sourceRule}）`,
        ];
        dedupMap.set(key, rec);
      } else {
        // Existing has higher or equal priority → push current to evidence
        existing.evidence = [
          ...(existing.evidence ?? []),
          `${rec.title}（${rec.sourceRule}）`,
        ];
      }
    }
  }

  return Array.from(dedupMap.values());
}

// ─── Summary generation (enhanced V2) ────────────────────────────

export function generateSummary(
  insights: Insight[],
  completionRate?: { completedThisWeek: number; totalThisWeek: number },
): CoachSummary {
  if (insights.length === 0) {
    return {
      headline: '记录第一条经历，开始你的成长之旅',
      highlights: [],
      concerns: [],
      nextAction: '创建第一条经历',
      ...(completionRate ? { completionRate } : {}),
    };
  }

  // Headline: 综合最重要的一条 insight
  const importantStale = insights.find((i) => i.type === 'stale' && i.severity === 'important');
  const noticeGrowth = insights.find((i) => i.type === 'growth' && i.severity === 'notice');
  const importantTrend = insights.find((i) => i.type === 'trend' && i.severity === 'important');

  let headline = '';
  if (importantStale) {
    headline = importantStale.title;
  } else if (importantTrend) {
    headline = importantTrend.title;
  } else if (noticeGrowth) {
    headline = noticeGrowth.title;
  } else {
    headline = insights[0].title;
  }

  // Highlights: 正面信号
  const highlights: string[] = [];
  for (const insight of insights) {
    if (insight.type === 'growth' && insight.severity !== 'important') {
      highlights.push(insight.title);
    }
    if (insight.type === 'retrospective' && insight.severity === 'info') {
      highlights.push(insight.title);
    }
    if (insight.type === 'trend' && insight.severity === 'info') {
      highlights.push(insight.title);
    }
  }

  // Concerns: 负面/需关注信号
  const concerns: string[] = [];
  for (const insight of insights) {
    if (insight.type === 'stale' && insight.severity !== 'info') {
      concerns.push(insight.title);
    }
    if (insight.type === 'gap') {
      concerns.push(insight.title);
    }
    if (insight.type === 'project' && insight.severity === 'important') {
      concerns.push(insight.title);
    }
    if (insight.type === 'trend' && insight.severity === 'important') {
      concerns.push(insight.title);
    }
  }

  // NextAction: 取第一优先级
  let nextAction = '';
  if (importantStale) {
    nextAction = `建议为相关能力补充新的实践经历`;
  } else if (concerns.length > 0) {
    nextAction = `关注 ${concerns.length} 个需要改进的方面`;
  } else if (highlights.length > 0) {
    nextAction = `继续保持当前的增长势头`;
  } else {
    nextAction = '记录新经历，持续成长';
  }

  return { headline, highlights, concerns, nextAction, ...(completionRate ? { completionRate } : {}) };
}
