import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../types';

const selectRecordsState = (state: RootState) => state.growth;
const selectGoalsState = (state: RootState) => state.goals;
const selectRemindersState = (state: RootState) => state.reminders;

export const selectAllRecords = (state: RootState) => selectRecordsState(state).records;
export const selectRecordsLoading = (state: RootState) => selectRecordsState(state).isLoading;
export const selectRecordsError = (state: RootState) => selectRecordsState(state).error;

export const selectRecordById = (id: string) => 
  createSelector([selectAllRecords], (records) => 
    records.find(record => record.id === id)
  );

export const selectRecentRecords = createSelector(
  [selectAllRecords],
  (records) =>
    [...records]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
);

export const selectAllTags = createSelector(
  [selectAllRecords],
  (records): string[] => {
    const tagSet = new Set<string>();
    records.forEach(record => {
      record.tags.forEach((tag: string) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }
);

export const selectRecordsByMood = (mood: string) =>
  createSelector([selectAllRecords], (records) =>
    records.filter(record => record.mood === mood)
  );

export const selectRecordsByTag = (tag: string) =>
  createSelector([selectAllRecords], (records) =>
    records.filter(record => record.tags.includes(tag))
  );

export const selectTotalRecordsCount = createSelector(
  [selectAllRecords],
  (records) => records.length
);

export const selectWeeklyRecordsCount = createSelector(
  [selectAllRecords],
  (records): number => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return records.filter(record =>
      new Date(record.createdAt) >= weekAgo
    ).length;
  }
);

export const selectMoodDistribution = createSelector(
  [selectAllRecords],
  (records): Record<string, number> =>
    records.reduce((acc, record) => {
      const mood = record.mood || 'unknown';
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
);

export const selectTagDistribution = createSelector(
  [selectAllRecords],
  (records): Record<string, number> => {
    const distribution: Record<string, number> = {};
    records.forEach(record => {
      record.tags.forEach((tag: string) => {
        distribution[tag] = (distribution[tag] || 0) + 1;
      });
    });
    return distribution;
  }
);

export const selectGoals = (state: RootState) => selectGoalsState(state).goals;
export const selectGoalsLoading = (state: RootState) => selectGoalsState(state).isLoading;
export const selectGoalsError = (state: RootState) => selectGoalsState(state).error;
export const selectActiveGoals = (state: RootState) => 
  selectGoalsState(state).goals.filter(goal => goal.status === 'active');
export const selectCompletedGoals = (state: RootState) => 
  selectGoalsState(state).goals.filter(goal => goal.status === 'completed');

export const selectReminders = (state: RootState) => selectRemindersState(state).reminders;
export const selectRemindersLoading = (state: RootState) => selectRemindersState(state).isLoading;
export const selectEnabledReminders = (state: RootState) => 
  selectRemindersState(state).reminders.filter(r => !r.isCompleted);
export const selectUpcomingReminders = createSelector(
  [selectEnabledReminders],
  (reminders) => {
    const now = new Date();
    return reminders
      .filter(r => new Date(r.time) > now)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }
);

export const selectAuth = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectCurrentUser = (state: RootState) => state.auth.user;

export const selectTheme = (state: RootState) => state.theme;
export const selectIsDarkMode = (state: RootState) => state.theme.isDarkMode;

export const selectAI = (state: RootState) => state.ai;
export const selectAIConfig = (state: RootState) => state.ai.config;
