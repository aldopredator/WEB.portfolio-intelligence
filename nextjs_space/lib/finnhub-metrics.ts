// Server-only module for fetching financial metrics and company data from Finnhub
// Uses Next.js fetch caching with 30-day revalidation for persistent caching

export interface FinnhubMetrics {
  // Valuation metrics
  pe_ratio?: number;
  pb_ratio?: number;
  ps_ratio?: number;
  pcf_ratio?: number;

  // Profitability metrics
  roe?: number;
  roa?: number;
  roi?: number;
  gross_margin?: number;
  operating_margin?: number;
  profit_margin?: number;

  // Financial health
  debt_to_equity?: number;
  current_ratio?: number;
  quick_ratio?: number;

  // Growth metrics
  revenue_growth?: number;
  earnings_growth?: number;

  // Dividend metrics
  dividend_yield?: number;
  payout_ratio?: number;

  // Market data
  market_cap?: number;
  volume?: number;
  currency?: string;
  beta?: number;

  // Real-time quote
  change_percent?: number; // Finnhub dp (percent change)

  // Per share metrics
  eps?: number;
  book_value_per_share?: number;
}

const METRICS_CACHE_TTL_SECONDS = 2592000; // 30 days in seconds (aligns with quarterly financial reporting)

/**
 * Internal function that does the actual API fetching
 */
async function fetchFinnhubMetricsInternal(ticker: string, apiKey: string): Promise<FinnhubMetrics> {
  console.log(`[FINNHUB] Fetching fresh metrics from API for ${ticker}`);

  try {
    const result: FinnhubMetrics = {};

    // Fetch basic financial metrics
    try {
      const url = `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${apiKey}`;
      const response = await fetch(url, {
        next: { revalidate: METRICS_CACHE_TTL_SECONDS } // Next.js cache for 30 days
      } as any);

      if (response.ok) {
        const data = await response.json();
        const metrics = data.metric || {};

        // Valuation metrics
        result.pe_ratio = metrics.peBasicExclExtraTTM || metrics.peBasic ? parseFloat(metrics.peBasicExclExtraTTM || metrics.peBasic) : undefined;
        result.pb_ratio = metrics.pbQuarterly || metrics.pbAnnual ? parseFloat(metrics.pbQuarterly || metrics.pbAnnual) : undefined;
        result.ps_ratio = metrics.psTTM || metrics.psQuarterly ? parseFloat(metrics.psTTM || metrics.psQuarterly) : undefined;
        result.pcf_ratio = metrics.pcfShareQuarterly || metrics.pcfShareAnnual ? parseFloat(metrics.pcfShareQuarterly || metrics.pcfShareAnnual) : undefined;

        // Profitability metrics (normalize percentages)
        function toPercent(raw: any): number | undefined {
          if (raw === null || raw === undefined) return undefined;
          const n = Number(raw);
          if (Number.isNaN(n)) return undefined;
          // Finnhub sometimes returns already-scaled percentages (e.g. 22.24) or decimal fractions (e.g. 0.2224).
          // If absolute value > 1, assume it's already a percentage (22.24 => 22.24%). Otherwise multiply by 100.
          return Math.abs(n) > 1 ? parseFloat(n.toFixed(2)) : parseFloat((n * 100).toFixed(2));
        }

        result.roe = toPercent(metrics.roeTTM ?? metrics.roeRfy);
        result.roa = toPercent(metrics.roaRfy ?? metrics.roaTTM);
        result.roi = toPercent(metrics.roiTTM ?? metrics.roiRfy);
        result.gross_margin = toPercent(metrics.grossMarginTTM ?? metrics.grossMarginAnnual);
        result.operating_margin = toPercent(metrics.operatingMarginTTM ?? metrics.operatingMarginAnnual);
        result.profit_margin = toPercent(metrics.netProfitMarginTTM ?? metrics.netProfitMarginAnnual);

        // Financial health
        result.debt_to_equity = metrics.totalDebt && metrics.totalEquity
          ? parseFloat((metrics.totalDebt / metrics.totalEquity).toFixed(2))
          : undefined;
        result.current_ratio = metrics.currentRatioQuarterly || metrics.currentRatioAnnual ? parseFloat(metrics.currentRatioQuarterly || metrics.currentRatioAnnual) : undefined;
        result.quick_ratio = metrics.quickRatioQuarterly || metrics.quickRatioAnnual ? parseFloat(metrics.quickRatioQuarterly || metrics.quickRatioAnnual) : undefined;

        // Growth metrics (normalize percentages)
        result.revenue_growth = toPercent(metrics.revenueGrowthTTMYoy ?? metrics.revenueGrowthQuarterlyYoy);
        result.earnings_growth = toPercent(metrics.epsGrowthTTMYoy ?? metrics.epsGrowthQuarterlyYoy);

        // Dividend metrics
        result.dividend_yield = toPercent(metrics.dividendYieldIndicatedAnnual ?? metrics.dividendYieldTTM);
        result.payout_ratio = toPercent(metrics.payoutRatioTTM ?? metrics.payoutRatioAnnual);

        // Market data
        result.beta = metrics.beta ? parseFloat(metrics.beta.toFixed(2)) : undefined;

        // Per share metrics
        result.eps = metrics.epsBasicExclExtraItemsTTM || metrics.epsExclExtraItemsAnnual ? parseFloat(metrics.epsBasicExclExtraItemsTTM || metrics.epsExclExtraItemsAnnual) : undefined;
        result.book_value_per_share = metrics.bookValuePerShareQuarterly || metrics.bookValuePerShareAnnual ? parseFloat(metrics.bookValuePerShareQuarterly || metrics.bookValuePerShareAnnual) : undefined;

        console.log(`[FINNHUB] ${ticker} - Successfully fetched ${Object.keys(result).filter(k => result[k as keyof FinnhubMetrics] !== undefined).length} metrics`);
      } else {
        console.warn(`[FINNHUB] ${ticker} - Metrics API returned status ${response.status}`);
      }
    } catch (e) {
      console.error(`[FINNHUB] ${ticker} - Error fetching metrics:`, e);
    }

    // Fetch company profile for market cap and currency
    try {
      const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${apiKey}`;
      const profileResponse = await fetch(profileUrl, {
        next: { revalidate: METRICS_CACHE_TTL_SECONDS }
      } as any);

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.marketCapitalization) {
          result.market_cap = profileData.marketCapitalization * 1000000; // Convert millions to actual number
        }
        if (profileData.currency) {
          result.currency = profileData.currency;
        }
        console.log(`[FINNHUB] ${ticker} - Fetched company profile`);
      }
    } catch (e) {
      console.error(`[FINNHUB] ${ticker} - Error fetching profile:`, e);
    }

    // Fetch quote for volume and additional data
    try {
      const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`;
      const quoteResponse = await fetch(quoteUrl, {
        next: { revalidate: METRICS_CACHE_TTL_SECONDS }
      } as any);

      if (quoteResponse.ok) {
        const quoteData = await quoteResponse.json();
        if (quoteData.v) {
          result.volume = quoteData.v; // Daily volume
        }
        if (typeof quoteData.dp === 'number') {
          result.change_percent = Number(quoteData.dp.toFixed(2));
        }
        console.log(`[FINNHUB] ${ticker} - Fetched quote data`);
      }
    } catch (e) {
      console.error(`[FINNHUB] ${ticker} - Error fetching quote:`, e);
    }

    return result;
  } catch (error) {
    console.error(`[FINNHUB] ${ticker} - Unexpected error:`, error);
    return {};
  }
}

/**
 * Fetch comprehensive financial data from Finnhub with Next.js persistent caching
 * Cache persists across deployments via Next.js fetch cache (30 days revalidation)
 */
export async function fetchFinnhubMetrics(ticker: string): Promise<FinnhubMetrics> {
  // @ts-ignore - process is available in Node.js server context
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    console.warn(`[FINNHUB] ${ticker} - API key not configured, skipping metrics fetch`);
    return {};
  }

  // Fetch with Next.js cache built into fetch() calls
  return fetchFinnhubMetricsInternal(ticker, apiKey);
}
