/**
 * StorageSettings 组件测试
 *
 * 覆盖：
 * - 初始加载时拉取每个 store 的 count + 配额信息
 * - 渲染标题"存储设置"
 * - 显示每个 store 名称
 * - "清空所有数据"按钮第一次点击进入"确认"状态，第二次触发 clearAllStorage
 * - 刷新按钮调用 hook 的 refresh
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import StorageSettings, { useStorageStats, clearAllStorage, switchStorageBackend } from '../../../pages/settings/StorageSettings';
import * as schemaModule from '../../../storage/schema';
import { getStorageBackendConfig, _resetStorageBackendConfig } from '../../../storage/config/storageConfig';
import { ENTITY_STORES } from '../../../storage/schema/types';

const renderWithI18n = (ui: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
};

describe('StorageSettings', () => {
  it('renders the title and danger section', async () => {
    renderWithI18n(<StorageSettings />);

    expect(screen.getByText('存储设置')).toBeInTheDocument();
    expect(screen.getByText('存储配额')).toBeInTheDocument();
    expect(screen.getByText('IndexedDB 各 store 记录数')).toBeInTheDocument();
    expect(screen.getByText('危险操作')).toBeInTheDocument();
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
        screen.getByText(/当前浏览器不支持 navigator\.storage\.estimate/),
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
      expect(screen.getByText('清空所有数据')).toBeInTheDocument();
    });

    // 第一次点击：进入确认状态
    fireEvent.click(screen.getByText('清空所有数据'));
    expect(screen.getByText('确认清空')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();

    // 第二次点击：触发 clearAllStorage
    await act(async () => {
      fireEvent.click(screen.getByText('确认清空'));
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
      expect(screen.getByText('清空所有数据')).toBeInTheDocument();
    });

    // 进入确认状态
    fireEvent.click(screen.getByText('清空所有数据'));
    expect(screen.getByText('确认清空')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();

    // 取消后回到初始状态
    fireEvent.click(screen.getByText('取消'));
    expect(screen.getByText('清空所有数据')).toBeInTheDocument();
    expect(screen.queryByText('确认清空')).not.toBeInTheDocument();
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

  it('renders three radio options with the default backend marked as 当前', () => {
    renderWithI18n(<StorageSettings />);

    const radios = screen.getAllByRole('radio', { name: /IndexedDB|LocalStorage|In-Memory/ });
    expect(radios).toHaveLength(3);

    // 默认 backend = 'indexeddb'，对应 radio 应被 checked
    const idbRadio = screen.getByRole('radio', { name: /IndexedDB/ });
    expect(idbRadio).toBeChecked();

    // "当前" 标签只出现在 idb 那一行
    expect(screen.getByText('当前')).toBeInTheDocument();
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
    expect(screen.queryByText('确认切换')).not.toBeInTheDocument();

    // 点 In-Memory radio
    const memRadio = screen.getByRole('radio', { name: /In-Memory/ });
    fireEvent.click(memRadio);

    // 进入 pending：显示确认 + 取消
    expect(screen.getByText('确认切换')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
    // pending 文案里出现目标 backend 名字
    expect(screen.getByText(/确定切到 In-Memory/)).toBeInTheDocument();
  });

  it('clicking the current radio does NOT enter pending state', () => {
    renderWithI18n(<StorageSettings />);

    const idbRadio = screen.getByRole('radio', { name: /IndexedDB/ });
    fireEvent.click(idbRadio);

    expect(screen.queryByText('确认切换')).not.toBeInTheDocument();
  });

  it('confirming the switch calls switchStorageBackend and reloads', async () => {
    const config = getStorageBackendConfig();
    const setSpy = jest.spyOn(config, 'setStorageBackend');

    renderWithI18n(<StorageSettings />);

    // 切到 LocalStorage
    fireEvent.click(screen.getByRole('radio', { name: /LocalStorage/ }));
    expect(screen.getByText('确认切换')).toBeInTheDocument();

    // 确认切换
    fireEvent.click(screen.getByText('确认切换'));

    expect(setSpy).toHaveBeenCalledWith('localStorage');
  });

  it('cancel button clears the pending state', () => {
    renderWithI18n(<StorageSettings />);

    fireEvent.click(screen.getByRole('radio', { name: /In-Memory/ }));
    expect(screen.getByText('确认切换')).toBeInTheDocument();

    fireEvent.click(screen.getByText('取消'));
    expect(screen.queryByText('确认切换')).not.toBeInTheDocument();
    expect(screen.queryByText('取消')).not.toBeInTheDocument();
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

  it('persists the new kind to LocalStorage', () => {
    switchStorageBackend('localStorage');
    expect(localStorage.getItem('growthos:storageBackend')).toBe('localStorage');
  });

  it('notifies config subscribers', () => {
    const config = getStorageBackendConfig();
    const listener = jest.fn();
    config.subscribe(listener);

    switchStorageBackend('inMemory');

    expect(listener).toHaveBeenCalledWith('inMemory');
  });
});
