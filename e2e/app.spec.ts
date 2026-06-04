/**
 * GrowthOS E2E 测试套件
 *
 * 关键设计：
 * - 用 authedPage fixture 模拟已登录态（注入 localStorage 的 STORAGE_KEYS.USER）
 * - 拆分为"公开页（未登录）"和"已登录"两大类
 * - 全部断言用 data-* 或稳定的中文文本，不再依赖动态文案
 * - 路由基于 HashRouter (#/goals)，URL 检查用 substring match
 */
import { test, expect } from './utils/authFixture';

// =============================================================
// 公开页（未登录场景）
// =============================================================

test.describe('Public Pages (unauthenticated)', () => {
  test('homepage shows the login form when not authenticated', async ({ page }) => {
    await page.goto('/');
    // Auth 页面有 email + password 输入框
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // 有登录/注册切换按钮
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login form has all required fields', async ({ page }) => {
    await page.goto('/');
    // 注册切换按钮存在
    const switchBtn = page.locator('button:has-text("注册")');
    await expect(switchBtn).toBeVisible();
  });

  test('does not render protected layout (no sidebar) when unauthenticated', async ({ page }) => {
    await page.goto('/');
    // 未登录时 Layout 不应渲染，md:flex sidebar 不存在
    const sidebar = page.locator('nav.hidden.md\\:flex');
    await expect(sidebar).toHaveCount(0);
  });
});

// =============================================================
// 已登录场景
// =============================================================

test.describe('Authenticated Layout & Navigation', () => {
  test('Layout sidebar renders after login', async ({ authedPage }) => {
    await authedPage.goto('/');
    // Layout 里的固定侧边栏 (md:flex)
    const sidebar = authedPage.locator('nav.hidden.md\\:flex');
    await expect(sidebar).toBeVisible();
    // 主内容区
    await expect(authedPage.locator('main')).toBeVisible();
  });

  test('sidebar has 7 navigation items', async ({ authedPage }) => {
    await authedPage.goto('/');
    const sidebar = authedPage.locator('nav.hidden.md\\:flex');
    // 7 个 Link: 首页/记录/目标/提醒/分析/成长树/设置
    await expect(sidebar.locator('a')).toHaveCount(7);
  });

  test('can navigate to goals page via sidebar', async ({ authedPage }) => {
    await authedPage.goto('/');
    await authedPage.locator('nav.hidden.md\\:flex').locator('a:has-text("目标")').click();
    await expect(authedPage).toHaveURL(/goals/);
  });

  test('can navigate to records page via sidebar', async ({ authedPage }) => {
    await authedPage.goto('/');
    await authedPage.locator('nav.hidden.md\\:flex').locator('a:has-text("记录")').click();
    await expect(authedPage).toHaveURL(/records/);
  });

  test('can navigate to analytics page via sidebar', async ({ authedPage }) => {
    await authedPage.goto('/');
    await authedPage.locator('nav.hidden.md\\:flex').locator('a:has-text("分析")').click();
    await expect(authedPage).toHaveURL(/analytics/);
  });

  test('can navigate to reminders page via sidebar', async ({ authedPage }) => {
    await authedPage.goto('/');
    await authedPage.locator('nav.hidden.md\\:flex').locator('a:has-text("提醒")').click();
    await expect(authedPage).toHaveURL(/reminders/);
  });

  test('can navigate to growth-tree page via sidebar', async ({ authedPage }) => {
    await authedPage.goto('/');
    await authedPage.locator('nav.hidden.md\\:flex').locator('a:has-text("成长树")').click();
    await expect(authedPage).toHaveURL(/growth-tree/);
  });

  test('can navigate to settings/storage page via sidebar', async ({ authedPage }) => {
    await authedPage.goto('/');
    await authedPage.locator('nav.hidden.md\\:flex').locator('a:has-text("设置")').click();
    await expect(authedPage).toHaveURL(/settings/);
  });

  test('dark mode toggle works', async ({ authedPage }) => {
    await authedPage.goto('/');
    const themeToggle = authedPage.locator('nav.hidden.md\\:flex').locator('button').filter({ hasText: /深色模式|浅色模式/ });
    await expect(themeToggle).toBeVisible();
    const initialTheme = await authedPage.evaluate(() => document.documentElement.classList.contains('dark'));
    await themeToggle.click();
    const newTheme = await authedPage.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(newTheme).not.toBe(initialTheme);
  });
});

// =============================================================
// Dashboard
// =============================================================

test.describe('Dashboard Page', () => {
  test('dashboard renders with title', async ({ authedPage }) => {
    await authedPage.goto('/');
    // hash 路由默认 /, App.tsx 自动 Navigate to /dashboard
    await expect(authedPage).toHaveURL(/dashboard/);
    const h1 = authedPage.locator('h1').first();
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/仪表板|Dashboard/);
  });

  test('dashboard shows stat cards', async ({ authedPage }) => {
    await authedPage.goto('/');
    // 至少 3 张统计卡（今日记录 / 活跃目标 / ...）
    const cards = authedPage.locator('.card.card-elevated');
    await expect(cards.first()).toBeVisible();
  });
});

// =============================================================
// Goals
// =============================================================

test.describe('Goals Page', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/');
    await authedPage.locator('nav.hidden.md\\:flex').locator('a:has-text("目标")').click();
    await expect(authedPage).toHaveURL(/goals/);
  });

  test('goals page renders with title', async ({ authedPage }) => {
    await expect(authedPage.locator('h1').first()).toBeVisible();
  });

  test('add goal button is visible', async ({ authedPage }) => {
    const addButton = authedPage.locator('button:has-text("添加目标")').first();
    await expect(addButton).toBeVisible();
  });

  test('can open add goal form', async ({ authedPage }) => {
    const addButton = authedPage.locator('button:has-text("添加目标")').first();
    await addButton.click();
    const form = authedPage.locator('form');
    await expect(form).toBeVisible();
  });
});

// =============================================================
// Records
// =============================================================

test.describe('Records Page', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/');
    await authedPage.locator('nav.hidden.md\\:flex').locator('a:has-text("记录")').click();
    await expect(authedPage).toHaveURL(/records/);
  });

  test('records page renders with h1', async ({ authedPage }) => {
    await expect(authedPage.locator('h1').first()).toBeVisible();
  });

  test('add record button is visible', async ({ authedPage }) => {
    const addButton = authedPage.locator('button:has-text("添加记录")').first();
    await expect(addButton).toBeVisible();
  });
});

// =============================================================
// Reminders
// =============================================================

test.describe('Reminders Page', () => {
  test('reminders page renders', async ({ authedPage }) => {
    await authedPage.goto('/');
    await authedPage.locator('nav.hidden.md\\:flex').locator('a:has-text("提醒")').click();
    await expect(authedPage).toHaveURL(/reminders/);
    await expect(authedPage.locator('main')).toBeVisible();
  });
});

// =============================================================
// Analytics
// =============================================================

test.describe('Analytics Page', () => {
  test('analytics page renders', async ({ authedPage }) => {
    await authedPage.goto('/');
    await authedPage.locator('nav.hidden.md\\:flex').locator('a:has-text("分析")').click();
    await expect(authedPage).toHaveURL(/analytics/);
    await expect(authedPage.locator('main')).toBeVisible();
  });
});

// =============================================================
// Accessibility
// =============================================================

test.describe('Accessibility', () => {
  test('page has proper heading structure', async ({ authedPage }) => {
    await authedPage.goto('/');
    const headings = authedPage.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible();
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('all images have alt text', async ({ authedPage }) => {
    await authedPage.goto('/');
    const images = authedPage.locator('img');
    const count = await images.count();
    if (count > 0) {
      const imagesWithoutAlt = await authedPage.locator('img:not([alt])').count();
      expect(imagesWithoutAlt).toBe(0);
    }
  });
});

// =============================================================
// Responsive Design
// =============================================================

test.describe('Responsive Design', () => {
  test('mobile viewport renders correctly', async ({ authedPage }) => {
    await authedPage.setViewportSize({ width: 375, height: 667 });
    await authedPage.goto('/');
    // 移动端主内容可见（侧边栏 hidden，header 出现）
    await expect(authedPage.locator('main')).toBeVisible();
  });

  test('tablet viewport renders correctly', async ({ authedPage }) => {
    await authedPage.setViewportSize({ width: 768, height: 1024 });
    await authedPage.goto('/');
    await expect(authedPage.locator('nav.hidden.md\\:flex')).toBeVisible();
  });

  test('desktop viewport renders correctly', async ({ authedPage }) => {
    await authedPage.setViewportSize({ width: 1920, height: 1080 });
    await authedPage.goto('/');
    await expect(authedPage.locator('nav.hidden.md\\:flex')).toBeVisible();
  });
});

// =============================================================
// Performance
// =============================================================

test.describe('Performance', () => {
  test('page loads within reasonable time', async ({ authedPage }) => {
    const startTime = Date.now();
    await authedPage.goto('/');
    await authedPage.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10_000);
  });

  test('no critical console errors on page load', async ({ authedPage }) => {
    const errors: string[] = [];
    authedPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await authedPage.goto('/');
    await authedPage.waitForLoadState('networkidle');

    // 过滤掉已知无关的噪音
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('DevTools') &&
      !e.includes('Download') &&
      !e.includes('manifest') &&
      !e.includes('service-worker')
    );

    expect(criticalErrors).toEqual([]);
  });
});
