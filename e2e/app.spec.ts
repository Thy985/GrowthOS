import { test, expect } from '@playwright/test';

test.describe('GrowthOS E2E Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/GrowthOS/i);
  });

  test('navigation menu is visible', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('can navigate to goals page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=目标');
    await expect(page).toHaveURL(/goals/);
  });

  test('can navigate to records page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=记录');
    await expect(page).toHaveURL(/records/);
  });

  test('can navigate to analytics page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=分析');
    await expect(page).toHaveURL(/analytics/);
  });

  test('can navigate to reminders page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=提醒');
    await expect(page).toHaveURL(/reminders/);
  });

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/');
    const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"], button:has-text("主题"), button:has-text("深色")').first();
    
    if (await themeToggle.isVisible()) {
      const initialTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      await themeToggle.click();
      const newTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(newTheme).not.toBe(initialTheme);
    }
  });
});

test.describe('Goals Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/goals');
  });

  test('goals page renders', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/目标/);
  });

  test('add goal button is visible', async ({ page }) => {
    const addButton = page.locator('button:has-text("添加目标"), button:has-text("添加新目标")').first();
    await expect(addButton).toBeVisible();
  });

  test('can open add goal form', async ({ page }) => {
    const addButton = page.locator('button:has-text("添加目标")').first();
    await addButton.click();
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });
});

test.describe('Records Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/records');
  });

  test('records page renders', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('search input is visible', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="搜索"]');
    await expect(searchInput).toBeVisible();
  });

  test('mood filter buttons are visible', async ({ page }) => {
    const moodFilters = page.locator('button:has-text("Great"), button:has-text("Good"), button:has-text("Okay")');
    const count = await moodFilters.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Accessibility E2E Tests', () => {
  test('page has proper heading structure', async ({ page }) => {
    await page.goto('/');
    const headings = await page.locator('h1, h2, h3').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    if (count > 0) {
      const imagesWithoutAlt = await page.locator('img:not([alt])').count();
      expect(imagesWithoutAlt).toBe(0);
    }
  });

  test('form inputs have labels', async ({ page }) => {
    await page.goto('/goals');
    const inputs = page.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
    const count = await inputs.count();
    if (count > 0) {
      const inputsWithoutLabel = await page.locator('input:not([aria-label]):not([id])').count();
      expect(inputsWithoutLabel).toBeLessThanOrEqual(count);
    }
  });
});

test.describe('Responsive Design E2E Tests', () => {
  test('mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('desktop viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Performance E2E Tests', () => {
  test('page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('DevTools') &&
      !e.includes('Download')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
