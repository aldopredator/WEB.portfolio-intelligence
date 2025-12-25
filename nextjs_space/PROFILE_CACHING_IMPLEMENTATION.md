# Company Profile Caching Implementation

**Date**: December 25, 2024  
**Commit**: bcb6aff  
**Status**: ✅ Complete

## Overview

Implemented company profile caching in the `Stock` table to eliminate API calls on page loads, improving performance and reducing dependency on external APIs.

## Problem Statement

Previously, company profile data (Industry, Sector, Country, Description, Website, Employees, Logo) was fetched from APIs (Yahoo Finance, Finnhub) on every page load. This caused:
- Slower page load times
- Rate limiting risks
- Unnecessary API consumption
- Inconsistent data between page loads

## Solution

Cache company profile data in the `Stock` table, populated once daily by the `populate-metrics.ts` script.

## Implementation Details

### 1. Schema Changes (`prisma/schema.prisma`)

Added company profile fields to the `Stock` model:

```prisma
model Stock {
  // ... existing fields ...
  
  // Company profile fields (cached from Yahoo Finance/Finnhub)
  country      String?  // Populated from API
  description  String?  @db.Text  // Populated from API
  website      String?  // Populated from API
  employees    Int?     // Populated from API
  logoUrl      String?  // Populated from API
}
```

### 2. Daily Population Script (`scripts/populate-metrics.ts`)

Added `updateCompanyProfile()` function that:
- Fetches company profile from Yahoo Finance via `fetchCompanyProfile()`
- Updates Stock record with: sector, industry, country, description, website, employees, logoUrl
- Runs for all stocks regardless of whether metrics already exist for today
- Logs success/failure for each stock

```typescript
async function updateCompanyProfile(stockId: string, ticker: string) {
  const profile = await fetchCompanyProfile(ticker);
  if (profile) {
    await prisma.stock.update({
      where: { id: stockId },
      data: {
        sector: profile.sector || undefined,
        industry: profile.industry || undefined,
        country: profile.country || undefined,
        description: profile.description || undefined,
        website: profile.weburl || undefined,
        employees: profile.totalEmployees || undefined,
        logoUrl: profile.logo || undefined,
      },
    });
  }
}
```

### 3. Data Fetching Layer (`lib/stock-data.ts`)

Modified `getStockData()` to use cached profile data instead of API calls:

**Before**:
```typescript
const profile = await fetchCompanyProfile(ticker);
if (profile && isRecord(stockEntry)) {
  stockEntry.company_profile = profile as any;
}
```

**After**:
```typescript
company_profile: {
  industry: stock.industry || 'N/A',
  sector: stock.sector || 'N/A',
  country: stock.country || 'N/A',
  description: stock.description || '',
  weburl: stock.website || '',
  totalEmployees: stock.employees || undefined,
  logo: stock.logoUrl || '',
},
```

Removed all `fetchCompanyProfile()` API calls from the data orchestration flow.

## Benefits

1. **Performance**: Page loads no longer make API calls for company profiles
2. **Consistency**: All stocks show the same profile data across sessions
3. **Reliability**: No rate limiting issues from excessive API calls
4. **Cost**: Reduced API usage (one daily refresh instead of per-page-load)
5. **Architecture**: Clean separation between cached data (DB) and enrichment APIs

## Data Freshness

- **Metrics**: Updated daily via `populate-metrics.ts` (already existing behavior)
- **Profiles**: Updated daily via `populate-metrics.ts` (new behavior)
- **Balance Sheets**: Still fetched from API (minimal data, low frequency)

## Testing

Created test scripts for verification:
- `scripts/test-profile-cache.ts` - Check profile data in database
- `scripts/test-fetch-profile.ts` - Test API profile fetching
- `scripts/update-nvda-profile.ts` - Manual profile update for testing

### Verified Results for NVDA:
```
Industry: Semiconductors ✅
Sector: Technology ✅
Country: United States ✅  
Description: NVIDIA Corporation, a computing infrastructure company... ✅
Website: https://www.nvidia.com ✅
Employees: null (Yahoo Finance doesn't provide) ⚠️
Logo URL: https://logo.clearbit.com/nvidia.com ✅
```

## Migration Path

1. ✅ Schema updated with new fields
2. ✅ Prisma client regenerated (`npx prisma generate`)
3. ✅ Schema pushed to database (`npx prisma db push`)
4. ✅ populate-metrics.ts updated to populate profiles
5. ⏭️ Next run of populate-metrics will populate all 423 stocks (~7 minutes with 1s delay)

## API Architecture Summary

### Before (All API-Driven):
```
Page Load → getStockData()
  ↓
  ├─ fetchStockData() [DB] ✅ Metrics (cached)
  ├─ fetchCompanyProfile() [API] ❌ Profile (API call)
  ├─ fetchBalanceSheet() [API] ⚠️ Balance sheet (still API)
  └─ fetchCompanyNews() [API] ⚠️ News (still API)
```

### After (Hybrid Cached + API):
```
Page Load → getStockData()
  ↓
  ├─ fetchStockData() [DB] ✅ Metrics (cached)
  ├─ stock.industry/sector/country [DB] ✅ Profile (cached)
  ├─ fetchBalanceSheet() [API] ⚠️ Balance sheet (still API, minimal)
  └─ fetchCompanyNews() [API] ⚠️ News (still API, minimal)
```

## Remaining API Calls

After this implementation, the only API calls on page loads are:
1. **Balance Sheets** - Fetch once per stock, minimal data
2. **Company News** - Fetch latest news articles (fast, cached separately)

Both are minimal and don't impact performance significantly.

## Future Enhancements

1. Consider caching balance sheets if they become a performance bottleneck
2. Add employees data source fallback (Finnhub provides this)
3. Implement cache invalidation strategy (e.g., refresh on company events)

## Related Commits

- 84ed94f - Fixed 5MB Prisma limit by reducing query size
- 8036407 - Fixed Enterprise Value metrics field mapping
- d88376e - Added Notes column to Excel export
- 5d3a9e8 - Created DATA_SOURCE_MAPPING.md documentation
- bcb6aff - **This commit**: Company profile caching

## Documentation

See [DATA_SOURCE_MAPPING.md](../DATA_SOURCE_MAPPING.md) for comprehensive field-by-field data source documentation.
