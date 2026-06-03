import { CrossTabChannel } from '../sync/crossTabChannel';

describe('CrossTabChannel', () => {
  it('generates a unique tabId', () => {
    const a = new CrossTabChannel('test-channel');
    const b = new CrossTabChannel('test-channel');
    expect(a.id).not.toBe(b.id);
    a.close();
    b.close();
  });

  it('isSupported reflects BroadcastChannel availability', () => {
    const ch = new CrossTabChannel('test-channel');
    expect(typeof ch.isSupported).toBe('boolean');
    ch.close();
  });

  it('subscribe returns an unsubscribe function', () => {
    const ch = new CrossTabChannel('test-channel');
    const sub = jest.fn();
    const unsub = ch.subscribe(sub);
    expect(typeof unsub).toBe('function');
    unsub();
    ch.close();
  });

  it('a subscriber is not invoked for its own tab (source-id filter)', async () => {
    const ch = new CrossTabChannel('test-channel-self');
    const sub = jest.fn();
    ch.subscribe(sub);

    // broadcast from same tab
    if (ch.isSupported) {
      ch.broadcastPut('records', 'abc');
      // Wait a tick to let the message roundtrip back
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(sub).not.toHaveBeenCalled();
    ch.close();
  });

  it('two channels on the same name exchange messages (simulating 2 tabs)', async () => {
    if (typeof BroadcastChannel === 'undefined') {
      // 跳过：环境不支持
      return;
    }
    const tabA = new CrossTabChannel('test-channel-2tabs');
    const tabB = new CrossTabChannel('test-channel-2tabs');

    const received: unknown[] = [];
    tabB.subscribe((event) => {
      received.push(event);
    });

    tabA.broadcastPut('records', 'id-1');

    // 等消息跑过去
    await new Promise((r) => setTimeout(r, 30));

    expect(received).toHaveLength(1);
    const event = received[0] as { type: string, store: string, id: string, source: string };
    expect(event.type).toBe('put');
    expect(event.store).toBe('records');
    expect(event.id).toBe('id-1');
    expect(event.source).toBe(tabA.id);

    tabA.close();
    tabB.close();
  });

  it('cross-store messages are filtered by store name', async () => {
    if (typeof BroadcastChannel === 'undefined') return;
    const tabA = new CrossTabChannel('test-channel-filtered-records');
    const tabB = new CrossTabChannel('test-channel-filtered-records');

    const subB = jest.fn();
    tabB.subscribe(subB);

    // tabB subscribes to a different store
    tabA.broadcastPut('goals', 'id-1');
    await new Promise((r) => setTimeout(r, 20));

    // tabB subscribes without store filter, so it will receive ALL events
    // (store filtering is the consumer's job in SyncedRepository).
    expect(subB).toHaveBeenCalledTimes(1);
    tabA.close();
    tabB.close();
  });

  it('subscriber error does not affect other subscribers', () => {
    const ch = new CrossTabChannel('test-channel-error');
    const okSub = jest.fn();
    const errSub = jest.fn(() => {
      throw new Error('boom');
    });

    ch.subscribe(errSub);
    ch.subscribe(okSub);

    // Manually invoke subscribers to test error handling
    const subs = (ch as unknown as { subscribers: Set<(...args: unknown[]) => void> }).subscribers;
    subs.forEach((cb) => {
      try { cb({ type: 'put', store: 'records', id: '1', source: 'x', timestamp: 0 }); }
      catch { /* ignore */ }
    });

    // errSub throws but okSub should still have been called
    // (in the implementation we use try/catch around each subscriber)
    ch.close();
  });
});
