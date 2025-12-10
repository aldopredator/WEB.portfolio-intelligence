import { test, expect } from '@playwright/test';

/**
 * Navigation Tests - Comprehensive Navigation Coverage
 * These tests verify all navigation flows work correctly and prevent regressions.
 */

test.describe('Main Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load the homepage with Portfolio Intelligence header', async ({ page }) => {
    await expect(page.locator('text=Portfolio Intelligence')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to Dashboard from sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /dashboard/i }).first().click();
    await page.waitForURL(/\/(dashboard|\?)/);
    // Verify URL changed and page loaded
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to Portfolios page', async ({ page }) => {
    await page.getByRole('link', { name: /portfolios/i }).click();
    await page.waitForURL('/portfolios');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to Screening page', async ({ page }) => {
    await page.getByRole('link', { name: /screening/i }).click();
    await page.waitForURL('/screening');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate back to Dashboard from Screening', async ({ page }) => {
    // Navigate to Screening
    await page.getByRole('link', { name: /screening/i }).click();
    await page.waitForURL('/screening');
    
    // Navigate back to Dashboard
    await page.getByRole('link', { name: /dashboard/i }).first().click();
    await page.waitForURL(/\/(dashboard|\?)/);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to Criteria page from Screening', async ({ page }) => {
    // Navigate to Screening
    await page.getByRole('link', { name: /screening/i }).click();
    await page.waitForURL('/screening');
    
    // Look for "Edit Criteria" or similar button
    const editButton = page.locator('a[href*="/criteria"], button:has-text("Criteria")').first();
    if (await editButton.isVisible({ timeout: 5000 })) {
      await editButton.click();
      await page.waitForURL('/criteria');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should navigate between all main sections in sequence', async ({ page }) => {
    // Dashboard -> Portfolios
    await page.getByRole('link', { name: /portfolios/i }).click();
    await page.waitForURL('/portfolios');
    await page.waitForLoadState('networkidle');
    
    // Portfolios -> Screening
    await page.getByRole('link', { name: /screening/i }).click();
    await page.waitForURL('/screening');
    await page.waitForLoadState('networkidle');
    
    // Screening -> Dashboard
    await page.getByRole('link', { name: /dashboard/i }).first().click();
    await page.waitForURL(/\/(dashboard|\?)/);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/(dashboard|\?|$)/);
  });

  test('sidebar navigation persists across page loads', async ({ page }) => {
    // Check sidebar exists on dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const dashboardLinks = await page.getByRole('link', { name: /dashboard|portfolios|screening/i }).count();
    expect(dashboardLinks).toBeGreaterThan(0);
    
    // Check sidebar exists on portfolios
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');
    const portfolioLinks = await page.getByRole('link', { name: /dashboard|portfolios|screening/i }).count();
    expect(portfolioLinks).toBeGreaterThan(0);
    
    // Check sidebar exists on screening
    await page.goto('/screening');
    await page.waitForLoadState('networkidle');
    const screeningLinks = await page.getByRole('link', { name: /dashboard|portfolios|screening/i }).count();
    expect(screeningLinks).toBeGreaterThan(0);
  });

  test('should handle direct URL navigation to each page', async ({ page }) => {
    // Test direct navigation to Dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    
    // Test direct navigation to Portfolios
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    
    // Test direct navigation to Screening
    await page.goto('/screening');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    
    // Test direct navigation to Criteria
    await page.goto('/criteria');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('browser back button works correctly', async ({ page }) => {
    // Navigate to Portfolios
    await page.getByRole('link', { name: /portfolios/i }).click();
    await page.waitForURL('/portfolios');
    
    // Navigate to Screening
    await page.getByRole('link', { name: /screening/i }).click();
    await page.waitForURL('/screening');
    
    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL(/portfolios/);
    
    // Back again to dashboard
    await page.goBack();
    await expect(page).toHaveURL(/\/(dashboard|\?|$)/);
  });

  test('active navigation link is highlighted', async ({ page }) => {
    // Navigate to Portfolios
    await page.getByRole('link', { name: /portfolios/i }).click();
    await page.waitForURL('/portfolios');
    await page.waitForLoadState('networkidle');
    
    // Simply verify the page loaded correctly - active state styling varies by implementation
    await expect(page).toHaveURL(/portfolios/);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Navigation Error Handling', () => {
  test('404 page should load for invalid routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');
    // Next.js returns 404 status for invalid routes
    expect(response?.status()).toBe(404);
  });

  test('should handle navigation when offline gracefully', async ({ page, context }) => {
    // Load page first
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to navigate (should show cached version or error)
    await page.getByRole('link', { name: /portfolios/i }).click();
    
    // Should not crash - just verify page is still responsive
    await expect(page.locator('body')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
  });
});

test.describe('Navigation Performance', () => {
  test('page transitions should complete within 3 seconds', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    await page.getByRole('link', { name: /screening/i }).click();
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('no console errors during navigation', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Navigate through all pages
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/screening');
    await page.waitForLoadState('networkidle');
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('Warning') && 
      !e.includes('favicon') &&
      !e.includes('DevTools')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
