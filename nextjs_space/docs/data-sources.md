# Data Sources Specification

## Primary Source: Finnhub API

Finnhub is the **primary data source** for all real-time and financial metrics. Use Finnhub whenever available.

### Finnhub Endpoints Used

1. **`/stock/metric`** - Financial metrics (quarterly/annual)
   - Valuation: PE, PB, PS, P/CF ratios
   - Profitability: ROE, ROA, ROI, margins (gross, operating, profit)
   - Financial Health: debt-to-equity, current ratio, quick ratio
   - Growth: revenue growth, earnings growth
   - Dividends: yield, payout ratio
   - Market: beta
   - Per Share: EPS, book value

2. **`/stock/profile2`** - Company profile
   - Market capitalization
   - Currency

3. **`/stock/quote`** - Real-time quote data
   - Current price (`c`)
   - Absolute change (`d`)
   - Percent change (`dp`)
   - Previous close (`pc`)
   - 52-week high (`h`)
   - 52-week low (`l`)
   - Volume (`v`)

### Finnhub Restrictions

- **`/stock/candle` (historical price data)**: Returns 403 errors on free tier / restricted plans
  - **Status**: Not available / paid subscription required
  - **Fallback**: Use Yahoo Finance for 30-day price history

---

## Fallback Source: Yahoo Finance

Yahoo Finance is used **only as a fallback** when Finnhub data is not available or subject to paid subscription restrictions.

### Yahoo Finance Endpoints Used

1. **`/v8/finance/chart`** - Historical price data (30-day chart)
   - **Purpose**: 30-Day Price Movement chart only
   - **Reason**: Finnhub `/stock/candle` requires paid subscription
   - **Authentication**: None required (free, public API)
   - **Revalidation**: 1 day (86400 seconds)

### Yahoo Finance Fallback Rules

✅ **Use Yahoo Finance for:**
- 30-day historical price data (for price movement charts)

❌ **Do NOT use Yahoo Finance for:**
- Real-time price, change, percent change (use Finnhub `/stock/quote`)
- Financial metrics (use Finnhub `/stock/metric`)
- 52-week high/low (use Finnhub `/stock/quote`)
- Volume (use Finnhub `/stock/quote`)

---

## Implementation Summary

| Data Field | Primary Source | Fallback Source | Notes |
|------------|----------------|-----------------|-------|
| Current Price | Finnhub `/stock/quote` (`c`) | - | Real-time |
| Absolute Change | Finnhub `/stock/quote` (`d`) | - | Real-time |
| Percent Change | Finnhub `/stock/quote` (`dp`) | - | Real-time |
| Previous Close | Finnhub `/stock/quote` (`pc`) | - | Real-time |
| 52-Week High | Finnhub `/stock/quote` (`h`) | - | Real-time |
| 52-Week Low | Finnhub `/stock/quote` (`l`) | - | Real-time |
| Volume | Finnhub `/stock/quote` (`v`) | - | Real-time |
| Financial Metrics | Finnhub `/stock/metric` | - | Quarterly/annual |
| Market Cap | Finnhub `/stock/profile2` | - | Real-time |
| **30-Day Price History** | ~~Finnhub `/stock/candle`~~ | **Yahoo Finance `/v8/finance/chart`** | Finnhub returns 403 (paid tier) |

---

## Cache Strategy

- **Finnhub financial metrics**: 30 days (2,592,000 seconds) - aligns with quarterly reporting
- **Finnhub real-time quote**: 30 days (inherited from metrics cache)
- **Yahoo price history**: 1 day (86,400 seconds) - more frequent refresh for charts
- **Sentiment data**: File-based cache with stale-while-revalidate

---

## Key Principle

> **Use Finnhub as primary source. If data is not provided or subject to paid subscription, use Yahoo Finance as fallback source.**

This ensures:
- Maximum accuracy and consistency from Finnhub (official, comprehensive API)
- No disruption when Finnhub has paid restrictions (graceful fallback to Yahoo)
- Cost optimization (use free Yahoo where Finnhub is paid)
