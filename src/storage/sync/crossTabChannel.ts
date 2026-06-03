/**
 * BroadcastChannel 跨 tab 同步
 *
 * 场景：用户在 A tab 创建了一条记录，希望 B tab 立刻看到。
 *       不靠轮询，靠 BroadcastChannel（postMessage 广播）。
 *
 * 消息结构：
 *   {
 *     type: 'put' | 'delete' | 'clear',
 *     store: EntityStore,
 *     id?: string,
 *     source: <unique-tab-id>,  // 用于避免自己收自己的消息
 *     timestamp: <ms>
 *   }
 *
 * 用法（典型）：
 *   const channel = new CrossTabChannel('growthos-records');
 *   channel.broadcastPut('records', id);
 *   channel.subscribe((event) => { ... });  // 失效本地缓存 / 重新拉取
 *
 * 降级：
 *   没有 BroadcastChannel API → 静默 noop（所有方法安全返回）
 *
 * 边界：
 *   - 不携带 payload（消息体尽量小，避免 postMessage 限制）
 *   - 接收端拿到事件后应该重新查 IDB，不要信任消息里的 id 一定还有
 *   - StorageEvent（localStorage 的事件）不重复走这里
 */

import type { EntityStore } from '../schema/types';

export type CrossTabEventType = 'put' | 'delete' | 'clear';

export interface CrossTabEvent {
  type: CrossTabEventType,
  store: EntityStore,
  id?: string,
  source: string,
  timestamp: number,
}

export type CrossTabSubscriber = (event: CrossTabEvent) => void;

const SUPPORTED = typeof BroadcastChannel !== 'undefined';

function generateTabId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class CrossTabChannel {
  private readonly channel: BroadcastChannel | null;
  private readonly tabId: string;
  private readonly subscribers: Set<CrossTabSubscriber> = new Set();

  constructor(channelName: string) {
    this.tabId = generateTabId();
    if (SUPPORTED) {
      this.channel = new BroadcastChannel(channelName);
      this.channel.addEventListener('message', (ev: MessageEvent<CrossTabEvent>) => {
        const event = ev.data;
        if (!event || event.source === this.tabId) return;
        this.subscribers.forEach((sub) => {
          try {
            sub(event);
          } catch (err) {
            // 订阅者错误不能影响其他订阅者
            console.error('[CrossTabChannel] subscriber error:', err);
          }
        });
      });
    } else {
      this.channel = null;
    }
  }

  get isSupported(): boolean {
    return this.channel !== null;
  }

  get id(): string {
    return this.tabId;
  }

  broadcastPut(store: EntityStore, id: string): void {
    this.broadcast({ type: 'put', store, id, source: this.tabId, timestamp: Date.now() });
  }

  broadcastDelete(store: EntityStore, id: string): void {
    this.broadcast({ type: 'delete', store, id, source: this.tabId, timestamp: Date.now() });
  }

  broadcastClear(store: EntityStore): void {
    this.broadcast({ type: 'clear', store, source: this.tabId, timestamp: Date.now() });
  }

  subscribe(subscriber: CrossTabSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  close(): void {
    this.subscribers.clear();
    this.channel?.close();
  }

  private broadcast(event: CrossTabEvent): void {
    this.channel?.postMessage(event);
  }
}

/**
 * 默认 channel name，按 store 区分（避免 records 变更误触发 goals 缓存失效）
 */
export function getDefaultChannelName(store: EntityStore): string {
  return `growthos:${store}`;
}
