/**
 * IndexedDB 连接管理
 *
 * 单例 + 懒初始化
 * 内部自动按 migrations 数组顺序执行未跑的迁移
 */

import { openDB, type IDBPDatabase } from 'idb';
import { DB_NAME, CURRENT_DB_VERSION, type GrowthOSDB } from './types';
import { migrations } from './migrations';
import { StorageError } from '../errors';

let dbInstance: IDBPDatabase<GrowthOSDB> | null = null;
let initPromise: Promise<IDBPDatabase<GrowthOSDB>> | null = null;

export async function openGrowthDB(): Promise<IDBPDatabase<GrowthOSDB>> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = await openDB<GrowthOSDB>(DB_NAME, CURRENT_DB_VERSION, {
        upgrade: async (db, oldVersion) => {
          // 按顺序执行未跑的迁移
          for (let v = oldVersion; v < CURRENT_DB_VERSION; v++) {
            const migration = migrations[v];
            if (migration) {
              await migration.up(db);
            }
          }
        },
        blocked() {
          console.warn('[storage] DB upgrade blocked by older tab');
        },
        blocking() {
          // 别的 tab 想升级，关掉自己的连接
          if (dbInstance) {
            dbInstance.close();
            dbInstance = null;
            initPromise = null;
          }
        },
        terminated() {
          dbInstance = null;
          initPromise = null;
        },
      });
      dbInstance = db;
      return db;
    } catch (err) {
      initPromise = null;
      throw StorageError.from(err, 'Failed to open IndexedDB');
    }
  })();

  return initPromise;
}

export async function getDB(): Promise<IDBPDatabase<GrowthOSDB>> {
  return openGrowthDB();
}

/**
 * 测试/重置用：删除整个数据库
 * 生产代码不应当调用
 */
export async function resetDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    initPromise = null;
  }
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve(); // 别的 tab 还在用，不阻塞
  });
}
