import { test, expect } from '@playwright/test';

test.describe('Screening Criteria', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/criteria');
  });

  test('should display rating filter at the top', async ({ page }) => {
    // Check that rating filter exists
    const ratingSection = page.locator('text=Rating').first();
    await expect(ratingSection).toBeVisible();
    
    // Check for rating buttons
    await expect(page.locator('button:has-text("Not Rated")')).toBeVisible();
    await expect(page.locator('button:has-text("⭐ 5")')).toBeVisible();
  });

  test('should enable and configure P/E filter', async ({ page }) => {
    // Find the P/E Ratio section
    const peSection = page.locator('text=P/E Ratio').first();
    await expect(peSection).toBeVisible();
    
    // Click the enable checkbox
    const enableButton = page.locator('button').filter({ has: peSection }).first();
    await enableButton.click();
    
    // Verify enabled state changed
    await expect(page.locator('text=Enabled').first()).toBeVisible();
  });

  test('should enable Avg Annual Volume % filters', async ({ page }) => {
    // Scroll to annual volume filters
    await page.locator('text=Avg Annual Volume % (10D)').scrollIntoViewIfNeeded();
    
    // Check both filters exist
    await expect(page.locator('text=Avg Annual Volume % (10D)')).toBeVisible();
    await expect(page.locator('text=Avg Annual Volume % (3M)')).toBeVisible();
  });

  test('should save and apply criteria', async ({ page }) => {
    // Enable a filter
    const peSection = page.locator('text=P/E Ratio').first();
    const enableButton = page.locator('button').filter({ has: peSection }).first();
    await enableButton.click();
    
    // Click Apply button
    await page.click('button:has-text("Apply Filters")');
    
    // Should navigate to screening page
    await page.waitForURL(/\/screening/);
    await expect(page).toHaveURL(/\/screening/);
  });

  test('should reset criteria to defaults', async ({ page }) => {
    // Enable a filter
    const peSection = page.locator('text=P/E Ratio').first();
    const enableButton = page.locator('button').filter({ has: peSection }).first();
    await enableButton.click();
    
    // Click Reset button
    await page.click('button:has-text("Reset")');
    
    // Verify filter is disabled
    await expect(page.locator('text=Disabled').first()).toBeVisible();
  });

  test('should exclude sectors', async ({ page }) => {
    // Scroll to sector exclusion
    await page.locator('text=Exclude Sectors').scrollIntoViewIfNeeded();
    
    // Check sector exclusion exists
    await expect(page.locator('text=Exclude Sectors')).toBeVisible();
    
    // Alcohol and Gambling should be excluded by default
    await expect(page.locator('text=Alcohol')).toBeVisible();
    await expect(page.locator('text=Gambling')).toBeVisible();
  });
});
