import { test, expect } from '@playwright/test';

test.describe('Stock Screening', () => {
  test('should display screening results', async ({ page }) => {
    await page.goto('/screening');
    
    // Check for screening table
    await expect(page.locator('text=STOCK').first()).toBeVisible();
    await expect(page.locator('text=MATCH SCORE')).toBeVisible();
    
    // Should show some stocks
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('should show active filters when criteria enabled', async ({ page }) => {
    // First, enable a filter in criteria
    await page.goto('/criteria');
    
    // Enable P/E filter
    const peSection = page.locator('text=P/E Ratio').first();
    const enableButton = page.locator('button').filter({ has: peSection }).first();
    await enableButton.click();
    
    // Apply filters
    await page.click('button:has-text("Apply Filters")');
    
    // Wait for screening page
    await page.waitForURL(/\/screening/);
    
    // Check active filters section
    await expect(page.locator('text=Active Screening Criteria')).toBeVisible();
    await expect(page.locator('text=P/E Ratio')).toBeVisible();
  });

  test('should display annual volume columns when enabled', async ({ page }) => {
    // Enable annual volume filters
    await page.goto('/criteria');
    
    // Scroll to and enable Avg Annual Volume % (10D)
    await page.locator('text=Avg Annual Volume % (10D)').scrollIntoViewIfNeeded();
    const vol10DSection = page.locator('text=Avg Annual Volume % (10D)').first();
    const enableButton = vol10DSection.locator('..').locator('..').locator('button').first();
    await enableButton.click();
    
    // Apply filters
    await page.click('button:has-text("Apply Filters")');
    
    // Wait for screening page
    await page.waitForURL(/\/screening/);
    
    // Check for annual volume column
    await expect(page.locator('th:has-text("Annual Vol % (10D)")')).toBeVisible();
  });

  test('should sort by match score', async ({ page }) => {
    await page.goto('/screening');
    
    // Click on Match Score header to sort
    await page.click('th:has-text("Match Score")');
    
    // Get first two match scores
    const firstScore = await page.locator('table tbody tr:nth-child(1)').locator('td:last-child').textContent();
    const secondScore = await page.locator('table tbody tr:nth-child(2)').locator('td:last-child').textContent();
    
    // Verify descending order (first should be >= second)
    expect(parseInt(firstScore || '0')).toBeGreaterThanOrEqual(parseInt(secondScore || '0'));
  });

  test('should filter by rating', async ({ page }) => {
    // Go to criteria and select 5-star rating only
    await page.goto('/criteria');
    
    // Click on 5-star rating button
    await page.click('button:has-text("⭐ 5")');
    
    // Apply filters
    await page.click('button:has-text("Apply Filters")');
    
    // Wait for screening page
    await page.waitForURL(/\/screening/);
    
    // Check active filter shows rating
    await expect(page.locator('text=Rating')).toBeVisible();
  });

  test('should show methodology information', async ({ page }) => {
    await page.goto('/screening');
    
    // Check for methodology section
    await expect(page.locator('text=Screening Methodology')).toBeVisible();
  });
});
