# Finnhub Metric Tags → Site Fields Mapping

This document maps common Finnhub metric keys (as returned by `/stock/metric`) and related endpoints to the fields used in the Portfolio Intelligence dashboard.

Notes
- Finnhub sometimes returns percentage-style values already scaled (e.g. `22.24`) or decimal fractions (e.g. `0.2224`). The code uses a normalization helper (`toPercent`) which converts decimals to percentages and leaves already-scaled values as-is.

Mapping (Finnhub key → Dashboard field)

- `peBasicExclExtraTTM`, `peBasic` → `pe_ratio`
- `pbQuarterly`, `pbAnnual` → `pb_ratio`
- `psTTM`, `psQuarterly` → `ps_ratio`
- `pcfShareQuarterly`, `pcfShareAnnual` → `pcf_ratio`

- `roeTTM`, `roeRfy` → `roe` (Dashboard: Profitability > ROE)
- `roaRfy`, `roaTTM` → `roa` (Dashboard: Profitability > ROA)
- `roiTTM`, `roiRfy` → `roi` (Dashboard: Profitability > ROI)
- `grossMarginTTM`, `grossMarginAnnual` → `gross_margin`
- `operatingMarginTTM`, `operatingMarginAnnual` → `operating_margin`
- `netProfitMarginTTM`, `netProfitMarginAnnual` → `profit_margin`

- `totalDebt`, `totalEquity` → used to compute `debt_to_equity` (Dashboard: Profitability > Debt-to-Equity)
- `currentRatioQuarterly`, `currentRatioAnnual` → `current_ratio`
- `quickRatioQuarterly`, `quickRatioAnnual` → `quick_ratio`

- `revenueGrowthTTMYoy`, `revenueGrowthQuarterlyYoy` → `revenue_growth` (normalized %)
- `epsGrowthTTMYoy`, `epsGrowthQuarterlyYoy` → `earnings_growth` (normalized %)

- `dividendYieldIndicatedAnnual`, `dividendYieldTTM` → `dividend_yield` (normalized %)
- `payoutRatioTTM`, `payoutRatioAnnual` → `payout_ratio` (normalized %)

- `beta` → `beta` (market data)
- `epsBasicExclExtraItemsTTM`, `epsExclExtraItemsAnnual` → `eps`
- `bookValuePerShareQuarterly`, `bookValuePerShareAnnual` → `book_value_per_share`

Profile & Quote endpoints
- `/stock/profile2` → `marketCapitalization` (Finnhub returns market cap in millions) → `market_cap` (converted to raw number by multiplying by 1,000,000)
- `/stock/profile2` → `currency` → `currency`
- `/quote` → `v` → `volume` (daily volume)

How percentages are handled
- The module code uses the following rule in `toPercent(raw)`:
  - If `raw` is null/undefined → `undefined`.
  - Convert `raw` to a Number `n`.
  - If `|n| > 1` → assume value already in percent (e.g. `22.24`) and return `n` rounded to 2 decimals.
  - Otherwise → multiply by 100 and round to 2 decimals (e.g. `0.2224` → `22.24`).

If you prefer a stricter mapping (explicit per-key scaling), we can update this doc and the code to handle each Finnhub key individually.

---
Generated: automatic mapping file for developer reference.
