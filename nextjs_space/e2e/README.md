# E2E Testing with Playwright

## Overview
Comprehensive end-to-end testing suite for the Stock Insights Dashboard using Playwright. Tests include functional testing, visual regression, accessibility, and performance checks.

## Test Coverage

### 1. Dashboard Layout Tests (`dashboard-layout.spec.ts`)
- ✅ Main dashboard title display
- ✅ Navigation links (Criteria, Screening)
- ✅ Page scrolling functionality
- ✅ Timestamp/last updated info

### 2. Stock Cards Tests (`stock-cards.spec.ts`)
- ✅ All 12 stock cards displayed (GOOG, TSLA, NVDA, AMZN, BRK-B, ISRG, NFLX, IDXX, III, PLTR, QBTS, RGTI)
- ✅ Stock prices visible
- ✅ Price change percentages
- ✅ Visual indicators (colors, arrows)
- ✅ Clickable stock cards

### 3. Component Visibility Tests (`components-visibility.spec.ts`)
- ✅ Price Chart component
- ✅ Social Sentiment card
- ✅ Pros & Cons section
- ✅ Company Highlights
- ✅ Recommendation card
- ✅ Market data (52-week high/low, volume)
- ✅ Financial ratios (P/E, P/B, etc.)

### 4. Stock Selection Tests (`stock-selection.spec.ts`)
- ✅ Stock name updates when selection changes
- ✅ Price data updates dynamically
- ✅ Chart data refreshes
- ✅ Sentiment updates
- ✅ Pros & Cons update per stock

### 5. Responsive Layout Tests (`responsive-layout.spec.ts`)
- ✅ Mobile (375x667)
- ✅ Tablet (768x1024)
- ✅ Desktop (1920x1080)
- ✅ No horizontal scrollbar
- ✅ Scrollable content
- ✅ Ultra-wide viewport (2560x1440)
- ✅ Small mobile (320x568)

### 6. Visual Regression Tests (`visual-regression.spec.ts`)
- ✅ Full page screenshots (desktop & mobile)
- ✅ Individual component screenshots
- ✅ Dark theme consistency
- ✅ Visual consistency after stock changes

### 7. Performance & Accessibility Tests (`performance-accessibility.spec.ts`)
- ✅ Page load time < 10s
- ✅ No console errors
- ✅ No failed network requests
- ✅ Chart rendering
- ✅ Heading hierarchy
- ✅ Keyboard accessibility
- ✅ Image alt text
- ✅ Button accessibility

## Installation

Already installed! If you need to reinstall:

```bash
npm install --save-dev @playwright/test playwright
npx playwright install chromium
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with UI mode (interactive)
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run specific test file
```bash
npx playwright test e2e/dashboard-layout.spec.ts
```

### Run tests for specific browser
```bash
npx playwright test --project="Desktop Chrome"
npx playwright test --project="Mobile Chrome"
npx playwright test --project="iPad"
```

### Debug tests
```bash
npm run test:debug
```

### Generate test code (record actions)
```bash
npm run test:codegen
```

### View test report
```bash
npm run test:report
```

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Video Recording**: Videos saved on test failure
- **Screenshots**: Screenshots taken on failure
- **Trace**: Trace collected on retry
- **Browsers**: Chrome, Firefox, Safari (desktop and mobile)
- **Dev Server**: Automatically starts `npm run dev` before tests

## Viewing Test Results

After running tests:

1. **Console Output**: Shows pass/fail status
2. **HTML Report**: `npm run test:report`
3. **Videos**: Located in `test-results/` folder
4. **Screenshots**: Located in `test-results/` folder
5. **Traces**: Can be viewed with Playwright trace viewer

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run tests
        run: npm test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

1. **Run tests before commits**: Catch issues early
2. **Update screenshots**: When UI changes intentionally, update baseline screenshots
3. **Review videos**: When tests fail, watch the video to see what happened
4. **Keep tests independent**: Each test should work standalone
5. **Use data-testid**: Add `data-testid` attributes to components for reliable selectors

## Adding New Tests

1. Create new file in `e2e/` folder
2. Import Playwright test utilities:
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Write test:
   ```typescript
   test('my new test', async ({ page }) => {
     await page.goto('/');
     // Your test code
   });
   ```
4. Run: `npx playwright test e2e/your-new-test.spec.ts`

## Updating Visual Regression Baselines

When you intentionally change the UI:

```bash
# Update all screenshots
npx playwright test --update-snapshots

# Update specific test
npx playwright test visual-regression.spec.ts --update-snapshots
```

## Troubleshooting

### Tests timing out
- Increase timeout in test: `test.setTimeout(60000)`
- Check if dev server is running
- Verify network connectivity

### Screenshots don't match
- Run with `--update-snapshots` if change is intentional
- Check if content is loading differently
- Verify animations are complete before screenshot

### Can't find elements
- Use `test:codegen` to record selectors
- Add `data-testid` attributes to components
- Use more resilient selectors (text content, roles)

## Current Status

✅ Testing framework installed
✅ 7 test suites created
✅ 40+ test cases covering all major features
✅ Video recording enabled
✅ Screenshot comparison enabled
✅ Multi-browser testing configured
✅ Responsive testing configured

## Next Steps

1. Run initial test suite to establish baseline
2. Add `data-testid` attributes to key components for more reliable selectors
3. Set up CI/CD integration
4. Create test documentation for new features
5. Add performance benchmarks
