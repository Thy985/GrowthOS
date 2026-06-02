# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> GrowthOS E2E Tests >> can navigate to goals page
- Location: e2e/app.spec.ts:15:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=目标')

```

# Page snapshot

```yaml
- paragraph [ref=e5]: 应用加载失败
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('GrowthOS E2E Tests', () => {
  4   |   test('homepage loads successfully', async ({ page }) => {
  5   |     await page.goto('/');
  6   |     await expect(page).toHaveTitle(/GrowthOS/i);
  7   |   });
  8   | 
  9   |   test('navigation menu is visible', async ({ page }) => {
  10  |     await page.goto('/');
  11  |     const nav = page.locator('nav');
  12  |     await expect(nav).toBeVisible();
  13  |   });
  14  | 
  15  |   test('can navigate to goals page', async ({ page }) => {
  16  |     await page.goto('/');
> 17  |     await page.click('text=目标');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  18  |     await expect(page).toHaveURL(/goals/);
  19  |   });
  20  | 
  21  |   test('can navigate to records page', async ({ page }) => {
  22  |     await page.goto('/');
  23  |     await page.click('text=记录');
  24  |     await expect(page).toHaveURL(/records/);
  25  |   });
  26  | 
  27  |   test('can navigate to analytics page', async ({ page }) => {
  28  |     await page.goto('/');
  29  |     await page.click('text=分析');
  30  |     await expect(page).toHaveURL(/analytics/);
  31  |   });
  32  | 
  33  |   test('can navigate to reminders page', async ({ page }) => {
  34  |     await page.goto('/');
  35  |     await page.click('text=提醒');
  36  |     await expect(page).toHaveURL(/reminders/);
  37  |   });
  38  | 
  39  |   test('dark mode toggle works', async ({ page }) => {
  40  |     await page.goto('/');
  41  |     const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"], button:has-text("主题"), button:has-text("深色")').first();
  42  |     
  43  |     if (await themeToggle.isVisible()) {
  44  |       const initialTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  45  |       await themeToggle.click();
  46  |       const newTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  47  |       expect(newTheme).not.toBe(initialTheme);
  48  |     }
  49  |   });
  50  | });
  51  | 
  52  | test.describe('Goals Page E2E Tests', () => {
  53  |   test.beforeEach(async ({ page }) => {
  54  |     await page.goto('/goals');
  55  |   });
  56  | 
  57  |   test('goals page renders', async ({ page }) => {
  58  |     await expect(page.locator('h1')).toContainText(/目标/);
  59  |   });
  60  | 
  61  |   test('add goal button is visible', async ({ page }) => {
  62  |     const addButton = page.locator('button:has-text("添加目标"), button:has-text("添加新目标")').first();
  63  |     await expect(addButton).toBeVisible();
  64  |   });
  65  | 
  66  |   test('can open add goal form', async ({ page }) => {
  67  |     const addButton = page.locator('button:has-text("添加目标")').first();
  68  |     await addButton.click();
  69  |     const form = page.locator('form');
  70  |     await expect(form).toBeVisible();
  71  |   });
  72  | });
  73  | 
  74  | test.describe('Records Page E2E Tests', () => {
  75  |   test.beforeEach(async ({ page }) => {
  76  |     await page.goto('/records');
  77  |   });
  78  | 
  79  |   test('records page renders', async ({ page }) => {
  80  |     await expect(page.locator('h1')).toBeVisible();
  81  |   });
  82  | 
  83  |   test('search input is visible', async ({ page }) => {
  84  |     const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="搜索"]');
  85  |     await expect(searchInput).toBeVisible();
  86  |   });
  87  | 
  88  |   test('mood filter buttons are visible', async ({ page }) => {
  89  |     const moodFilters = page.locator('button:has-text("Great"), button:has-text("Good"), button:has-text("Okay")');
  90  |     const count = await moodFilters.count();
  91  |     expect(count).toBeGreaterThan(0);
  92  |   });
  93  | });
  94  | 
  95  | test.describe('Accessibility E2E Tests', () => {
  96  |   test('page has proper heading structure', async ({ page }) => {
  97  |     await page.goto('/');
  98  |     const headings = await page.locator('h1, h2, h3').all();
  99  |     expect(headings.length).toBeGreaterThan(0);
  100 |   });
  101 | 
  102 |   test('images have alt text', async ({ page }) => {
  103 |     await page.goto('/');
  104 |     const images = page.locator('img');
  105 |     const count = await images.count();
  106 |     if (count > 0) {
  107 |       const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  108 |       expect(imagesWithoutAlt).toBe(0);
  109 |     }
  110 |   });
  111 | 
  112 |   test('form inputs have labels', async ({ page }) => {
  113 |     await page.goto('/goals');
  114 |     const inputs = page.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
  115 |     const count = await inputs.count();
  116 |     if (count > 0) {
  117 |       const inputsWithoutLabel = await page.locator('input:not([aria-label]):not([id])').count();
```