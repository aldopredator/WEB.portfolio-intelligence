import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Basic Quality Gate
 * These tests verify that the application builds and critical pages load without errors.
 * They are intentionally simple to provide fast feedback on breaking changes.
 */

test.describe('Smoke Tests - Quality Gate', () => {
  
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });

  test('dashboard page loads successfully', async ({ page }) => {
    const response = await page.goto('/dashboard');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
    
    // Wait for page to be interactive
    await page.waitForLoadState('domcontentloaded');
  });

  test('portfolios page loads successfully', async ({ page }) => {
    const response = await page.goto('/portfolios');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });

  test('screening page loads successfully', async ({ page }) => {
    const response = await page.goto('/screening');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });

  test('criteria page loads successfully', async ({ page }) => {
    const response = await page.goto('/criteria');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });

  test('benchmark page loads successfully', async ({ page }) => {
    const response = await page.goto('/benchmark');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });

  test('no JavaScript errors on dashboard', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Allow minor warnings but fail on actual errors
    const criticalErrors = errors.filter(e => 
      !e.includes('Warning') && 
      !e.includes('favicon') &&
      !e.includes('DevTools')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('navigation menu is present', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for navigation elements (sidebar or header nav)
    const hasNav = await page.locator('nav, [role="navigation"]').count() > 0;
    expect(hasNav).toBeTruthy();
  });
});
