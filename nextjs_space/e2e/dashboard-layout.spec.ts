import { test, expect } from '@playwright/test';

/**
 * Dashboard Layout and Navigation Tests
 * Verifies the overall structure and navigation elements are present and functional
 */
test.describe('Dashboard Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should display the main dashboard title', async ({ page }) => {
    const title = page.locator('h1, h2').filter({ hasText: /Stock Insights Dashboard|Portfolio/i }).first();
    await expect(title).toBeVisible();
  });

  test('should display navigation links', async ({ page }) => {
    // Check for Criteria link
    const criteriaLink = page.getByRole('link', { name: /criteria/i });
    await expect(criteriaLink).toBeVisible();
    
    // Check for Screening link
    const screeningLink = page.getByRole('link', { name: /screening/i });
    await expect(screeningLink).toBeVisible();
  });

  test('should navigate to Criteria page', async ({ page }) => {
    await page.getByRole('link', { name: /criteria/i }).click();
    await expect(page).toHaveURL(/.*criteria/);
  });

  test('should navigate to Screening page', async ({ page }) => {
    await page.getByRole('link', { name: /screening/i }).click();
    await expect(page).toHaveURL(/.*screening/);
  });

  test('should have proper page scrolling', async ({ page }) => {
    // Get the page height
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    
    // If content is taller than viewport, verify scrolling works
    if (bodyHeight > viewportHeight) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    }
  });

  test('should display timestamp/last updated info', async ({ page }) => {
    const timestamp = page.locator('text=/Last updated|Updated|Nov.*202[0-9]/i').first();
    await expect(timestamp).toBeVisible();
  });
});
