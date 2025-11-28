import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * Takes screenshots to compare visual consistency across updates
 */
test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait a bit more for any animations or async content
    await page.waitForTimeout(2000);
  });

  test('full page screenshot - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('dashboard-desktop.png', {
      fullPage: true,
      maxDiffPixels: 100, // Allow minor differences
    });
  });

  test('full page screenshot - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('stock card screenshot', async ({ page }) => {
    const stockCard = page.locator('text=GOOG').locator('..').first();
    await expect(stockCard).toHaveScreenshot('stock-card.png');
  });

  test('price chart screenshot', async ({ page }) => {
    const chart = page.locator('svg, canvas').first();
    await expect(chart).toBeVisible();
    await page.waitForTimeout(1000); // Wait for chart to fully render
    await expect(chart).toHaveScreenshot('price-chart.png');
  });

  test('sentiment card screenshot', async ({ page }) => {
    const sentimentCard = page.locator('text=/Social Sentiment/i').locator('..').first();
    await expect(sentimentCard).toHaveScreenshot('sentiment-card.png');
  });

  test('pros and cons screenshot', async ({ page }) => {
    const prosConsSection = page.locator('text=/Pros.*Cons/i').locator('..').first();
    await expect(prosConsSection).toHaveScreenshot('pros-cons-section.png');
  });

  test('dark theme consistency', async ({ page }) => {
    // Verify dark background is being used
    const backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    // Dark theme should have dark background (rgb values low)
    const rgb = backgroundColor.match(/\d+/g)?.map(Number);
    if (rgb) {
      const isDark = rgb[0] < 50 && rgb[1] < 50 && rgb[2] < 50;
      expect(isDark).toBeTruthy();
    }
  });

  test('visual consistency after stock change', async ({ page }) => {
    // Take screenshot of GOOG
    await page.waitForTimeout(2000);
    const googScreenshot = await page.screenshot({ fullPage: true });
    
    // Change to TSLA
    const tslaButton = page.locator('text=TSLA').first();
    if (await tslaButton.isVisible()) {
      await tslaButton.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot of TSLA
      const tslaScreenshot = await page.screenshot({ fullPage: true });
      
      // Screenshots should be different (different data)
      expect(Buffer.compare(googScreenshot, tslaScreenshot)).not.toBe(0);
      
      // But layout should be similar - verify key elements are still in place
      await expect(page.locator('text=/Social Sentiment/i').first()).toBeVisible();
      await expect(page.locator('text=/Pros/i').first()).toBeVisible();
    }
  });
});
