import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType: string | null;
  downlink: number | null;
}

type NetworkCallback = (status: NetworkStatus) => void;

class NetworkDetector {
  private listeners: Set<NetworkCallback> = new Set();
  private currentStatus: NetworkStatus;

  constructor() {
    this.currentStatus = this.getInitialStatus();
    this.setupListeners();
  }

  private getInitialStatus(): NetworkStatus {
    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSlowConnection: false,
      effectiveType: null,
      downlink: null
    };
  }

  private getConnectionInfo(): Partial<NetworkStatus> {
    const nav = navigator as Navigator & {
      connection?: {
        effectiveType?: string;
        downlink?: number;
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
      };
    };

    const connection = nav.connection;
    if (!connection) return {};

    const isSlowConnection = ['slow-2g', '2g'].includes(connection.effectiveType || '');

    return {
      isSlowConnection,
      effectiveType: connection.effectiveType || null,
      downlink: connection.downlink || null
    };
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      this.updateStatus({ isOnline: true });
    };

    const handleOffline = () => {
      this.updateStatus({ isOnline: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const nav = navigator as Navigator & {
      connection?: {
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
      };
    };

    const connection = nav.connection;
    if (connection) {
      const handleChange = () => {
        this.updateStatus(this.getConnectionInfo());
      };
      connection.addEventListener('change', handleChange);
    }

    this.updateStatus(this.getConnectionInfo());
  }

  private updateStatus(updates: Partial<NetworkStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...updates };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.currentStatus));
  }

  subscribe(callback: NetworkCallback): () => void {
    this.listeners.add(callback);
    callback(this.currentStatus);
    return () => this.listeners.delete(callback);
  }

  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }
}

export const networkDetector = new NetworkDetector();

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(networkDetector.getStatus());

  useEffect(() => {
    return networkDetector.subscribe(setStatus);
  }, []);

  return status;
}

export function useIsOnline(): boolean {
  const status = useNetworkStatus();
  return status.isOnline;
}

export function useOfflineWarning(): { showWarning: boolean; message: string | null } {
  const status = useNetworkStatus();

  const showWarning = !status.isOnline;
  const message = !status.isOnline
    ? '您当前处于离线状态，数据将在恢复网络后同步'
    : null;

  return { showWarning, message };
}

export async function waitForOnline(): Promise<void> {
  if (navigator.onLine) return;

  return new Promise((resolve) => {
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };
    window.addEventListener('online', handleOnline);
  });
}

export function isServiceWorkerAvailable(): boolean {
  return 'serviceWorker' in navigator;
}

export function registerServiceWorker(scriptUrl: string): Promise<ServiceWorkerRegistration | void> {
  if (!isServiceWorkerAvailable()) {
    console.warn('Service Worker 不可用');
    return Promise.resolve();
  }

  return navigator.serviceWorker.register(scriptUrl).catch(error => {
    console.error('Service Worker 注册失败:', error);
    throw error;
  });
}
