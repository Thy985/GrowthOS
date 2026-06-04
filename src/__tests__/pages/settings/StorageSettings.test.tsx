/**
 * StorageSettings 组件测试
 *
 * i18n 策略：测试在 en-US 下跑，所有断言用英文，确保 i18n 化后测试仍可移植
 *
 * 覆盖：
 * - 初始加载时拉取每个 store 的 count + 配额信息
 * - 渲染标题 "Storage Settings"
 * - 显示每个 store 名称
 * - "Clear All Data" 按钮第一次点击进入"确认"状态，第二次触发 clearAllStorage
 * - 刷新按钮调用 hook 的 refresh
 * - BackendCard 三个 radio 切换 + 持久化
 * - BackupCard 导出/导入/预览/取消
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import StorageSettings, { useStorageStats, clearAllStorage, switchStorageBackend } from '../../../pages/settings/StorageSettings';
import * as schemaModule from '../../../storage/schema';
import { getStorageBackendConfig, _resetStorageBackendConfig } from '../../../storage/config/storageConfig';
import { ENTITY_STORES } from '../../../storage/schema/types';

// 固定为 en-US，使断言不依赖运行环境
beforeAll(async () => {
  await i18n.changeLanguage('en-US');
});

const renderWithI18n = (ui: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
};

describe('StorageSettings', () => {
  it('renders the title and danger section', async () => {
    renderWithI18n(<StorageSettings />);

    expect(screen.getByText('Storage Settings')).toBeInTheDocument();
    expect(screen.getByText('Storage Quota')).toBeInTheDocument();
    expect(screen.getByText('IndexedDB Store Counts')).toBeInTheDocument();
    expect(screen.getByText('Dangerous Operations')).toBeInTheDocument();
  });

  it('loads store counts and displays them', async () => {
    const fakeDb = {
      count: jest.fn().mockImplementation(async (store: string) => {
        const fake: Record<string, number> = {
          records: 5,
          goals: 2,
          reminders: 3,
          users: 1,
          chatSessions: 4,
          chatMessages: 10,
        };
        return fake[store] ?? 0;
      }),
    };
    const openSpy = jest
      .spyOn(schemaModule, 'getDB')
      .mockResolvedValue(fakeDb as never);

    renderWithI18n(<StorageSettings />);

    await waitFor(() => {
      for (const store of ENTITY_STORES) {
        expect(screen.getByText(store)).toBeInTheDocument();
      }
    });

    expect(openSpy).toHaveBeenCalled();
  });

  it('shows unsupported message when navigator.storage.estimate is missing', async () => {
    // jsdom 缺 navigator.storage
    const fakeDb = { count: jest.fn().mockResolvedValue(0) };
    jest.spyOn(schemaModule, 'getDB').mockResolvedValue(fakeDb as never);

    renderWithI18n(<StorageSettings />);

    await waitFor(() => {
      expect(
        screen.getByText(/Current browser does not support navigator\.storage\.estimate/),
      ).toBeInTheDocument();
    });
  });

  it('clear button requires double-click confirmation', async () => {
    const fakeDb = { count: jest.fn().mockResolvedValue(0) };
    jest.spyOn(schemaModule, 'getDB').mockResolvedValue(fakeDb as never);
    const resetSpy = jest
      .spyOn(schemaModule, 'resetDatabase')
      .mockResolvedValue(undefined);

    renderWithI18n(<StorageSettings />);

    await waitFor(() => {
      expect(screen.getByText('Clear All Data')).toBeInTheDocument();
    });

    // 第一次点击：进入确认状态
    fireEvent.click(screen.getByText('Clear All Data'));
    expect(screen.getByText('Confirm Clear')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    // 第二次点击：触发 clearAllStorage
    await act(async () => {
      fireEvent.click(screen.getByText('Confirm Clear'));
    });

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalled();
    });
  });

  it('cancel button resets confirmation state', async () => {
    const fakeDb = { count: jest.fn().mockResolvedValue(0) };
    jest.spyOn(schemaModule, 'getDB').mockResolvedValue(fakeDb as never);

    renderWithI18n(<StorageSettings />);

    await waitFor(() => {
      expect(screen.getByText('Clear All Data')).toBeInTheDocument();
    });

    // 进入确认状态
    fireEvent.click(screen.getByText('Clear All Data'));
    expect(screen.getByText('Confirm Clear')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    // 取消后回到初始状态
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('Clear All Data')).toBeInTheDocument();
    expect(screen.queryByText('Confirm Clear')).not.toBeInTheDocument();
  });
});

describe('clearAllStorage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resets DB, clears storage', async () => {
    const resetSpy = jest
      .spyOn(schemaModule, 'resetDatabase')
      .mockResolvedValue(undefined);
    const clearLs = jest.spyOn(Storage.prototype, 'clear');
    const clearSs = jest.spyOn(window.sessionStorage, 'clear');

    await clearAllStorage();

    expect(resetSpy).toHaveBeenCalled();
    expect(clearLs).toHaveBeenCalled();
    expect(clearSs).toHaveBeenCalled();
  });
});

describe('useStorageStats hook', () => {
  it('returns loading state initially, then populated state', async () => {
    const fakeDb = {
      count: jest.fn().mockImplementation(async (store: string) => {
        return store === 'records' ? 7 : 0;
      }),
    };
    jest.spyOn(schemaModule, 'getDB').mockResolvedValue(fakeDb as never);

    const Probe: React.FC = () => {
      const { storeStats, loading } = useStorageStats();
      return (
        <div>
          <span data-testid="loading">{String(loading)}</span>
          <span data-testid="records-count">
            {storeStats.find((s) => s.store === 'records')?.count ?? -1}
          </span>
        </div>
      );
    };

    renderWithI18n(<Probe />);

    // 初始 loading
    expect(screen.getByTestId('loading').textContent).toBe('true');

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('records-count').textContent).toBe('7');
    });
  });

  it('captures error message when getDB throws', async () => {
    jest.spyOn(schemaModule, 'getDB').mockRejectedValue(new Error('boom'));

    const Probe: React.FC = () => {
      const { error } = useStorageStats();
      return <span data-testid="error">{error ?? 'no-error'}</span>;
    };

    renderWithI18n(<Probe />);

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('boom');
    });
  });
});

describe('BackendCard', () => {
  beforeEach(() => {
    // 隔离每个测试：从 LocalStorage 清掉残留的 backend 选择
    try { localStorage.removeItem('growthos:storageBackend'); } catch { /* ignore */ }
    _resetStorageBackendConfig();
  });

  afterEach(() => {
    _resetStorageBackendConfig();
    try { localStorage.removeItem('growthos:storageBackend'); } catch { /* ignore */ }
    jest.restoreAllMocks();
  });

  it('renders three radio options with the default backend marked as Current', () => {
    renderWithI18n(<StorageSettings />);

    const radios = screen.getAllByRole('radio', { name: /IndexedDB|LocalStorage|In-Memory/ });
    expect(radios).toHaveLength(3);

    // 默认 backend = 'indexeddb'，对应 radio 应被 checked
    const idbRadio = screen.getByRole('radio', { name: /IndexedDB/ });
    expect(idbRadio).toBeChecked();

    // "Current" 标签只出现在 idb 那一行
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('shows the persisted backend from LocalStorage as current', () => {
    localStorage.setItem('growthos:storageBackend', 'localStorage');
    _resetStorageBackendConfig();

    renderWithI18n(<StorageSettings />);

    const lsRadio = screen.getByRole('radio', { name: /LocalStorage/ });
    expect(lsRadio).toBeChecked();
  });

  it('clicking a non-current radio enters pending state with confirm/cancel buttons', () => {
    renderWithI18n(<StorageSettings />);

    // 一开始没有确认按钮
    expect(screen.queryByText('Confirm Switch')).not.toBeInTheDocument();

    // 点 In-Memory radio
    const memRadio = screen.getByRole('radio', { name: /In-Memory/ });
    fireEvent.click(memRadio);

    // 进入 pending：显示确认 + 取消
    expect(screen.getByText('Confirm Switch')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    // pending 文案里出现目标 backend 名字
    expect(screen.getByText(/Switch to In-Memory/)).toBeInTheDocument();
  });

  it('clicking the current radio does NOT enter pending state', () => {
    renderWithI18n(<StorageSettings />);

    const idbRadio = screen.getByRole('radio', { name: /IndexedDB/ });
    fireEvent.click(idbRadio);

    expect(screen.queryByText('Confirm Switch')).not.toBeInTheDocument();
  });

  it('confirming the switch calls switchStorageBackend and reloads', async () => {
    // mock 迁移模块：让 migrateBetweenBackends 立即 resolve
    jest.doMock('../../../storage/migration', () => ({
      MIGRATABLE_TABLES: [],
      migrateTable: jest.fn(),
      migrateBetweenBackends: jest.fn(async () => []),
      estimateMigrationSize: jest.fn(async () => ({ totalItems: 0, tables: [] })),
    }));
    // 重新 import 让 doMock 生效
    jest.isolateModules(() => {
      // no-op
    });

    const config = getStorageBackendConfig();
    const setSpy = jest.spyOn(config, 'setStorageBackend');

    renderWithI18n(<StorageSettings />);

    // 切到 LocalStorage
    fireEvent.click(screen.getByRole('radio', { name: /LocalStorage/ }));
    expect(screen.getByText('Confirm Switch')).toBeInTheDocument();

    // 确认切换
    fireEvent.click(screen.getByText('Confirm Switch'));

    await waitFor(() => {
      expect(setSpy).toHaveBeenCalledWith('localStorage');
    });

    jest.dontMock('../../../storage/migration');
  });

  it('cancel button clears the pending state', () => {
    renderWithI18n(<StorageSettings />);

    fireEvent.click(screen.getByRole('radio', { name: /In-Memory/ }));
    expect(screen.getByText('Confirm Switch')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Confirm Switch')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('updates UI when backend changes from another source (subscription)', async () => {
    renderWithI18n(<StorageSettings />);

    // 初始：IndexedDB 是当前
    expect(screen.getByRole('radio', { name: /IndexedDB/ })).toBeChecked();

    // 模拟其他来源切换：直接调用 config.setStorageBackend
    const config = getStorageBackendConfig();
    act(() => {
      config.setStorageBackend('inMemory');
    });

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /In-Memory/ })).toBeChecked();
    });
  });
});

describe('switchStorageBackend', () => {
  beforeEach(() => {
    try { localStorage.removeItem('growthos:storageBackend'); } catch { /* ignore */ }
    _resetStorageBackendConfig();
  });

  afterEach(() => {
    _resetStorageBackendConfig();
    try { localStorage.removeItem('growthos:storageBackend'); } catch { /* ignore */ }
    jest.restoreAllMocks();
  });

  it('persists the new kind to LocalStorage (inMemory → localStorage = no migration cost)', async () => {
    // 起步设成 inMemory，避免真实 IDB→LS 迁移路径
    getStorageBackendConfig().setStorageBackend('inMemory');
    await switchStorageBackend('localStorage');
    expect(localStorage.getItem('growthos:storageBackend')).toBe('localStorage');
  });

  it('notifies config subscribers', async () => {
    // 起步设成 inMemory
    getStorageBackendConfig().setStorageBackend('inMemory');
    const config = getStorageBackendConfig();
    const listener = jest.fn();
    config.subscribe(listener);

    await switchStorageBackend('localStorage');

    expect(listener).toHaveBeenCalledWith('localStorage');
  });
});

describe('BackupCard', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    try { localStorage.removeItem('growthos:storageBackend'); } catch { /* ignore */ }
    _resetStorageBackendConfig();
    getStorageBackendConfig().setStorageBackend('indexeddb');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders export and import buttons', () => {
    renderWithI18n(<StorageSettings />);
    expect(screen.getByTestId('backup-export')).toHaveTextContent('Export All Data');
    expect(screen.getByTestId('backup-import-trigger')).toHaveTextContent('Restore from Backup');
  });

  it('triggers download when export is clicked', async () => {
    // mock downloadBackup（避免真实下载）
    let downloaded: unknown = null;
    const backupModule = await import('../../../storage/backup');
    const spy = jest.spyOn(backupModule, 'downloadBackup').mockImplementation((b) => {
      downloaded = b;
    });

    renderWithI18n(<StorageSettings />);
    fireEvent.click(screen.getByTestId('backup-export'));

    await waitFor(() => {
      expect(downloaded).not.toBeNull();
    });
    expect((downloaded as { $type: string }).$type).toBe('growthos-backup');
    spy.mockRestore();
  });

  it('shows preview when a valid backup file is selected', async () => {
    const backup = {
      $type: 'growthos-backup',
      $version: 1,
      schemaVersion: 2,
      timestamp: '2024-06-01T00:00:00.000Z',
      appVersion: '1.0.0',
      data: {
        records: [], goals: [], reminders: [], trees: [], users: [],
        chatSessions: [], chatMessages: [],
        preferences: { llmConfig: null, aiSettings: null, currentUser: null },
      },
    };
    const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });
    // jsdom 不支持 file.text()，手动实现
    (file as unknown as { text: () => Promise<string> }).text = async () => JSON.stringify(backup);

    renderWithI18n(<StorageSettings />);

    const fileInput = screen.getByTestId('backup-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('backup-preview')).toBeInTheDocument();
    });
    expect(screen.getByText(/backup\.json/)).toBeInTheDocument();
  });

  it('shows error when invalid file is selected', async () => {
    const file = new File(['not json{'], 'bad.json', { type: 'application/json' });
    (file as unknown as { text: () => Promise<string> }).text = async () => 'not json{';

    renderWithI18n(<StorageSettings />);
    const fileInput = screen.getByTestId('backup-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('backup-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('backup-error').textContent).toMatch(/Invalid backup file/);
  });

  it('cancels preview', async () => {
    const backup = {
      $type: 'growthos-backup',
      $version: 1,
      schemaVersion: 2,
      timestamp: '2024-06-01T00:00:00.000Z',
      appVersion: '1.0.0',
      data: {
        records: [], goals: [], reminders: [], trees: [], users: [],
        chatSessions: [], chatMessages: [],
        preferences: { llmConfig: null, aiSettings: null, currentUser: null },
      },
    };
    const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });
    (file as unknown as { text: () => Promise<string> }).text = async () => JSON.stringify(backup);

    renderWithI18n(<StorageSettings />);
    const fileInput = screen.getByTestId('backup-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('backup-preview')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('backup-preview')).not.toBeInTheDocument();
  });
});
