import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import reminderReducer, {
  loadReminders,
  addReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
  clearError,
} from '../../features/reminders/store/reminderSlice.ts';
import { secureStorage } from '../../shared/utils/secureStorage.ts';

function makeStore() {
  return configureStore({ reducer: { reminder: reminderReducer } });
}

const sampleReminder = {
  title: '锻炼',
  description: '跑步 30 分钟',
  date: '2024-12-31',
  time: '10:00',
};

describe('reminderSlice', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initial state is empty', () => {
    const store = makeStore();
    expect(store.getState().reminder).toEqual({
      reminders: [],
      isLoading: false,
      error: null,
    });
  });

  it('clearError clears error', () => {
    const store = makeStore();
    store.dispatch(clearError());
    expect(store.getState().reminder.error).toBeNull();
  });

  describe('loadReminders', () => {
    it('loads from storage', async () => {
      const reminder = {
        id: 'r1',
        ...sampleReminder,
        isCompleted: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      secureStorage.setItem('growth-reminders', [reminder]);
      const store = makeStore();
      await store.dispatch(loadReminders());
      expect(store.getState().reminder.reminders).toHaveLength(1);
    });

    it('handles empty storage', async () => {
      const store = makeStore();
      await store.dispatch(loadReminders());
      expect(store.getState().reminder.reminders).toEqual([]);
    });
  });

  describe('addReminder', () => {
    it('adds reminder with defaults', async () => {
      // mock Notification 避免 jsdom 中抛错
      vi.stubGlobal(
        'Notification',
        class {
          static permission = 'default';
          static requestPermission = vi.fn().mockResolvedValue('denied');
        },
      );
      const store = makeStore();
      const result = await store.dispatch(addReminder(sampleReminder));
      expect(result.type).toBe('reminder/addReminder/fulfilled');
      const r = store.getState().reminder.reminders[0];
      expect(r.title).toBe('锻炼');
      expect(r.isCompleted).toBe(false);
    });
  });

  describe('updateReminder', () => {
    it('updates existing reminder', async () => {
      vi.stubGlobal(
        'Notification',
        class {
          static permission = 'default';
          static requestPermission = vi.fn().mockResolvedValue('denied');
        },
      );
      const store = makeStore();
      const added = await store.dispatch(addReminder(sampleReminder));
      const reminder = added.payload as {
        id: string;
        title: string;
        description: string;
        date: string;
        time: string;
        isCompleted: boolean;
        createdAt: string;
        updatedAt: string;
      };
      const result = await store.dispatch(updateReminder({ ...reminder, title: '新标题' }));
      expect(result.type).toBe('reminder/updateReminder/fulfilled');
      expect(store.getState().reminder.reminders[0].title).toBe('新标题');
    });
  });

  describe('deleteReminder', () => {
    it('removes reminder by id', async () => {
      vi.stubGlobal(
        'Notification',
        class {
          static permission = 'default';
          static requestPermission = vi.fn().mockResolvedValue('denied');
        },
      );
      const store = makeStore();
      const added = await store.dispatch(addReminder(sampleReminder));
      const reminderId = (added.payload as { id: string }).id;
      expect(store.getState().reminder.reminders).toHaveLength(1);
      const result = await store.dispatch(deleteReminder(reminderId));
      expect(result.type).toBe('reminder/deleteReminder/fulfilled');
      expect(store.getState().reminder.reminders).toHaveLength(0);
    });
  });

  describe('completeReminder', () => {
    it('marks reminder as completed', async () => {
      vi.stubGlobal(
        'Notification',
        class {
          static permission = 'default';
          static requestPermission = vi.fn().mockResolvedValue('denied');
        },
      );
      const store = makeStore();
      const added = await store.dispatch(addReminder(sampleReminder));
      const reminderId = (added.payload as { id: string }).id;
      const result = await store.dispatch(completeReminder(reminderId));
      expect(result.type).toBe('reminder/completeReminder/fulfilled');
      expect(store.getState().reminder.reminders[0].isCompleted).toBe(true);
    });
  });
});
