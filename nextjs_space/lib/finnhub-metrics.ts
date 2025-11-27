// Server-only module for fetching financial metrics and company data from Finnhub
// @ts-ignore - process is available in Node.js server context
import { getCached, setCached } from './cache';

export interface FinnhubMetrics {
  pe_ratio?: number;
  pb_ratio?: number;
  debt_to_equity?: number;
  roe?: number;
  dividend_yield?: number;
  market_cap?: number;
  volume?: number;
  currency?: string;
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

    // Fetch basic financial metrics (P/E, P/B, debt-to-equity, ROE, dividend yield)
    try {
      const url = `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${apiKey}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        const metrics = data.metric || {};
        
        result.pe_ratio = metrics.peBasic ? parseFloat(metrics.peBasic) : undefined;
        result.pb_ratio = metrics.pbBasic ? parseFloat(metrics.pbBasic) : undefined;
        result.debt_to_equity = metrics.totalDebt && metrics.totalEquity 
          ? parseFloat((metrics.totalDebt / metrics.totalEquity).toFixed(2))
          : undefined;
        result.roe = metrics.roe ? parseFloat((metrics.roe * 100).toFixed(2)) : undefined;
        result.dividend_yield = metrics.dividendYield ? parseFloat((metrics.dividendYield * 100).toFixed(2)) : undefined;
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
