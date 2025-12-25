# Data Source Mapping - Portfolio Intelligence

## Architecture Overview

```
┌─────────────────┐
│   External APIs │
│  Yahoo Finance  │ ──┐
│  Polygon.io     │   │
│  Finnhub        │   │
└─────────────────┘   │
                      │ populate-metrics.ts (daily)
                      ▼
┌─────────────────────────────────────┐
│     PostgreSQL Database (Prisma)    │
│                                     │
│  ┌─────────┐  ┌──────────────┐    │
│  │  Stock  │  │  StockData   │    │
│  └─────────┘  └──────────────┘    │
│                                     │
│  ┌─────────────┐  ┌─────────────┐ │
│  │   Metrics   │  │PriceHistory │ │
│  │(Daily Snap) │  │  (90 days)  │ │
│  └─────────────┘  └─────────────┘ │
│                                     │
│  ┌──────────┐   ┌──────────────┐  │
│  │Portfolio │   │    News      │  │
│  └──────────┘   └──────────────┘  │
└─────────────────────────────────────┘
                      │
                      │ lib/stock-data.ts
                      │ + API enrichment (profiles/news)
                      ▼
┌─────────────────────────────────────┐
│          Website Pages              │
│  Dashboard | Screening | Criteria   │
└─────────────────────────────────────┘
```

---

## Detailed Field Mapping

### 📊 **Dashboard Page** (`/`)

#### Main Stock Card
| Field | Displayed As | Source | Table/API | Notes |
|-------|-------------|--------|-----------|-------|
| Ticker | Stock symbol | Prisma DB | `Stock.ticker` | - |
| Company Name | Full name | Prisma DB | `Stock.company` | - |
| Current Price | $XXX.XX | Prisma DB | `StockData.currentPrice` | Updated when stock added |
| Change | +$X.XX | Prisma DB | `StockData.change` | - |
| Change % | +X.XX% | Prisma DB | `StockData.changePercent` | - |
| 52 Week High | $XXX.XX | Prisma DB | `StockData.week52High` | - |
| 52 Week Low | $XXX.XX | Prisma DB | `StockData.week52Low` | - |

#### Stock Multipliers Card
| Field | Displayed As | Source | Table/API | Notes |
|-------|-------------|--------|-----------|-------|
| Total Debt/Equity | XX | Prisma DB | `Metrics.debtToEquity` | Daily snapshot |
| Price/Sales | XX | Prisma DB | `Metrics.psRatio` → `priceToSales` | Mapped to UI name |
| Trailing P/E | XX | Prisma DB | `Metrics.peRatio` → `trailingPE` | Mapped to UI name |
| Forward P/E | XX.XX | Prisma DB | `Metrics.forwardPE` | - |
| Price/Book | XX | Prisma DB | `Metrics.pbRatio` → `priceToBook` | - |
| Enterprise Value/Revenue | X.XX | Prisma DB | `Metrics.evToRevenue` → `enterpriseToRevenue` | **Fixed in commit 8036407** |
| Enterprise Value/EBITDA | XX.XX | Prisma DB | `Metrics.evToEbitda` → `enterpriseToEbitda` | **Fixed in commit 8036407** |

#### Stock Ratios Card
| Field | Displayed As | Source | Table/API | Notes |
|-------|-------------|--------|-----------|-------|
| ROE | XX% | Prisma DB | `Metrics.roe` | Return on Equity |
| ROA | X% | Prisma DB | `Metrics.roa` | Return on Assets |
| Profit Margin | XX% | Prisma DB | `Metrics.profitMargin` | - |
| Quarterly Revenue Growth | XX% | Prisma DB | `Metrics.revenueGrowthQoQ` → `quarterlyRevenueGrowth` | Quarter over Quarter |
| Quarterly Earnings Growth | XX% | Prisma DB | `Metrics.earningsGrowthQoQ` → `quarterlyEarningsGrowth` | Quarter over Quarter |
| Beta (5Y Monthly) | X.XX | Prisma DB | `Metrics.beta` | - |

#### Stock Statistics Card
| Field | Displayed As | Source | Table/API | Notes |
|-------|-------------|--------|-----------|-------|
| Shares Outstanding | XXX.XXB | Prisma DB | `Metrics.sharesOutstanding` | Often null (Yahoo doesn't return) |
| Float Shares | XXX.XXM | Prisma DB | `Metrics.floatShares` | **Fixed in commit 84ed94f** |
| Float % | XX% | Calculated | Derived from floatShares/sharesOutstanding | - |
| Avg Daily Volume (10D) | XXM | Prisma DB | `Metrics.averageVolume10Day` | 10-day average |
| Avg Annual Volume in % (10D) | XXX% | Calculated | Derived from averageVolume10Day | - |
| Avg Daily Volume (3M) | XXM | Prisma DB | `Metrics.averageVolume` | 3-month average |
| Avg Annual Volume in % (3M) | XXX% | Calculated | Derived from averageVolume | - |

#### Share Statistics Card
| Field | Displayed As | Source | Table/API | Notes |
|-------|-------------|--------|-----------|-------|
| Shares Outstanding | XXX.XXB | Prisma DB | `Metrics.sharesOutstanding` | - |
| Float Shares | XXX.XXM | Prisma DB | `Metrics.floatShares` | - |
| % Held by Insiders | X.XX% | Prisma DB | `Metrics.heldByInsiders` | - |
| % Held by Institutions | XX.XX% | Prisma DB | `Metrics.heldByInstitutions` | - |
| Avg Daily Volume (10D) | XXM | Prisma DB | `Metrics.averageVolume10Day` | - |
| Avg Daily Volume (3M) | XXM | Prisma DB | `Metrics.averageVolume` | - |

#### Company Info Card
| Field | Displayed As | Source | Table/API | Notes |
|-------|-------------|--------|-----------|-------|
| Industry | Technology | **Yahoo Finance API** | Live fetch | ⚠️ Not cached |
| Sector | Technology | **Yahoo Finance API** | Live fetch | ⚠️ Not cached |
| Country | United States | **Yahoo Finance API** | Live fetch | ⚠️ Not cached |
| Website | url | **Yahoo Finance API** | Live fetch | ⚠️ Not cached |
| Employees | X,XXX | **Yahoo Finance API** | Live fetch | ⚠️ Not cached |
| Company Logo | Image | **Clearbit API** | Generated from domain | Via Yahoo profile |
| Description | Text | **Yahoo Finance API** | Live fetch | ⚠️ Not cached |

#### Price History Chart
| Field | Displayed As | Source | Table/API | Notes |
|-------|-------------|--------|-----------|-------|
| Historical Prices | Line chart | Prisma DB | `PriceHistory` (last 30 days) | **Reduced from 90 to 30 days (commit 84ed94f)** |
| Comparison Ticker | Dropdown | Prisma DB | All stocks via `/api/stock-list` | Cross-portfolio comparison |

#### Market News Card
| Field | Displayed As | Source | Table/API | Notes |
|-------|-------------|--------|-----------|-------|
| News Articles | List | Prisma DB | `News` (last 2 articles) | **Reduced from 5 to 2 (commit 84ed94f)** |
| Article Title | Text | Prisma DB | `News.title` | - |
| Article Source | Text | Prisma DB | `News.source` | - |
| Published Date | Date | Prisma DB | `News.publishedAt` | - |

---

### 📋 **Screening Page** (`/screening`)

#### Screening Table (Visible Columns)
| Field | Displayed As | Source | Table/API | Notes |
|-------|-------------|--------|-----------|-------|
| Ticker | Stock symbol | Prisma DB | `Stock.ticker` | - |
| Name | Company name | Prisma DB | `Stock.company` | - |
| Sector | Category | **Yahoo Finance API** | Live fetch via company profile | ⚠️ Not cached |
| Industry | Sub-category | **Yahoo Finance API** | Live fetch via company profile | ⚠️ Not cached |
| Portfolio | Portfolio name | Prisma DB | `Portfolio.name` via `Stock.portfolio` relation | - |
| Rating | Star rating | Prisma DB | `Stock.rating` | User-assigned |
| Last Updated | Date | Prisma DB | `Stock.updatedAt` | When rating was last changed |
| P/E | XX.XX | Prisma DB | `Metrics.peRatio` | - |
| P/B | X.XX | Prisma DB | `Metrics.pbRatio` | - |
| P/S | X.XX | Prisma DB | `Metrics.psRatio` | - |
| Market Cap | $XXB | Prisma DB | `Metrics.marketCap` | - |
| Avg Volume | XXM | Prisma DB | `Metrics.averageVolume` | - |
| Beta | X.XX | Prisma DB | `Metrics.beta` | - |
| ROE | XX% | Prisma DB | `Metrics.roe` | - |
| Profit Margin | XX% | Prisma DB | `Metrics.profitMargin` | - |
| Debt/Equity | XX | Prisma DB | `Metrics.debtToEquity` | - |
| Match Score | XX% | Calculated | Based on enabled criteria | Server-side calculation |

#### Raw Excel Export (Additional Fields)
| Field | Displayed As | Source | Table/API | Notes |
|-------|-------------|--------|-----------|-------|
| Notes | User notes | Prisma DB | `Stock.notes` | **Added in commit d88376e** |
| Country | Country name | **Yahoo Finance API** | Live fetch via company profile | ⚠️ Not cached |
| Trailing P/E | XX.XX | Prisma DB | `Metrics.peRatio` | - |
| Forward P/E | XX.XX | Prisma DB | `Metrics.forwardPE` | - |
| Enterprise Value/Revenue | X.XX | Prisma DB | `Metrics.evToRevenue` | - |
| Enterprise Value/EBITDA | XX.XX | Prisma DB | `Metrics.evToEbitda` | - |
| ROA | X.XX% | Prisma DB | `Metrics.roa` | - |
| Quarterly Revenue Growth | XX% | Prisma DB | `Metrics.revenueGrowthQoQ` | - |
| Quarterly Earnings Growth | XX% | Prisma DB | `Metrics.earningsGrowthQoQ` | - |
| 30d Return | +X.XX% | Calculated | From `PriceHistory` (30 days) | Server-side calculation |
| 30d Volatility | X.X% | Calculated | From `PriceHistory` (30 days) | Standard deviation |
| 1d Change | +X.XX% | Calculated | From `PriceHistory` (last 2 days) | - |
| 60d Return | +X.XX% | Calculated | From `PriceHistory` (60 days) | - |
| 60d Volatility | X.X% | Calculated | From `PriceHistory` (60 days) | - |
| Max Drawdown | -X.XX% | Calculated | From `PriceHistory` (90 days) | Largest peak-to-trough decline |
| Max Drawup | +X.XX% | Calculated | From `PriceHistory` (90 days) | Largest trough-to-peak increase |
| CAGR | +X.XX% | Calculated | From all available `PriceHistory` | Compound Annual Growth Rate |

---

### 🎯 **Criteria Page** (`/criteria`)

All screening criteria are configured here and stored in:
- URL parameters (for session persistence)
- Not stored in database

Criteria use the same Metrics table fields as the screening page for filtering.

---

## Key Scripts & Their Purpose

### 📝 **Data Population Scripts**

| Script | Purpose | Frequency | API Used |
|--------|---------|-----------|----------|
| `populate-metrics.ts` | Fetches and stores financial metrics | **Daily** (manual) | Yahoo Finance |
| `populate-price-history.ts` | Backfills historical prices | One-time | Yahoo Finance |
| `add-ticker` API route | Adds new stock with initial data | On-demand | Yahoo Finance |

### 🔍 **Diagnostic Scripts**

| Script | Purpose |
|--------|---------|
| `check-amzn-metrics.ts` | Verify AMZN metrics in DB |
| `check-nvda-metrics.ts` | Verify NVDA metrics in DB |
| `query-metrics.ts` | Query and export metrics data |

---

## ⚠️ Current Limitations

### 1. **Not Cached (Always API calls)**:
- Company Industry/Sector/Country
- Company Description
- Company Logo URLs
- Employee count

**Recommendation**: Add `Industry`, `Sector`, `Country`, `Description`, `EmployeeCount`, `LogoUrl` columns to `Stock` table and populate during `populate-metrics.ts` run.

### 2. **Prisma 5MB Response Limit**:
- Fixed in commit 84ed94f by reducing:
  - PriceHistory: 90 → 30 days
  - News: 5 → 2 articles per stock

### 3. **Field Name Mismatches**:
- Database uses: `evToRevenue`, `evToEbitda`, `peRatio`, `psRatio`
- UI expects: `enterpriseToRevenue`, `enterpriseToEbitda`, `trailingPE`, `priceToSales`
- **Fixed in commit 8036407** with dual mappings

---

## Data Freshness Policy

### Metrics Table
- **Refresh Frequency**: Once per day (manual script run)
- **Freshness Check**: `lib/stock-data.ts` considers metrics fresh if < 2 days old
- **Stale Data Behavior**: Falls back to API calls if > 2 days old

### Price History
- **Refresh Frequency**: Only when stock is added (not updated daily)
- **Usage**: Charts, return calculations, volatility metrics

### Company Profiles
- **Refresh Frequency**: Every page load (not cached)
- **Impact**: Extra API calls on each dashboard/screening page load

---

## Recommended Improvements

1. **Cache Company Profiles**: Add columns to `Stock` table for industry, sector, country, description
2. **Automate Daily Refresh**: Set up cron job/scheduled task for `populate-metrics.ts`
3. **Add News Caching**: Populate `News` table during daily refresh instead of real-time fetching
4. **Price History Update**: Add script to update last 30 days of price history daily
5. **Monitor API Rate Limits**: Implement rate limiting for Yahoo Finance calls

---

## File References

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Data Orchestrator | `lib/stock-data.ts` | Main data fetching + DB/API hybrid logic |
| Metrics Population | `scripts/populate-metrics.ts` | Daily metrics fetch from Yahoo Finance |
| Database Schema | `prisma/schema.prisma` | All table definitions |
| Dashboard Page | `app/page.tsx` | Calls `getStockData()` for dashboard data |
| Screening Page | `app/screening/page.tsx` | Queries DB directly + calls `getStockData()` |
| Stock Details Card | `app/dashboard/components/StockDetailsCard.tsx` | Displays valuation metrics |
| Share Statistics Card | `app/dashboard/components/ShareStatisticsCard.tsx` | Displays ownership/volume metrics |

---

**Last Updated**: December 25, 2025 (commits 84ed94f, 8036407, d88376e)
