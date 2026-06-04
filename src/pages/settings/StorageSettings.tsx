/**
 * StorageSettings 页面
 *
 * 用途：
 * 1. 显示当前存储配额（navigator.storage.estimate）
 * 2. 显示每个 IndexedDB store 的记录数
 * 3. 切换 storage backend（IDB / LS / In-Memory）— 带数据迁移
 * 4. 备份与恢复（导出全量数据 / 从 JSON 恢复）
 * 5. "清空所有数据" 按钮（清 IDB + LocalStorage 后 reload）
 *
 * 所有用户可见文案走 i18n（storage.* 命名空间）
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
  try {
    window.location.reload();
  } catch {
    /* 忽略：测试环境 */
  }
}

/**
 * 切换 storage backend（带数据迁移）
 */
export interface SwitchBackendResult {
  success: boolean,
  results: TableMigrationResult[],
  totalItems: number,
  error?: string,
}

export interface SwitchBackendOptions {
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

  config.setStorageBackend(kind);

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

/* ============================================================ */
/* BackendCard                                                  */
/* ============================================================ */

type BackendLabelKey =
  | 'storage.backendCard.indexeddbLabel'
  | 'storage.backendCard.localStorageLabel'
  | 'storage.backendCard.inMemoryLabel';

const BackendCard: React.FC = () => {
  const { t } = useTranslation();
  const config = getStorageBackendConfig();
  const [current, setCurrent] = useState<StorageBackendKind>(config.getStorageBackend());
  const [pending, setPending] = useState<StorageBackendKind | null>(null);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<{ done: number, total: number, currentTable: string } | null>(null);
  const [result, setResult] = useState<SwitchBackendResult | null>(null);

  const BACKEND_OPTIONS: { kind: StorageBackendKind, labelKey: BackendLabelKey, descKey: string, warnKey?: string }[] = [
    {
      kind: 'indexeddb',
      labelKey: 'storage.backendCard.indexeddbLabel',
      descKey: 'storage.backendCard.indexeddbDescription',
    },
    {
      kind: 'localStorage',
      labelKey: 'storage.backendCard.localStorageLabel',
      descKey: 'storage.backendCard.localStorageDescription',
      warnKey: 'storage.backendCard.localStorageWarning',
    },
    {
      kind: 'inMemory',
      labelKey: 'storage.backendCard.inMemoryLabel',
      descKey: 'storage.backendCard.inMemoryDescription',
      warnKey: 'storage.backendCard.inMemoryWarning',
    },
  ];

  useEffect(() => {
    const unsubscribe = config.subscribe((kind) => setCurrent(kind));
    return unsubscribe;
  }, [config]);

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
      title={t('storage.backendCard.title')}
      subtitle={t('storage.backendCard.subtitle')}
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
                  {t(opt.labelKey)}
                  {isCurrent && (
                    <span className="ml-2 text-xs text-emerald-600">
                      {t('storage.backendCard.current')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {t(opt.descKey)}
                </div>
                {opt.warnKey && (
                  <div className="text-xs text-amber-600 mt-1">⚠ {t(opt.warnKey)}</div>
                )}
              </div>
            </label>
          );
        })}

        {pending && !migrating && !result && (
          <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
            <div className="text-sm text-amber-600">
              {t('storage.backendCard.confirmTitle', {
                name: t(BACKEND_OPTIONS.find((o) => o.kind === pending)?.labelKey ?? ''),
              })}
              {estimate !== null && estimate > 0 && (
                <span className="text-[var(--color-text-secondary)] ml-1">
                  {t('storage.backendCard.confirmEstimate', { count: estimate })}
                </span>
              )}
              <span className="block text-xs mt-0.5">
                {t('storage.backendCard.confirmReloads')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="primary" size="small" onClick={() => void handleConfirm()}>
                {t('storage.backendCard.confirmButton')}
              </Button>
              <Button variant="ghost" size="small" onClick={() => setPending(null)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        {migrating && (
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border-subtle)] text-sm text-[var(--color-text-secondary)]">
            <span className="inline-block w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>
              {t('storage.backendCard.migrating')}
              {progress && progress.total > 0 &&
                t('storage.backendCard.migratingProgress', { done: progress.done, total: progress.total })}
              {progress?.currentTable &&
                t('storage.backendCard.migratingTable', { table: progress.currentTable })}
              …
            </span>
          </div>
        )}

        {result && !result.success && (
          <div className="pt-2 border-t border-[var(--color-border-subtle)]">
            <div className="text-sm text-red-600">
              ✗ {result.error ?? t('storage.backendCard.switchFailed')}
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
              {t('storage.backendCard.close')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

/* ============================================================ */
/* BackupCard                                                   */
/* ============================================================ */

interface BackupPreview {
  fileName: string,
  backup: BackupData,
}

const BackupCard: React.FC = () => {
  const { t } = useTranslation();
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
        setError(t('storage.backupCard.invalidFile', { message: err.message }));
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setBusy(null);
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
      if (!result.success) {
        setError(t('storage.backupCard.partialFailure'));
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

  const yes = t('storage.backupCard.yes');
  const no = t('storage.backupCard.no');

  return (
    <Card
      title={t('storage.backupCard.title')}
      subtitle={t('storage.backupCard.subtitle')}
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
            {busy === 'export' ? t('storage.backupCard.exporting') : t('storage.backupCard.export')}
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy !== null}
            data-testid="backup-import-trigger"
          >
            {busy === 'import' ? t('storage.backupCard.reading') : t('storage.backupCard.import')}
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
              <div className="font-medium">{t('storage.backupCard.fileLabel', { name: preview.fileName })}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1 space-y-0.5">
                <div>
                  {t('storage.backupCard.backupTime', {
                    time: new Date(preview.backup.timestamp).toLocaleString(),
                  })}
                </div>
                <div>
                  {t('storage.backupCard.schemaInfo', {
                    schema: preview.backup.schemaVersion,
                    format: preview.backup.$version,
                  })}
                </div>
                <div>
                  {t('storage.backupCard.totalItems', { count: totalItems })}
                </div>
                <ul className="list-disc list-inside ml-2">
                  <li>{t('storage.backupCard.tableCount.records', { count: preview.backup.data.records.length })}</li>
                  <li>{t('storage.backupCard.tableCount.goals', { count: preview.backup.data.goals.length })}</li>
                  <li>{t('storage.backupCard.tableCount.reminders', { count: preview.backup.data.reminders.length })}</li>
                  <li>{t('storage.backupCard.tableCount.trees', { count: preview.backup.data.trees.length })}</li>
                  <li>{t('storage.backupCard.tableCount.users', { count: preview.backup.data.users.length })}</li>
                  <li>{t('storage.backupCard.tableCount.chatSessions', { count: preview.backup.data.chatSessions.length })}</li>
                  <li>{t('storage.backupCard.tableCount.chatMessages', { count: preview.backup.data.chatMessages.length })}</li>
                  {preview.backup.data.preferences.llmConfig && <li>{t('storage.backupCard.preferenceIncluded.llmConfig')}</li>}
                  {preview.backup.data.preferences.aiSettings && <li>{t('storage.backupCard.preferenceIncluded.aiSettings')}</li>}
                  {preview.backup.data.preferences.currentUser && <li>{t('storage.backupCard.preferenceIncluded.currentUser')}</li>}
                </ul>
              </div>
            </div>

            <div className="space-y-2 border-t border-[var(--color-border-subtle)] pt-2">
              <div className="text-sm font-medium">{t('storage.backupCard.restoreOptions')}</div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="restore-mode"
                  value="merge"
                  checked={restoreMode === 'merge'}
                  onChange={() => setRestoreMode('merge')}
                />
                <span>{t('storage.backupCard.modeMerge')}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="restore-mode"
                  value="overwrite"
                  checked={restoreMode === 'overwrite'}
                  onChange={() => setRestoreMode('overwrite')}
                />
                <span className="text-amber-600">{t('storage.backupCard.modeOverwrite')}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={restorePrefs}
                  onChange={(e) => setRestorePrefs(e.target.checked)}
                />
                <span>{t('storage.backupCard.includePreferences')}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={restoreCreds}
                  onChange={(e) => setRestoreCreds(e.target.checked)}
                />
                <span>{t('storage.backupCard.includeCredentials')}</span>
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
                {t('storage.backupCard.confirmRestore')}
              </Button>
              <Button variant="ghost" size="small" onClick={handleCancelPreview}>
                {t('common.cancel')}
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
              {t('storage.backupCard.restoreComplete', { count: restoreResult.totalItems })}
            </div>
            <ul className="text-xs space-y-0.5 text-[var(--color-text-secondary)]">
              {restoreResult.tableResults.map((r) => (
                <li key={r.tableId}>
                  {r.success
                    ? t('storage.backupCard.tableResult', { table: r.tableId, count: r.count })
                    : t('storage.backupCard.tableResultFailed', { table: r.tableId, count: r.count, error: r.error })}
                </li>
              ))}
              <li>{t('storage.backupCard.preferenceRestored.llmConfig', { value: restoreResult.preferencesRestored.llmConfig ? yes : no })}</li>
              <li>{t('storage.backupCard.preferenceRestored.aiSettings', { value: restoreResult.preferencesRestored.aiSettings ? yes : no })}</li>
              <li>{t('storage.backupCard.preferenceRestored.currentUser', { value: restoreResult.preferencesRestored.currentUser ? yes : no })}</li>
            </ul>
            <Button
              variant="ghost"
              size="small"
              onClick={handleCancelPreview}
              className="mt-2"
            >
              {t('storage.backendCard.close')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

/* ============================================================ */
/* StorageSettings (page)                                      */
/* ============================================================ */

const StorageSettings: React.FC = () => {
  const { t } = useTranslation();
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

  const quotaColor: Record<QuotaInfo['level'], string> = {
    ok: 'text-emerald-600',
    warn: 'text-amber-600',
    critical: 'text-orange-600',
    exceeded: 'text-red-600',
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {t('storage.pageTitle')}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {t('storage.pageSubtitle')}
        </p>
      </div>

      <BackendCard />

      <BackupCard />

      {error && (
        <Card>
          <div className="text-red-600">{t('storage.readError', { message: error })}</div>
        </Card>
      )}

      <Card
        title={t('storage.quotaCard.title')}
        subtitle={t('storage.quotaCard.subtitle')}
      >
        {loading && !quota ? (
          <div className="text-sm text-[var(--color-text-secondary)]">
            {t('storage.quotaCard.loading')}
          </div>
        ) : !quota?.isSupported ? (
          <div className="text-sm text-[var(--color-text-secondary)]">
            {t('storage.quotaCard.notSupported')}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className={`text-2xl font-semibold ${quotaColor[quota.level]}`}>
                {quota.percent.toFixed(1)}%
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t(`storage.quotaCard.level.${quota.level}`)}
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
              <span>{t('storage.quotaCard.used', { size: formatBytes(quota.usage) })}</span>
              <span>{t('storage.quotaCard.total', { size: formatBytes(quota.quota) })}</span>
            </div>
            <Button
              variant="ghost"
              size="small"
              onClick={() => void refresh()}
              loading={loading}
            >
              {t('components.button.refresh')}
            </Button>
          </div>
        )}
      </Card>

      <Card
        title={t('storage.storeStatsCard.title')}
        subtitle={t('storage.storeStatsCard.subtitle')}
        headerAction={
          <Button
            variant="ghost"
            size="small"
            onClick={() => void refresh()}
            loading={loading}
          >
            {t('components.button.refresh')}
          </Button>
        }
      >
        {loading && storeStats.length === 0 ? (
          <div className="text-sm text-[var(--color-text-secondary)]">
            {t('storage.storeStatsCard.loading')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-text-secondary)]">
                <th className="py-2 font-medium">{t('storage.storeStatsCard.storeHeader')}</th>
                <th className="py-2 font-medium text-right">{t('storage.storeStatsCard.countHeader')}</th>
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
                <td className="py-2 font-semibold">{t('storage.storeStatsCard.total')}</td>
                <td className="py-2 text-right font-bold">
                  {storeStats.reduce((sum, s) => sum + s.count, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </Card>

      <Card
        title={t('storage.dangerCard.title')}
        subtitle={t('storage.dangerCard.subtitle')}
        className="border-red-200"
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t('storage.dangerCard.intro')}
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>{t('storage.dangerCard.step1')}</li>
              <li>{t('storage.dangerCard.step2')}</li>
              <li>{t('storage.dangerCard.step3')}</li>
              <li>{t('storage.dangerCard.step4')}</li>
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
                {t('storage.dangerCard.confirm')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirming(false)}
                disabled={clearing}
              >
                {t('storage.dangerCard.cancel')}
              </Button>
              <span className="text-xs text-amber-600">{t('storage.dangerCard.confirmHint')}</span>
            </div>
          ) : (
            <Button variant="danger" onClick={() => setConfirming(true)}>
              {t('storage.dangerCard.clearAll')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StorageSettings;
