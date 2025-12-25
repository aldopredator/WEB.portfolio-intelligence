# Daily Metrics Historization System

## Overview

This system captures daily snapshots of financial metrics and stores them in the Metrics table for:
- **Historical analysis** - Track how metrics change over time
- **ML model training** - Build datasets for predictive models
- **Multi-factor modeling** - Perform linear regression on metric columns

## Architecture Changes

### 1. **Metrics Table Schema** (UPDATED)
The Metrics table now supports daily snapshots:
- Removed `@unique` constraint on `stockId` 
- Added `snapshotDate` field (Date type)
- Created composite unique key `(stockId, snapshotDate)`
- Expanded fields to include 40+ financial metrics

### 2. **Data Flow**

**Before:**
```
Screening Page → getStockData() → Live API Calls (Finnhub/Polygon) → Display
```

**After:**
```
Daily Job → scripts/populate-metrics.ts → Metrics Table (DB)
                                              ↓
Screening Page → getStockData() → Read from Metrics Table → Display
                                   (Falls back to APIs if >2 days old)
```

### 3. **Key Files Modified**

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Updated Metrics model for daily snapshots |
| `scripts/populate-metrics.ts` | **NEW** - Daily population script |
| `lib/stock-data.ts` | Reads from Metrics table first, enriches with APIs only if stale |
| `app/screening/page.tsx` | Joins Metrics table, uses cached values |
| `package.json` | Added `populate-metrics` script |

## Setup Instructions

### 1. Update Database Schema

```bash
cd nextjs_space
npx prisma generate
npx prisma db push
```

This will:
- Generate new Prisma client with updated Metrics model
- Update your PostgreSQL schema to support daily snapshots

### 2. Initial Metrics Population

Run the script to populate metrics for all active stocks:

```bash
npm run populate-metrics
# or
yarn populate-metrics
```

Expected output:
```
🚀 Starting daily metrics population...
📅 Snapshot date: 2025-12-24
📊 Found 25 active stocks to process
  📊 Fetching metrics for AAPL...
    ✅ AAPL: 28/42 fields (67% complete)
  💾 AAPL: Snapshot saved successfully
...
✅ Metrics population completed!
📊 Summary:
   - Processed: 25 stocks
   - Success: 25 snapshots created
   - Skipped: 0 (already exist)
   - Errors: 0
   - Duration: 45s
```

### 3. Schedule Daily Job

#### Option A: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
   - Name: "Portfolio Intelligence - Daily Metrics"
   - Trigger: Daily at 6:00 AM (after market close)
   - Action: Start a program
     - Program: `npm`
     - Arguments: `run populate-metrics`
     - Start in: `C:\path\to\nextjs_space`

#### Option B: Node-Cron (In-App Scheduler)

Create `scripts/cron-scheduler.ts`:
```typescript
import cron from 'node-cron';
import { exec } from 'child_process';

// Run daily at 6:00 AM EST (after market close)
cron.schedule('0 6 * * *', () => {
  console.log('Running daily metrics population...');
  exec('npm run populate-metrics', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      return;
    }
    console.log(stdout);
  });
});
```

#### Option C: Vercel Cron (Production)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/populate-metrics",
    "schedule": "0 6 * * *"
  }]
}
```

Create `app/api/cron/populate-metrics/route.ts` (API route to run the script).

## How It Works

### 1. **Metrics Collection**

The `populate-metrics.ts` script:
1. Fetches all active stocks from database
2. For each stock:
   - Checks if metrics already exist for today (skips if yes)
   - Fetches comprehensive metrics from Finnhub & Polygon APIs
   - Stores snapshot with today's date
3. Rate-limits API calls (1 second between requests)
4. Provides detailed progress logging

### 2. **Data Caching Strategy**

**`lib/stock-data.ts` logic:**
```typescript
1. Load latest metrics snapshot from DB for each stock
2. Check age of metrics:
   - If < 2 days old → Use cached metrics ✅
   - If > 2 days old → Fetch from APIs 🔄
3. Always fetch company profile & news (changes frequently)
4. Return merged data to consumers
```

**Benefits:**
- 🚀 **Faster page loads** - No API waits for fresh metrics
- 💰 **Reduced API costs** - Stay within free tier limits
- 📊 **Historical data** - Track metric trends over time
- 🤖 **ML-ready** - Export metrics for model training

### 3. **Screening Page**

The screening page now:
1. Joins `stocks` + `metrics` tables (latest snapshot per stock)
2. Builds `enrichedStockInfo` by merging DB metrics with API data
3. Applies filters using DB-cached values
4. Falls back to API data only for missing/stale metrics

## Data Completeness

Each snapshot tracks completeness:
```
📊 AAPL: 28/42 fields (67% complete)
```

Fields populated depend on:
- **Finnhub API** - Financial ratios, profitability, growth
- **Polygon API** - Market data, shares outstanding, ownership
- **Data availability** - Some metrics missing for ETFs/certain stocks

## Historical Data Analysis

### Query Examples

**1. Get metrics history for a stock:**
```sql
SELECT snapshotDate, peRatio, pbRatio, roe, marketCap
FROM "Metrics"
WHERE stockId = 'stock-id-here'
ORDER BY snapshotDate DESC;
```

**2. Calculate metric trends:**
```sql
SELECT 
  ticker,
  AVG(peRatio) as avg_pe,
  STDDEV(peRatio) as pe_volatility,
  MAX(roe) as max_roe
FROM "Stock" s
JOIN "Metrics" m ON s.id = m.stockId
WHERE m.snapshotDate >= NOW() - INTERVAL '90 days'
GROUP BY ticker;
```

**3. Export for ML training:**
```sql
COPY (
  SELECT 
    s.ticker,
    m.snapshotDate,
    m.peRatio, m.pbRatio, m.psRatio,
    m.roe, m.roa, m.profitMargin,
    m.debtToEquity, m.beta,
    m.marketCap, m.volume
  FROM "Metrics" m
  JOIN "Stock" s ON s.id = m.stockId
  ORDER BY s.ticker, m.snapshotDate
) TO '/tmp/metrics_history.csv' WITH CSV HEADER;
```

## Monitoring

### Check Metrics Coverage

```sql
-- Total snapshots
SELECT COUNT(*) FROM "Metrics";

-- Snapshots per stock
SELECT s.ticker, COUNT(m.id) as snapshot_count
FROM "Stock" s
LEFT JOIN "Metrics" m ON s.id = m.stockId
GROUP BY s.ticker
ORDER BY snapshot_count DESC;

-- Latest snapshot date
SELECT MAX(snapshotDate) FROM "Metrics";

-- Data completeness by field
SELECT 
  COUNT(peRatio) as has_pe,
  COUNT(pbRatio) as has_pb,
  COUNT(roe) as has_roe,
  COUNT(*) as total
FROM "Metrics"
WHERE snapshotDate = CURRENT_DATE;
```

### Script Logs

Check script output for errors:
```bash
npm run populate-metrics 2>&1 | tee metrics-$(date +%Y%m%d).log
```

## Troubleshooting

### Issue: "No metrics data available"

**Cause:** API returned empty/null for all fields.

**Fix:** 
1. Check API keys in `.env`: `POLYGON_API_KEY`, `FINNHUB_API_KEY`
2. Verify API rate limits not exceeded
3. Check if ticker is valid (some tickers not supported)

### Issue: Duplicate key error on snapshotDate

**Cause:** Trying to insert metrics for same stock+date twice.

**Fix:** The script checks for existing records. If you see this error, it means the unique constraint is working. The script will skip and continue.

### Issue: Metrics are stale (>2 days old)

**Cause:** Daily job not running.

**Fix:**
1. Verify cron/scheduler is configured
2. Manually run: `npm run populate-metrics`
3. Check logs for errors

## Multi-Factor Modeling

With historical metrics data, you can build multi-factor models:

### Example: Linear Regression on Returns

```python
import pandas as pd
from sklearn.linear_model import LinearRegression

# Load metrics history
df = pd.read_sql("""
  SELECT 
    m.snapshotDate,
    m.peRatio, m.pbRatio, m.roe, m.beta,
    m.debtToEquity, m.profitMargin,
    ph.price
  FROM "Metrics" m
  JOIN "PriceHistory" ph ON m.stockId = ph.stockId 
    AND m.snapshotDate = ph.date
  WHERE m.snapshotDate >= NOW() - INTERVAL '180 days'
""", engine)

# Calculate forward returns
df['return_30d'] = df.groupby('ticker')['price'].pct_change(30).shift(-30)

# Build model
features = ['peRatio', 'pbRatio', 'roe', 'beta', 'debtToEquity', 'profitMargin']
X = df[features].fillna(0)
y = df['return_30d'].fillna(0)

model = LinearRegression()
model.fit(X, y)

print("Factor coefficients:", dict(zip(features, model.coef_)))
```

## Future Enhancements

- [ ] Add intraday snapshots for high-frequency data
- [ ] Implement anomaly detection (flag unusual metric changes)
- [ ] Build automated alerts (e.g., "PE ratio dropped 50%")
- [ ] Create metrics dashboard with trend charts
- [ ] Export to Parquet for big data processing
- [ ] Add data validation (sanity checks on metrics)

## API Rate Limits

**Finnhub Free Tier:**
- 60 calls/minute
- 600 calls/day

**Polygon Free Tier:**
- 5 calls/minute
- Unlimited daily

**Script Behavior:**
- Waits 1 second between stocks (safe rate)
- For 100 stocks: ~2-3 minutes total
- Respects rate limits automatically

## Support

If you encounter issues:
1. Check database connection: `PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL`
2. Verify API keys are valid
3. Review script logs for error messages
4. Check Prisma client is generated: `npx prisma generate`

---

**Next Steps:**
1. Run `npx prisma db push` to update schema
2. Run `npm run populate-metrics` to create first snapshot
3. Schedule daily job (Task Scheduler or cron)
4. Monitor metrics table growth over days/weeks
5. Start building ML models! 🚀
