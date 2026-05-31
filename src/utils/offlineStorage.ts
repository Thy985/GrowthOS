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

export type SyncOperation = 'create' | 'update' | 'delete';
export type EntityType = 'record' | 'goal' | 'reminder' | 'tree' | 'treeNode';
export type Resolution = 'local' | 'server' | 'merge';

export interface SyncPayload {
  id: string;
  operation: SyncOperation;
  entityType: EntityType;
  entityId: string;
  data?: Record<string, unknown>;
}

export interface SyncQueueItem {
  id: string;
  operation: SyncOperation;
  entityType: EntityType;
  entityId: string;
  payload: SyncPayload;
  timestamp: string;
  retryCount: number;
}

export interface SyncMeta {
  lastSyncTime: string | null;
  serverVersions: Record<string, number>;
}

export interface ConflictInfo {
  entityType: EntityType;
  entityId: string;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  queueItem: SyncQueueItem;
}

export interface SyncProgress {
  total: number;
  completed: number;
  current: SyncQueueItem | null;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  queue: SyncQueueItem[];
  conflicts: ConflictInfo[];
  lastSyncTime: string | null;
  syncProgress: SyncProgress;
  error: string | null;
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
        name: 'records' | 'goals' | 'reminders' | 'growthTrees' | 'treeNodes'
      ) => {
        const store = db.createObjectStore(name, { keyPath: 'id' });
        store.createIndex('by-status', 'syncStatus');
        store.createIndex('by-updated', 'updatedAt');
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
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

type EntityStore = 'records' | 'goals' | 'reminders' | 'growthTrees' | 'treeNodes';

function mapStoreToEntityType(store: EntityStore): EntityType {
  const map: Record<EntityStore, EntityType> = {
    records: 'record',
    goals: 'goal',
    reminders: 'reminder',
    growthTrees: 'tree',
    treeNodes: 'treeNode',
  };
  return map[store];
}

async function addToSyncQueue(
  operation: SyncOperation,
  store: EntityStore,
  entityId: string,
  payload: SyncPayload
): Promise<void> {
  const db = await getDB();
  const item: SyncQueueItem = {
    id: generateId(),
    operation,
    entityType: mapStoreToEntityType(store),
    entityId,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
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

  const entityData = data as Record<string, unknown>;
  const entity: SyncedEntity<T> = {
    id,
    data: entityData as T,
    syncStatus: 'pending',
    localVersion: 1,
    createdAt: now,
    updatedAt: now,
    userId,
  } as SyncedEntity<T>;

  await db.put(store, entity as SyncedEntity<Record<string, unknown>>);

  const syncPayload: SyncPayload = {
    id,
    operation: 'create',
    entityType: mapStoreToEntityType(store),
    entityId: id,
    data: entityData,
  };
  await addToSyncQueue('create', store, id, syncPayload);

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

  const existingData = existing.data as Record<string, unknown>;
  const updateData = updates as Record<string, unknown>;
  const mergedData: Record<string, unknown> = { ...existingData, ...updateData };

  const updated: SyncedEntity<T> = {
    ...existing,
    data: mergedData as T,
    syncStatus: 'pending',
    localVersion: existing.localVersion + 1,
    updatedAt: new Date().toISOString(),
  } as SyncedEntity<T>;

  await db.put(store, updated as SyncedEntity<Record<string, unknown>>);

  const syncPayload: SyncPayload = {
    id,
    operation: 'update',
    entityType: mapStoreToEntityType(store),
    entityId: id,
    data: mergedData,
  };
  await addToSyncQueue('update', store, id, syncPayload);

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

  const syncPayload: SyncPayload = {
    id,
    operation: 'delete',
    entityType: mapStoreToEntityType(store),
    entityId: id,
  };
  await addToSyncQueue('delete', store, id, syncPayload);

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
  const results = await db.getAll(store);
  return results as SyncedEntity<T>[];
}

export async function getPendingEntities<T>(
  store: EntityStore
): Promise<SyncedEntity<T>[]> {
  const db = await getDB();
  const results = await db.getAllFromIndex(store, 'by-status', 'pending');
  return results as SyncedEntity<T>[];
}

export async function getConflictEntities<T>(
  store: EntityStore
): Promise<SyncedEntity<T>[]> {
  const db = await getDB();
  const results = await db.getAllFromIndex(store, 'by-status', 'conflict');
  return results as SyncedEntity<T>[];
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
  serverData?: Record<string, unknown>
): Promise<void> {
  const db = await getDB();
  const entity = await db.get(store, id);
  if (entity) {
    entity.syncStatus = 'conflict';
    entity.data = { ...entity.data, _serverData: serverData || {} };
    await db.put(store, entity);
  }
}

export async function resolveConflict(
  store: EntityStore,
  id: string,
  resolution: Resolution,
  mergedData?: Record<string, unknown>
): Promise<void> {
  const db = await getDB();
  const entity = await db.get(store, id);
  if (!entity) return;

  const entityData = entity.data as Record<string, unknown>;

  if ((resolution === 'local' || resolution === 'merge') && mergedData) {
    entity.data = mergedData;
  } else if (resolution === 'server' && entityData._serverData) {
    entity.data = entityData._serverData as Record<string, unknown>;
    entity.serverVersion = entity.localVersion;
  }

  delete entity.data._serverData;
  entity.syncStatus = 'pending';
  entity.localVersion += 1;
  entity.updatedAt = new Date().toISOString();

  await db.put(store, entity);

  const syncPayload: SyncPayload = {
    id,
    operation: 'update',
    entityType: mapStoreToEntityType(store),
    entityId: id,
    data: entity.data,
  };
  await addToSyncQueue('update', store, id, syncPayload);
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
  const record: SyncMeta & { id: string } = { id: 'main', ...existing, ...meta };
  await db.put('syncMeta', record);
}
