/**
 * Playwright fixture: 模拟已登录用户
 *
 * 业务背景：
 * - App.tsx 在 useEffect 里调 checkAuth() 同步地从 localStorage(STORAGE_KEYS.USER) 恢复登录态
 * - 未登录时整页只渲染 <Auth /> 组件，无法测到 navbar / goals / records 等受保护页面
 * - e2e 测试要覆盖"已登录" 路径的产品 UI 行为，必须显式注入登录态
 *
 * 实现策略：
 * - 扩展 @playwright/test 的 base test
 * - 通过 page.addInitScript() 在每次 navigation 前注入 STORAGE_KEYS.USER
 * - 提供 authedPage fixture，自动等待 Layout 渲染完成（侧边栏出现）
 *
 * 为什么不用 storageState 文件：
 * - storageState 需要先生成、提交到仓库
 * - addInitScript 更轻量、无外部依赖、随测试代码走
 * - 测试隔离性更好（每个 page 都是干净 context）
 */
import { test as base, expect, type Page } from '@playwright/test';
import { STORAGE_KEYS } from '../../src/constants';

// 合成一个稳定、可重复的"虚拟用户"
// 形状兼容 authSlice.checkAuth reducer 的两种识别方式：
//   1) { user: {...}, token }  ← authServiceV2.setItem 包装后的形状
//   2) {...裸 user}           ← 兼容分支
// 故意不放在 fixture 的 setup script 里硬编码，让 reducer 走"形状 1"路径
export const FAKE_USER = {
  id: 'e2e-user-1',
  email: 'e2e@growthos.local',
  username: 'E2EUser',
  name: 'E2E User',
  createdAt: '2025-01-01T00:00:00.000Z',
};

export const FAKE_AUTH_PAYLOAD = {
  user: FAKE_USER,
  token: 'fake-jwt-token-for-e2e',
};

export const test = base.extend<{ authedPage: Page }>({
  // 默认 page（未登录）继续可用，给"公开页面"测试使用
  authedPage: async ({ page }, use) => {
    // 在每次 page navigation / page.goto 前注入登录态
    await page.addInitScript(
      ({ key, value }: { key: string; value: string }) => {
        window.localStorage.setItem(key, value);
      },
      { key: STORAGE_KEYS.USER, value: JSON.stringify(FAKE_AUTH_PAYLOAD) },
    );
    await use(page);
  },
});

export { expect };
