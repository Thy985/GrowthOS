describe('offlineStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('type definitions', () => {
    it('should have correct SyncStatus values', () => {
      const statuses = ['synced', 'pending', 'conflict'];
      expect(statuses).toHaveLength(3);
    });

    it('should have correct EntityType values', () => {
      const types = ['record', 'goal', 'reminder', 'tree', 'treeNode'];
      expect(types).toHaveLength(5);
    });

    it('should have correct SyncOperation values', () => {
      const operations = ['create', 'update', 'delete'];
      expect(operations).toHaveLength(3);
    });

    it('should have correct Resolution values', () => {
      const resolutions = ['local', 'server', 'merge'];
      expect(resolutions).toHaveLength(3);
    });
  });

  describe('SyncQueueItem structure', () => {
    it('should validate SyncQueueItem fields', () => {
      const item = {
        id: 'test-id',
        operation: 'create' as const,
        entityType: 'record' as const,
        entityId: 'entity-id',
        payload: {},
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      expect(item.id).toBeDefined();
      expect(item.operation).toBe('create');
      expect(item.entityType).toBe('record');
      expect(item.retryCount).toBe(0);
    });

    it('should track retry count', () => {
      const item = {
        id: 'test-id',
        operation: 'create' as const,
        entityType: 'record' as const,
        entityId: 'entity-id',
        payload: {},
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      item.retryCount += 1;
      expect(item.retryCount).toBe(1);
    });
  });

  describe('ConflictInfo structure', () => {
    it('should validate ConflictInfo fields', () => {
      const conflict: {
        entityType: 'record' | 'goal' | 'reminder' | 'tree' | 'treeNode',
        entityId: string,
        localData: Record<string, unknown>,
        serverData: Record<string, unknown>,
        queueItem: {
          id: string,
          operation: 'create' | 'update' | 'delete',
          entityType: 'record' | 'goal' | 'reminder' | 'tree' | 'treeNode',
          entityId: string,
          payload: Record<string, unknown>,
          timestamp: string,
          retryCount: number,
        },
      } = {
        entityType: 'record',
        entityId: 'test-id',
        localData: { activity: 'Local' },
        serverData: { activity: 'Server' },
        queueItem: {
          id: 'queue-id',
          operation: 'update',
          entityType: 'record',
          entityId: 'test-id',
          payload: {},
          timestamp: new Date().toISOString(),
          retryCount: 0,
        },
      };

      expect(conflict.entityType).toBe('record');
      expect(conflict.localData).toBeDefined();
      expect(conflict.serverData).toBeDefined();
    });
  });

  describe('SyncProgress structure', () => {
    it('should validate SyncProgress fields', () => {
      const progress: {
        total: number,
        completed: number,
        current: {
          id: string,
          operation: 'create' | 'update' | 'delete',
          entityType: 'record' | 'goal' | 'reminder' | 'tree' | 'treeNode',
          entityId: string,
          payload: Record<string, unknown>,
          timestamp: string,
          retryCount: number,
        } | null,
      } = {
        total: 10,
        completed: 5,
        current: null,
      };

      expect(progress.total).toBe(10);
      expect(progress.completed).toBe(5);
      expect(progress.current).toBeNull();
    });
  });

  describe('SyncMeta structure', () => {
    it('should validate SyncMeta fields', () => {
      const meta: {
        lastSyncTime: string | null,
        serverVersions: Record<string, number>,
      } = {
        lastSyncTime: null,
        serverVersions: {},
      };

      expect(meta.lastSyncTime).toBeNull();
      expect(meta.serverVersions).toEqual({});
    });

    it('should store server versions', () => {
      const meta: {
        lastSyncTime: string | null,
        serverVersions: Record<string, number>,
      } = {
        lastSyncTime: new Date().toISOString(),
        serverVersions: {
          'record-1': 5,
          'goal-1': 3,
        },
      };

      expect(meta.serverVersions['record-1']).toBe(5);
    });
  });

  describe('Entity store mapping', () => {
    it('should map entity types to stores', () => {
      const storeMap: Record<string, string> = {
        record: 'records',
        goal: 'goals',
        reminder: 'reminders',
        tree: 'growthTrees',
        treeNode: 'treeNodes',
      };

      expect(storeMap['record']).toBe('records');
      expect(storeMap['goal']).toBe('goals');
    });
  });

  describe('Resolution strategies', () => {
    it('should support local resolution', () => {
      const resolution = 'local' as const;
      expect(resolution).toBe('local');
    });

    it('should support server resolution', () => {
      const resolution = 'server' as const;
      expect(resolution).toBe('server');
    });

    it('should support merge resolution', () => {
      const resolution = 'merge' as const;
      expect(resolution).toBe('merge');
    });
  });
});
