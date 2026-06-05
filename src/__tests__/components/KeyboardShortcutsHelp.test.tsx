import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import KeyboardShortcutsHelp from '../../shared/components/KeyboardShortcutsHelp.tsx';

describe('KeyboardShortcutsHelp', () => {
  it('renders nothing when isOpen=false', () => {
    const { container } = render(<KeyboardShortcutsHelp isOpen={false} onClose={() => undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders heading and all 7 shortcut descriptions when open', () => {
    render(<KeyboardShortcutsHelp isOpen onClose={() => undefined} />);
    expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
    expect(screen.getByText('回到首页')).toBeInTheDocument();
    expect(screen.getByText('查看记录列表')).toBeInTheDocument();
    expect(screen.getByText('查看成长树')).toBeInTheDocument();
    expect(screen.getByText('查看数据分析')).toBeInTheDocument();
    expect(screen.getByText('显示/隐藏快捷键帮助')).toBeInTheDocument();
    expect(screen.getByText('快速搜索')).toBeInTheDocument();
    expect(screen.getByText('关闭弹窗')).toBeInTheDocument();
    expect(screen.getByText(/提示[：:]在输入框中使用快捷键无效/)).toBeInTheDocument();
  });

  it('renders all key badges', () => {
    render(<KeyboardShortcutsHelp isOpen onClose={() => undefined} />);
    expect(screen.getAllByText('H')).toHaveLength(1);
    expect(screen.getAllByText('R')).toHaveLength(1);
    expect(screen.getAllByText('T')).toHaveLength(1);
    expect(screen.getAllByText('A')).toHaveLength(1);
    expect(screen.getAllByText('?')).toHaveLength(1);
    expect(screen.getAllByText('Ctrl')).toHaveLength(1);
    expect(screen.getAllByText('K')).toHaveLength(1);
    expect(screen.getAllByText('Esc')).toHaveLength(1);
  });

  it('close button invokes onClose', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp isOpen onClose={onClose} />);
    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
