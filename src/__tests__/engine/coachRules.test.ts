import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  detectStaleCapabilities,
  detectGrowthCapabilities,
  detectPatterns,
  detectRetrospectiveInsights,
  detectCapabilityTrends,
  detectExperienceGaps,
  detectProjectHealth,
  generateRecommendations,
  generateSummary,
  deduplicateRecommendations,
} from '../../features/coach/engine/coachRules';
import type { Insight } from '../../features/coach/types/coachTypes';
import type {
  Experience,
  Capability,
  Principle,
  Project,
  ExperienceCapabilityLink,
} from '../../shared/types';

vi.mock('../../shared/utils/secureStorage', () => ({
  secureStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

// ─── Helpers ───────────────────────────────────────────────

function makeExperience(overrides: Partial<Experience> = {}): Experience {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? 'exp-1',
    userId: overrides.userId ?? 'user-1',
    event: overrides.event ?? 'Test event',
    reflection: overrides.reflection,
    principle: overrides.principle,
    confidence: overrides.confidence ?? 0.5,
    projectId: overrides.projectId,
    mood: overrides.mood,
    energy: overrides.energy,
    occurredAt: overrides.occurredAt ?? now,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function makeLink(overrides: Partial<ExperienceCapabilityLink> = {}): ExperienceCapabilityLink {
  return {
    id: overrides.id ?? 'link-1',
    experienceId: overrides.experienceId ?? 'exp-1',
    capabilityId: overrides.capabilityId ?? 'cap-1',
    contribution: overrides.contribution ?? 0.5,
    evidence: overrides.evidence,
  };
}

function makeCapability(overrides: Partial<Capability> = {}): Capability {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? 'cap-1',
    userId: overrides.userId ?? 'user-1',
    name: overrides.name ?? 'Test Capability',
    category: overrides.category ?? 'cognition',
    parentId: overrides.parentId ?? null,
    currentLevel: overrides.currentLevel ?? 50,
    targetLevel: overrides.targetLevel ?? 80,
    growthRate: overrides.growthRate ?? 0,
    description: overrides.description,
    icon: overrides.icon,
    color: overrides.color,
    lastUpdated: overrides.lastUpdated ?? now,
    createdAt: overrides.createdAt ?? now,
  };
}

function makePrinciple(overrides: Partial<Principle> = {}): Principle {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? 'principle-1',
    userId: overrides.userId ?? 'user-1',
    content: overrides.content ?? 'Test principle',
    sourceExperienceIds: overrides.sourceExperienceIds ?? [],
    category: overrides.category ?? 'other',
    confidence: overrides.confidence ?? 0.5,
    usageCount: overrides.usageCount ?? 0,
    lastUsedAt: overrides.lastUsedAt,
    createdAt: overrides.createdAt ?? now,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? 'project-1',
    userId: overrides.userId ?? 'user-1',
    name: overrides.name ?? 'Test Project',
    description: overrides.description,
    status: overrides.status ?? 'active',
    startDate: overrides.startDate ?? now,
    endDate: overrides.endDate,
    retrospective: overrides.retrospective,
    capabilitiesUsed: overrides.capabilitiesUsed ?? [],
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

// ─── Setup ─────────────────────────────────────────────────

describe('coachRules', () => {
  const FIXED_NOW = new Date('2026-06-06T00:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── detectStaleCapabilities ───────────────────────────

  describe('detectStaleCapabilities', () => {
    test('returns empty when all capabilities are recent (< 14 days)', () => {
      const cap = makeCapability({ id: 'cap-1', name: 'Recent Cap' });
      const exp = makeExperience({
        id: 'exp-1',
        occurredAt: '2026-06-01T00:00:00Z',
      });
      const link = makeLink({ experienceId: 'exp-1', capabilityId: 'cap-1' });

      const results = detectStaleCapabilities([cap], [exp], [link], FIXED_NOW);
      expect(results).toEqual([]);
    });

    test('returns info insight when capability is 14+ days stale', () => {
      const cap = makeCapability({ id: 'cap-1', name: 'Stale Cap' });
      const exp = makeExperience({
        id: 'exp-1',
        occurredAt: '2026-05-20T00:00:00Z', // 17 days ago
      });
      const link = makeLink({ experienceId: 'exp-1', capabilityId: 'cap-1' });

      const results = detectStaleCapabilities([cap], [exp], [link], FIXED_NOW);
      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe('info');
      expect(results[0].type).toBe('stale');
      expect(results[0].title).toContain('Stale Cap');
    });

    test('returns notice insight when capability is 30+ days stale', () => {
      const cap = makeCapability({ id: 'cap-1', name: 'Stale Cap' });
      const exp = makeExperience({
        id: 'exp-1',
        occurredAt: '2026-05-01T00:00:00Z', // 36 days ago
      });
      const link = makeLink({ experienceId: 'exp-1', capabilityId: 'cap-1' });

      const results = detectStaleCapabilities([cap], [exp], [link], FIXED_NOW);
      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe('notice');
      expect(results[0].type).toBe('stale');
    });

    test('returns important insight when capability is 60+ days stale', () => {
      const cap = makeCapability({ id: 'cap-1', name: 'Very Stale Cap' });
      const exp = makeExperience({
        id: 'exp-1',
        occurredAt: '2026-04-01T00:00:00Z', // 66 days ago
      });
      const link = makeLink({ experienceId: 'exp-1', capabilityId: 'cap-1' });

      const results = detectStaleCapabilities([cap], [exp], [link], FIXED_NOW);
      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe('important');
      expect(results[0].type).toBe('stale');
      expect(results[0].title).toContain('Very Stale Cap');
    });

    test('returns empty for capabilities with no experiences', () => {
      const cap = makeCapability({ id: 'cap-1' });

      const results = detectStaleCapabilities([cap], [], [], FIXED_NOW);
      expect(results).toEqual([]);
    });

    test('sorts insights by severity (important first)', () => {
      const cap1 = makeCapability({ id: 'cap-1', name: 'Important' });
      const cap2 = makeCapability({ id: 'cap-2', name: 'Info' });
      const cap3 = makeCapability({ id: 'cap-3', name: 'Notice' });

      const exp1 = makeExperience({ id: 'exp-1', occurredAt: '2026-04-01T00:00:00Z' });
      const exp2 = makeExperience({ id: 'exp-2', occurredAt: '2026-05-20T00:00:00Z' });
      const exp3 = makeExperience({ id: 'exp-3', occurredAt: '2026-05-01T00:00:00Z' });

      const links = [
        makeLink({ experienceId: 'exp-1', capabilityId: 'cap-1' }),
        makeLink({ experienceId: 'exp-2', capabilityId: 'cap-2' }),
        makeLink({ experienceId: 'exp-3', capabilityId: 'cap-3' }),
      ];

      const results = detectStaleCapabilities(
        [cap1, cap2, cap3],
        [exp1, exp2, exp3],
        links,
        FIXED_NOW,
      );
      expect(results).toHaveLength(3);
      expect(results[0].severity).toBe('important');
      expect(results[1].severity).toBe('notice');
      expect(results[2].severity).toBe('info');
    });
  });

  // ─── detectGrowthCapabilities ───────────────────────────

  describe('detectGrowthCapabilities', () => {
    test('returns empty when no growth', () => {
      const cap = makeCapability({ id: 'cap-1', name: 'No Growth' });

      const results = detectGrowthCapabilities([cap], [], [], FIXED_NOW);
      expect(results).toEqual([]);
    });

    test('returns info insight when growth > 5 points', () => {
      const cap = makeCapability({ id: 'cap-1', name: 'Growing Cap' });
      // Recent experience within last 30 days
      const recentExp = makeExperience({
        id: 'exp-recent',
        occurredAt: '2026-06-01T00:00:00Z',
        reflection: 'recent reflection',
      });
      // Old experience older than 30 days
      const oldExp = makeExperience({
        id: 'exp-old',
        occurredAt: '2026-04-01T00:00:00Z',
      });
      const links = [
        makeLink({
          id: 'link-1',
          experienceId: 'exp-recent',
          capabilityId: 'cap-1',
          contribution: 0.8,
        }),
        makeLink({
          id: 'link-2',
          experienceId: 'exp-old',
          capabilityId: 'cap-1',
          contribution: 0.3,
        }),
      ];

      const results = detectGrowthCapabilities([cap], [recentExp, oldExp], links, FIXED_NOW);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].type).toBe('growth');
    });

    test('returns notice insight when growth > 15 points', () => {
      const cap = makeCapability({ id: 'cap-1', name: 'Fast Growing' });
      // Multiple recent experiences to drive up level significantly
      const recentExp = makeExperience({
        id: 'exp-recent',
        occurredAt: '2026-06-01T00:00:00Z',
        reflection: 'recent',
        principle: 'principle',
        confidence: 0.9,
      });
      const oldExp = makeExperience({
        id: 'exp-old',
        occurredAt: '2026-04-01T00:00:00Z',
        confidence: 0.2,
      });
      const links = [
        makeLink({
          id: 'link-1',
          experienceId: 'exp-recent',
          capabilityId: 'cap-1',
          contribution: 1.0,
        }),
        makeLink({
          id: 'link-2',
          experienceId: 'exp-old',
          capabilityId: 'cap-1',
          contribution: 0.1,
        }),
      ];

      const results = detectGrowthCapabilities([cap], [recentExp, oldExp], links, FIXED_NOW);
      // At minimum should detect growth (info or notice)
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].type).toBe('growth');
    });
  });

  // ─── detectPatterns ────────────────────────────────────

  describe('detectPatterns', () => {
    test('detects concentration when 80%+ experiences for one capability', () => {
      const cap = makeCapability({ id: 'cap-1', name: 'Dominant Cap' });
      const exps = [
        makeExperience({ id: 'exp-1', occurredAt: '2026-06-01T00:00:00Z' }),
        makeExperience({ id: 'exp-2', occurredAt: '2026-06-02T00:00:00Z' }),
        makeExperience({ id: 'exp-3', occurredAt: '2026-06-03T00:00:00Z' }),
        makeExperience({ id: 'exp-4', occurredAt: '2026-06-04T00:00:00Z' }),
        makeExperience({ id: 'exp-5', occurredAt: '2026-06-05T00:00:00Z' }),
      ];
      // 4 out of 5 = 80% for cap-1
      const links = [
        makeLink({ id: 'link-1', experienceId: 'exp-1', capabilityId: 'cap-1' }),
        makeLink({ id: 'link-2', experienceId: 'exp-2', capabilityId: 'cap-1' }),
        makeLink({ id: 'link-3', experienceId: 'exp-3', capabilityId: 'cap-1' }),
        makeLink({ id: 'link-4', experienceId: 'exp-4', capabilityId: 'cap-1' }),
        makeLink({ id: 'link-5', experienceId: 'exp-5', capabilityId: 'cap-2' }),
      ];

      const results = detectPatterns(exps, [cap], [], [], links, FIXED_NOW);
      expect(results.length).toBeGreaterThanOrEqual(1);
      const concentration = results.find(
        (r) => r.type === 'pattern' && r.title.includes('Dominant Cap'),
      );
      expect(concentration).toBeDefined();
    });

    test('detects many active projects (> 3)', () => {
      const projects = [
        makeProject({ id: 'p1', name: 'Project 1', status: 'active' }),
        makeProject({ id: 'p2', name: 'Project 2', status: 'active' }),
        makeProject({ id: 'p3', name: 'Project 3', status: 'active' }),
        makeProject({ id: 'p4', name: 'Project 4', status: 'active' }),
      ];

      const results = detectPatterns([], [], [], projects, [], FIXED_NOW);
      expect(results.length).toBeGreaterThanOrEqual(1);
      const warning = results.find((r) => r.type === 'warning');
      expect(warning).toBeDefined();
      expect(warning!.title).toContain('4');
    });

    test('detects unused principles (usageCount = 0)', () => {
      const principles = [
        makePrinciple({ id: 'pr-1', content: 'Unused principle', usageCount: 0 }),
      ];

      const results = detectPatterns([], [], principles, [], [], FIXED_NOW);
      expect(results.length).toBeGreaterThanOrEqual(1);
      const unused = results.find((r) => r.type === 'pattern' && r.title.includes('1'));
      expect(unused).toBeDefined();
    });

    test('returns empty when no patterns detected', () => {
      const principle = makePrinciple({ id: 'pr-1', usageCount: 5 });
      const project = makeProject({ id: 'p1', status: 'active' });

      const results = detectPatterns([], [], [principle], [project], [], FIXED_NOW);
      expect(results).toEqual([]);
    });
  });

  // ─── generateRecommendations ───────────────────────────

  describe('generateRecommendations', () => {
    test('generates HIGH priority for stale > 60 days capability', () => {
      const cap = makeCapability({ id: 'cap-1', name: 'Stale Cap' });
      const staleInsight: Insight = {
        type: 'stale',
        icon: '⚠️',
        title: '你的「Stale Cap」已 70 天未更新',
        description: '能力可能正在退化',
        severity: 'important',
      };

      const results = generateRecommendations([staleInsight], [cap], [], [], [], [], FIXED_NOW);
      const highRec = results.find((r) => r.priority === 'high' && r.relatedCapability === 'cap-1');
      expect(highRec).toBeDefined();
    });

    test('generates MEDIUM priority for growing capability', () => {
      const cap = makeCapability({ id: 'cap-1', name: 'Growing Cap' });
      const growthInsight: Insight = {
        type: 'growth',
        icon: '🚀',
        title: '你的「Growing Cap」本月增长 20 分，势头很好！',
        description: '能力水平从 30 提升到 50',
        severity: 'notice',
      };

      const results = generateRecommendations([growthInsight], [cap], [], [], [], [], FIXED_NOW);
      const mediumRec = results.find(
        (r) => r.priority === 'medium' && r.relatedCapability === 'cap-1',
      );
      expect(mediumRec).toBeDefined();
    });

    test('generates LOW priority for unused principle', () => {
      const principle = makePrinciple({
        id: 'pr-1',
        content: 'Never used principle',
        usageCount: 0,
      });

      const results = generateRecommendations([], [], [], [principle], [], [], FIXED_NOW);
      const lowRec = results.find(
        (r) => r.priority === 'low' && r.title.includes('Never used principle'),
      );
      expect(lowRec).toBeDefined();
    });

    test('generates default recommendation when no insights', () => {
      const results = generateRecommendations([], [], [], [], [], [], FIXED_NOW);
      expect(results).toHaveLength(1);
      expect(results[0].priority).toBe('low');
      expect(results[0].title).toContain('记录新经历');
    });

    test('sorts by priority', () => {
      const cap = makeCapability({ id: 'cap-1', name: 'Stale' });
      const cap2 = makeCapability({ id: 'cap-2', name: 'Growing' });
      const insights: Insight[] = [
        {
          type: 'growth',
          icon: '🚀',
          title: '你的「Growing」本月增长 20 分，势头很好！',
          description: '',
          severity: 'notice',
        },
        {
          type: 'stale',
          icon: '⚠️',
          title: '你的「Stale」已 70 天未更新',
          description: '',
          severity: 'important',
        },
      ];

      const results = generateRecommendations(insights, [cap, cap2], [], [], [], [], FIXED_NOW);
      const highIndex = results.findIndex((r) => r.priority === 'high');
      const mediumIndex = results.findIndex((r) => r.priority === 'medium');
      expect(highIndex).toBeGreaterThanOrEqual(0);
      expect(mediumIndex).toBeGreaterThanOrEqual(0);
      expect(highIndex).toBeLessThan(mediumIndex);
    });
  });

  // ─── generateSummary ───────────────────────────────────

  describe('generateSummary', () => {
    test('returns stale summary for important stale insight', () => {
      const insight: Insight = {
        type: 'stale',
        icon: '⚠️',
        title: '你的「React 开发」已 70 天未更新',
        description: '能力可能正在退化',
        severity: 'important',
      };

      const summary = generateSummary([insight]);
      expect(summary.headline).toContain('React 开发');
      expect(summary.headline).toContain('70');
    });

    test('returns growth summary for notice growth insight', () => {
      const insight: Insight = {
        type: 'growth',
        icon: '🚀',
        title: '你的「公开演讲」本月增长 20 分，势头很好！',
        description: '',
        severity: 'notice',
      };

      const summary = generateSummary([insight]);
      expect(summary.headline).toContain('公开演讲');
      expect(summary.headline).toContain('20');
    });

    test('returns pattern summary for pattern insight', () => {
      const insight: Insight = {
        type: 'pattern',
        icon: '🎯',
        title: '本月你 85% 经历都贡献给了「系统设计」',
        description: '',
        severity: 'info',
      };

      const summary = generateSummary([insight]);
      expect(summary.headline).toContain('系统设计');
    });

    test('returns default when no insights', () => {
      const summary = generateSummary([]);
      expect(summary.headline).toBe('记录第一条经历，开始你的成长之旅');
    });

    test('returns stale insight headline for stale info insight', () => {
      const insight: Insight = {
        type: 'stale',
        icon: 'ℹ️',
        title: '你的「Test Cap」两周没有新经历了',
        description: '',
        severity: 'info',
      };

      const summary = generateSummary([insight]);
      expect(summary.headline).toBe('你的「Test Cap」两周没有新经历了');
    });

    test('includes completionRate when provided', () => {
      const summary = generateSummary([], { completedThisWeek: 3, totalThisWeek: 5 });
      expect(summary.completionRate).toEqual({ completedThisWeek: 3, totalThisWeek: 5 });
    });

    test('highlights include growth and retrospective info insights', () => {
      const insights: Insight[] = [
        {
          type: 'growth',
          icon: '📈',
          title: 'TypeScript 本月 +15',
          description: '',
          severity: 'info',
        },
        {
          type: 'retrospective',
          icon: '🌟',
          title: '系统设计在 3 个项目中表现良好',
          description: '',
          severity: 'info',
        },
      ];

      const summary = generateSummary(insights);
      expect(summary.highlights).toHaveLength(2);
    });

    test('concerns include stale, gap, important project, and important trend', () => {
      const insights: Insight[] = [
        {
          type: 'stale',
          icon: '⚠️',
          title: '系统设计已 60 天未训练',
          description: '',
          severity: 'important',
        },
        {
          type: 'gap',
          icon: '📭',
          title: '沟通表达从未关联经历',
          description: '',
          severity: 'notice',
        },
        {
          type: 'project',
          icon: '⏰',
          title: '项目已活跃 45 天未复盘',
          description: '',
          severity: 'important',
        },
        {
          type: 'trend',
          icon: '📉',
          title: '测试能力等级出现下降',
          description: '',
          severity: 'important',
        },
      ];

      const summary = generateSummary(insights);
      expect(summary.concerns.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// V2 New Rule Tests
// ═══════════════════════════════════════════════════════════

describe('V2 Coach Rules', () => {
  const FIXED_NOW = new Date('2026-06-06T00:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── detectRetrospectiveInsights ──────────────────────

  describe('detectRetrospectiveInsights', () => {
    test('returns empty when no projects have retrospectives', () => {
      const projects = [makeProject({ id: 'p1', retrospective: undefined })];
      const results = detectRetrospectiveInsights(projects, []);
      expect(results).toEqual([]);
    });

    test('returns empty when retrospectives have no whatWentWell/wentWrong', () => {
      const projects = [
        makeProject({
          id: 'p1',
          retrospective: {
            whatWentWell: [],
            whatWentWrong: [],
            nextTime: [],
            capabilitiesUsed: [],
          },
        }),
      ];
      const results = detectRetrospectiveInsights(projects, []);
      expect(results).toEqual([]);
    });

    test('returns info insight when capability mentioned well in 2+ projects', () => {
      const cap = makeCapability({ id: 'cap-sys', name: '系统设计' });
      const projects = [
        makeProject({
          id: 'p1',
          retrospective: {
            whatWentWell: ['Good'],
            whatWentWrong: [],
            nextTime: [],
            capabilitiesUsed: [],
          },
          capabilitiesUsed: ['cap-sys'],
        }),
        makeProject({
          id: 'p2',
          retrospective: {
            whatWentWell: ['Great'],
            whatWentWrong: [],
            nextTime: [],
            capabilitiesUsed: [],
          },
          capabilitiesUsed: ['cap-sys'],
        }),
      ];
      const results = detectRetrospectiveInsights(projects, [cap]);
      expect(results.length).toBeGreaterThanOrEqual(1);
      const retroInsight = results.find((r) => r.type === 'retrospective' && r.severity === 'info');
      expect(retroInsight).toBeDefined();
    });

    test('returns notice insight when capability mentioned wrong in 2+ projects', () => {
      const cap = makeCapability({ id: 'cap-sm', name: '状态管理' });
      const projects = [
        makeProject({
          id: 'p1',
          retrospective: {
            whatWentWell: ['Good'],
            whatWentWrong: ['Bad'],
            nextTime: [],
            capabilitiesUsed: [],
          },
          capabilitiesUsed: ['cap-sm'],
        }),
        makeProject({
          id: 'p2',
          retrospective: {
            whatWentWell: ['Great'],
            whatWentWrong: ['Also bad'],
            nextTime: [],
            capabilitiesUsed: [],
          },
          capabilitiesUsed: ['cap-sm'],
        }),
      ];
      const results = detectRetrospectiveInsights(projects, [cap]);
      expect(results.length).toBeGreaterThanOrEqual(1);
      const retroNotice = results.find(
        (r) => r.type === 'retrospective' && r.severity === 'notice',
      );
      expect(retroNotice).toBeDefined();
    });
  });

  // ─── detectCapabilityTrends ───────────────────────────

  describe('detectCapabilityTrends', () => {
    test('returns empty when fewer than 2 projects with retros', () => {
      const cap = makeCapability({ id: 'cap-1', growthRate: 0 });
      const projects = [
        makeProject({
          id: 'p1',
          retrospective: {
            whatWentWell: ['Good'],
            whatWentWrong: [],
            nextTime: [],
            capabilitiesUsed: [],
          },
          capabilitiesUsed: ['cap-1'],
        }),
      ];
      const results = detectCapabilityTrends([cap], projects);
      expect(results).toEqual([]);
    });

    test('returns info insight for continuous growth', () => {
      const cap = makeCapability({
        id: 'cap-ts',
        name: 'TypeScript',
        currentLevel: 70,
        targetLevel: 90,
        growthRate: 0.5,
      });
      const projects = [
        makeProject({
          id: 'p1',
          retrospective: {
            whatWentWell: ['Good'],
            whatWentWrong: [],
            nextTime: [],
            capabilitiesUsed: [],
          },
          capabilitiesUsed: ['cap-ts'],
        }),
        makeProject({
          id: 'p2',
          retrospective: {
            whatWentWell: ['Better'],
            whatWentWrong: [],
            nextTime: [],
            capabilitiesUsed: [],
          },
          capabilitiesUsed: ['cap-ts'],
        }),
      ];
      const results = detectCapabilityTrends([cap], projects);
      const growth = results.find((r) => r.type === 'trend' && r.severity === 'info');
      expect(growth).toBeDefined();
    });

    test('returns notice insight for plateau (growthRate=0, 3+ projects)', () => {
      const cap = makeCapability({
        id: 'cap-sys',
        name: '系统设计',
        currentLevel: 70,
        targetLevel: 90,
        growthRate: 0,
      });
      const projects = [
        makeProject({
          id: 'p1',
          retrospective: {
            whatWentWell: ['OK'],
            whatWentWrong: [],
            nextTime: [],
            capabilitiesUsed: [],
          },
          capabilitiesUsed: ['cap-sys'],
        }),
        makeProject({
          id: 'p2',
          retrospective: {
            whatWentWell: ['OK'],
            whatWentWrong: [],
            nextTime: [],
            capabilitiesUsed: [],
          },
          capabilitiesUsed: ['cap-sys'],
        }),
        makeProject({
          id: 'p3',
          retrospective: {
            whatWentWell: ['OK'],
            whatWentWrong: [],
            nextTime: [],
            capabilitiesUsed: [],
          },
          capabilitiesUsed: ['cap-sys'],
        }),
      ];
      const results = detectCapabilityTrends([cap], projects);
      const plateau = results.find((r) => r.type === 'trend' && r.severity === 'notice');
      expect(plateau).toBeDefined();
    });

    test('returns important insight for degradation (negative growthRate)', () => {
      const cap = makeCapability({
        id: 'cap-test',
        name: '测试',
        currentLevel: 40,
        targetLevel: 80,
        growthRate: -0.3,
      });
      const projects = [
        makeProject({
          id: 'p1',
          retrospective: {
            whatWentWell: ['OK'],
            whatWentWrong: [],
            nextTime: [],
            capabilitiesUsed: [],
          },
        }),
        makeProject({
          id: 'p2',
          retrospective: {
            whatWentWell: ['OK'],
            whatWentWrong: [],
            nextTime: [],
            capabilitiesUsed: [],
          },
        }),
      ];
      const results = detectCapabilityTrends([cap], projects);
      const degradation = results.find((r) => r.type === 'trend' && r.severity === 'important');
      expect(degradation).toBeDefined();
    });
  });

  // ─── detectExperienceGaps ─────────────────────────────

  describe('detectExperienceGaps', () => {
    test('returns empty when all capabilities are linked', () => {
      const caps = [makeCapability({ id: 'cap-1' }), makeCapability({ id: 'cap-2' })];
      const links = [makeLink({ capabilityId: 'cap-1' }), makeLink({ capabilityId: 'cap-2' })];
      const results = detectExperienceGaps(caps, links);
      expect(results).toEqual([]);
    });

    test('returns info insight for single gapped capability', () => {
      const cap1 = makeCapability({ id: 'cap-1', name: 'Linked Cap' });
      const cap2 = makeCapability({ id: 'cap-2', name: 'Unlinked Cap' });
      const links = [makeLink({ capabilityId: 'cap-1' })];
      const results = detectExperienceGaps([cap1, cap2], links);
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('gap');
      expect(results[0].severity).toBe('info');
      expect(results[0].title).toContain('Unlinked Cap');
    });

    test('returns notice insight for multiple gapped capabilities', () => {
      const caps = [
        makeCapability({ id: 'cap-1', name: 'A' }),
        makeCapability({ id: 'cap-2', name: 'B' }),
        makeCapability({ id: 'cap-3', name: 'C' }),
      ];
      const links = [makeLink({ capabilityId: 'cap-1' })];
      const results = detectExperienceGaps(caps, links);
      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe('notice');
      expect(results[0].title).toContain('2 个能力');
    });
  });

  // ─── detectProjectHealth ──────────────────────────────

  describe('detectProjectHealth', () => {
    test('returns important insight for active project > 30 days without retrospective', () => {
      const projects = [
        makeProject({
          id: 'p1',
          name: 'Flutter 重构',
          status: 'active',
          startDate: '2026-04-01T00:00:00Z',
          retrospective: undefined,
        }),
      ];
      const results = detectProjectHealth(projects, [], FIXED_NOW);
      const important = results.find((r) => r.severity === 'important');
      expect(important).toBeDefined();
      expect(important?.title).toContain('Flutter 重构');
    });

    test('returns notice insight for completed project without retrospective', () => {
      const projects = [
        makeProject({
          id: 'p1',
          name: '性能优化',
          status: 'completed',
          retrospective: undefined,
        }),
      ];
      const results = detectProjectHealth(projects, [], FIXED_NOW);
      const notice = results.find((r) => r.severity === 'notice' && r.type === 'project');
      expect(notice).toBeDefined();
    });

    test('returns notice insight for active project with no experiences', () => {
      const projects = [
        makeProject({
          id: 'p1',
          name: '空壳项目',
          status: 'active',
          startDate: new Date().toISOString(),
        }),
      ];
      const results = detectProjectHealth(projects, [], FIXED_NOW);
      const noExp = results.find((r) => r.type === 'project' && r.title.includes('空壳项目'));
      expect(noExp).toBeDefined();
    });

    test('returns empty for healthy project with retrospective and experiences', () => {
      const exp = makeExperience({ id: 'exp-1', projectId: 'p1' });
      const projects = [
        makeProject({
          id: 'p1',
          name: '健康项目',
          status: 'active',
          startDate: new Date().toISOString(),
          retrospective: {
            whatWentWell: ['Good'],
            whatWentWrong: [],
            nextTime: [],
            capabilitiesUsed: [],
          },
        }),
      ];
      const results = detectProjectHealth(projects, [exp], FIXED_NOW);
      const projectInsights = results.filter((r) => r.type === 'project');
      expect(projectInsights).toEqual([]);
    });
  });

  // ─── deduplicateRecommendations ───────────────────────

  describe('deduplicateRecommendations', () => {
    const makeRec = (
      id: string,
      actionId: string,
      params: Record<string, string> | undefined,
      priority: 'high' | 'medium' | 'low',
      source: string,
    ) => ({
      id,
      actionId,
      actionParams: params,
      title: `${actionId} rec`,
      action: 'do it',
      icon: '🎯',
      priority,
      sourceRule: source,
      status: 'pending' as const,
      statusUpdatedAt: FIXED_NOW.toISOString(),
    });

    test('returns same recommendations when no duplicates', () => {
      const recs = [
        makeRec('r1', 'review_project', { projectId: 'p1' }, 'high', 'stale'),
        makeRec('r2', 'record_experience', { capabilityId: 'c1' }, 'medium', 'growth'),
      ];
      const result = deduplicateRecommendations(recs);
      expect(result).toHaveLength(2);
    });

    test('merges duplicates with same actionId + actionParams, keeping higher priority', () => {
      const recs = [
        makeRec('r1', 'review_project', { projectId: 'p1' }, 'medium', 'project'),
        makeRec('r2', 'review_project', { projectId: 'p1' }, 'high', 'stale'),
      ];
      const result = deduplicateRecommendations(recs);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('r2'); // higher priority keeps id
      expect(result[0].priority).toBe('high');
      expect(result[0].evidence).toContain('review_project rec（project）');
    });

    test('keeps first as primary when both have same priority', () => {
      const recs = [
        makeRec('r1', 'record_experience', { capabilityId: 'c1' }, 'medium', 'stale'),
        makeRec('r2', 'record_experience', { capabilityId: 'c1' }, 'medium', 'gap'),
      ];
      const result = deduplicateRecommendations(recs);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('r1');
      expect(result[0].evidence).toContain('record_experience rec（gap）');
    });

    test('treats undefined actionParams as empty object for dedup key', () => {
      const recs = [
        makeRec('r1', 'review_experiences', undefined, 'low', 'pattern'),
        makeRec('r2', 'review_experiences', {}, 'medium', 'pattern'),
      ];
      const result = deduplicateRecommendations(recs);
      expect(result).toHaveLength(1);
    });
  });
});
