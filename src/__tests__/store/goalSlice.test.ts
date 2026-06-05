import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import goalReducer, {
  loadGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  incrementGoalProgress,
  clearError,
} from '../../features/goals/store/goalSlice.ts';
import { secureStorage } from '../../shared/utils/secureStorage.ts';

function makeStore() {
  return configureStore({ reducer: { goal: goalReducer } });
}

const sampleGoal = {
  title: '读书',
  description: '读 10 本书',
  targetValue: 10,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
};

describe('goalSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initial state is empty', () => {
    const store = makeStore();
    expect(store.getState().goal).toEqual({ goals: [], isLoading: false, error: null });
  });

  it('clearError clears error', () => {
    const store = makeStore();
    store.dispatch(clearError());
    expect(store.getState().goal.error).toBeNull();
  });

  describe('loadGoals', () => {
    it('loads from storage', async () => {
      const goal = {
        id: 'g1',
        ...sampleGoal,
        currentValue: 0,
        status: 'active' as const,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      secureStorage.setItem('growth-goals', [goal]);
      const store = makeStore();
      await store.dispatch(loadGoals());
      expect(store.getState().goal.goals).toHaveLength(1);
    });

    it('handles empty storage', async () => {
      const store = makeStore();
      await store.dispatch(loadGoals());
      expect(store.getState().goal.goals).toEqual([]);
    });
  });

  describe('addGoal', () => {
    it('adds goal with defaults', async () => {
      const store = makeStore();
      const result = await store.dispatch(addGoal(sampleGoal));
      expect(result.type).toBe('goal/addGoal/fulfilled');
      const goal = store.getState().goal.goals[0];
      expect(goal.title).toBe('读书');
      expect(goal.currentValue).toBe(0);
      expect(goal.status).toBe('active');
      expect(goal.id).toBeDefined();
    });
  });

  describe('updateGoal', () => {
    it('updates existing goal', async () => {
      const store = makeStore();
      const added = await store.dispatch(addGoal(sampleGoal));
      const goalId = (added.payload as { id: string }).id;
      const result = await store.dispatch(
        updateGoal({ id: goalId, title: '新标题' }),
      );
      expect(result.type).toBe('goal/updateGoal/fulfilled');
      expect(store.getState().goal.goals[0].title).toBe('新标题');
    });
  });

  describe('deleteGoal', () => {
    it('removes goal by id', async () => {
      const store = makeStore();
      const added = await store.dispatch(addGoal(sampleGoal));
      const goalId = (added.payload as { id: string }).id;
      expect(store.getState().goal.goals).toHaveLength(1);
      const result = await store.dispatch(deleteGoal(goalId));
      expect(result.type).toBe('goal/deleteGoal/fulfilled');
      expect(store.getState().goal.goals).toHaveLength(0);
    });
  });

  describe('incrementGoalProgress', () => {
    it('increments currentValue', async () => {
      const store = makeStore();
      const added = await store.dispatch(addGoal(sampleGoal));
      const goalId = (added.payload as { id: string }).id;
      await store.dispatch(incrementGoalProgress({ goalId, value: 3 }));
      expect(store.getState().goal.goals[0].currentValue).toBe(3);
    });

    it('marks goal completed when currentValue >= targetValue', async () => {
      const store = makeStore();
      const added = await store.dispatch(addGoal(sampleGoal));
      const goalId = (added.payload as { id: string }).id;
      await store.dispatch(incrementGoalProgress({ goalId, value: 10 }));
      expect(store.getState().goal.goals[0].currentValue).toBe(10);
      expect(store.getState().goal.goals[0].status).toBe('completed');
    });

    it('keeps status when not yet reached target', async () => {
      const store = makeStore();
      const added = await store.dispatch(addGoal(sampleGoal));
      const goalId = (added.payload as { id: string }).id;
      await store.dispatch(incrementGoalProgress({ goalId, value: 5 }));
      expect(store.getState().goal.goals[0].status).toBe('active');
    });
  });
});
