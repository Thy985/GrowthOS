import {
  getAllSyncQueue,
  removeSyncQueueItem,
  updateSyncQueueRetry,
  getSyncQueueCount,
  getSyncMeta,
  updateSyncMeta,
  markAsSynced,
  markAsConflict,
  SyncQueueItem
} from './offlineStorage';

export interface SyncResult {
  success: boolean;
  queueItemId: string;
  error?: string;
  hasConflict?: boolean;
  serverData?: unknown;
}

export interface ConflictInfo {
  entityType: string;
  entityId: string;
  localData: unknown;
  serverData: unknown;
  queueItem: SyncQueueItem;
}

type SyncProgressCallback = (progress: {
  total: number;
  completed: number;
  current: SyncQueueItem | null;
  results: SyncResult[];
}) => void;

const MAX_RETRY_COUNT = 3;
const RETRY_DELAYS = [1000, 3000, 10000];

class SyncQueueManager {
  private isSyncing = false;
  private progressCallbacks: Set<SyncProgressCallback> = new Set();

  subscribe(callback: SyncProgressCallback): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  private notifyProgress(progress: Parameters<SyncProgressCallback>[0]): void {
    this.progressCallbacks.forEach(cb => cb(progress));
  }

  isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }

  async getQueueCount(): Promise<number> {
    return getSyncQueueCount();
  }

  async getQueue(): Promise<SyncQueueItem[]> {
    return getAllSyncQueue();
  }

  private async simulateServerSync(item: SyncQueueItem): Promise<{
    success: boolean;
    error?: string;
    hasConflict?: boolean;
    serverData?: unknown;
    serverVersion?: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    if (!navigator.onLine) {
      return { success: false, error: '网络不可用' };
    }

    const shouldFail = Math.random() < 0.05;
    if (shouldFail) {
      return { success: false, error: '服务器暂时不可用' };
    }

    const hasConflict = Math.random() < 0.1;
    if (hasConflict) {
      return {
        success: false,
        hasConflict: true,
        serverData: {
          ...(item.payload as Record<string, unknown>),
          serverModified: true,
          serverVersion: (item.payload as Record<string, unknown>).localVersion
            ? (item.payload as Record<string, unknown>).localVersion + 1
            : 2
        }
      };
    }

    return {
      success: true,
      serverVersion: (item.payload as Record<string, unknown>).localVersion
        ? (item.payload as Record<string, unknown>).localVersion + 1
        : 1
    };
  }

  private getStoreName(entityType: string): 'records' | 'goals' | 'reminders' | 'growthTrees' | 'treeNodes' {
    const mapping: Record<string, 'records' | 'goals' | 'reminders' | 'growthTrees' | 'treeNodes'> = {
      record: 'records',
      goal: 'goals',
      reminder: 'reminders',
      tree: 'growthTrees',
      treeNode: 'treeNodes'
    };
    return mapping[entityType] || 'records';
  }

  async processQueue(onProgress?: SyncProgressCallback): Promise<{
    results: SyncResult[];
    conflicts: ConflictInfo[];
    errors: string[];
  }> {
    if (this.isSyncing) {
      throw new Error('同步正在进行中');
    }

    if (!navigator.onLine) {
      throw new Error('网络不可用，请检查网络连接');
    }

    this.isSyncing = true;
    const results: SyncResult[] = [];
    const conflicts: ConflictInfo[] = [];
    const errors: string[] = [];

    try {
      const queue = await this.getQueue();
      const total = queue.length;

      if (total === 0) {
        this.isSyncing = false;
        return { results: [], conflicts: [], errors: [] };
      }

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        
        this.notifyProgress({
          total,
          completed: i,
          current: item,
          results: [...results]
        });

        if (onProgress) {
          onProgress({
            total,
            completed: i,
            current: item,
            results: [...results]
          });
        }

        try {
          const syncResult = await this.simulateServerSync(item);

          if (syncResult.success) {
            await removeSyncQueueItem(item.id);
            await markAsSynced(
              this.getStoreName(item.entityType),
              item.entityId,
              syncResult.serverVersion || 1
            );

            results.push({
              success: true,
              queueItemId: item.id
            });
          } else if (syncResult.hasConflict) {
            await markAsConflict(
              this.getStoreName(item.entityType),
              item.entityId,
              syncResult.serverData
            );

            conflicts.push({
              entityType: item.entityType,
              entityId: item.entityId,
              localData: item.payload,
              serverData: syncResult.serverData,
              queueItem: item
            });

            results.push({
              success: false,
              queueItemId: item.id,
              hasConflict: true,
              serverData: syncResult.serverData
            });
          } else {
            if (item.retryCount < MAX_RETRY_COUNT) {
              await updateSyncQueueRetry(item.id);
              const delay = RETRY_DELAYS[item.retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
              await new Promise(resolve => setTimeout(resolve, delay));
              
              i--;
              continue;
            } else {
              errors.push(`${item.entityType} ${item.entityId}: ${syncResult.error}`);
              results.push({
                success: false,
                queueItemId: item.id,
                error: syncResult.error
              });
            }
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '未知错误';
          errors.push(`${item.entityType} ${item.entityId}: ${errorMsg}`);
          results.push({
            success: false,
            queueItemId: item.id,
            error: errorMsg
          });
        }
      }

      await updateSyncMeta({
        lastSyncTime: new Date().toISOString()
      });

      this.notifyProgress({
        total,
        completed: total,
        current: null,
        results
      });

      return { results, conflicts, errors };
    } finally {
      this.isSyncing = false;
    }
  }

  async requestBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } })
          .sync.register('sync-pending-data');
      } catch (error) {
        console.warn('Background Sync 注册失败:', error);
      }
    }
  }
}

export const syncQueueManager = new SyncQueueManager();

export async function triggerSync(): Promise<{
  results: SyncResult[];
  conflicts: ConflictInfo[];
  errors: string[];
}> {
  return syncQueueManager.processQueue();
}

export async function checkPendingSync(): Promise<{
  count: number;
  queue: SyncQueueItem[];
}> {
  const [count, queue] = await Promise.all([
    getSyncQueueCount(),
    getAllSyncQueue()
  ]);
  return { count, queue };
}

export async function getLastSyncTime(): Promise<string | null> {
  const meta = await getSyncMeta();
  return meta.lastSyncTime;
}
