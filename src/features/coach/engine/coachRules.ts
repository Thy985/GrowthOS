import type {
  Experience,
  Capability,
  Principle,
  Project,
  ExperienceCapabilityLink,
} from '../../../shared/types';
import { calculateCapabilityLevel } from '../../capabilities/store/capabilitySlice';
import type { Insight, Recommendation } from '../types/coachTypes';

// Constants
const STALE_DAYS_INFO = 14;
const STALE_DAYS_NOTICE = 30;
const STALE_DAYS_IMPORTANT = 60;
const GROWTH_INFO = 5;
const GROWTH_NOTICE = 15;
const CONCENTRATION_THRESHOLD = 0.8;
const MANY_PROJECTS_THRESHOLD = 3;

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

// Rule 1: Detect stale capabilities
export function detectStaleCapabilities(
  capabilities: Capability[],
  experiences: Experience[],
  links: ExperienceCapabilityLink[],
  now?: Date,
): Insight[] {
  const currentDate = now || new Date();
  const insights: Insight[] = [];

  // Build a map for O(1) experience lookup
  const expMap = new Map<string, Experience>();
  for (const exp of experiences) {
    expMap.set(exp.id, exp);
  }

  for (const capability of capabilities) {
    // Find all links for this capability
    const capLinks = links.filter((link) => link.capabilityId === capability.id);
    if (capLinks.length === 0) continue;

    // Find the most recent experience date
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

// Rule 2: Detect growth capabilities
export function detectGrowthCapabilities(
  capabilities: Capability[],
  experiences: Experience[],
  links: ExperienceCapabilityLink[],
  now?: Date,
): Insight[] {
  const currentDate = now || new Date();
  const insights: Insight[] = [];

  for (const capability of capabilities) {
    // Current level
    const currentLevel = calculateCapabilityLevel(capability.id, experiences, links);

    // Level 30 days ago (only use experiences older than 30 days)
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

// Rule 3: Detect patterns
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

  // Check if 80%+ of last 30 days experiences are for one capability
  const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentExperiences = experiences.filter((exp) => new Date(exp.occurredAt) >= thirtyDaysAgo);

  if (recentExperiences.length > 0) {
    // Count experiences per capability
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

  // Check if active projects > threshold
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

  // Check if principles have usageCount = 0
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

// Rule 4: Generate recommendations
export function generateRecommendations(
  insights: Insight[],
  capabilities: Capability[],
  projects: Project[],
  principles: Principle[],
  experiences: Experience[],
  _links: ExperienceCapabilityLink[],
  now?: Date,
): Recommendation[] {
  const currentDate = now || new Date();
  const recommendations: Recommendation[] = [];

  // HIGH: Stale capability > 60 days → recommend recording experience
  const importantStale = insights.filter((i) => i.type === 'stale' && i.severity === 'important');
  for (const insight of importantStale) {
    const capability = capabilities.find((c) => insight.title.includes(c.name));
    if (capability) {
      recommendations.push({
        icon: '📝',
        title: `记录「${capability.name}」相关经历`,
        action: '该能力已超过 60 天未更新，建议补充新的实践经历',
        priority: 'high',
        relatedCapability: capability.id,
      });
    }
  }

  // HIGH: Active project > 30 days without retrospective → recommend retrospective
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
      icon: '🔄',
      title: `复盘「${project.name}」项目`,
      action: `已活跃 ${daysSince} 天，建议进行一次回顾总结`,
      priority: 'high',
    });
  }

  // MEDIUM: Fastest growing capability → recommend continuing
  const growthInsights = insights.filter((i) => i.type === 'growth');
  if (growthInsights.length > 0) {
    // Find the one with highest change
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
    const capability = capabilities.find((c) => bestGrowth.title.includes(c.name));
    if (capability) {
      recommendations.push({
        icon: '🚀',
        title: `继续保持「${capability.name}」的增长势头`,
        action: '该能力本月增长显著，继续投入时间实践',
        priority: 'medium',
        relatedCapability: capability.id,
      });
    }
  }

  // MEDIUM: New project with no experiences → recommend starting
  const projectsWithNoExperiences = projects.filter((p) => {
    const projectExps = experiences.filter((exp) => exp.projectId === p.id);
    return projectExps.length === 0;
  });
  for (const project of projectsWithNoExperiences.slice(0, 1)) {
    recommendations.push({
      icon: '🏁',
      title: `开始记录「${project.name}」的相关经历`,
      action: '该项目还没有相关经历记录，从第一次实践开始吧',
      priority: 'medium',
    });
  }

  // LOW: Unused principles → recommend applying
  const unusedPrinciples = principles.filter((p) => p.usageCount === 0);
  if (unusedPrinciples.length > 0) {
    const principle = unusedPrinciples[0];
    recommendations.push({
      icon: '💡',
      title: `尝试运用「${principle.content}」`,
      action: '这条原则还没有被实践过，试试在工作中应用它',
      priority: 'low',
    });
  }

  // LOW: Default → record new experience
  if (recommendations.length === 0) {
    recommendations.push({
      icon: '✏️',
      title: '记录新经历，开始你的成长之旅',
      action: '每一次经历都是成长的机会',
      priority: 'low',
    });
  }

  return recommendations;
}

// Summary generation
export function generateSummary(insights: Insight[]): string {
  if (insights.length === 0) {
    return '记录第一条经历，开始你的成长之旅';
  }

  // Priority 1: Important stale
  const importantStale = insights.find((i) => i.type === 'stale' && i.severity === 'important');
  if (importantStale) {
    const match = importantStale.title.match(/你的「(.+?)」已 (\d+) 天未更新/);
    if (match) {
      return `你的「${match[1]}」已 ${match[2]} 天未更新，是时候补充新经历了`;
    }
  }

  // Priority 2: Notice growth
  const noticeGrowth = insights.find((i) => i.type === 'growth' && i.severity === 'notice');
  if (noticeGrowth) {
    const match = noticeGrowth.title.match(/你的「(.+?)」本月增长 (\d+) 分/);
    if (match) {
      return `你的「${match[1]}」本月增长 ${match[2]} 分，继续保持这个势头`;
    }
  }

  // Priority 3: Pattern
  const patternInsight = insights.find((i) => i.type === 'pattern');
  if (patternInsight) {
    const match = patternInsight.title.match(/经历都贡献给了「(.+?)」/);
    if (match) {
      return `本月你的经历主要围绕「${match[1]}」展开`;
    }
  }

  // Default
  return '记录第一条经历，开始你的成长之旅';
}
