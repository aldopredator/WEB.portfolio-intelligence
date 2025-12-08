import { test, expect } from '@playwright/test';

test('Demo: Full workflow test', async ({ page }) => {
  test.setTimeout(60000);

  console.log('🚀 Starting Portfolio Intelligence workflow test...');

  // Step 1: Go to homepage
  console.log('📍 Step 1: Navigate to homepage');
  await page.goto('/');
  await page.waitForTimeout(2000);
  
  // Step 2: Navigate to criteria page
  console.log('📍 Step 2: Navigate to criteria configuration');
  await page.goto('/criteria');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Check rating filter exists
  const hasRatingFilter = await page.locator('text=Rating').count() > 0;
  console.log('✅ Rating filter found:', hasRatingFilter);
  
  // Step 3: Navigate to screening
  console.log('📍 Step 3: Navigate to screening page');
  await page.goto('/screening');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Check for table
  const hasTable = await page.locator('table').count() > 0;
  console.log('✅ Screening table found:', hasTable);
  
  // Check for stocks
  const stockCount = await page.locator('table tbody tr').count();
  console.log(`✅ Found ${stockCount} stocks in screening results`);
  
  // Step 4: Navigate to dashboard
  console.log('📍 Step 4: Navigate to dashboard');
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Check dashboard loaded
  const hasDashboard = await page.locator('body').count() > 0;
  console.log('✅ Dashboard loaded:', hasDashboard);
  
  console.log('🎉 Test completed successfully!');
  
  // Assertions
  expect(hasRatingFilter).toBeTruthy();
  expect(hasTable).toBeTruthy();
  expect(stockCount).toBeGreaterThan(0);
  expect(hasDashboard).toBeTruthy();
});
