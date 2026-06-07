import type { RootState } from '../../../app/store';
import type { CoachDiagnosis, CoachSummary, Insight, Recommendation } from '../types/coachTypes';

export const selectCoachDiagnosis = (state: RootState): CoachDiagnosis | null =>
  state.coach.diagnosis;

export const selectCoachHistory = (state: RootState): CoachDiagnosis[] =>
  state.coach.history;

export const selectCoachIsAnalyzing = (state: RootState): boolean =>
  state.coach.isAnalyzing;

export const selectCoachLastAnalyzedAt = (state: RootState): string | null =>
  state.coach.lastAnalyzedAt;

export const selectRecommendationStatuses = (
  state: RootState,
): Record<string, { status: string; updatedAt: string }> =>
  state.coach.recommendationStatuses;

const EMPTY_ARRAY: never[] = [];

export const selectCoachInsights = (state: RootState): Insight[] =>
  state.coach.diagnosis?.insights ?? (EMPTY_ARRAY as unknown as Insight[]);

export const selectCoachRecommendations = (state: RootState): Recommendation[] =>
  state.coach.diagnosis?.recommendations ?? (EMPTY_ARRAY as unknown as Recommendation[]);

export const selectCoachSummary = (state: RootState): CoachSummary | null =>
  state.coach.diagnosis?.summary ?? null;