import type { RootState } from '../../../app/store';
import type { CoachDiagnosis, CoachSummary, Insight, Recommendation } from '../types/coachTypes';

const CACHE_TTL_MS = 30 * 60 * 1000;

export const selectCoachDiagnosis = (state: RootState): CoachDiagnosis | null =>
  state.coach.diagnosis;

export const selectIsCoachCacheValid = (state: RootState): boolean => {
  const { diagnosis, lastGeneratedAt } = state.coach;
  if (!diagnosis || !lastGeneratedAt) return false;
  const age = Date.now() - new Date(lastGeneratedAt).getTime();
  return age < CACHE_TTL_MS;
};

const EMPTY_ARRAY: never[] = [];

export const selectCoachInsights = (state: RootState): Insight[] =>
  state.coach.diagnosis?.insights ?? (EMPTY_ARRAY as unknown as Insight[]);

export const selectCoachRecommendations = (state: RootState): Recommendation[] =>
  state.coach.diagnosis?.recommendations ?? (EMPTY_ARRAY as unknown as Recommendation[]);

export const selectCoachSummary = (state: RootState): CoachSummary | null =>
  state.coach.diagnosis?.summary ?? null;
