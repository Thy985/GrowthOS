import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

import { GrowthProvider, useGrowth } from '../../shared/contexts/GrowthContext.tsx';
import { secureStorage } from '../../shared/utils/secureStorage.ts';

const Probe = () => {
  const { records, addRecord, importData, getAllTags } = useGrowth();
  return (
    <div>
      <span data-testid="records">{records.length}</span>
      <span data-testid="tags">{getAllTags().join(',')}</span>
      <button onClick={() => addRecord({ activity: 'test', learning: '', mood: '很好', reflection: '' })}>addRecord</button>
      <button onClick={() => addRecord({ activity: '学习编程 #代码', learning: '', mood: '一般', reflection: '' })}>addRecordWithTag</button>
      <button onClick={() => addRecord({ activity: '运动 跑步5公里', learning: '', mood: '很好', reflection: '' })}>addRecordWithKeywordTag</button>
      <button onClick={() => importData({ records: [{ id: 'imp1', activity: 'imported', learning: '', mood: '很好', reflection: '', tags: [], createdAt: '2024-01-01' }] })}>importData</button>
    </div>
  );
};

describe('GrowthContext mutations', () => {
  beforeEach(() => {
    localStorage.clear();
    secureStorage.removeItem('growthos-records');
    secureStorage.removeItem('growthos-tree');
  });

  it('addRecord adds a record with timestamp and auto-tags', async () => {
    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );
    await vi.waitFor(() => {
      expect(screen.getByTestId('records').textContent).toBe('0');
    });
    act(() => {
      fireEvent.click(screen.getByText('addRecordWithTag'));
    });
    expect(screen.getByTestId('records').textContent).toBe('1');
    expect(screen.getByTestId('tags').textContent).toContain('编程');
  });

  it('addRecord extracts keyword tags from activity text', async () => {
    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );
    await vi.waitFor(() => {
      expect(screen.getByTestId('records').textContent).toBe('0');
    });
    act(() => {
      fireEvent.click(screen.getByText('addRecordWithKeywordTag'));
    });
    expect(screen.getByTestId('records').textContent).toBe('1');
    expect(screen.getByTestId('tags').textContent).toContain('运动');
  });

  it('importData imports records and updates state', async () => {
    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );
    await vi.waitFor(() => {
      expect(screen.getByTestId('records').textContent).toBe('0');
    });
    act(() => {
      fireEvent.click(screen.getByText('importData'));
    });
    expect(screen.getByTestId('records').textContent).toBe('1');
  });

  it('addRecord with plain text works', async () => {
    render(
      <GrowthProvider>
        <Probe />
      </GrowthProvider>,
    );
    await vi.waitFor(() => {
      expect(screen.getByTestId('records').textContent).toBe('0');
    });
    act(() => {
      fireEvent.click(screen.getByText('addRecord'));
    });
    expect(screen.getByTestId('records').textContent).toBe('1');
  });
});
