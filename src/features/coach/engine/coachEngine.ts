import type {
  Experience,
  Capability,
  Principle,
  Project,
  ExperienceCapabilityLink,
} from '../../../shared/types';
import type { CoachDiagnosis } from '../types/coachTypes';

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
  SEVERITY_ORDER,
  PRIORITY_ORDER,
} from './coachRules';

export function analyze(
  experiences: Experience[],
  capabilities: Capability[],
  principles: Principle[],
  projects: Project[],
  links: ExperienceCapabilityLink[],
  now?: Date,
): CoachDiagnosis {
  // 1. Run all rule functions
  const staleInsights = detectStaleCapabilities(capabilities, experiences, links, now);
  const growthInsights = detectGrowthCapabilities(capabilities, experiences, links, now);
  const patternInsights = detectPatterns(
    experiences,
    capabilities,
    principles,
    projects,
    links,
    now,
  );
  const retroInsights = detectRetrospectiveInsights(projects, capabilities);
  const trendInsights = detectCapabilityTrends(capabilities, projects);
  const gapInsights = detectExperienceGaps(capabilities, links);
  const healthInsights = detectProjectHealth(projects, experiences, now);

  // 2. Combine and sort insights by severity
  const allInsights = [
    ...staleInsights,
    ...growthInsights,
    ...patternInsights,
    ...retroInsights,
    ...trendInsights,
    ...gapInsights,
    ...healthInsights,
  ].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  // 3. Generate recommendations from insights
  const recommendations = generateRecommendations(
    allInsights,
    capabilities,
    projects,
    principles,
    experiences,
    links,
    now,
  );

  // 4. Sort recommendations by priority, limit to 5
  const sortedRecs = [...recommendations]
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, 5);

  // 5. Generate summary
  const summary = generateSummary(allInsights);

  return {
    summary,
    insights: allInsights,
    recommendations: sortedRecs,
    generatedAt: (now || new Date()).toISOString(),
  };
}

// V2 interface (for future LLM integration)
export interface CoachEngine {
  analyze(
    experiences: Experience[],
    capabilities: Capability[],
    principles: Principle[],
    projects: Project[],
    links: ExperienceCapabilityLink[],
  ): CoachDiagnosis | Promise<CoachDiagnosis>;
}
