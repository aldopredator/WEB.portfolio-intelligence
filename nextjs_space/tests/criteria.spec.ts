import { test, expect } from '@playwright/test';

test.describe('Screening Criteria', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/criteria');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should display criteria page', async ({ page }) => {
    // Check for page title
    await expect(page.locator('text=Screening Criteria').or(page.locator('text=Criteria'))).toBeVisible({ timeout: 10000 });
  });

  test('should display rating filter section', async ({ page }) => {
    // Check that rating filter exists
    await expect(page.locator('text=Rating').first()).toBeVisible({ timeout: 10000 });
  });

  test('should have apply filters button', async ({ page }) => {
    // Check for the apply button
    await expect(page.getByRole('button', { name: /apply/i })).toBeVisible({ timeout: 10000 });
  });

  test('should have reset button', async ({ page }) => {
    // Check for the reset button
    await expect(page.getByRole('button', { name: /reset/i })).toBeVisible({ timeout: 10000 });
  });
});
