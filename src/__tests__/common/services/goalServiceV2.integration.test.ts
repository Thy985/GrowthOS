/**
 * goalServiceV2 集成测试
 */

import {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  incrementGoalProgress,
  __setGoalRepositoryForTest,
  __resetGoalRepositoryForTest,
} from '../../../common/services/goalServiceV2';
import { createTestRepository } from './_helpers';
import type { ReadWriteRepository } from '../../../common/repositories/repository';
import type { Goal } from '../../../types';

let repo: ReadWriteRepository<Goal>;

beforeEach(() => {
  __resetGoalRepositoryForTest();
  repo = createTestRepository<Goal>();
  __setGoalRepositoryForTest(repo);
});

afterEach(() => {
  __resetGoalRepositoryForTest();
});

describe('goalServiceV2 (Step 2: IndexedDB path)', () => {
  it('creates a goal with sensible defaults', async () => {
    const goal = await createGoal({
      title: 'Read 10 books',
      targetValue: 10,
      targetDate: '2026-12-31',
    });
    expect(goal.id).toBeTruthy();
    expect(goal.status).toBe('active');
    expect(goal.currentValue).toBe(0);
    expect(goal.category).toBe('other');
  });

  it('getGoalById returns null when not found', async () => {
    expect(await getGoalById('nope')).toBeNull();
  });

  it('updateGoal merges and stamps updatedAt', async () => {
    const g = await createGoal({ title: 'A', targetValue: 5, targetDate: '2026-01-01' });
    const updated = await updateGoal(g.id, { currentValue: 3 });
    expect(updated.currentValue).toBe(3);
    expect(updated.title).toBe('A');
  });

  it('updateGoal throws on non-existent', async () => {
    await expect(updateGoal('nope', { title: 'x' })).rejects.toThrow(/不存在/);
  });

  it('deleteGoal throws on non-existent', async () => {
    await expect(deleteGoal('nope')).rejects.toThrow(/不存在/);
  });

  it('incrementGoalProgress raises currentValue', async () => {
    const g = await createGoal({ title: 'A', targetValue: 10, targetDate: '2026-01-01' });
    const after = await incrementGoalProgress(g.id, 3);
    expect(after.currentValue).toBe(3);
  });

  it('incrementGoalProgress marks as completed when reaching target', async () => {
    const g = await createGoal({ title: 'A', targetValue: 5, targetDate: '2026-01-01' });
    const after = await incrementGoalProgress(g.id, 5);
    expect(after.currentValue).toBe(5);
    expect(after.status).toBe('completed');
  });

  it('incrementGoalProgress throws on non-existent', async () => {
    await expect(incrementGoalProgress('nope', 1)).rejects.toThrow(/不存在/);
  });

  it('getGoals returns all', async () => {
    await createGoal({ title: 'A', targetValue: 1, targetDate: '2026-01-01' });
    await createGoal({ title: 'B', targetValue: 1, targetDate: '2026-01-01' });
    expect(await getGoals()).toHaveLength(2);
  });
});
