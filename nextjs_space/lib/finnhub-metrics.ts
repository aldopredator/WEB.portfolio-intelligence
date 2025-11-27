// Server-only module for fetching financial metrics from Finnhub
// @ts-ignore - process is available in Node.js server context
import { getCached, setCached } from './cache';

export interface FinnhubMetrics {
  pe_ratio?: number;
  pb_ratio?: number;
  debt_to_equity?: number;
  roe?: number;
  dividend_yield?: number;
}

const METRICS_CACHE_TTL_MS = 3600000; // 1 hour default

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
    const url = `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Finnhub metrics fetch failed for ${ticker}: ${response.statusText}`);
      return {};
    }

    const data = await response.json();
    
    // Finnhub returns metrics under a nested structure
    const metrics = data.metric || {};
    
    const result: FinnhubMetrics = {
      pe_ratio: metrics.peBasic ? parseFloat(metrics.peBasic) : undefined,
      pb_ratio: metrics.pbBasic ? parseFloat(metrics.pbBasic) : undefined,
      debt_to_equity: metrics.totalDebt && metrics.totalEquity 
        ? parseFloat((metrics.totalDebt / metrics.totalEquity).toFixed(2))
        : undefined,
      roe: metrics.roe ? parseFloat((metrics.roe * 100).toFixed(2)) : undefined, // Convert to percentage
      dividend_yield: metrics.dividendYield ? parseFloat((metrics.dividendYield * 100).toFixed(2)) : undefined, // Convert to percentage
    };

    // Cache the result
    await setCached(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error(`Error fetching Finnhub metrics for ${ticker}:`, error);
    return {};
  }
}
