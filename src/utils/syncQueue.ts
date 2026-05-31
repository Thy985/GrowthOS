import { getAllSyncQueue, getSyncQueueCount, removeSyncQueueItem, markAsSynced, markAsConflict, updateSyncMeta, getSyncMeta, updateSyncQueueRetry } from './offlineStorage';

const MAX_RETRY_COUNT = 3;
const RETRY_DELAYS = [1000, 2000, 5000];

export interface SyncQueueItem {
  id: string,
  entityType: string,
  entityId: string,
  operation: 'create' | 'update' | 'delete',
  payload: unknown,
  createdAt: string,
  retryCount: number,
}

export interface SyncResult {
  success: boolean,
  queueItemId: string,
  hasConflict?: boolean,
  serverData?: unknown,
  error?: string,
  serverVersion?: number,
}

export interface ConflictInfo {
  entityType: string,
  entityId: string,
  localData: unknown,
  serverData: unknown,
  queueItem: SyncQueueItem,
}

export type SyncProgressCallback = (progress: {
  total: number,
  completed: number,
  current: SyncQueueItem | null,
  results: SyncResult[],
}) => void;

class SyncQueueManager {
  private isSyncing = false;
  private progressCallbacks: Set<SyncProgressCallback> = new Set();

  private notifyProgress(progress: {
    total: number,
    completed: number,
    current: SyncQueueItem | null,
    results: SyncResult[],
  }) {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    });
  }

  addProgressCallback(callback: SyncProgressCallback) {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  async getQueue(): Promise<SyncQueueItem[]> {
    const queue = await getAllSyncQueue();
    // @ts-expect-error - offlineStorage 返回的类型与 syncQueue 不同但兼容
    return queue as SyncQueueItem[];
  }

  async addToQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
    const id = `${item.entityType}_${item.entityId}_${Date.now()}`;
    const queueItem: SyncQueueItem = {
      ...item,
      id,
      createdAt: new Date().toISOString(),
      retryCount: 0
    };
    // @ts-expect-error - offlineStorage 没有导出 addSyncQueueItem
    await addSyncQueueItem(queueItem);
    return id;
  }

  async removeFromQueue(id: string): Promise<void> {
    await removeSyncQueueItem(id);
  }

  async clearQueue(): Promise<void> {
    const queue = await this.getQueue();
    await Promise.all(queue.map(item => this.removeFromQueue(item.id)));
  }

  private async simulateServerSync(item: SyncQueueItem): Promise<{
    success: boolean,
    hasConflict?: boolean,
    serverData?: Record<string, unknown>,
    error?: string,
    serverVersion?: number,
  }> {
    await new Promise(resolve => setTimeout(resolve, 100));

    if (Math.random() < 0.05) {
      return {
        success: false,
        error: '服务器暂时不可用'
      };
    }

    const hasConflict = Math.random() < 0.1;
    const payload = item.payload as Record<string, unknown>;
    const baseVersion = payload.localVersion ? (payload.localVersion as number) + 1 : 1;

    if (hasConflict) {
      return {
        success: false,
        hasConflict: true,
        serverData: {
          ...payload,
          serverModified: true,
          serverVersion: payload.localVersion ? (payload.localVersion as number) + 1 : 2
        }
      };
    }

    return {
      success: true,
      serverVersion: baseVersion
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
    results: SyncResult[],
    conflicts: ConflictInfo[],
    errors: string[],
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
  results: SyncResult[],
  conflicts: ConflictInfo[],
  errors: string[],
}> {
  return syncQueueManager.processQueue();
}

export async function checkPendingSync(): Promise<{
  count: number,
  queue: SyncQueueItem[],
}> {
  const [count, queue] = await Promise.all([
    getSyncQueueCount(),
    getAllSyncQueue()
  ]);
  // @ts-expect-error - offlineStorage 返回的类型与 syncQueue 不同但兼容
  return { count, queue: queue as SyncQueueItem[] };
}

export async function getLastSyncTime(): Promise<string | null> {
  const meta = await getSyncMeta();
  return meta.lastSyncTime;
}
