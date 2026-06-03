import { QuotaMonitor } from '../quota/quotaMonitor';

describe('QuotaMonitor', () => {
  it('isSupported reflects navigator.storage.estimate availability', () => {
    const m = new QuotaMonitor();
    expect(typeof m.isSupported).toBe('boolean');
  });

  it('initial status is ok level with zeros', () => {
    const m = new QuotaMonitor();
    const s = m.status;
    expect(s.level).toBe('ok');
    expect(s.usage).toBe(0);
    expect(s.quota).toBe(0);
  });

  it('check() returns a valid QuotaStatus', async () => {
    const m = new QuotaMonitor();
    const s = await m.check();
    expect(typeof s.isSupported).toBe('boolean');
    expect(typeof s.usage).toBe('number');
    expect(typeof s.quota).toBe('number');
    expect(typeof s.percent).toBe('number');
    expect(['ok', 'warn', 'critical', 'exceeded']).toContain(s.level);
    expect(typeof s.timestamp).toBe('number');
  });

  it('canWrite returns ok when not supported', () => {
    const m = new QuotaMonitor();
    expect(m.canWrite(1_000_000)).toEqual({ ok: true });
  });

  it('canWrite rejects when projected usage would exceed quota', () => {
    const m = new QuotaMonitor();
    // 手动设置一个状态
    (m as unknown as { lastStatus: { isSupported: boolean, usage: number, quota: number, percent: number, level: 'ok', timestamp: number } }).lastStatus = {
      isSupported: true,
      usage: 9_000_000,
      quota: 10_000_000,
      percent: 90,
      level: 'ok',
      timestamp: 0,
    };
    const r = m.canWrite(2_000_000);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/exceeded/);
  });

  it('canWrite allows writes that stay under quota', () => {
    const m = new QuotaMonitor();
    (m as unknown as { lastStatus: { isSupported: boolean, usage: number, quota: number, percent: number, level: 'ok', timestamp: number } }).lastStatus = {
      isSupported: true,
      usage: 1_000_000,
      quota: 10_000_000,
      percent: 10,
      level: 'ok',
      timestamp: 0,
    };
    expect(m.canWrite(500_000).ok).toBe(true);
  });

  it('subscribe returns unsubscribe', () => {
    const m = new QuotaMonitor();
    const sub = jest.fn();
    const unsub = m.subscribe(sub);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('start/stop is idempotent', () => {
    const m = new QuotaMonitor({ intervalMs: 1_000_000 });
    m.start();
    m.start(); // 不应报错
    m.stop();
    m.stop(); // 不应报错
  });

  it('respects custom thresholds', () => {
    const m = new QuotaMonitor({ warnPercent: 50, criticalPercent: 80 });
    expect((m as unknown as { options: { warnPercent: number } }).options.warnPercent).toBe(50);
    expect((m as unknown as { options: { criticalPercent: number } }).options.criticalPercent).toBe(80);
  });
});
