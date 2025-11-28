import { test, expect } from '@playwright/test';

/**
 * Stock Card Tests
 * Verifies all stock cards are displayed with correct data
 */
test.describe('Stock Cards Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  const EXPECTED_STOCKS = [
    { ticker: 'GOOG', name: /Alphabet/i },
    { ticker: 'TSLA', name: /Tesla/i },
    { ticker: 'NVDA', name: /Nvidia/i },
    { ticker: 'AMZN', name: /Amazon/i },
    { ticker: 'BRK-B', name: /Berkshire/i },
    { ticker: 'ISRG', name: /Intuitive Surgical/i },
    { ticker: 'NFLX', name: /Netflix/i },
    { ticker: 'IDXX', name: /IDEXX/i },
    { ticker: 'III', name: /3i Group/i },
    { ticker: 'PLTR', name: /Palantir/i },
    { ticker: 'QBTS', name: /Wave Quantum/i },
    { ticker: 'RGTI', name: /Rigetti/i },
  ];

  test('should display all expected stock cards', async ({ page }) => {
    for (const stock of EXPECTED_STOCKS) {
      const stockCard = page.locator(`text=${stock.ticker}`).first();
      await expect(stockCard).toBeVisible();
    }
  });

  test('should display stock prices', async ({ page }) => {
    // Look for price indicators ($ symbol followed by numbers)
    const prices = page.locator('text=/\\$[0-9,.]+/').first();
    await expect(prices).toBeVisible();
  });

  test('should display price change percentages', async ({ page }) => {
    // Look for percentage changes (positive or negative)
    const percentChange = page.locator('text=/[+-]?[0-9.]+%/').first();
    await expect(percentChange).toBeVisible();
  });

  test('should show visual indicators for price movement', async ({ page }) => {
    // Check for up/down arrows or color indicators
    const hasColorIndicator = await page.locator('[class*="green"], [class*="red"], [class*="emerald"], [class*="rose"]').count();
    expect(hasColorIndicator).toBeGreaterThan(0);
  });

  test('stock cards should be clickable', async ({ page }) => {
    // Get the first stock card
    const firstStock = page.locator(`text=${EXPECTED_STOCKS[0].ticker}`).first();
    await firstStock.click();
    
    // Should navigate or show details (verify URL or content change)
    // For now, just verify the click doesn't error
    await page.waitForTimeout(500);
  });
});
