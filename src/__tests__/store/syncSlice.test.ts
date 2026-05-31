import { configureStore } from '@reduxjs/toolkit';
import syncReducer, {
  setOnlineStatus,
  setSyncing,
  setSyncProgress,
  setSyncError,
  loadSyncStatus,
  performSync,
  resolveConflict,
} from '../../store/slices/syncSlice';

jest.mock('../../utils/syncQueue', () => ({
  checkPendingSync: jest.fn().mockResolvedValue({ count: 0, queue: [] }),
  triggerSync: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../utils/offlineStorage', () => ({
  resolveConflict: jest.fn().mockResolvedValue(undefined),
}));

describe('Sync Slice', () => {
  const createTestStore = () =>
    configureStore({
      reducer: {
        sync: syncReducer,
      },
    });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().sync;

      expect(state.isLoading).toBe(false);
      expect(state.isOnline).toBe(true);
      expect(state.isSyncing).toBe(false);
      expect(state.pendingCount).toBe(0);
      expect(state.queue).toEqual([]);
      expect(state.conflicts).toEqual([]);
      expect(state.lastSyncTime).toBeNull();
      expect(state.syncProgress.total).toBe(0);
      expect(state.syncProgress.completed).toBe(0);
      expect(state.syncProgress.current).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('synchronous actions', () => {
    it('should set online status', () => {
      const store = createTestStore();

      store.dispatch(setOnlineStatus(false));

      expect(store.getState().sync.isOnline).toBe(false);
    });

    it('should set syncing status', () => {
      const store = createTestStore();

      store.dispatch(setSyncing(true));

      expect(store.getState().sync.isSyncing).toBe(true);
    });

    it('should set sync progress', () => {
      const store = createTestStore();

      store.dispatch(setSyncProgress({
        total: 10,
        completed: 5,
        current: null,
      }));

      const state = store.getState().sync;
      expect(state.syncProgress.total).toBe(10);
      expect(state.syncProgress.completed).toBe(5);
      expect(state.syncProgress.current).toBeNull();
    });

    it('should set sync error', () => {
      const store = createTestStore();

      store.dispatch(setSyncError('Sync failed'));

      expect(store.getState().sync.error).toBe('Sync failed');
    });

    it('should clear sync error with null', () => {
      const store = createTestStore();

      store.dispatch(setSyncError('Error'));
      store.dispatch(setSyncError(null));

      expect(store.getState().sync.error).toBeNull();
    });
  });

  describe('async thunks', () => {
    it('should handle loadSyncStatus.pending', () => {
      const store = createTestStore();

      store.dispatch(loadSyncStatus.pending('request-id'));

      expect(store.getState().sync.isLoading).toBe(true);
    });

    it('should handle loadSyncStatus.fulfilled', async () => {
      const store = createTestStore();
      const mockQueue: Array<{ id: string; operation: 'create' | 'update' | 'delete'; entityType: string; entityId: string; payload: unknown; createdAt: string; retryCount: number }> = [];

      await store.dispatch(loadSyncStatus.fulfilled(
        { count: 1, queue: mockQueue },
        'request-id'
      ));

      const state = store.getState().sync;
      expect(state.pendingCount).toBe(1);
      expect(state.queue).toEqual(mockQueue);
    });

    it('should handle performSync.pending', () => {
      const store = createTestStore();

      store.dispatch(performSync.pending('request-id'));

      expect(store.getState().sync.isSyncing).toBe(true);
    });

    it('should handle performSync.rejected', async () => {
      const store = createTestStore();

      await store.dispatch(performSync.rejected(
        new Error('Network error'),
        'request-id',
        undefined,
        { payload: 'Network error' }
      ));

      const state = store.getState().sync;
      expect(state.isSyncing).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });

  describe('conflict resolution', () => {
    it('should handle resolveConflict.fulfilled', async () => {
      const store = createTestStore();

      store.dispatch(resolveConflict.fulfilled(
        { entityId: 'test-id' },
        'request-id',
        {
          entityType: 'record',
          entityId: 'test-id',
          resolution: 'local',
        }
      ));

      expect(store.getState().sync.conflicts).toHaveLength(0);
    });
  });
});
