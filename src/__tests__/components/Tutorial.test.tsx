import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import Tutorial from '../../shared/components/Tutorial.tsx';
import { secureStorage } from '../../shared/utils/secureStorage.ts';

describe('Tutorial', () => {
  beforeEach(() => {
    localStorage.clear();
    secureStorage.removeItem('growthos-tutorial-seen');
  });

  it('renders first step when not seen before', async () => {
    render(<Tutorial />);
    expect(await screen.findByText('欢迎使用 GrowthOS!')).toBeInTheDocument();
    expect(screen.getByText('下一步')).toBeInTheDocument();
    expect(screen.getByText('跳过')).toBeInTheDocument();
  });

  it('does not render when tutorial already seen', () => {
    secureStorage.setItem('growthos-tutorial-seen', true);
    const { container } = render(<Tutorial />);
    expect(container.firstChild).toBeNull();
  });

  it('next button advances through steps', async () => {
    render(<Tutorial />);
    await screen.findByText('欢迎使用 GrowthOS!');
    act(() => {
      fireEvent.click(screen.getByText('下一步'));
    });
    expect(screen.getByText('记录你的活动')).toBeInTheDocument();
  });

  it('prev button goes back a step (visible after step 1)', async () => {
    render(<Tutorial />);
    await screen.findByText('欢迎使用 GrowthOS!');
    act(() => {
      fireEvent.click(screen.getByText('下一步'));
    });
    expect(screen.getByText('上一步')).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByText('上一步'));
    });
    expect(screen.getByText('欢迎使用 GrowthOS!')).toBeInTheDocument();
  });

  it('skip button closes tutorial and persists seen', async () => {
    const { container } = render(<Tutorial />);
    await screen.findByText('欢迎使用 GrowthOS!');
    act(() => {
      fireEvent.click(screen.getByText('跳过'));
    });
    expect(container.firstChild).toBeNull();
    expect(secureStorage.getItem('growthos-tutorial-seen')).toBe(true);
  });

  it('last step shows 开始使用 and clicking it completes tutorial', async () => {
    render(<Tutorial />);
    await screen.findByText('欢迎使用 GrowthOS!');
    // 共 6 步:0-5;点 5 次"下一步"到达最后
    for (let i = 0; i < 5; i++) {
      act(() => {
        fireEvent.click(screen.getByText('下一步'));
      });
    }
    expect(screen.getByText('开始使用')).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByText('开始使用'));
    });
    expect(secureStorage.getItem('growthos-tutorial-seen')).toBe(true);
  });
});
