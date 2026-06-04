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
import {
  migrateBetweenBackends,
  estimateMigrationSize,
  type TableMigrationResult,
} from '../../storage/migration';
import {
  createBackup,
  restoreFromBackup,
  BackupFormatError,
  type BackupData,
  type RestoreOptions,
  type RestoreResult,
} from '../../storage/backup';

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
 * 切换 storage backend（带数据迁移）
 *
 * 流程：
 * 1. 估算要迁移的数据量
 * 2. 把 fromKind 的数据复制到 toKind
 * 3. 持久化新 backend 选择到 LocalStorage
 * 4. 重新加载页面（让所有 service 单例重建）
 *
 * 失败处理：返回结果，不修改 config（用户可重试或保留旧 backend）
 */
export interface SwitchBackendResult {
  success: boolean,
  results: TableMigrationResult[],
  totalItems: number,
  error?: string,
}

export interface SwitchBackendOptions {
  /** 进度回调（每完成一个表调用一次） */
  onProgress?: (done: number, total: number, currentTable: string) => void,
}

export async function switchStorageBackend(
  kind: StorageBackendKind,
  options?: SwitchBackendOptions,
): Promise<SwitchBackendResult> {
  const config = getStorageBackendConfig();
  const fromKind = config.getStorageBackend();

  if (fromKind === kind) {
    return { success: true, results: [], totalItems: 0 };
  }

  // 1. 迁移数据
  const results = await migrateBetweenBackends(fromKind, kind, {
    onProgress: options?.onProgress,
  });
  const totalItems = results.reduce((sum, r) => sum + r.count, 0);
  const failed = results.filter((r) => !r.success);

  if (failed.length > 0) {
    return {
      success: false,
      results,
      totalItems,
      error: `迁移失败：${failed.map((f) => f.tableId).join(', ')}`,
    };
  }

  // 2. 持久化新 backend 选择
  config.setStorageBackend(kind);

  // 3. Reload（让所有 service 单例按新 backend 重建）
  try {
    window.location.reload();
  } catch {
    /* 忽略：测试环境 */
  }

  return { success: true, results, totalItems };
}

/** 估算"切换到 kind"需要迁移的数据量（用于 UI 提示） */
export async function estimateSwitchSize(kind: StorageBackendKind): Promise<number> {
  const config = getStorageBackendConfig();
  const fromKind = config.getStorageBackend();
  if (fromKind === kind) return 0;
  const { totalItems } = await estimateMigrationSize(fromKind);
  return totalItems;
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
  const [estimate, setEstimate] = useState<number | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<{ done: number, total: number, currentTable: string } | null>(null);
  const [result, setResult] = useState<SwitchBackendResult | null>(null);

  // 订阅 backend 变化（应对其他来源的切换）
  useEffect(() => {
    const unsubscribe = config.subscribe((kind) => setCurrent(kind));
    return unsubscribe;
  }, [config]);

  // 选中候选时，估算要迁移的数据量
  useEffect(() => {
    let cancelled = false;
    if (pending && pending !== current) {
      estimateSwitchSize(pending).then((n) => {
        if (!cancelled) setEstimate(n);
      }).catch(() => {
        if (!cancelled) setEstimate(null);
      });
    } else {
      setEstimate(null);
    }
    return () => { cancelled = true; };
  }, [pending, current]);

  const handleSelect = (kind: StorageBackendKind) => {
    if (kind === current) return;
    setPending(kind);
    setResult(null);
  };

  const handleConfirm = async () => {
    if (!pending) return;
    setMigrating(true);
    setResult(null);
    try {
      const r = await switchStorageBackend(pending, {
        onProgress: (done, total, currentTable) => setProgress({ done, total, currentTable }),
      });
      setResult(r);
      // 成功时 reload 会自动发生；失败则停留在当前页面显示结果
      if (!r.success) {
        setMigrating(false);
      }
    } catch (err) {
      setResult({
        success: false,
        results: [],
        totalItems: 0,
        error: err instanceof Error ? err.message : String(err),
      });
      setMigrating(false);
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
                disabled={migrating}
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

        {pending && !migrating && !result && (
          <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
            <div className="text-sm text-amber-600">
              确定切到 {BACKEND_OPTIONS.find((o) => o.kind === pending)?.label}？
              {estimate !== null && estimate > 0 && (
                <span className="text-[var(--color-text-secondary)] ml-1">
                  （将复制 {estimate} 条数据）
                </span>
              )}
              <span className="block text-xs mt-0.5">这会重新加载页面。</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="primary" size="small" onClick={() => void handleConfirm()}>
                确认切换
              </Button>
              <Button variant="ghost" size="small" onClick={() => setPending(null)}>
                取消
              </Button>
            </div>
          </div>
        )}

        {migrating && (
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border-subtle)] text-sm text-[var(--color-text-secondary)]">
            <span className="inline-block w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>
              正在迁移数据
              {progress && progress.total > 0 && ` (${progress.done}/${progress.total})`}
              {progress?.currentTable && ` · ${progress.currentTable}`}…
            </span>
          </div>
        )}

        {result && !result.success && (
          <div className="pt-2 border-t border-[var(--color-border-subtle)]">
            <div className="text-sm text-red-600">
              ✗ {result.error ?? '切换失败'}
            </div>
            {result.results.filter((r) => !r.success).length > 0 && (
              <ul className="text-xs text-red-500 mt-1 list-disc list-inside">
                {result.results.filter((r) => !r.success).map((r) => (
                  <li key={r.tableId}>
                    {r.tableId}: {r.error}
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="ghost"
              size="small"
              onClick={() => {
                setResult(null);
                setPending(null);
              }}
              className="mt-2"
            >
              关闭
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

/* ============================================================ */
/* 备份与恢复（BackupCard）                                     */
/* ============================================================ */

interface BackupPreview {
  fileName: string,
  backup: BackupData,
}

const BackupCard: React.FC = () => {
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [restorePrefs, setRestorePrefs] = useState(true);
  const [restoreCreds, setRestoreCreds] = useState(true);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setBusy('export');
    setError(null);
    try {
      const backup = await createBackup();
      const { downloadBackup } = await import('../../storage/backup');
      downloadBackup(backup);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy('import');
    setError(null);
    setRestoreResult(null);
    try {
      const { readBackupFile } = await import('../../storage/backup');
      const backup = await readBackupFile(file);
      setPreview({ fileName: file.name, backup });
    } catch (err) {
      if (err instanceof BackupFormatError) {
        setError(`备份文件无效：${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setBusy(null);
      // 清空 input，允许重选同一文件
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmRestore = async () => {
    if (!preview) return;
    setBusy('import');
    setError(null);
    try {
      const options: RestoreOptions = {
        mode: restoreMode,
        includePreferences: restorePrefs,
        includeCredentials: restoreCreds,
      };
      const result = await restoreFromBackup(preview.backup, options);
      setRestoreResult(result);
      // 成功后保留 preview，让用户看到结果
      if (result.success) {
        // 不清 preview，让用户看结果摘要
      } else {
        setError('部分表恢复失败，详情见下方');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const handleCancelPreview = () => {
    setPreview(null);
    setRestoreResult(null);
    setError(null);
  };

  const totalItems = preview
    ? preview.backup.data.records.length +
      preview.backup.data.goals.length +
      preview.backup.data.reminders.length +
      preview.backup.data.trees.length +
      preview.backup.data.users.length +
      preview.backup.data.chatSessions.length +
      preview.backup.data.chatMessages.length
    : 0;

  return (
    <Card
      title="数据备份"
      subtitle="导出全量数据为 JSON 文件，或从备份恢复"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="small"
            onClick={() => void handleExport()}
            disabled={busy !== null}
            data-testid="backup-export"
          >
            {busy === 'export' ? '正在导出…' : '导出全量数据'}
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy !== null}
            data-testid="backup-import-trigger"
          >
            {busy === 'import' ? '正在读取…' : '从备份恢复'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => void handleFileChange(e)}
            className="hidden"
            data-testid="backup-file-input"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600" data-testid="backup-error">
            ✗ {error}
          </div>
        )}

        {preview && !restoreResult && (
          <div
            className="space-y-3 p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]"
            data-testid="backup-preview"
          >
            <div className="text-sm">
              <div className="font-medium">📄 {preview.fileName}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1 space-y-0.5">
                <div>备份时间：{new Date(preview.backup.timestamp).toLocaleString()}</div>
                <div>schema v{preview.backup.schemaVersion} · 格式 v{preview.backup.$version}</div>
                <div>共 <span className="font-semibold">{totalItems}</span> 条业务数据</div>
                <ul className="list-disc list-inside ml-2">
                  <li>记录：{preview.backup.data.records.length}</li>
                  <li>目标：{preview.backup.data.goals.length}</li>
                  <li>提醒：{preview.backup.data.reminders.length}</li>
                  <li>技能树：{preview.backup.data.trees.length}</li>
                  <li>用户（含凭证）：{preview.backup.data.users.length}</li>
                  <li>聊天会话：{preview.backup.data.chatSessions.length}</li>
                  <li>聊天消息：{preview.backup.data.chatMessages.length}</li>
                  {preview.backup.data.preferences.llmConfig && <li>LLM 配置：✓</li>}
                  {preview.backup.data.preferences.aiSettings && <li>AI 设置：✓</li>}
                  {preview.backup.data.preferences.currentUser && <li>当前登录态：✓</li>}
                </ul>
              </div>
            </div>

            <div className="space-y-2 border-t border-[var(--color-border-subtle)] pt-2">
              <div className="text-sm font-medium">恢复选项</div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="restore-mode"
                  value="merge"
                  checked={restoreMode === 'merge'}
                  onChange={() => setRestoreMode('merge')}
                />
                <span>合并（保留现有数据，仅插入新 ID）</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="restore-mode"
                  value="overwrite"
                  checked={restoreMode === 'overwrite'}
                  onChange={() => setRestoreMode('overwrite')}
                />
                <span className="text-amber-600">
                  覆盖（清空现有表后写入）⚠ 不可逆
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={restorePrefs}
                  onChange={(e) => setRestorePrefs(e.target.checked)}
                />
                <span>恢复偏好（LLM 配置、AI 设置、当前登录态）</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={restoreCreds}
                  onChange={(e) => setRestoreCreds(e.target.checked)}
                />
                <span>恢复用户账号（含密码哈希）</span>
              </label>
            </div>

            <div className="flex items-center gap-2 border-t border-[var(--color-border-subtle)] pt-2">
              <Button
                variant="primary"
                size="small"
                onClick={() => void handleConfirmRestore()}
                disabled={busy !== null}
                data-testid="backup-confirm"
              >
                确认恢复
              </Button>
              <Button variant="ghost" size="small" onClick={handleCancelPreview}>
                取消
              </Button>
            </div>
          </div>
        )}

        {restoreResult && (
          <div
            className="space-y-2 p-3 rounded-lg border border-emerald-500/50 bg-emerald-50/30"
            data-testid="backup-result"
          >
            <div className="text-sm font-medium text-emerald-700">
              ✓ 恢复完成：{restoreResult.totalItems} 条数据
            </div>
            <ul className="text-xs space-y-0.5 text-[var(--color-text-secondary)]">
              {restoreResult.tableResults.map((r) => (
                <li key={r.tableId}>
                  {r.tableId}：{r.count} 条 {r.success ? '✓' : `✗ ${r.error}`}
                </li>
              ))}
              <li>LLM 配置：{restoreResult.preferencesRestored.llmConfig ? '✓' : '—'}</li>
              <li>AI 设置：{restoreResult.preferencesRestored.aiSettings ? '✓' : '—'}</li>
              <li>当前登录态：{restoreResult.preferencesRestored.currentUser ? '✓' : '—'}</li>
            </ul>
            <Button
              variant="ghost"
              size="small"
              onClick={handleCancelPreview}
              className="mt-2"
            >
              关闭
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

      <BackupCard />

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
