import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page for each test
    await page.goto('/');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should load the homepage', async ({ page }) => {
    // Check for header
    await expect(page.locator('text=Portfolio Intelligence')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to dashboard', async ({ page }) => {
    // Click on dashboard link (use text instead of href to avoid dynamic URLs)
    await page.getByRole('link', { name: /dashboard/i }).first().click();
    
    // Wait for navigation
    await page.waitForURL(/\/(dashboard|\?)/);
    
    // Verify we're on the dashboard
    await expect(page.locator('text=Stock insights')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to screening page', async ({ page }) => {
    // Navigate to screening (use text locator instead of href)
    await page.getByRole('link', { name: /screening/i }).click();
    
    // Wait for navigation
    await page.waitForURL('/screening');
    
    // Check for screening page elements
    await expect(page.locator('text=Stock Screening')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to portfolios page', async ({ page }) => {
    // Navigate to portfolios
    await page.getByRole('link', { name: /portfolios/i }).click();
    
    // Wait for navigation
    await page.waitForURL('/portfolios');
    
    // Check for portfolios page elements
    await expect(page.locator('text=Manage your portfolios')).toBeVisible({ timeout: 10000 });
  });
});
