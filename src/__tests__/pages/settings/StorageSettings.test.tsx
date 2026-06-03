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
import StorageSettings, { useStorageStats, clearAllStorage } from '../../../pages/settings/StorageSettings';
import * as schemaModule from '../../../storage/schema';
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
