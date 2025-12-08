import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check for header
    await expect(page.locator('text=Portfolio Intelligence')).toBeVisible();
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Click on dashboard link
    await page.click('a[href="/dashboard"]');
    
    // Wait for navigation
    await page.waitForURL('/dashboard');
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should navigate to screening page', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to screening
    await page.click('a[href="/screening"]');
    
    // Wait for navigation
    await page.waitForURL('/screening');
    
    // Check for screening page elements
    await expect(page.locator('text=Stock Screening')).toBeVisible();
  });

  test('should navigate to criteria page', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to criteria
    await page.click('a[href="/criteria"]');
    
    // Wait for navigation
    await page.waitForURL('/criteria');
    
    // Check for criteria page elements
    await expect(page.locator('text=Screening Criteria')).toBeVisible();
  });
});
