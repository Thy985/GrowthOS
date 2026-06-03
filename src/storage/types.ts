/**
 * 本地存储层类型定义
 *
 * 设计原则：
 * 1. 业务代码不直接 import idb / localStorage，只看到 StorageAdapter<T>
 * 2. 后端实现（IndexedDB / localStorage / Memory）可注入
 * 3. 错误统一为 StorageError，不向上层泄漏底层异常
 */

// 任何业务实体必须至少有 id 字段
export interface BaseEntity {
  id: string,
}

// 后端选型枚举（重导出 config/storageConfig 中的权威定义）
export type { StorageBackendKind } from './config/storageConfig';

// 索引查询的可比较字段
export type QueryValue = string | number | boolean | null;

export interface QueryOptions {
  // 索引名（来自 DBSchema 定义的 indexes）
  index?: string,
  // 范围查询
  range?: { gte?: QueryValue, lte?: QueryValue, gt?: QueryValue, lt?: QueryValue },
  // 排序字段（运行时按字符串名；不限于 BaseEntity 字段以支持各实体的属性）
  sortBy?: string,
  sortDirection?: 'asc' | 'desc',
  // 限制
  limit?: number,
  offset?: number,
}

// 存储适配器接口
// 所有方法都是 async，便于统一为 Promise 风格
export interface StorageAdapter<T extends BaseEntity> {
  /** 初始化（打开连接、创建表）。幂等。 */
  init(): Promise<void>,

  /** 根据 id 查询单个实体。 */
  get(id: string): Promise<T | null>,

  /** 查询所有实体。警告：大表慎用。 */
  getAll(): Promise<T[]>,

  /** 索引/范围查询。 */
  query(options?: QueryOptions): Promise<T[]>,

  /** 写入（新建或覆盖）。 */
  put(entity: T): Promise<T>,

  /** 批量写入。 */
  putMany(entities: T[]): Promise<T[]>,

  /** 删除。返回是否实际删除。 */
  delete(id: string): Promise<boolean>,

  /** 清空整张表。 */
  clear(): Promise<void>,

  /** 数量。 */
  count(): Promise<number>,

  /** 关闭连接（如 IndexedDB）。 */
  close(): Promise<void>,
}

// 工厂函数签名
export type AdapterFactory<T extends BaseEntity> = () => Promise<StorageAdapter<T>>;