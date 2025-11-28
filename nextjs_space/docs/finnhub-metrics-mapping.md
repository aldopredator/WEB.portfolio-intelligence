# Finnhub Metric Tags → Site Fields Mapping

This document maps common Finnhub metric keys (as returned by `/stock/metric`) and related endpoints to the fields used in the Portfolio Intelligence dashboard.

Notes
- Finnhub sometimes returns percentage-style values already scaled (e.g. `22.24`) or decimal fractions (e.g. `0.2224`). The code uses a normalization helper (`toPercent`) which converts decimals to percentages and leaves already-scaled values as-is.

Mapping (Finnhub key → Dashboard field)

| Finnhub Key(s) | Dashboard Field | UI Location | Type | Notes |
|---|---|---:|---:|---|
| `peBasicExclExtraTTM`, `peBasic` | `pe_ratio` | Valuation → P/E Ratio | ratio | Raw numeric ratio (no %)
| `pbQuarterly`, `pbAnnual` | `pb_ratio` | Valuation → P/B Ratio | ratio | Raw numeric ratio
| `psTTM`, `psQuarterly` | `ps_ratio` | Valuation → P/S Ratio | ratio | Raw numeric ratio
| `pcfShareQuarterly`, `pcfShareAnnual` | `pcf_ratio` | Valuation → P/CF Ratio | ratio | Raw numeric ratio

| `roeTTM`, `roeRfy` | `roe` | Profitability → ROE | percentage | Normalized to percent (e.g. 0.2224 → 22.24%)
| `roaRfy`, `roaTTM` | `roa` | Profitability → ROA | percentage | Normalized to percent
| `roiTTM`, `roiRfy` | `roi` | Profitability → ROI | percentage | Normalized to percent
| `grossMarginTTM`, `grossMarginAnnual` | `gross_margin` | Profitability → Gross Margin | percentage | Normalized to percent
| `operatingMarginTTM`, `operatingMarginAnnual` | `operating_margin` | Profitability → Operating Margin | percentage | Normalized to percent
| `netProfitMarginTTM`, `netProfitMarginAnnual` | `profit_margin` | Profitability → Profit Margin | percentage | Normalized to percent

| `totalDebt`, `totalEquity` | computed `debt_to_equity` | Profitability → Debt-to-Equity | ratio | Computed as totalDebt / totalEquity (raw ratio)
| `currentRatioQuarterly`, `currentRatioAnnual` | `current_ratio` | Financial Health → Current Ratio | ratio | Raw numeric ratio
| `quickRatioQuarterly`, `quickRatioAnnual` | `quick_ratio` | Financial Health → Quick Ratio | ratio | Raw numeric ratio

| `revenueGrowthTTMYoy`, `revenueGrowthQuarterlyYoy` | `revenue_growth` | Growth → Revenue Growth | percentage | Normalized to percent
| `epsGrowthTTMYoy`, `epsGrowthQuarterlyYoy` | `earnings_growth` | Growth → Earnings Growth | percentage | Normalized to percent

| `dividendYieldIndicatedAnnual`, `dividendYieldTTM` | `dividend_yield` | Dividends → Dividend Yield | percentage | Normalized to percent
| `payoutRatioTTM`, `payoutRatioAnnual` | `payout_ratio` | Dividends → Payout Ratio | percentage | Normalized to percent

| `beta` | `beta` | Market Data | number | Raw numeric
| `epsBasicExclExtraItemsTTM`, `epsExclExtraItemsAnnual` | `eps` | Per share | number | Earnings per share
| `bookValuePerShareQuarterly`, `bookValuePerShareAnnual` | `book_value_per_share` | Per share | number | Raw numeric

Profile & Quote endpoints

| Endpoint / Field | Dashboard Field | UI Location | Type | Notes |
|---|---|---:|---:|---|
| `/stock/profile2` → `marketCapitalization` | `market_cap` | Market Data | number | Finnhub returns market cap in millions — code multiplies by 1,000,000
| `/stock/profile2` → `currency` | `currency` | Market Data | string | Currency code, e.g. `USD`
| `/quote` → `v` | `volume` | Market Data | number | Daily traded volume

How percentages are handled

- The module code uses the following rule in `toPercent(raw)`:
  - If `raw` is null/undefined → `undefined`.
  - Convert `raw` to a Number `n`.
  - If `|n| > 1` → assume value already in percent (e.g. `22.24`) and return `n` rounded to 2 decimals.
  - Otherwise → multiply by 100 and round to 2 decimals (e.g. `0.2224` → `22.24`).

Is Finnhub indicating types reliably?

- Finnhub does not include an explicit `type` flag per metric in the `metric` response; keys are consistent in naming (e.g., `roeTTM`, `roeRfy`, `revenueGrowthTTMYoy`) and documentation describes whether a key is a percentage or ratio. Because of the lack of a standardized `type` field in the API response, the code uses a normalization heuristic (`toPercent`) that covers the two common formats:
  - decimal fractions (0.2224) and already-scaled percentages (22.24).

- If you prefer stricter behavior (no heuristics), I can implement a hard-coded per-key type mapping and apply conversions only per-key. This is recommended for full robustness.

Next steps

- I can implement a strict per-key type map in `finnhub-metrics.ts` and prefer it over `toPercent` heuristics. This will make future additions deterministic without manual testing.

---
Generated: automatic mapping file for developer reference.
