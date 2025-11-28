# MUI Integration Plan

## Current Status
- **Original Tailwind Dashboard**: Fully functional with all features (restored as main page)
- **MUI Prototype**: Visual design complete but missing data integration (saved as `page-mui.tsx`)

## Issues Identified

### Critical Issues from MUI Prototype
1. **Mock Data Only**: Using hardcoded MOCK_STOCKS, MOCK_STOCK_DATA instead of real API data
2. **No Dynamic Updates**: Changing stocks in sidebar doesn't update the actual data
3. **Missing Features**:
   - Social Sentiment card
   - Pros & Cons section
   - Top navigation (Criteria, Screening links)
   - Recommendation card
   - Company highlights
4. **Layout Issues**:
   - Sidebar too wide, covering content
   - No bottom scrolling
   - Content overflow not handled

## Required Work for Proper MUI Integration

### Phase 1: Data Integration (Priority 1)
- [ ] Convert MUI dashboard to server component (like original)
- [ ] Integrate `getStockData()` function from original page
- [ ] Connect real-time data from:
  - Yahoo Finance API (price history)
  - Finnhub API (metrics)
  - Sentiment API (social sentiment)
- [ ] Make stock selection actually change underlying data
- [ ] Add proper revalidation (ISR)

### Phase 2: Missing Components (Priority 1)
- [ ] Create MUI version of `SentimentCard` component
- [ ] Create MUI version of `ProsConsCard` component
- [ ] Create MUI version of `RecommendationCard` component
- [ ] Create MUI version of `CompanyHighlights` component
- [ ] Add top navigation bar with Criteria/Screening links

### Phase 3: Layout Fixes (Priority 2)
- [ ] Reduce sidebar width from 260px to ~200px
- [ ] Add proper scrolling for main content area
- [ ] Make sidebar collapsible on mobile
- [ ] Fix content overflow in cards
- [ ] Add bottom padding for scrollable content

### Phase 4: Testing Framework (Priority 3)
As you mentioned, we need automated testing:

#### Recommended Testing Stack
```bash
# Visual regression testing
npm install --save-dev @playwright/test
npm install --save-dev playwright

# Component testing
npm install --save-dev @testing-library/react
npm install --save-dev @testing-library/jest-dom
npm install --save-dev jest jest-environment-jsdom

# E2E testing with video recording
# Playwright already includes video recording
```

#### Test Scenarios to Implement
1. **Visual Regression Tests** (Playwright)
   - Screenshot comparison for each stock
   - Mobile/desktop viewport tests
   - Dark theme consistency

2. **Navigation Tests**
   - Click each stock in sidebar
   - Verify data updates correctly
   - Verify URL changes (if using dynamic routes)

3. **Data Integration Tests**
   - Verify API calls are made
   - Verify data transforms correctly
   - Verify error states display properly

4. **Component Tests** (React Testing Library)
   - Each card renders with correct data
   - Charts display properly
   - Interactive elements work

5. **Scroll & Layout Tests**
   - Verify scrolling works on all viewports
   - Sidebar doesn't cover content
   - All sections visible

## Implementation Strategy

### Option A: Keep Both Versions (Recommended)
- Keep original Tailwind at `/` (fully functional)
- Develop MUI version at `/mui-dashboard` route
- Test MUI thoroughly before switching
- Users can preview new design without breaking production

### Option B: Direct Migration (Risky)
- Replace original with MUI immediately
- Fix issues in production
- Not recommended due to data integration complexity

## File Structure for Proper Integration

```
app/
├── page.tsx                           # Current Tailwind dashboard (keep as is)
├── mui-dashboard/
│   ├── page.tsx                       # New MUI dashboard with full integration
│   ├── components/
│   │   ├── MUISentimentCard.tsx      # Port sentiment features
│   │   ├── MUIProsConsCard.tsx       # Port pros/cons features
│   │   ├── MUIRecommendationCard.tsx # Port recommendation features
│   │   └── MUICompanyHighlights.tsx  # Port highlights features
│   └── layout.tsx                     # MUI-specific layout
├── components/                        # Original Tailwind components
└── theme/                            # MUI theme config
```

## Next Steps

1. **Immediate**: Original dashboard restored ✅
2. **Short-term**: Create `/mui-dashboard` route for parallel development
3. **Mid-term**: Implement data integration for MUI version
4. **Long-term**: Add Playwright testing suite
5. **Final**: Switch to MUI as default after thorough testing

## Testing Framework Setup

```javascript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    video: 'on', // Record video of all tests
    screenshot: 'on', // Take screenshots on failure
  },
  projects: [
    { name: 'Desktop Chrome', use: { viewport: { width: 1280, height: 720 } } },
    { name: 'Mobile Safari', use: { viewport: { width: 375, height: 667 } } },
  ],
});
```

```javascript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Stock Dashboard', () => {
  test('should display all stocks in sidebar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="stock-GOOG"]')).toBeVisible();
    await expect(page.locator('[data-testid="stock-TSLA"]')).toBeVisible();
    // ... etc
  });

  test('should update data when stock is selected', async ({ page }) => {
    await page.goto('/');
    
    // Get initial price
    const initialPrice = await page.locator('[data-testid="current-price"]').textContent();
    
    // Click different stock
    await page.click('[data-testid="stock-TSLA"]');
    
    // Verify price changed
    const newPrice = await page.locator('[data-testid="current-price"]').textContent();
    expect(newPrice).not.toBe(initialPrice);
  });

  test('should show all required sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="sentiment-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="pros-cons-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="recommendation-card"]')).toBeVisible();
  });
});
```

## Conclusion

The MUI design looks great visually, but we rushed the implementation without properly integrating the existing data layer and features. The right approach is:

1. Keep working version live (done ✅)
2. Build MUI version properly with all features
3. Add comprehensive testing
4. Switch when confident

Let me know if you want to proceed with Option A (parallel development) or if you'd like me to start implementing the missing features directly.
