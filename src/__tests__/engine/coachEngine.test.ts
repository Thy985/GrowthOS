import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

import { analyze } from '../../features/coach/engine/coachEngine';
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
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

// ─── Tests ────────────────────────────────────────────────

describe('coachEngine analyze', () => {
  const FIXED_NOW = new Date('2026-06-06T00:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns diagnosis with empty data', () => {
    const result = analyze([], [], [], [], [], FIXED_NOW);

    expect(result).toBeDefined();
    expect(result.insights).toEqual([]);
    expect(result.recommendations).toBeDefined();
    expect(result.summary.headline.length).toBeGreaterThan(0);
    expect(result.generatedAt).toBe(FIXED_NOW.toISOString());
  });

  test('returns diagnosis with only experiences', () => {
    const exp = makeExperience({
      id: 'exp-1',
      occurredAt: '2026-06-01T00:00:00Z',
    });

    const result = analyze([exp], [], [], [], [], FIXED_NOW);

    expect(result).toBeDefined();
    expect(result.insights).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.summary.headline.length).toBeGreaterThan(0);
    expect(result.generatedAt).toBe(FIXED_NOW.toISOString());
  });

  test('returns diagnosis with full data', () => {
    const cap = makeCapability({ id: 'cap-1', name: 'Full Data Cap' });
    const exp = makeExperience({
      id: 'exp-1',
      occurredAt: '2026-04-01T00:00:00Z', // stale
    });
    const link = makeLink({ experienceId: 'exp-1', capabilityId: 'cap-1' });
    const principle = makePrinciple({ id: 'pr-1', content: 'Test principle', usageCount: 0 });
    const project = makeProject({ id: 'proj-1', status: 'active' });

    const result = analyze([exp], [cap], [principle], [project], [link], FIXED_NOW);

    expect(result).toBeDefined();
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.summary.headline.length).toBeGreaterThan(0);
    expect(result.generatedAt).toBe(FIXED_NOW.toISOString());
  });

  test('combines multiple rule insights', () => {
    const cap1 = makeCapability({ id: 'cap-1', name: 'Stale Cap' });
    const cap2 = makeCapability({ id: 'cap-2', name: 'Pattern Cap' });
    const staleExp = makeExperience({
      id: 'exp-1',
      occurredAt: '2026-04-01T00:00:00Z',
    });
    const recentExp1 = makeExperience({ id: 'exp-2', occurredAt: '2026-06-01T00:00:00Z' });
    const recentExp2 = makeExperience({ id: 'exp-3', occurredAt: '2026-06-02T00:00:00Z' });
    const recentExp3 = makeExperience({ id: 'exp-4', occurredAt: '2026-06-03T00:00:00Z' });
    const recentExp4 = makeExperience({ id: 'exp-5', occurredAt: '2026-06-04T00:00:00Z' });

    const links = [
      makeLink({ id: 'l1', experienceId: 'exp-1', capabilityId: 'cap-1' }),
      // Pattern: 80% of recent experiences for cap-2
      makeLink({ id: 'l2', experienceId: 'exp-2', capabilityId: 'cap-2' }),
      makeLink({ id: 'l3', experienceId: 'exp-3', capabilityId: 'cap-2' }),
      makeLink({ id: 'l4', experienceId: 'exp-4', capabilityId: 'cap-2' }),
      makeLink({ id: 'l5', experienceId: 'exp-5', capabilityId: 'cap-2' }),
    ];

    const unusedPrinciple = makePrinciple({ id: 'pr-1', content: 'Unused', usageCount: 0 });
    const projects = [
      makeProject({ id: 'p1', status: 'active' }),
      makeProject({ id: 'p2', status: 'active' }),
      makeProject({ id: 'p3', status: 'active' }),
      makeProject({ id: 'p4', status: 'active' }),
    ];

    const result = analyze(
      [staleExp, recentExp1, recentExp2, recentExp3, recentExp4],
      [cap1, cap2],
      [unusedPrinciple],
      projects,
      links,
      FIXED_NOW,
    );

    // Should have stale insight + pattern insights + warning
    expect(result.insights.length).toBeGreaterThanOrEqual(2);
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  test('limits recommendations to 5', () => {
    // Create stale capabilities to generate high-priority recommendations
    const caps = [
      makeCapability({ id: 'cap-1', name: 'Stale 1' }),
      makeCapability({ id: 'cap-2', name: 'Stale 2' }),
      makeCapability({ id: 'cap-3', name: 'Stale 3' }),
      makeCapability({ id: 'cap-4', name: 'Stale 4' }),
      makeCapability({ id: 'cap-5', name: 'Stale 5' }),
      makeCapability({ id: 'cap-6', name: 'Stale 6' }),
    ];
    const exps = [
      makeExperience({ id: 'exp-1', occurredAt: '2026-03-01T00:00:00Z' }),
      makeExperience({ id: 'exp-2', occurredAt: '2026-03-01T00:00:00Z' }),
      makeExperience({ id: 'exp-3', occurredAt: '2026-03-01T00:00:00Z' }),
      makeExperience({ id: 'exp-4', occurredAt: '2026-03-01T00:00:00Z' }),
      makeExperience({ id: 'exp-5', occurredAt: '2026-03-01T00:00:00Z' }),
      makeExperience({ id: 'exp-6', occurredAt: '2026-03-01T00:00:00Z' }),
    ];
    const links = [
      makeLink({ id: 'l1', experienceId: 'exp-1', capabilityId: 'cap-1' }),
      makeLink({ id: 'l2', experienceId: 'exp-2', capabilityId: 'cap-2' }),
      makeLink({ id: 'l3', experienceId: 'exp-3', capabilityId: 'cap-3' }),
      makeLink({ id: 'l4', experienceId: 'exp-4', capabilityId: 'cap-4' }),
      makeLink({ id: 'l5', experienceId: 'exp-5', capabilityId: 'cap-5' }),
      makeLink({ id: 'l6', experienceId: 'exp-6', capabilityId: 'cap-6' }),
    ];

    const result = analyze(exps, caps, [], [], links, FIXED_NOW);

    expect(result.recommendations.length).toBeLessThanOrEqual(5);
  });

  test('generates correct timestamp', () => {
    const result = analyze([], [], [], [], [], FIXED_NOW);
    expect(result.generatedAt).toBe('2026-06-06T00:00:00.000Z');
  });

  test('summary is non-empty', () => {
    const result = analyze([], [], [], [], [], FIXED_NOW);
    expect(result.summary).toBeDefined();
    expect(result.summary.headline.length).toBeGreaterThan(0);
  });
});
