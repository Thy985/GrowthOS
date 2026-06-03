/**
 * StorageSettings 页面
 *
 * 用途：
 * 1. 显示当前存储配额（navigator.storage.estimate）
 * 2. 显示每个 IndexedDB store 的记录数
 * 3. 提供"清空所有数据"按钮（清 IDB + LocalStorage 后 reload）
 *
 * 这是 dev/工具型功能。生产用户偶尔用（"我想重置应用"）。
 * 真正的"运行时切换 backend"留作后续（见 ARCHITECTURE.md）。
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getQuotaMonitor } from '../../storage/quota';
import { getDB, resetDatabase } from '../../storage/schema';
import { ENTITY_STORES, type EntityStore } from '../../storage/schema/types';
import { getStorageBackendConfig, type StorageBackendKind } from '../../storage/config';

interface StoreStats {
  store: EntityStore,
  count: number,
}

interface QuotaInfo {
  isSupported: boolean,
  usage: number,
  quota: number,
  percent: number,
  level: 'ok' | 'warn' | 'critical' | 'exceeded',
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** 内部 hook：拉取每个 store 的 count + 配额信息 */
export function useStorageStats() {
  const [storeStats, setStoreStats] = useState<StoreStats[]>([]);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await getDB();
      const counts = await Promise.all(
        ENTITY_STORES.map(async (store) => ({
          store,
          count: await db.count(store),
        })),
      );
      setStoreStats(counts);

      const monitor = getQuotaMonitor();
      if (monitor.isSupported) {
        const status = await monitor.check();
        setQuota({
          isSupported: true,
          usage: status.usage,
          quota: status.quota,
          percent: status.percent,
          level: status.level,
        });
      } else {
        setQuota({ isSupported: false, usage: 0, quota: 0, percent: 0, level: 'ok' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { storeStats, quota, loading, error, refresh };
}

/** 清空所有存储：删 IDB + 清 LocalStorage + 重新加载 */
export async function clearAllStorage(): Promise<void> {
  await resetDatabase();
  localStorage.clear();
  sessionStorage.clear();
  // 强制重载，让所有 service 单例重建
  try {
    window.location.reload();
  } catch {
    /* 忽略：测试环境 */
  }
}

/**
 * 切换 storage backend
 * 持久化到 LocalStorage，调用方需自行 reload。
 */
export function switchStorageBackend(kind: StorageBackendKind): void {
  getStorageBackendConfig().setStorageBackend(kind);
  try {
    window.location.reload();
  } catch {
    /* 忽略：测试环境 */
  }
}

/** BackendCard：选 IDB / LS / In-Memory */
const BACKEND_OPTIONS: { kind: StorageBackendKind, label: string, description: string, warning?: string }[] = [
  {
    kind: 'indexeddb',
    label: 'IndexedDB（推荐）',
    description: '容量大、支持索引、跨 tab 同步、自动持久化',
  },
  {
    kind: 'localStorage',
    label: 'LocalStorage',
    description: '单 store ~5MB 上限、跨 tab 即时同步、简单可靠',
    warning: '容量小，不适合大量记录/聊天消息',
  },
  {
    kind: 'inMemory',
    label: 'In-Memory（内存）',
    description: '纯内存、刷新清空、用于测试 / 调试',
    warning: '刷新或切换路由后数据丢失',
  },
];

const BackendCard: React.FC = () => {
  const config = getStorageBackendConfig();
  const [current, setCurrent] = useState<StorageBackendKind>(config.getStorageBackend());
  const [pending, setPending] = useState<StorageBackendKind | null>(null);

  // 订阅 backend 变化（应对其他来源的切换）
  useEffect(() => {
    const unsubscribe = config.subscribe((kind) => setCurrent(kind));
    return unsubscribe;
  }, [config]);

  const handleSelect = (kind: StorageBackendKind) => {
    if (kind === current) return;
    setPending(kind);
  };

  const handleConfirm = () => {
    if (pending) {
      switchStorageBackend(pending);
      // reload 触发，下面不执行
    }
  };

  return (
    <Card
      title="数据后端"
      subtitle="决定所有业务数据存哪里（重启后保持）"
    >
      <div className="space-y-3">
        {BACKEND_OPTIONS.map((opt) => {
          const isCurrent = opt.kind === current;
          return (
            <label
              key={opt.kind}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                isCurrent
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20'
                  : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border)]'
              }`}
            >
              <input
                type="radio"
                name="storage-backend"
                value={opt.kind}
                checked={isCurrent}
                onChange={() => handleSelect(opt.kind)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[var(--color-text-primary)]">
                  {opt.label}
                  {isCurrent && <span className="ml-2 text-xs text-emerald-600">当前</span>}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {opt.description}
                </div>
                {opt.warning && (
                  <div className="text-xs text-amber-600 mt-1">⚠ {opt.warning}</div>
                )}
              </div>
            </label>
          );
        })}

        {pending && (
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
            <span className="text-sm text-amber-600">
              确定切到 {
                BACKEND_OPTIONS.find((o) => o.kind === pending)?.label
              }？这会重新加载页面。
            </span>
            <Button variant="primary" size="small" onClick={handleConfirm}>
              确认切换
            </Button>
            <Button variant="ghost" size="small" onClick={() => setPending(null)}>
              取消
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

const StorageSettings: React.FC = () => {
  // t 是 i18n hook 的返回值；当前页面文案固定中文，未使用
  const { t: _t } = useTranslation();
  const { storeStats, quota, loading, error, refresh } = useStorageStats();
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setClearing(true);
    try {
      await clearAllStorage();
      // 强制重载，让所有 service 单例重建
      // （jsdom 等环境 reload 是 read-only，try-catch 容错）
      try {
        window.location.reload();
      } catch {
        /* 忽略：测试环境 */
      }
    } catch (err) {
      setClearing(false);
      setConfirming(false);
      console.error('[StorageSettings] clear failed:', err);
    }
  };

  const quotaLevelText = {
    ok: '充足',
    warn: '接近上限',
    critical: '即将耗尽',
    exceeded: '已超出',
  } as const;

  const quotaColor = {
    ok: 'text-emerald-600',
    warn: 'text-amber-600',
    critical: 'text-orange-600',
    exceeded: 'text-red-600',
  } as const;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          存储设置
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          查看浏览器存储用量，或清空所有数据重置应用。
        </p>
      </div>

      <BackendCard />

      {error && (
        <Card>
          <div className="text-red-600">读取存储信息失败：{error}</div>
        </Card>
      )}

      <Card title="存储配额" subtitle="通过 navigator.storage.estimate() 获取">
        {loading && !quota ? (
          <div className="text-sm text-[var(--color-text-secondary)]">加载中...</div>
        ) : !quota?.isSupported ? (
          <div className="text-sm text-[var(--color-text-secondary)]">
            当前浏览器不支持 navigator.storage.estimate（Safari 旧版、部分移动浏览器）
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className={`text-2xl font-semibold ${quotaColor[quota.level]}`}>
                {quota.percent.toFixed(1)}%
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {quotaLevelText[quota.level]}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  quota.level === 'ok' ? 'bg-emerald-500'
                  : quota.level === 'warn' ? 'bg-amber-500'
                  : quota.level === 'critical' ? 'bg-orange-500'
                  : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, quota.percent)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
              <span>已用 {formatBytes(quota.usage)}</span>
              <span>总计 {formatBytes(quota.quota)}</span>
            </div>
            <Button
              variant="ghost"
              size="small"
              onClick={() => void refresh()}
              loading={loading}
            >
              刷新
            </Button>
          </div>
        )}
      </Card>

      <Card
        title="IndexedDB 各 store 记录数"
        subtitle="每个业务实体的数据条数"
        headerAction={
          <Button
            variant="ghost"
            size="small"
            onClick={() => void refresh()}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        {loading && storeStats.length === 0 ? (
          <div className="text-sm text-[var(--color-text-secondary)]">加载中...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-text-secondary)]">
                <th className="py-2 font-medium">Store</th>
                <th className="py-2 font-medium text-right">记录数</th>
              </tr>
            </thead>
            <tbody>
              {storeStats.map(({ store, count }) => (
                <tr key={store} className="border-t border-[var(--color-border-subtle)]">
                  <td className="py-2 font-mono">{store}</td>
                  <td className="py-2 text-right font-semibold">{count}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[var(--color-border)]">
                <td className="py-2 font-semibold">合计</td>
                <td className="py-2 text-right font-bold">
                  {storeStats.reduce((sum, s) => sum + s.count, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </Card>

      <Card
        title="危险操作"
        subtitle="清空所有数据不可恢复，建议先导出"
        className="border-red-200"
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)]">
            此操作会：
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>删除整个 IndexedDB 数据库（所有记录、目标、提醒、AI 对话）</li>
              <li>清空 LocalStorage（用户设置、主题、token）</li>
              <li>清空 SessionStorage</li>
              <li>重新加载页面，让所有 service 重建</li>
            </ul>
          </p>

          {confirming ? (
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                onClick={() => void handleClear()}
                loading={clearing}
                disabled={clearing}
              >
                确认清空
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirming(false)}
                disabled={clearing}
              >
                取消
              </Button>
              <span className="text-xs text-amber-600">再点一次确认</span>
            </div>
          ) : (
            <Button variant="danger" onClick={() => setConfirming(true)}>
              清空所有数据
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StorageSettings;
