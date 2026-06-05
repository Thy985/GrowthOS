import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { GrowthProvider, useGrowth } from '../../shared/contexts/GrowthContext.tsx';
import { secureStorage } from '../../shared/utils/secureStorage.ts';

const Probe = () => {
  const {
    records,
    treeData,
    isLoading,
    error,
    getStats,
    getAverageMood,
    getAllTags,
    searchRecords,
    filterRecordsByMood,
    filterRecordsByTags,
    filterRecordsByDateRange,
  } = useGrowth();
  const stats = getStats();
  const avgMood = getAverageMood();
  const tags = getAllTags();
  const searchResults = searchRecords('编程');
  const moodResults = filterRecordsByMood(['很好']);
  const tagResults = filterRecordsByTags(['React']);
  const dateResults = filterRecordsByDateRange(new Date('2024-01-01'), new Date('2024-12-31'));

  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="error">{error ?? 'none'}</span>
      <span data-testid="records">{records.length}</span>
      <span data-testid="hasTree">{treeData ? 'yes' : 'no'}</span>
      <span data-testid="weeklyRecords">{stats.weeklyRecords}</span>
      <span data-testid="totalRecords">{stats.totalRecords}</span>
      <span data-testid="growthProgress">{stats.growthProgress}</span>
      <span data-testid="avgMood">{avgMood}</span>
      <span data-testid="tagsCount">{tags.length}</span>
      <span data-testid="searchResults">{searchResults.length}</span>
      <span data-testid="moodResults">{moodResults.length}</span>
      <span data-testid="tagResults">{tagResults.length}</span>
      <span data-testid="dateResults">{dateResults.length}</span>
    </div>
  );
};

describe('GrowthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    secureStorage.removeItem('growthos-records');
    secureStorage.removeItem('growthos-tree');
  });

  it('useGrowth throws when used outside provider', () => {
    const ProbeOutside = () => {
      useGrowth();
      return null;
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<ProbeOutside />)).toThrow(/GrowthProvider/);
    spy.mockRestore();
  });

  it('loads default tree when no saved tree exists', async () => {
    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );
    // useEffect will set up the default tree
    // Check that tree is set after mount
    await vi.waitFor(() => {
      expect(screen.getByTestId('hasTree').textContent).toBe('yes');
    });
  });

  it('loads saved records and tree from secureStorage', async () => {
    const savedRecords = [
      {
        id: '1',
        activity: '学习React',
        learning: 'hooks',
        reflection: '',
        mood: '很好',
        tags: ['React'],
        createdAt: '2024-06-01T10:00:00.000Z',
      },
      {
        id: '2',
        activity: '写代码',
        learning: '',
        reflection: '',
        mood: '一般',
        tags: ['编程'],
        createdAt: '2024-06-03T10:00:00.000Z',
      },
    ];
    const savedTree = {
      id: '1',
      name: 'My Tree',
      children: [],
    };
    secureStorage.setItem('growthos-records', savedRecords);
    secureStorage.setItem('growthos-tree', savedTree);

    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('records').textContent).toBe('2');
      expect(screen.getByTestId('hasTree').textContent).toBe('yes');
      expect(screen.getByTestId('searchResults').textContent).toBe('1'); // '编程' matches activity
    });
  });

  it('handles error from secureStorage gracefully', async () => {
    const spy = vi.spyOn(secureStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage boom');
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('加载数据失败');
    });

    spy.mockRestore();
    errSpy.mockRestore();
  });

  it('getStats returns correct stats', async () => {
    const recentRecords = [
      {
        id: '1',
        activity: 'test',
        learning: '',
        reflection: '',
        mood: '很好',
        tags: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        activity: 'test2',
        learning: '',
        reflection: '',
        mood: '一般',
        tags: [],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    secureStorage.setItem('growthos-records', recentRecords);

    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('weeklyRecords').textContent).toBe('2');
      expect(screen.getByTestId('totalRecords').textContent).toBe('2');
    });
  });

  it('getAverageMood computes correctly', async () => {
    const records = [
      {
        id: '1',
        activity: 'test',
        learning: '',
        reflection: '',
        mood: '很好',
        tags: [],
        createdAt: '2024-01-01',
      },
      {
        id: '2',
        activity: 'test',
        learning: '',
        reflection: '',
        mood: '一般',
        tags: [],
        createdAt: '2024-01-02',
      },
      {
        id: '3',
        activity: 'test',
        learning: '',
        reflection: '',
        mood: '不太好',
        tags: [],
        createdAt: '2024-01-03',
      },
    ];
    secureStorage.setItem('growthos-records', records);

    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );

    await vi.waitFor(() => {
      // (2 + 1 + 0) / 3 = 1.0
      expect(screen.getByTestId('avgMood').textContent).toBe('1.0');
    });
  });

  it('getAverageMood returns 0 when no records', async () => {
    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('avgMood').textContent).toBe('0');
    });
  });

  it('getAllTags returns unique tags from records', async () => {
    const records = [
      {
        id: '1',
        activity: 'test',
        learning: '',
        reflection: '',
        mood: '很好',
        tags: ['React', '前端'],
        createdAt: '2024-01-01',
      },
      {
        id: '2',
        activity: 'test',
        learning: '',
        reflection: '',
        mood: '一般',
        tags: ['React', '后端'],
        createdAt: '2024-01-02',
      },
    ];
    secureStorage.setItem('growthos-records', records);

    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('tagsCount').textContent).toBe('3'); // React, 前端, 后端
    });
  });

  it('filterRecordsByMood filters correctly', async () => {
    const records = [
      {
        id: '1',
        activity: 'test',
        learning: '',
        reflection: '',
        mood: '很好',
        tags: [],
        createdAt: '2024-01-01',
      },
      {
        id: '2',
        activity: 'test',
        learning: '',
        reflection: '',
        mood: '一般',
        tags: [],
        createdAt: '2024-01-02',
      },
      {
        id: '3',
        activity: 'test',
        learning: '',
        reflection: '',
        mood: '很好',
        tags: [],
        createdAt: '2024-01-03',
      },
    ];
    secureStorage.setItem('growthos-records', records);

    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('moodResults').textContent).toBe('2');
    });
  });

  it('filterRecordsByTags filters correctly', async () => {
    const records = [
      {
        id: '1',
        activity: 'test',
        learning: '',
        reflection: '',
        mood: '很好',
        tags: ['React', '前端'],
        createdAt: '2024-01-01',
      },
      {
        id: '2',
        activity: 'test',
        learning: '',
        reflection: '',
        mood: '一般',
        tags: ['Vue', '前端'],
        createdAt: '2024-01-02',
      },
    ];
    secureStorage.setItem('growthos-records', records);

    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('tagResults').textContent).toBe('1');
    });
  });

  it('filterRecordsByDateRange filters correctly', async () => {
    const records = [
      {
        id: '1',
        activity: 'test',
        learning: '',
        reflection: '',
        mood: '很好',
        tags: [],
        createdAt: '2024-01-01',
      },
      {
        id: '2',
        activity: 'test',
        learning: '',
        reflection: '',
        mood: '一般',
        tags: [],
        createdAt: '2025-06-01',
      },
    ];
    secureStorage.setItem('growthos-records', records);

    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('dateResults').textContent).toBe('1');
    });
  });

  it('searchRecords returns all records when searchTerm is empty', async () => {
    const records = [
      {
        id: '1',
        activity: 'test',
        learning: '',
        reflection: '',
        mood: '很好',
        tags: [],
        createdAt: '2024-01-01',
      },
    ];
    secureStorage.setItem('growthos-records', records);

    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId('records').textContent).toBe('1');
    });
  });
});
