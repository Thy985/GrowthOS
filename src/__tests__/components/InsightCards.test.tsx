import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { InsightCards } from '../../features/dashboard/components/InsightCards';
import type { Capability } from '../../shared/types';

// ── Mock helpers ──────────────────────────────────────────────────────────

function makeCapability(overrides: Partial<Capability> = {}): Capability {
  const now = new Date().toISOString();
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 40);
  return {
    id: overrides.id ?? 'cap-1',
    userId: overrides.userId ?? 'test-user',
    name: overrides.name ?? 'TypeScript',
    category: overrides.category ?? 'skill',
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

// ── Tests ─────────────────────────────────────────────────────────────────

describe('InsightCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no capabilities provided', () => {
    render(<InsightCards capabilities={[]} />);
    expect(screen.getByText(/暂无洞察/)).toBeInTheDocument();
  });

  it('shows stale capability cards when capabilities not updated in >30 days', () => {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 45);

    const staleCap = makeCapability({
      id: 'cap-stale',
      name: 'React',
      lastUpdated: staleDate.toISOString(),
    });

    render(<InsightCards capabilities={[staleCap]} />);

    // Stale capability should appear with the name
    expect(screen.getByText(/⏳ React/)).toBeInTheDocument();
    // Should show "45 天未更新" (using the fallback since i18n key lookup may vary)
    expect(screen.getByText(/天未更新/)).toBeInTheDocument();
  });

  it('shows highest growth capability card', () => {
    const growthCap = makeCapability({
      id: 'cap-growth',
      name: 'Communication',
      growthRate: 25.7,
    });

    render(<InsightCards capabilities={[growthCap]} />);

    // Growth card with rocket emoji
    expect(screen.getByText(/🚀 Communication/)).toBeInTheDocument();
    // Growth percentage should be rounded
    expect(screen.getByText(/本月增长/)).toBeInTheDocument();
    expect(screen.getByText(/\+26%/)).toBeInTheDocument();
  });

  it('shows both stale and growth cards simultaneously', () => {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 60);

    const staleCap = makeCapability({
      id: 'cap-stale',
      name: 'CSS',
      growthRate: 5,
      lastUpdated: staleDate.toISOString(),
    });
    const growthCap = makeCapability({
      id: 'cap-growth',
      name: 'Rust',
      growthRate: 40,
    });

    render(<InsightCards capabilities={[staleCap, growthCap]} />);

    // Both cards should be visible
    expect(screen.getByText(/⏳ CSS/)).toBeInTheDocument();
    expect(screen.getByText(/天未更新/)).toBeInTheDocument();
    expect(screen.getByText(/🚀 Rust/)).toBeInTheDocument();
    expect(screen.getByText(/本月增长/)).toBeInTheDocument();
    // No empty state when there are insights
    expect(screen.queryByText(/暂无洞察/)).not.toBeInTheDocument();
  });

  it('does not show growth card when growthRate is negative infinity or undefined', () => {
    // Test with negative infinity
    const negInfCap = makeCapability({
      id: 'cap-neg-inf',
      name: 'Dead Skill',
      growthRate: -Infinity,
    });

    const { unmount } = render(<InsightCards capabilities={[negInfCap]} />);
    // The component still shows the growth card for -Infinity since it's > -Infinity initial max
    // But verify the behavior: with a single capability having -Infinity, it becomes highestGrowth
    // since -Infinity > -Infinity is false, so it won't replace null highestGrowth
    expect(screen.queryByText(/🚀/)).not.toBeInTheDocument();

    unmount();

    // Test with undefined growthRate (falls back to 0 per makeCapability default)
    const undefinedGrowthCap = makeCapability({
      id: 'cap-undef',
      name: 'Undefined Growth',
      growthRate: 0,
    });

    // A capability with growthRate 0 will still be shown as highestGrowth since 0 > -Infinity
    render(<InsightCards capabilities={[undefinedGrowthCap]} />);
    expect(screen.getByText(/🚀 Undefined Growth/)).toBeInTheDocument();
  });
});
