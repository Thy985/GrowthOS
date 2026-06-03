/**
 * reminderServiceV2 集成测试
 */

import {
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
  getUpcomingReminders,
  __setReminderRepositoryForTest,
  __resetReminderRepositoryForTest,
} from '../../../common/services/reminderServiceV2';
import { createTestRepository } from './_helpers';
import type { Repository } from '../../../common/repositories/repository';
import type { Reminder } from '../../../types';

let repo: Repository<Reminder>;

beforeEach(() => {
  __resetReminderRepositoryForTest();
  repo = createTestRepository<Reminder>();
  __setReminderRepositoryForTest(repo);
});

afterEach(() => {
  __resetReminderRepositoryForTest();
});

describe('reminderServiceV2 (Step 2: IndexedDB path)', () => {
  it('creates with isCompleted=false', async () => {
    const r = await createReminder({
      title: 'Drink water',
      date: '2026-01-01',
      time: '09:00',
    });
    expect(r.isCompleted).toBe(false);
  });

  it('completeReminder flips isCompleted to true', async () => {
    const r = await createReminder({ title: 'A', date: '2026-01-01', time: '09:00' });
    const done = await completeReminder(r.id);
    expect(done.isCompleted).toBe(true);
  });

  it('updateReminder throws on non-existent', async () => {
    await expect(updateReminder('nope', { title: 'x' })).rejects.toThrow(/不存在/);
  });

  it('deleteReminder throws on non-existent', async () => {
    await expect(deleteReminder('nope')).rejects.toThrow(/不存在/);
  });

  it('getReminderById returns null when missing', async () => {
    expect(await getReminderById('nope')).toBeNull();
  });

  it('getUpcomingReminders returns future uncompleted ones sorted by date', async () => {
    const future1 = await createReminder({ title: 'tomorrow', date: '2099-01-01', time: '09:00' });
    const future2 = await createReminder({ title: 'day after', date: '2099-01-02', time: '09:00' });
    await createReminder({ title: 'past', date: '2000-01-01', time: '09:00' });
    const completed = await createReminder({ title: 'done', date: '2099-03-01', time: '09:00' });
    await completeReminder(completed.id);

    const upcoming = await getUpcomingReminders();
    expect(upcoming).toHaveLength(2);
    expect(upcoming[0].id).toBe(future1.id);
    expect(upcoming[1].id).toBe(future2.id);
  });
});
