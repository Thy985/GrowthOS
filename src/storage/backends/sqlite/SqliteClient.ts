/**
 * SqliteClient — SQLite 客户端抽象
 *
 * 用途：
 * - SqliteAdapter 只依赖这个接口，不直接 import 任何具体 SQLite 实现
 * - 真实环境（Capacitor Native）注入 @capacitor-community/sqlite 的封装
 * - 测试 / Web 降级：注入 InMemorySqliteClient（基于 Map 的内存版）
 *
 * 设计动机：
 * - 把"如何跟 SQLite 引擎对话"从 adapter 抽离
 * - 让 SqliteAdapter 可以在没有原生环境时跑单元测试
 * - 切换 SQLite 实现（如 sql.js / capacitor-sqlite / node-sqlite3）零改 adapter
 *
 * 注意：
 * - 本文件不 import @capacitor-community/sqlite（避免给 web build 引入原生依赖）
 * - 真正接入 native 时，新建 `capacitorSqliteClient.ts` 实现这个接口即可
 */

import type { BaseEntity, QueryValue } from '../../types';
import type { QueryOptions } from '../../types';

/** 一条实体的 SQL 表名约定（snake_case）：表名 = entity store 名 */
export type SqliteTableName = string;

/** 排序方向 */
export type SortDirection = 'asc' | 'desc';

/**
 * SqliteClient 最小接口
 *
 * 实现者需要保证：
 * - 每个表有一个主键列 `id TEXT PRIMARY KEY`
 * - get/put/delete/clear/count 直接对单表操作
 * - query 支持简单等值 / 范围 + 排序 + limit/offset
 * - 多个并发调用串行化（避免多 tab 写冲突）
 */
export interface SqliteClient {
  /** 打开 DB / 创建表（幂等） */
  init(schema: SqliteSchema): Promise<void>,

  /** 读单条 */
  get(table: SqliteTableName, id: string): Promise<BaseEntity | null>,

  /** 读全部（按 id 排序） */
  getAll(table: SqliteTableName): Promise<BaseEntity[]>,

  /** 写一条（覆盖） */
  put(table: SqliteTableName, entity: BaseEntity): Promise<void>,

  /** 批量写（事务） */
  putMany(table: SqliteTableName, entities: BaseEntity[]): Promise<void>,

  /** 删一条 */
  delete(table: SqliteTableName, id: string): Promise<boolean>,

  /** 清空表 */
  clear(table: SqliteTableName): Promise<void>,

  /** 数量 */
  count(table: SqliteTableName): Promise<number>,

  /** 索引/范围查询（简化版：仅支持等值 + 简单排序） */
  query(table: SqliteTableName, options: QueryOptions): Promise<BaseEntity[]>,

  /** 关闭 */
  close(): Promise<void>,
}

/** Schema 元数据：哪些表是 GrowthOS 业务表 */
export interface SqliteSchema {
  tables: SqliteTableName[],
}

/* ============================================================ */
/* InMemorySqliteClient                                         */
/* - 测试 / Web 降级 / 平台未检测到 native 时的兜底               */
/* - 单进程，多 tab 走 IDB 或 LS                                */
/* ============================================================ */

export class InMemorySqliteClient implements SqliteClient {
  private data = new Map<SqliteTableName, Map<string, BaseEntity>>();
  private initialized = false;

  async init(schema: SqliteSchema): Promise<void> {
    this.initialized = true;
    for (const table of schema.tables) {
      if (!this.data.has(table)) this.data.set(table, new Map());
    }
  }

  private ensureInit(): void {
    if (!this.initialized) throw new Error('InMemorySqliteClient not initialized');
  }

  private table(name: SqliteTableName): Map<string, BaseEntity> {
    this.ensureInit();
    let t = this.data.get(name);
    if (!t) {
      t = new Map();
      this.data.set(name, t);
    }
    return t;
  }

  async get(table: string, id: string): Promise<BaseEntity | null> {
    return this.table(table).get(id) ?? null;
  }

  async getAll(table: string): Promise<BaseEntity[]> {
    return Array.from(this.table(table).values());
  }

  async put(table: string, entity: BaseEntity): Promise<void> {
    if (!entity.id) throw new Error('Entity must have an id');
    this.table(table).set(entity.id, entity);
  }

  async putMany(table: string, entities: BaseEntity[]): Promise<void> {
    const t = this.table(table);
    for (const e of entities) {
      if (!e.id) throw new Error('Entity must have an id');
      t.set(e.id, e);
    }
  }

  async delete(table: string, id: string): Promise<boolean> {
    return this.table(table).delete(id);
  }

  async clear(table: string): Promise<void> {
    this.table(table).clear();
  }

  async count(table: string): Promise<number> {
    return this.table(table).size;
  }

  async query(table: string, options: QueryOptions = {}): Promise<BaseEntity[]> {
    let results = Array.from(this.table(table).values());

    if (options.range) {
      const { gte, lte, gt, lt } = options.range;
      const key = (options.sortBy as string) ?? 'id';
      results = results.filter((item) => {
        const v = (item as unknown as Record<string, QueryValue>)[key];
        if (v === undefined || v === null) return false;
        if (gte !== undefined && gte !== null && v < gte) return false;
        if (lte !== undefined && lte !== null && v > lte) return false;
        if (gt !== undefined && gt !== null && v <= gt) return false;
        if (lt !== undefined && lt !== null && v >= lt) return false;
        return true;
      });
    }

    if (options.sortBy) {
      const dir: SortDirection = options.sortDirection === 'desc' ? 'desc' : 'asc';
      const key = options.sortBy as string;
      results.sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[key];
        const bv = (b as unknown as Record<string, unknown>)[key];
        if (av === bv) return 0;
        if (av === undefined || av === null) return 1;
        if (bv === undefined || bv === null) return -1;
        if (av < bv) return dir === 'asc' ? -1 : 1;
        return dir === 'asc' ? 1 : -1;
      });
    }

    if (options.offset && options.offset > 0) {
      results = results.slice(options.offset);
    }
    if (options.limit !== undefined && options.limit >= 0) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  async close(): Promise<void> {
    this.data.clear();
    this.initialized = false;
  }

  // 测试辅助
  has(table: string, id: string): boolean {
    return this.table(table).has(id);
  }

  size(table: string): number {
    return this.table(table).size;
  }
}

/* ============================================================ */
/* 平台检测                                                     */
/* ============================================================ */

/**
 * 检测当前是否在 Capacitor Native 容器中
 *
 * 在 web / jest / node 下返回 false
 * 真接入 native 时：动态 import '@capacitor/core' 并取 isNativePlatform()
 */
export async function isNativePlatform(): Promise<boolean> {
  // 简化：直接用 navigator.userAgent 探测（避免给 web build 引入 @capacitor/core）
  // 真接入时替换为：
  //   const { Capacitor } = await import('@capacitor/core');
  //   return Capacitor.isNativePlatform();
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // Capacitor 在 iOS 上会带 "Capacitor" UA token，Android 上 WebView 也带
  // 但也可能被 mock；真实 native 应由插件本身验证（checkConnection）
  return /Capacitor/i.test(ua);
}

/**
 * 创建平台合适的 SqliteClient
 *
 * - Native (Capacitor)：用真实 SQLite 插件（待接入）
 * - Web / 单元测试：降级到 InMemorySqliteClient
 */
export async function createPlatformSqliteClient(): Promise<SqliteClient> {
  if (await isNativePlatform()) {
    // 真接入 native 时这里动态 import capacitor sqlite 插件
    // 暂时统一走 in-memory（避免 web build 引入未安装的原生包）
    // const { createCapacitorSqliteClient } = await import('./capacitorSqliteClient');
    // return createCapacitorSqliteClient();
  }
  return new InMemorySqliteClient();
}
