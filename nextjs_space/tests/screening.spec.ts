import { test, expect } from '@playwright/test';

test.describe('Stock Screening', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/screening');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should display screening page', async ({ page }) => {
    // Check for screening page header
    await expect(page.locator('text=Stock Screening').or(page.locator('text=Screening'))).toBeVisible({ timeout: 10000 });
    
    // Should have a table with results
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should display screening table headers', async ({ page }) => {
    // Check for essential table headers
    await expect(page.locator('th').filter({ hasText: /stock/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show at least one stock in results', async ({ page }) => {
    // Check if there's at least one row in the table
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });
  });

  test('should show methodology information', async ({ page }) => {
    // Check for methodology section
    await expect(page.locator('text=Methodology').or(page.locator('text=How it works'))).toBeVisible({ timeout: 10000 });
  });
});
