import { test, expect } from '@playwright/test';

/**
 * Component Visibility Tests
 * Ensures all critical components are visible and functional
 */
test.describe('Dashboard Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display Price Chart component', async ({ page }) => {
    // Look for chart-related text or SVG elements
    const chart = page.locator('svg, canvas, text=/Price Movement|30-Day|Chart/i').first();
    await expect(chart).toBeVisible({ timeout: 10000 });
  });

  test('should display Social Sentiment card', async ({ page }) => {
    const sentimentCard = page.locator('text=/Social Sentiment|Sentiment|Community/i').first();
    await expect(sentimentCard).toBeVisible();
  });

  test('should display Pros & Cons section', async ({ page }) => {
    // Look for pros and cons indicators
    const prosSection = page.locator('text=/Pros|Advantages|Strengths/i').first();
    const consSection = page.locator('text=/Cons|Disadvantages|Weaknesses/i').first();
    
    await expect(prosSection).toBeVisible();
    await expect(consSection).toBeVisible();
  });

  test('should display Company Highlights', async ({ page }) => {
    const highlights = page.locator('text=/Company Highlights|Key Metrics|Financial Metrics/i').first();
    await expect(highlights).toBeVisible();
  });

  test('should display Recommendation card', async ({ page }) => {
    const recommendation = page.locator('text=/Recommendation|Rating|Analyst/i').first();
    await expect(recommendation).toBeVisible();
  });

  test('should display market data (52-week high/low, volume, etc)', async ({ page }) => {
    const marketData = page.locator('text=/52-Week|52W|Volume|Market Cap/i').first();
    await expect(marketData).toBeVisible();
  });

  test('sentiment score should be visible', async ({ page }) => {
    // Look for sentiment indicators (Positive, Negative, Neutral, or percentages)
    const sentimentScore = page.locator('text=/Positive|Negative|Neutral|[0-9]+%/i').first();
    await expect(sentimentScore).toBeVisible();
  });

  test('should display financial ratios', async ({ page }) => {
    // Look for common ratios like P/E, P/B, etc.
    const ratios = page.locator('text=/P\\/E|PE Ratio|Price to Earnings|P\\/B|Price to Book/i').first();
    await expect(ratios).toBeVisible();
  });
});
