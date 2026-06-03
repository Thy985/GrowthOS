/**
 * 存储配额监控
 *
 * 浏览器 storage 配额（quota）和使用量（usage）通过 navigator.storage.estimate() 拿。
 * 不同浏览器配额不同：
 * - Chrome / Edge: 约 60% 磁盘
 * - Firefox: 约 50% 磁盘
 * - Safari: ~1GB 起，提示用户后可申请更多
 *
 * 用途：
 * 1. 启动时 / 定期 check，给用户"存储快满了"提示
 * 2. 写入前预检：接近配额时拒绝写入或触发清理流程
 * 3. 跨 tab 监听 storage 事件（navigator.storage 上有 quota 变更事件，但很弱）
 *
 * 降级：
 *   没有 navigator.storage.estimate() → noop（isSupported = false）
 */

export type QuotaLevel = 'ok' | 'warn' | 'critical' | 'exceeded';

export interface QuotaStatus {
  isSupported: boolean,
  usage: number,         // 已用 bytes（0 表示未知）
  quota: number,         // 总配额 bytes（0 表示未知）
  percent: number,       // 0-100（0 表示未知）
  level: QuotaLevel,
  timestamp: number,
}

export interface QuotaMonitorOptions {
  /** warn 阈值百分比；默认 80 */
  warnPercent?: number,
  /** critical 阈值百分比；默认 95 */
  criticalPercent?: number,
  /** exceeded 阈值百分比；默认 100（不可能） */
  exceededPercent?: number,
  /** 定期检查间隔（ms）；默认 60000 */
  intervalMs?: number,
}

export type QuotaSubscriber = (status: QuotaStatus) => void;

const DEFAULT_WARN = 80;
const DEFAULT_CRITICAL = 95;
const DEFAULT_EXCEEDED = 100;
const DEFAULT_INTERVAL = 60_000;

export class QuotaMonitor {
  private readonly options: Required<QuotaMonitorOptions>;
  private readonly subscribers: Set<QuotaSubscriber> = new Set();
  private lastStatus: QuotaStatus;
  private timer: ReturnType<typeof setInterval> | null = null;
  private inFlight: Promise<QuotaStatus> | null = null;

  constructor(options: QuotaMonitorOptions = {}) {
    this.options = {
      warnPercent: options.warnPercent ?? DEFAULT_WARN,
      criticalPercent: options.criticalPercent ?? DEFAULT_CRITICAL,
      exceededPercent: options.exceededPercent ?? DEFAULT_EXCEEDED,
      intervalMs: options.intervalMs ?? DEFAULT_INTERVAL,
    };
    this.lastStatus = {
      isSupported: this.isSupported,
      usage: 0,
      quota: 0,
      percent: 0,
      level: 'ok',
      timestamp: Date.now(),
    };
  }

  get isSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.storage?.estimate === 'function';
  }

  get status(): QuotaStatus {
    return this.lastStatus;
  }

  /**
   * 立刻检查一次（多个并发调用合并）
   */
  async check(): Promise<QuotaStatus> {
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.doCheck().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  /**
   * 启动定期轮询
   */
  start(): void {
    if (this.timer || !this.isSupported) return;
    this.timer = setInterval(() => {
      void this.check();
    }, this.options.intervalMs);
    void this.check();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  subscribe(subscriber: QuotaSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  /**
   * 写入前预检：根据当前 usage + 预计写入大小判断是否会超
   * 不发起新查询，用 lastStatus 即可（实时性要求不高）
   */
  canWrite(estimatedBytes: number): { ok: boolean, reason?: string } {
    const s = this.lastStatus;
    if (!s.isSupported || s.quota === 0) return { ok: true };
    const projectedUsage = s.usage + estimatedBytes;
    if (projectedUsage > s.quota) {
      return {
        ok: false,
        reason: `storage quota would be exceeded: ${projectedUsage} > ${s.quota} bytes`,
      };
    }
    if (projectedUsage / s.quota * 100 >= this.options.exceededPercent) {
      return {
        ok: false,
        reason: `projected usage at ${projectedUsage} bytes hits exceeded threshold`,
      };
    }
    return { ok: true };
  }

  private async doCheck(): Promise<QuotaStatus> {
    if (!this.isSupported) {
      return this.lastStatus;
    }
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage ?? 0;
      const quota = estimate.quota ?? 0;
      const percent = quota > 0 ? (usage / quota) * 100 : 0;
      const level = this.computeLevel(percent);
      const status: QuotaStatus = {
        isSupported: true,
        usage,
        quota,
        percent,
        level,
        timestamp: Date.now(),
      };
      this.lastStatus = status;
      this.notify(status);
      return status;
    } catch (err) {
      console.warn('[QuotaMonitor] estimate failed:', err);
      return this.lastStatus;
    }
  }

  private computeLevel(percent: number): QuotaLevel {
    if (percent >= this.options.exceededPercent) return 'exceeded';
    if (percent >= this.options.criticalPercent) return 'critical';
    if (percent >= this.options.warnPercent) return 'warn';
    return 'ok';
  }

  private notify(status: QuotaStatus): void {
    this.subscribers.forEach((sub) => {
      try {
        sub(status);
      } catch (err) {
        console.error('[QuotaMonitor] subscriber error:', err);
      }
    });
  }
}

/** 全局单例（懒初始化） */
let globalMonitor: QuotaMonitor | null = null;
export function getQuotaMonitor(options?: QuotaMonitorOptions): QuotaMonitor {
  if (!globalMonitor) {
    globalMonitor = new QuotaMonitor(options);
  }
  return globalMonitor;
}
