// Server-only module for fetching financial metrics and company data from Finnhub
// @ts-ignore - process is available in Node.js server context
import { getCached, setCached } from './cache';

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

  // Per share metrics
  eps?: number;
  book_value_per_share?: number;
}

const METRICS_CACHE_TTL_MS = 3600000; // 1 hour default

/**
 * Fetch comprehensive financial data from Finnhub including metrics and company info
 */
export async function fetchFinnhubMetrics(ticker: string): Promise<FinnhubMetrics> {
  // @ts-ignore - process is available in Node.js server context
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    console.warn('FINNHUB_API_KEY not set; skipping Finnhub metrics fetch');
    return {};
  }

  // Check cache first
  const cacheKey = `finnhub-metrics-${ticker}`;
  const cached = await getCached<FinnhubMetrics>(cacheKey, METRICS_CACHE_TTL_MS);
  if (cached) {
    return cached;
  }

  try {
    const result: FinnhubMetrics = {};

    // Fetch basic financial metrics
    try {
      const url = `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${apiKey}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        const metrics = data.metric || {};

        // Valuation metrics
        result.pe_ratio = metrics.peBasicExclExtraTTM || metrics.peBasic ? parseFloat(metrics.peBasicExclExtraTTM || metrics.peBasic) : undefined;
        result.pb_ratio = metrics.pbQuarterly || metrics.pbAnnual ? parseFloat(metrics.pbQuarterly || metrics.pbAnnual) : undefined;
        result.ps_ratio = metrics.psQuarterly || metrics.psAnnual ? parseFloat(metrics.psQuarterly || metrics.psAnnual) : undefined;
        result.pcf_ratio = metrics.pcfShareQuarterly || metrics.pcfShareAnnual ? parseFloat(metrics.pcfShareQuarterly || metrics.pcfShareAnnual) : undefined;

        // Profitability metrics (convert decimals to percentages)
        result.roe = metrics.roeTTM || metrics.roeRfy ? parseFloat(((metrics.roeTTM || metrics.roeRfy) * 100).toFixed(2)) : undefined;
        result.roa = metrics.roaRfy || metrics.roaTTM ? parseFloat(((metrics.roaRfy || metrics.roaTTM) * 100).toFixed(2)) : undefined;
        result.roi = metrics.roiTTM || metrics.roiRfy ? parseFloat(((metrics.roiTTM || metrics.roiRfy) * 100).toFixed(2)) : undefined;
        result.gross_margin = metrics.grossMarginTTM || metrics.grossMarginAnnual ? parseFloat(((metrics.grossMarginTTM || metrics.grossMarginAnnual) * 100).toFixed(2)) : undefined;
        result.operating_margin = metrics.operatingMarginTTM || metrics.operatingMarginAnnual ? parseFloat(((metrics.operatingMarginTTM || metrics.operatingMarginAnnual) * 100).toFixed(2)) : undefined;
        result.profit_margin = metrics.netProfitMarginTTM || metrics.netProfitMarginAnnual ? parseFloat(((metrics.netProfitMarginTTM || metrics.netProfitMarginAnnual) * 100).toFixed(2)) : undefined;

        // Financial health
        result.debt_to_equity = metrics.totalDebt && metrics.totalEquity
          ? parseFloat((metrics.totalDebt / metrics.totalEquity).toFixed(2))
          : undefined;
        result.current_ratio = metrics.currentRatioQuarterly || metrics.currentRatioAnnual ? parseFloat(metrics.currentRatioQuarterly || metrics.currentRatioAnnual) : undefined;
        result.quick_ratio = metrics.quickRatioQuarterly || metrics.quickRatioAnnual ? parseFloat(metrics.quickRatioQuarterly || metrics.quickRatioAnnual) : undefined;

        // Growth metrics (convert decimals to percentages)
        result.revenue_growth = metrics.revenueGrowthTTMYoy || metrics.revenueGrowthQuarterlyYoy ? parseFloat(((metrics.revenueGrowthTTMYoy || metrics.revenueGrowthQuarterlyYoy) * 100).toFixed(2)) : undefined;
        result.earnings_growth = metrics.epsGrowthTTMYoy || metrics.epsGrowthQuarterlyYoy ? parseFloat(((metrics.epsGrowthTTMYoy || metrics.epsGrowthQuarterlyYoy) * 100).toFixed(2)) : undefined;

        // Dividend metrics
        result.dividend_yield = metrics.dividendYieldIndicatedAnnual || metrics.dividendYieldTTM ? parseFloat(((metrics.dividendYieldIndicatedAnnual || metrics.dividendYieldTTM) * 100).toFixed(2)) : undefined;
        result.payout_ratio = metrics.payoutRatioTTM || metrics.payoutRatioAnnual ? parseFloat(((metrics.payoutRatioTTM || metrics.payoutRatioAnnual) * 100).toFixed(2)) : undefined;

        // Market data
        result.beta = metrics.beta ? parseFloat(metrics.beta.toFixed(2)) : undefined;

        // Per share metrics
        result.eps = metrics.epsBasicExclExtraItemsTTM || metrics.epsExclExtraItemsAnnual ? parseFloat(metrics.epsBasicExclExtraItemsTTM || metrics.epsExclExtraItemsAnnual) : undefined;
        result.book_value_per_share = metrics.bookValuePerShareQuarterly || metrics.bookValuePerShareAnnual ? parseFloat(metrics.bookValuePerShareQuarterly || metrics.bookValuePerShareAnnual) : undefined;
      }
    } catch (e) {
      console.warn(`Failed to fetch Finnhub metrics for ${ticker}:`, e);
    }

    // Fetch company profile for market cap and currency
    try {
      const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${apiKey}`;
      const profileResponse = await fetch(profileUrl);

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.marketCapitalization) {
          result.market_cap = profileData.marketCapitalization * 1000000; // Convert millions to actual number
        }
        if (profileData.currency) {
          result.currency = profileData.currency;
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch Finnhub profile for ${ticker}:`, e);
    }

    // Fetch quote for volume and additional data
    try {
      const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`;
      const quoteResponse = await fetch(quoteUrl);

      if (quoteResponse.ok) {
        const quoteData = await quoteResponse.json();
        if (quoteData.v) {
          result.volume = quoteData.v; // Daily volume
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch Finnhub quote for ${ticker}:`, e);
    }

    // Cache the result
    await setCached(cacheKey, result);

    return result;
  } catch (error) {
    console.error(`Error fetching Finnhub data for ${ticker}:`, error);
    return {};
  }
}
