import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type SyncStatus = 'synced' | 'pending' | 'conflict';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId?: number;
}

export interface SyncedEntity<T> extends BaseEntity {
  data: T;
  syncStatus: SyncStatus;
  localVersion: number;
  serverVersion?: number;
}

export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'record' | 'goal' | 'reminder' | 'treeNode';
  entityId: string;
  payload: unknown;
  timestamp: string;
  retryCount: number;
}

export interface SyncMeta {
  lastSyncTime: string | null;
  serverVersions: Record<string, number>;
}

interface GrowthOSDB extends DBSchema {
  records: {
    key: string;
    value: SyncedEntity<Record<string, unknown>>;
    indexes: {
      'by-status': SyncStatus;
      'by-updated': string;
    };
  };
  goals: {
    key: string;
    value: SyncedEntity<Record<string, unknown>>;
    indexes: {
      'by-status': SyncStatus;
      'by-updated': string;
    };
  };
  reminders: {
    key: string;
    value: SyncedEntity<Record<string, unknown>>;
    indexes: {
      'by-status': SyncStatus;
      'by-updated': string;
    };
  };
  growthTrees: {
    key: string;
    value: SyncedEntity<Record<string, unknown>>;
    indexes: {
      'by-status': SyncStatus;
      'by-updated': string;
    };
  };
  treeNodes: {
    key: string;
    value: SyncedEntity<Record<string, unknown>>;
    indexes: {
      'by-status': SyncStatus;
      'by-tree': string;
      'by-updated': string;
    };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-timestamp': string;
      'by-entity': [string, string];
    };
  };
  syncMeta: {
    key: string;
    value: SyncMeta;
  };
}

const DB_NAME = 'growthos-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<GrowthOSDB> | null = null;

export async function initOfflineDB(): Promise<IDBPDatabase<GrowthOSDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<GrowthOSDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const createStore = (
        name: 'records' | 'goals' | 'reminders' | 'growthTrees' | 'treeNodes',
        indexConfig?: { name: string; keyPath: string; options?: IDBIndexParameters }
      ) => {
        const store = db.createObjectStore(name, { keyPath: 'id' });
        store.createIndex('by-status', 'syncStatus');
        store.createIndex('by-updated', 'updatedAt');
        if (indexConfig) {
          store.createIndex(indexConfig.name, indexConfig.keyPath, indexConfig.options);
        }
      };

      createStore('records');
      createStore('goals');
      createStore('reminders');
      createStore('growthTrees');

      const treeNodesStore = db.createObjectStore('treeNodes', { keyPath: 'id' });
      treeNodesStore.createIndex('by-status', 'syncStatus');
      treeNodesStore.createIndex('by-tree', 'data.treeId');
      treeNodesStore.createIndex('by-updated', 'updatedAt');

      const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
      syncQueueStore.createIndex('by-timestamp', 'timestamp');
      syncQueueStore.createIndex('by-entity', ['entityType', 'entityId']);

      db.createObjectStore('syncMeta', { keyPath: 'id' });
    },
    blocked() {
      console.warn('Database upgrade blocked by older version');
    },
    blocking() {
      dbInstance?.close();
      dbInstance = null;
    },
  });

  return dbInstance;
}

export async function getDB(): Promise<IDBPDatabase<GrowthOSDB>> {
  if (!dbInstance) {
    return initOfflineDB();
  }
  return dbInstance;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

type EntityStore = 'records' | 'goals' | 'reminders' | 'growthTrees' | 'treeNodes';

async function addToSyncQueue(
  operation: 'create' | 'update' | 'delete',
  entityType: EntityStore,
  entityId: string,
  payload: unknown
): Promise<void> {
  const db = await getDB();
  const item: SyncQueueItem = {
    id: generateId(),
    operation,
    entityType: entityType.replace('growthTrees', 'tree') as SyncQueueItem['entityType'],
    entityId,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0
  };
  await db.put('syncQueue', item);
}

export async function createEntity<T extends BaseEntity>(
  store: EntityStore,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  userId?: number
): Promise<SyncedEntity<T>> {
  const db = await getDB();
  const now = new Date().toISOString();
  const id = generateId();

  const entity: SyncedEntity<T> = {
    id,
    data: data as T,
    syncStatus: 'pending',
    localVersion: 1,
    createdAt: now,
    updatedAt: now,
    userId
  } as SyncedEntity<T>;

  await db.put(store, entity as SyncedEntity<Record<string, unknown>>);
  await addToSyncQueue('create', store, id, entity);

  return entity;
}

export async function updateEntity<T extends BaseEntity>(
  store: EntityStore,
  id: string,
  updates: Partial<Omit<T, 'id' | 'createdAt'>>
): Promise<SyncedEntity<T> | null> {
  const db = await getDB();
  const existing = await db.get(store, id);

  if (!existing) return null;

  const updated: SyncedEntity<T> = {
    ...existing,
    data: { ...existing.data, ...updates } as T,
    syncStatus: 'pending',
    localVersion: existing.localVersion + 1,
    updatedAt: new Date().toISOString()
  } as SyncedEntity<T>;

  await db.put(store, updated as SyncedEntity<Record<string, unknown>>);
  await addToSyncQueue('update', store, id, updated);

  return updated;
}

export async function deleteEntity(
  store: EntityStore,
  id: string
): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get(store, id);

  if (!existing) return false;

  await db.delete(store, id);
  await addToSyncQueue('delete', store, id, { id });

  return true;
}

export async function getEntity<T>(
  store: EntityStore,
  id: string
): Promise<SyncedEntity<T> | null> {
  const db = await getDB();
  const result = await db.get(store, id);
  return result as SyncedEntity<T> | null;
}

export async function getAllEntities<T>(
  store: EntityStore
): Promise<SyncedEntity<T>[]> {
  const db = await getDB();
  return (await db.getAll(store)) as SyncedEntity<T>[];
}

export async function getPendingEntities<T>(
  store: EntityStore
): Promise<SyncedEntity<T>[]> {
  const db = await getDB();
  return (await db.getAllFromIndex(store, 'by-status', 'pending')) as SyncedEntity<T>[];
}

export async function getConflictEntities<T>(
  store: EntityStore
): Promise<SyncedEntity<T>[]> {
  const db = await getDB();
  return (await db.getAllFromIndex(store, 'by-status', 'conflict')) as SyncedEntity<T>[];
}

export async function markAsSynced(
  store: EntityStore,
  id: string,
  serverVersion: number
): Promise<void> {
  const db = await getDB();
  const entity = await db.get(store, id);
  if (entity) {
    entity.syncStatus = 'synced';
    entity.serverVersion = serverVersion;
    await db.put(store, entity);
  }
}

export async function markAsConflict(
  store: EntityStore,
  id: string,
  serverData: unknown
): Promise<void> {
  const db = await getDB();
  const entity = await db.get(store, id);
  if (entity) {
    entity.syncStatus = 'conflict';
    entity.data = { ...entity.data, _serverData: serverData };
    await db.put(store, entity);
  }
}

export async function resolveConflict(
  store: EntityStore,
  id: string,
  resolution: 'local' | 'server',
  mergedData?: unknown
): Promise<void> {
  const db = await getDB();
  const entity = await db.get(store, id);
  if (!entity) return;

  if (resolution === 'server' && entity.data._serverData) {
    entity.data = entity.data._serverData as Record<string, unknown>;
    entity.serverVersion = entity.localVersion;
  } else if (resolution === 'merge' && mergedData) {
    entity.data = mergedData as Record<string, unknown>;
  }

  delete entity.data._serverData;
  entity.syncStatus = 'pending';
  entity.localVersion += 1;
  entity.updatedAt = new Date().toISOString();

  await db.put(store, entity);
  await addToSyncQueue('update', store, id, entity);
}

export async function getAllSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAll('syncQueue');
}

export async function getSyncQueueCount(): Promise<number> {
  const db = await getDB();
  return db.count('syncQueue');
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDB();
  await db.clear('syncQueue');
}

export async function updateSyncQueueRetry(id: string): Promise<void> {
  const db = await getDB();
  const item = await db.get('syncQueue', id);
  if (item) {
    item.retryCount += 1;
    await db.put('syncQueue', item);
  }
}

export async function getSyncMeta(): Promise<SyncMeta> {
  const db = await getDB();
  const meta = await db.get('syncMeta', 'main');
  return meta || { lastSyncTime: null, serverVersions: {} };
}

export async function updateSyncMeta(meta: Partial<SyncMeta>): Promise<void> {
  const db = await getDB();
  const existing = await getSyncMeta();
  await db.put('syncQueue', { id: 'main', ...existing, ...meta } as unknown as SyncMeta);
}
