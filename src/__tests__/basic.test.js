import { test, expect } from '@playwright/test';

test.describe('GrowthOS Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application', async ({ page }) => {
    await expect(page).toHaveTitle(/GrowthOS/i);
  });

  test('should display navigation links', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
  });
});
