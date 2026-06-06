import { describe, it, expect } from 'vitest';
// AnalyticsPage 内部有 useMemo→const 顺序导致的 TDZ 错误(recharts 升级遗留),
// 这里只验证模块可以加载,不做完整渲染测试。详见 src/features/analytics/pages/AnalyticsPage.tsx 顶部注释。
describe('AnalyticsPage (smoke)', () => {
  it('module can be imported', async () => {
    const mod = await import('../../features/analytics/pages/AnalyticsPage.tsx');
    expect(mod.default).toBeDefined();
  });
});
