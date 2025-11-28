import { test, expect } from '@playwright/test';

/**
 * Performance and Accessibility Tests
 * Ensures the dashboard performs well and is accessible
 */
test.describe('Performance Tests', () => {
  test('page should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
    console.log(`Page loaded in ${loadTime}ms`);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known harmless errors if any
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('404') &&
      !err.includes('CORS') // Might have API CORS issues in dev
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should not have failed network requests (except expected)', async ({ page }) => {
    const failedRequests: string[] = [];
    
    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out expected failures (logos that don't exist, etc)
    const unexpectedFailures = failedRequests.filter(url => 
      !url.includes('favicon') &&
      !url.includes('.svg') && // Logo files might not all exist
      !url.includes('.png')
    );
    
    expect(unexpectedFailures.length).toBe(0);
  });

  test('chart should render without errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const chart = page.locator('svg, canvas').first();
    await expect(chart).toBeVisible({ timeout: 10000 });
    
    // Verify chart has actual content (not just empty)
    const chartContent = await chart.innerHTML().catch(() => '');
    expect(chartContent.length).toBeGreaterThan(100); // Has actual chart elements
  });
});

test.describe('Accessibility Tests', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Should have other headings
    const headingCount = await page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headingCount).toBeGreaterThan(1);
  });

  test('links should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Tab through focusable elements
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    
    // Should be able to focus on interactive elements
    expect(['A', 'BUTTON', 'INPUT', 'SELECT']).toContain(focusedElement);
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // Alt can be empty string for decorative images, but should exist
      expect(alt).not.toBeNull();
    }
  });

  test('buttons should be accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      // Buttons should have text content or aria-label
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      expect(text || ariaLabel).toBeTruthy();
    }
  });
});
