# Automated Testing with Playwright

This directory contains automated end-to-end tests for the Portfolio Intelligence application using Playwright.

## Test Structure

- `navigation.spec.ts` - Tests for page navigation and routing
- `criteria.spec.ts` - Tests for screening criteria configuration
- `screening.spec.ts` - Tests for stock screening functionality
- `dashboard.spec.ts` - Tests for dashboard display and widgets

## Running Tests

### Prerequisites
Make sure you have installed dependencies:
```bash
yarn install
```

### Run All Tests
```bash
yarn test
```

### Run Tests in UI Mode (Interactive)
```bash
yarn test:ui
```

### Run Tests in Headed Mode (See Browser)
```bash
yarn test:headed
```

### View Test Report
```bash
yarn test:report
```

### Run Specific Test File
```bash
npx playwright test tests/navigation.spec.ts
```

### Run Tests in Specific Browser
```bash
npx playwright test --project=chromium
```

## Test Scenarios Covered

### Navigation Tests
- ✅ Homepage loads correctly
- ✅ Navigate to dashboard
- ✅ Navigate to screening page
- ✅ Navigate to criteria page

### Criteria Configuration Tests
- ✅ Rating filter displays at top
- ✅ Enable/disable P/E filter
- ✅ Avg Annual Volume % filters exist
- ✅ Save and apply criteria
- ✅ Reset criteria to defaults
- ✅ Sector exclusion functionality

### Screening Tests
- ✅ Display screening results table
- ✅ Show active filters
- ✅ Annual volume columns appear when enabled
- ✅ Sort by match score
- ✅ Filter by rating
- ✅ Methodology information displayed

### Dashboard Tests
- ✅ Display stock cards
- ✅ Company information card
- ✅ Price chart rendering
- ✅ Stock statistics display
- ✅ Social sentiment (if available)

## Configuration

The Playwright configuration is in `playwright.config.ts`. Key settings:

- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests`
- **Browser**: Chromium
- **Web Server**: Automatically starts dev server before tests
- **Retries**: 2 retries in CI, 0 locally
- **Screenshots**: Captured on failure
- **Traces**: Captured on first retry

## Debugging Tests

### Debug Mode
```bash
npx playwright test --debug
```

### Run Single Test
```bash
npx playwright test -g "should display rating filter"
```

### Generate Test Code
```bash
npx playwright codegen http://localhost:3000
```

## CI/CD Integration

Tests can be run in CI pipelines. Example GitHub Actions workflow:

```yaml
- name: Install dependencies
  run: yarn install
  
- name: Install Playwright Browsers
  run: npx playwright install --with-deps
  
- name: Run Playwright tests
  run: yarn test
  
- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Writing New Tests

1. Create a new `.spec.ts` file in the `tests` directory
2. Import test utilities: `import { test, expect } from '@playwright/test';`
3. Use `test.describe()` to group related tests
4. Use `test()` for individual test cases
5. Use `expect()` assertions to verify behavior

Example:
```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/my-page');
    await expect(page.locator('text=Hello')).toBeVisible();
  });
});
```

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for network idle** when loading data: `await page.waitForLoadState('networkidle')`
3. **Use specific selectors** over generic ones
4. **Group related tests** with `test.describe()`
5. **Clean up state** between tests with `test.beforeEach()` and `test.afterEach()`
6. **Keep tests independent** - each test should run standalone

## Troubleshooting

### Test Timeout
Increase timeout in test:
```typescript
test('my test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

### Element Not Found
Use `waitForSelector`:
```typescript
await page.waitForSelector('button:has-text("Submit")');
await page.click('button:has-text("Submit")');
```

### Flaky Tests
Add explicit waits:
```typescript
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000); // Use sparingly
```
