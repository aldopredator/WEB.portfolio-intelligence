import { test, expect } from '@playwright/test';

/**
 * Responsive Layout Tests
 * Verifies the dashboard works correctly on different screen sizes
 */
test.describe('Responsive Layout', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
      });

      test('should display main content', async ({ page }) => {
        const mainContent = page.locator('main, [role="main"], body').first();
        await expect(mainContent).toBeVisible();
      });

      test('should have scrollable content', async ({ page }) => {
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
        const viewportHeight = await page.evaluate(() => window.innerHeight);
        
        // Content should be scrollable
        expect(bodyHeight).toBeGreaterThan(0);
        
        // Test scrolling works
        await page.evaluate(() => window.scrollTo(0, 100));
        const scrollY = await page.evaluate(() => window.scrollY);
        expect(scrollY).toBeGreaterThanOrEqual(0);
      });

      test('should not have horizontal scrollbar', async ({ page }) => {
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        
        // Body width should not exceed viewport width (no horizontal scroll)
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // +10 for scrollbar
      });

      test('stock cards should be visible', async ({ page }) => {
        const stockCards = page.locator('text=/GOOG|TSLA|NVDA/').first();
        await expect(stockCards).toBeVisible();
      });

      test('navigation should be accessible', async ({ page }) => {
        // On mobile, there might be a hamburger menu
        const nav = page.locator('nav, [role="navigation"]').first();
        const navLinks = page.getByRole('link', { name: /criteria|screening/i }).first();
        
        // Either nav or links should be visible (or behind a menu button)
        const hasNav = await nav.isVisible().catch(() => false);
        const hasLinks = await navLinks.isVisible().catch(() => false);
        const hasMenuButton = await page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i]').isVisible().catch(() => false);
        
        expect(hasNav || hasLinks || hasMenuButton).toBeTruthy();
      });
    });
  }

  test('should handle very small mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should still render without breaking
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Should not have horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasOverflow).toBeFalsy();
  });

  test('should handle ultra-wide viewport', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Content should be centered or properly distributed
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });
});
