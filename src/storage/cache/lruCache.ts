/**
 * LRU 内存缓存
 *
 * 用途：包裹 Repository / StorageAdapter 的读路径，
 *       减少对 IndexedDB 的重复查询。
 *
 * 设计：
 * - 通用 LRU，键 = string，值 = unknown（业务侧 cast）
 * - 命中时移动到队尾（最近使用）
 * - 容量满时淘汰队首（最久未用）
 * - TTL 可选（默认不过期）
 * - 写入侧通过 invalidate() 失效
 *
 * 边界：
 * - get 命中后**不主动失效**：业务侧必须显式调用 invalidate
 * - 这是 LRU 不是 ARC/LIRS，但够用
 */

export interface LRUOptions {
  /** 最大条目数；默认 500 */
  maxSize?: number,
  /** 单条 TTL（ms）；默认不限 */
  ttlMs?: number,
}

interface Entry<V> {
  value: V,
  insertedAt: number,
}

export class LRUCache<V = unknown> {
  private readonly maxSize: number;
  private readonly ttlMs: number | null;
  private readonly map = new Map<string, Entry<V>>();

  constructor(options: LRUOptions = {}) {
    this.maxSize = options.maxSize ?? 500;
    this.ttlMs = options.ttlMs ?? null;
  }

  get(key: string): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (this.ttlMs !== null && Date.now() - entry.insertedAt > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    // 命中：移到队尾（最近使用）
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      // 淘汰队首
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) this.map.delete(oldestKey);
    }
    this.map.set(key, { value, insertedAt: Date.now() });
  }

  invalidate(key: string): boolean {
    return this.map.delete(key);
  }

  invalidateAll(): void {
    this.map.clear();
  }

  has(key: string): boolean {
    const entry = this.map.get(key);
    if (!entry) return false;
    if (this.ttlMs !== null && Date.now() - entry.insertedAt > this.ttlMs) {
      this.map.delete(key);
      return false;
    }
    return true;
  }

  get size(): number {
    return this.map.size;
  }

  /** 测试用：拿到所有当前 key（不触发 LRU 重排） */
  keys(): string[] {
    return [...this.map.keys()];
  }
}
