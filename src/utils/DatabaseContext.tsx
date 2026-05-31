import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';
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
  entityType: 'record' | 'goal' | 'reminder' | 'tree' | 'treeNode';
  entityId: string;
  payload: unknown;
  timestamp: string;
  retryCount: number;
}

export interface SyncMeta {
  lastSyncTime: string | null;
  serverVersions: Record<string, number>;
}

export interface ConflictInfo {
  entityType: string;
  entityId: string;
  localData: unknown;
  serverData: unknown;
  queueItem: SyncQueueItem;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  queue: SyncQueueItem[];
  conflicts: ConflictInfo[];
  lastSyncTime: string | null;
  syncProgress: {
    total: number;
    completed: number;
    current: SyncQueueItem | null;
  };
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

type EntityStore = 'records' | 'goals' | 'reminders' | 'growthTrees' | 'treeNodes';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface DatabaseContextValue {
  db: IDBPDatabase<GrowthOSDB> | null;
  isReady: boolean;
  error: string | null;
  initDatabase: () => Promise<IDBPDatabase<GrowthOSDB>>;
  createEntity: <T extends BaseEntity>(
    store: EntityStore,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    userId?: number
  ) => Promise<SyncedEntity<T>>;
  updateEntity: <T extends BaseEntity>(
    store: EntityStore,
    id: string,
    updates: Partial<Omit<T, 'id' | 'createdAt'>>
  ) => Promise<SyncedEntity<T> | null>;
  deleteEntity: (store: EntityStore, id: string) => Promise<boolean>;
  getEntity: <T>(store: EntityStore, id: string) => Promise<SyncedEntity<T> | null>;
  getAllEntities: <T>(store: EntityStore) => Promise<SyncedEntity<T>[]>;
  getPendingEntities: <T>(store: EntityStore) => Promise<SyncedEntity<T>[]>;
  getConflictEntities: <T>(store: EntityStore) => Promise<SyncedEntity<T>[]>;
  markAsSynced: (store: EntityStore, id: string, serverVersion: number) => Promise<void>;
  markAsConflict: (store: EntityStore, id: string, serverData: unknown) => Promise<void>;
  resolveConflict: (
    store: EntityStore,
    id: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: unknown
  ) => Promise<void>;
  getAllSyncQueue: () => Promise<SyncQueueItem[]>;
  getSyncQueueCount: () => Promise<number>;
  removeSyncQueueItem: (id: string) => Promise<void>;
  clearSyncQueue: () => Promise<void>;
  updateSyncQueueRetry: (id: string) => Promise<void>;
  getSyncMeta: () => Promise<SyncMeta>;
  updateSyncMeta: (meta: Partial<SyncMeta>) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

interface DatabaseProviderProps {
  children: React.ReactNode;
}

async function createDatabase(): Promise<IDBPDatabase<GrowthOSDB>> {
  return openDB<GrowthOSDB>(DB_NAME, DB_VERSION, {
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
      console.warn('Database blocking older connection');
    },
  });
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [db, setDb] = useState<IDBPDatabase<GrowthOSDB> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dbRef = useRef<IDBPDatabase<GrowthOSDB> | null>(null);

  const initDatabase = useCallback(async (): Promise<IDBPDatabase<GrowthOSDB>> => {
    if (dbRef.current) {
      return dbRef.current;
    }

    try {
      const database = await createDatabase();
      dbRef.current = database;
      setDb(database);
      setIsReady(true);
      return database;
    } catch (err) {
      const message = err instanceof Error ? err.message : '数据库初始化失败';
      setError(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    initDatabase().catch(err => {
      console.error('Failed to initialize database:', err);
    });

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
        dbRef.current = null;
      }
    };
  }, [initDatabase]);

  const addToSyncQueue = useCallback(async (
    operation: 'create' | 'update' | 'delete',
    entityType: EntityStore,
    entityId: string,
    payload: unknown
  ): Promise<void> => {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    const item: SyncQueueItem = {
      id: generateId(),
      operation,
      entityType: entityType === 'records' ? 'record'
        : entityType === 'goals' ? 'goal'
        : entityType === 'reminders' ? 'reminder'
        : entityType === 'growthTrees' ? 'tree'
        : 'treeNode',
      entityId,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
    await database.put('syncQueue', item);
  }, []);

  const createEntity = useCallback(async <T extends BaseEntity>(
    store: EntityStore,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    userId?: number
  ): Promise<SyncedEntity<T>> => {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const id = generateId();

    const entity = {
      id,
      data: data as T,
      syncStatus: 'pending' as SyncStatus,
      localVersion: 1,
      createdAt: now,
      updatedAt: now,
      userId
    };

    await database.put(store, entity as SyncedEntity<Record<string, unknown>>);
    await addToSyncQueue('create', store, id, entity);

    return entity as SyncedEntity<T>;
  }, [addToSyncQueue]);

  const updateEntity = useCallback(async <T extends BaseEntity>(
    store: EntityStore,
    id: string,
    updates: Partial<Omit<T, 'id' | 'createdAt'>>
  ): Promise<SyncedEntity<T> | null> => {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    const existing = await database.get(store, id) as SyncedEntity<T> | undefined;
    if (!existing) return null;

    const updated = {
      ...existing,
      data: { ...existing.data, ...updates } as T,
      syncStatus: 'pending' as SyncStatus,
      localVersion: existing.localVersion + 1,
      updatedAt: new Date().toISOString()
    };

    await database.put(store, updated as SyncedEntity<Record<string, unknown>>);
    await addToSyncQueue('update', store, id, updated);

    return updated as SyncedEntity<T>;
  }, [addToSyncQueue]);

  const deleteEntity = useCallback(async (
    store: EntityStore,
    id: string
  ): Promise<boolean> => {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    const existing = await database.get(store, id);
    if (!existing) return false;

    await database.delete(store, id);
    await addToSyncQueue('delete', store, id, { id });

    return true;
  }, [addToSyncQueue]);

  const getEntity = useCallback(async function <T>(store: EntityStore, id: string): Promise<SyncedEntity<T> | null> {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    const result = await database.get(store, id);
    return (result as SyncedEntity<T>) || null;
  }, []);

  const getAllEntities = useCallback(async function <T>(store: EntityStore): Promise<SyncedEntity<T>[]> {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    const results = await database.getAll(store);
    return results as SyncedEntity<T>[];
  }, []);

  const getPendingEntities = useCallback(async function <T>(store: EntityStore): Promise<SyncedEntity<T>[]> {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    const results = await database.getAllFromIndex(store, 'by-status', 'pending');
    return results as SyncedEntity<T>[];
  }, []);

  const getConflictEntities = useCallback(async function <T>(store: EntityStore): Promise<SyncedEntity<T>[]> {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    const results = await database.getAllFromIndex(store, 'by-status', 'conflict');
    return results as SyncedEntity<T>[];
  }, []);

  const markAsSynced = useCallback(async (
    store: EntityStore,
    id: string,
    serverVersion: number
  ): Promise<void> => {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    const entity = await database.get(store, id);
    if (entity) {
      entity.syncStatus = 'synced';
      entity.serverVersion = serverVersion;
      await database.put(store, entity);
    }
  }, []);

  const markAsConflict = useCallback(async (
    store: EntityStore,
    id: string,
    serverData: unknown
  ): Promise<void> => {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    const entity = await database.get(store, id);
    if (entity) {
      entity.syncStatus = 'conflict';
      entity.data = { ...entity.data, _serverData: serverData };
      await database.put(store, entity);
    }
  }, []);

  const resolveConflict = useCallback(async (
    store: EntityStore,
    id: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: unknown
  ): Promise<void> => {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    const entity = await database.get(store, id);
    if (!entity) return;

    if ((resolution === 'local' || resolution === 'merge') && mergedData) {
      entity.data = mergedData as Record<string, unknown>;
    } else if (resolution === 'server' && entity.data._serverData) {
      entity.data = entity.data._serverData as Record<string, unknown>;
      entity.serverVersion = entity.localVersion;
    }

    delete entity.data._serverData;
    entity.syncStatus = 'pending';
    entity.localVersion += 1;
    entity.updatedAt = new Date().toISOString();

    await database.put(store, entity);
    await addToSyncQueue('update', store, id, entity);
  }, [addToSyncQueue]);

  const getAllSyncQueue = useCallback(async (): Promise<SyncQueueItem[]> => {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    return database.getAll('syncQueue');
  }, []);

  const getSyncQueueCount = useCallback(async (): Promise<number> => {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    return database.count('syncQueue');
  }, []);

  const removeSyncQueueItem = useCallback(async (id: string): Promise<void> => {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    await database.delete('syncQueue', id);
  }, []);

  const clearSyncQueue = useCallback(async (): Promise<void> => {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    await database.clear('syncQueue');
  }, []);

  const updateSyncQueueRetry = useCallback(async (id: string): Promise<void> => {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    const item = await database.get('syncQueue', id);
    if (item) {
      item.retryCount += 1;
      await database.put('syncQueue', item);
    }
  }, []);

  const getSyncMeta = useCallback(async (): Promise<SyncMeta> => {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    const meta = await database.get('syncMeta', 'main');
    return meta || { lastSyncTime: null, serverVersions: {} };
  }, []);

  const updateSyncMeta = useCallback(async (meta: Partial<SyncMeta>): Promise<void> => {
    const database = dbRef.current;
    if (!database) throw new Error('Database not initialized');

    const existing = await getSyncMeta();
    const record = { id: 'main', ...existing, ...meta };
    await database.put('syncMeta', record as SyncMeta & { id: string });
  }, [getSyncMeta]);

  const value: DatabaseContextValue = {
    db,
    isReady,
    error,
    initDatabase,
    createEntity,
    updateEntity,
    deleteEntity,
    getEntity,
    getAllEntities,
    getPendingEntities,
    getConflictEntities,
    markAsSynced,
    markAsConflict,
    resolveConflict,
    getAllSyncQueue,
    getSyncQueueCount,
    removeSyncQueueItem,
    clearSyncQueue,
    updateSyncQueueRetry,
    getSyncMeta,
    updateSyncMeta
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextValue => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export async function initOfflineDB(): Promise<IDBPDatabase<GrowthOSDB>> {
  return createDatabase();
}

export async function getDB(): Promise<IDBPDatabase<GrowthOSDB>> {
  return createDatabase();
}
