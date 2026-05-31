import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import {
  checkPendingSync,
  triggerSync,
  type ConflictInfo
} from '../../utils/syncQueue';
import { resolveConflict as resolveConflictStorage } from '../../utils/offlineStorage';
import type { SyncQueueItem } from '../../utils/syncQueue';

export interface SyncState {
  isLoading: boolean,
  isOnline: boolean,
  isSyncing: boolean,
  pendingCount: number,
  queue: SyncQueueItem[],
  conflicts: ConflictInfo[],
  lastSyncTime: string | null,
  syncProgress: {
    total: number,
    completed: number,
    current: SyncQueueItem | null,
  },
  error: string | null,
}

const initialState: SyncState = {
  isLoading: false,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  queue: [],
  conflicts: [],
  lastSyncTime: null,
  syncProgress: {
    total: 0,
    completed: 0,
    current: null
  },
  error: null
};

export const loadSyncStatus = createAsyncThunk(
  'sync/loadStatus',
  async () => {
    const { count, queue } = await checkPendingSync();
    return { count, queue };
  }
);

export const performSync = createAsyncThunk(
  'sync/perform',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const result = await triggerSync();
      void dispatch(loadSyncStatus());
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '同步失败');
    }
  }
);

export const resolveConflict = createAsyncThunk(
  'sync/resolveConflict',
  async (
    { entityType, entityId, resolution, mergedData }: {
      entityType: string,
      entityId: string,
      resolution: 'local' | 'server' | 'merge',
      mergedData?: Record<string, unknown>,
    },
    { dispatch }
  ) => {
    const storeMap: Record<string, 'records' | 'goals' | 'reminders' | 'growthTrees' | 'treeNodes'> = {
      record: 'records',
      goal: 'goals',
      reminder: 'reminders',
      tree: 'growthTrees',
      treeNode: 'treeNodes'
    };

    const store = storeMap[entityType] || 'records';
    await resolveConflictStorage(store, entityId, resolution, mergedData);
    void dispatch(loadSyncStatus());

    return { entityId };
  }
);

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setSyncProgress: (state, action: PayloadAction<{
      total: number,
      completed: number,
      current: SyncQueueItem | null,
    }>) => {
      state.syncProgress = action.payload;
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearSyncError: (state) => {
      state.error = null;
    },
    updateProgress: (state, action: PayloadAction<{
      total: number,
      completed: number,
      current: SyncQueueItem | null,
    }>) => {
      state.syncProgress = action.payload;
    },
    removeConflict: (state, action: PayloadAction<string>) => {
      state.conflicts = state.conflicts.filter(c => c.entityId !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSyncStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSyncStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingCount = action.payload.count;
        state.queue = action.payload.queue;
      })
      .addCase(loadSyncStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '加载同步状态失败';
      })
      .addCase(performSync.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(performSync.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.conflicts = action.payload.conflicts;
        state.lastSyncTime = new Date().toISOString();
        state.pendingCount = state.queue.length - action.payload.results.filter(r => r.success).length;
      })
      .addCase(performSync.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      })
      .addCase(resolveConflict.fulfilled, (state, action) => {
        state.conflicts = state.conflicts.filter(c => c.entityId !== action.payload.entityId);
      });
  }
});

export const {
  setOnlineStatus,
  setSyncing,
  setSyncProgress,
  setSyncError,
  clearSyncError,
  updateProgress,
  removeConflict
} = syncSlice.actions;

export default syncSlice.reducer;
