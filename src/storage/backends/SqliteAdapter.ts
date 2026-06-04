/**
 * SqliteAdapter — 通过 SqliteClient 适配到 StorageAdapter 接口
 *
 * 用途：
 * - 在 Native（Capacitor iOS / Android）下走原生 SQLite
 * - 单一表，typed（泛型 T）
 *
 * 设计动机：
 * - 业务只看到 StorageAdapter<T>，不感知 SQLite
 * - SqliteClient 是注入的；测试时用 InMemorySqliteClient 替代原生实现
 *
 * 限制：
 * - 当前不暴露事务给业务（put/putMany 各自原子）
 * - 不暴露多列索引（业务通过 query 走 sortBy + range）
 */

import type { BaseEntity, StorageAdapter, QueryOptions } from '../types';
import { StorageError } from '../errors';
import type { SqliteClient, SqliteTableName } from './sqlite/SqliteClient';

export class SqliteAdapter<T extends BaseEntity> implements StorageAdapter<T> {
  private initialized = false;

  constructor(
    private readonly client: SqliteClient,
    private readonly table: SqliteTableName,
  ) {
    if (!table) {
      throw new StorageError('INVALID_INPUT', 'SqliteAdapter requires a non-empty table name');
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      // 单表 schema 注册：让 client 知道这个表
      await this.client.init({ tables: [this.table] });
      this.initialized = true;
    } catch (err) {
      throw StorageError.from(err, `Failed to init SqliteAdapter for ${this.table}`);
    }
  }

  private ensureInit(): void {
    if (!this.initialized) {
      throw new StorageError('PLATFORM_UNAVAILABLE', 'SqliteAdapter not initialized');
    }
  }

  async get(id: string): Promise<T | null> {
    this.ensureInit();
    try {
      const row = await this.client.get(this.table, id);
      return (row as T) ?? null;
    } catch (err) {
      throw StorageError.from(err, `Failed to get ${id} from ${this.table}`);
    }
  }

  async getAll(): Promise<T[]> {
    this.ensureInit();
    try {
      const rows = await this.client.getAll(this.table);
      return rows as T[];
    } catch (err) {
      throw StorageError.from(err, `Failed to getAll from ${this.table}`);
    }
  }

  async query(options: QueryOptions = {}): Promise<T[]> {
    this.ensureInit();
    try {
      const rows = await this.client.query(this.table, options);
      return rows as T[];
    } catch (err) {
      throw StorageError.from(err, `Failed to query ${this.table}`);
    }
  }

  async put(entity: T): Promise<T> {
    this.ensureInit();
    if (!entity.id) {
      throw new StorageError('INVALID_INPUT', 'Entity must have an id');
    }
    try {
      await this.client.put(this.table, entity);
      return entity;
    } catch (err) {
      throw StorageError.from(err, `Failed to put ${entity.id} into ${this.table}`);
    }
  }

  async putMany(entities: T[]): Promise<T[]> {
    this.ensureInit();
    try {
      await this.client.putMany(this.table, entities);
      return entities;
    } catch (err) {
      throw StorageError.from(err, `Failed to putMany into ${this.table}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    this.ensureInit();
    try {
      return await this.client.delete(this.table, id);
    } catch (err) {
      throw StorageError.from(err, `Failed to delete ${id} from ${this.table}`);
    }
  }

  async clear(): Promise<void> {
    this.ensureInit();
    try {
      await this.client.clear(this.table);
    } catch (err) {
      throw StorageError.from(err, `Failed to clear ${this.table}`);
    }
  }

  async count(): Promise<number> {
    this.ensureInit();
    try {
      return await this.client.count(this.table);
    } catch (err) {
      throw StorageError.from(err, `Failed to count ${this.table}`);
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.close();
    } catch (err) {
      throw StorageError.from(err, `Failed to close ${this.table}`);
    }
    this.initialized = false;
  }
}
