import { AppError, ErrorFactory } from './ApiResponse';

export interface RetryConfig {
  maxRetries: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
  retryableErrors?: string[],
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['NETWORK_ERROR', 'STORAGE_ERROR', 'INTERNAL_ERROR']
};

export interface RequestConfig {
  signal?: AbortSignal,
  timeout?: number,
  retry?: Partial<RetryConfig>,
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === config.maxRetries) {
        break;
      }

      const appError = error instanceof AppError ? error : ErrorFactory.unknown(error);
      
      if (config.retryableErrors && !config.retryableErrors.includes(appError.code)) {
        throw error;
      }

      await sleep(delay);
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError!;
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
}

export class RequestDeduplicator {
  private pending = new Map<string, Promise<unknown>>();

  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.pending.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = fn()
      .finally(() => {
        this.pending.delete(key);
      });

    this.pending.set(key, promise);
    return promise as Promise<T>;
  }

  cancel(key: string): void {
    const promise = this.pending.get(key);
    if (promise) {
      this.pending.delete(key);
    }
  }

  cancelAll(): void {
    this.pending.clear();
  }
}

export const deduplicator = new RequestDeduplicator();

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class RequestQueue {
  private queue: Array<{
    id: string,
    execute: () => Promise<unknown>,
    priority?: number,
    resolve: (value: unknown) => void,
    reject: (error: unknown) => void,
  }> = [];
  private processing = false;
  private maxConcurrent: number;
  private maxQueueSize: number;

  constructor(maxConcurrent = 3, maxQueueSize = 50) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueueSize = maxQueueSize;
  }

  async add<T>(request: { id: string, execute: () => Promise<T>, priority?: number }): Promise<T> {
    if (this.queue.length >= this.maxQueueSize) {
      throw ErrorFactory.validation('Request queue is full');
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        ...request,
        resolve: resolve as (value: unknown) => void,
        reject
      });
      
      this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      void this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.maxConcurrent);
      await Promise.allSettled(batch.map(request => 
        request.execute()
          .then(request.resolve)
          .catch(request.reject)
      ));
    }

    this.processing = false;
  }

  clear(): void {
    this.queue = [];
  }

  get size(): number {
    return this.queue.length;
  }
}

export const requestQueue = new RequestQueue();
