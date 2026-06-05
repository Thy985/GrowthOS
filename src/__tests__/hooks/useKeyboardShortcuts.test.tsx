import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';

import useKeyboardShortcuts from '../../shared/hooks/useKeyboardShortcuts.ts';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  callback: () => void;
}

interface HarnessProps {
  shortcuts: Shortcut[];
}

const Harness = ({ shortcuts }: HarnessProps) => {
  useKeyboardShortcuts(shortcuts);
  return <div>ready</div>;
};

// 帮助函数:触发键盘事件
const fireKey = (init: KeyboardEventInit) => {
  window.dispatchEvent(new KeyboardEvent('keydown', init));
};

describe('useKeyboardShortcuts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers callback when key matches', () => {
    const cb = vi.fn();
    render(<Harness shortcuts={[{ key: 'h', callback: cb }]} />);
    fireKey({ key: 'h' });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('is case-insensitive', () => {
    const cb = vi.fn();
    render(<Harness shortcuts={[{ key: 'h', callback: cb }]} />);
    fireKey({ key: 'H' });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('does not trigger on other keys', () => {
    const cb = vi.fn();
    render(<Harness shortcuts={[{ key: 'h', callback: cb }]} />);
    fireKey({ key: 'r' });
    expect(cb).not.toHaveBeenCalled();
  });

  it('requires ctrl key when shortcut.ctrl=true', () => {
    const cb = vi.fn();
    render(<Harness shortcuts={[{ key: 'k', ctrl: true, callback: cb }]} />);
    fireKey({ key: 'k' }); // 无 ctrl
    expect(cb).not.toHaveBeenCalled();
    fireKey({ key: 'k', ctrlKey: true });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('respects shift/alt/meta modifiers', () => {
    const cbShift = vi.fn();
    const cbAlt = vi.fn();
    const cbMeta = vi.fn();
    render(
      <Harness
        shortcuts={[
          { key: 's', shift: true, callback: cbShift },
          { key: 'a', alt: true, callback: cbAlt },
          { key: 'm', meta: true, callback: cbMeta },
        ]}
      />,
    );
    fireKey({ key: 's' });
    expect(cbShift).not.toHaveBeenCalled();
    fireKey({ key: 's', shiftKey: true });
    expect(cbShift).toHaveBeenCalledTimes(1);
    fireKey({ key: 'a', altKey: true });
    expect(cbAlt).toHaveBeenCalledTimes(1);
    fireKey({ key: 'm', metaKey: true });
    expect(cbMeta).toHaveBeenCalledTimes(1);
  });

  it('skips keys when typing in input', () => {
    const cb = vi.fn();
    render(<Harness shortcuts={[{ key: 'h', callback: cb }]} />);

    const input = document.createElement('input');
    document.body.appendChild(input);
    const event = new KeyboardEvent('keydown', { key: 'h', bubbles: true });
    Object.defineProperty(event, 'target', { value: input, configurable: true });
    input.dispatchEvent(event);
    document.body.removeChild(input);
    expect(cb).not.toHaveBeenCalled();
  });

  it('removes listener on unmount', () => {
    const cb = vi.fn();
    const { unmount } = render(<Harness shortcuts={[{ key: 'h', callback: cb }]} />);
    unmount();
    fireKey({ key: 'h' });
    expect(cb).not.toHaveBeenCalled();
  });
});
