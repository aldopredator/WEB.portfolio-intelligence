// Server-only module for fetching financial metrics and company data from Finnhub
// Uses Next.js fetch caching with 30-day revalidation for persistent caching

import type { AnalystRecommendation } from './types';
import { shouldUseYahooFinance, fetchYahooCompanyProfile } from './yahoo-finance';

export interface CompanyProfile {
  name?: string;
  logo?: string;
  industry?: string;
  sector?: string;
  subSector?: string;
  country?: string;
  marketCapitalization?: number;
  currency?: string;
  weburl?: string;
}

export interface BalanceSheet {
  assets?: number;
  liabilities?: number;
  equity?: number;
  currency?: string;
}

export interface NewsArticle {
  headline: string;
  source: string;
  url: string;
  datetime?: number;
  summary?: string;
  image?: string;
}

export interface PriceTarget {
  targetHigh?: number;
  targetLow?: number;
  targetMean?: number;
  targetMedian?: number;
  numberOfAnalysts?: number;
}

export interface EarningsEvent {
  date: string;
  epsEstimate?: number;
  epsActual?: number;
  revenueEstimate?: number;
  revenueActual?: number;
  quarter?: number;
  year?: number;
}

export interface EarningsSurprise {
  actual?: number;
  estimate?: number;
  period: string;
  quarter?: number;
  year?: number;
  surprise?: number;
  surprisePercent?: number;
}

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
  averageVolume10Day?: number;
  currency?: string;
  beta?: number;

  // Real-time quote
  change_percent?: number; // Finnhub dp (percent change)
  change?: number; // Finnhub d (absolute change)
  current_price?: number; // Finnhub c (current price)
  previous_close?: number; // Finnhub pc (previous close)
  '52_week_high'?: number; // Finnhub h (52-week high)
  '52_week_low'?: number; // Finnhub l (52-week low)

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
        if (typeof quoteData.d === 'number') {
          result.change = Number(quoteData.d.toFixed(2));
        }
        if (typeof quoteData.c === 'number') {
          result.current_price = Number(quoteData.c.toFixed(2));
        }
        if (typeof quoteData.pc === 'number') {
          result.previous_close = Number(quoteData.pc.toFixed(2));
        }
        if (typeof quoteData.h === 'number') {
          result['52_week_high'] = Number(quoteData.h.toFixed(2));
        }
        if (typeof quoteData.l === 'number') {
          result['52_week_low'] = Number(quoteData.l.toFixed(2));
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

/**
 * Fetch company profile data from Finnhub
 */
export async function fetchCompanyProfile(ticker: string): Promise<CompanyProfile> {
  // Check if this is a non-US stock that should use Yahoo Finance
  if (shouldUseYahooFinance(ticker)) {
    console.log(`[FINNHUB] ${ticker} - Non-US stock detected, using Yahoo Finance fallback`);
    try {
      const yahooProfile = await fetchYahooCompanyProfile(ticker);
      if (yahooProfile) {
        return {
          name: yahooProfile.name,
          logo: yahooProfile.logo,
          industry: yahooProfile.industry,
          sector: yahooProfile.sector,
          country: yahooProfile.country,
          marketCapitalization: yahooProfile.marketCapitalization,
          currency: yahooProfile.currency,
          weburl: yahooProfile.weburl,
        };
      }
    } catch (error) {
      console.error(`[FINNHUB] ${ticker} - Yahoo Finance fallback failed:`, error);
    }
  }

  // Try Finnhub for US stocks or if Yahoo failed
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn(`[FINNHUB] ${ticker} - API key not configured for profile`);
    return {};
  }

  try {
    const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${apiKey}`;
    const response = await fetch(url, {
      next: { revalidate: METRICS_CACHE_TTL_SECONDS }
    } as any);

    if (response.ok) {
      const data = await response.json();
      
      // Check if Finnhub returned an error (common for non-US stocks)
      if (data.error) {
        console.warn(`[FINNHUB] ${ticker} - API error: ${data.error}`);
        return {};
      }
      
      return {
        name: data.name,
        logo: data.logo,
        industry: data.finnhubIndustry,
        sector: data.gsector,
        subSector: data.naicsSubsector,
        country: data.country,
        marketCapitalization: data.marketCapitalization ? data.marketCapitalization * 1000000 : undefined,
        currency: data.currency,
        weburl: data.weburl,
      };
    }
  } catch (error) {
    console.error(`[FINNHUB] ${ticker} - Error fetching profile:`, error);
  }
  return {};
}

/**
 * Fetch company news from Finnhub
 */
export async function fetchCompanyNews(ticker: string, limit: number = 10): Promise<NewsArticle[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn(`[FINNHUB] ${ticker} - API key not configured for news`);
    return [];
  }

  try {
    // Get news from last 30 days
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    const from = fromDate.toISOString().split('T')[0];
    const to = toDate.toISOString().split('T')[0];

    const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${apiKey}`;
    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour (news is time-sensitive)
    } as any);

    if (response.ok) {
      const data = await response.json();
      return data.slice(0, limit).map((article: any) => ({
        headline: article.headline,
        source: article.source,
        url: article.url,
        datetime: article.datetime,
        summary: article.summary,
        image: article.image,
      }));
    }
  } catch (error) {
    console.error(`[FINNHUB] ${ticker} - Error fetching news:`, error);
  }
  return [];
}

/**
 * Fetch price target from Finnhub
 */
export async function fetchPriceTarget(ticker: string): Promise<PriceTarget> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn(`[FINNHUB] ${ticker} - API key not configured for price target`);
    return {};
  }

  try {
    const url = `https://finnhub.io/api/v1/stock/price-target?symbol=${ticker}&token=${apiKey}`;
    const response = await fetch(url, {
      next: { revalidate: 86400 } // Cache for 1 day
    } as any);

    if (response.ok) {
      const data = await response.json();
      return {
        targetHigh: data.targetHigh,
        targetLow: data.targetLow,
        targetMean: data.targetMean,
        targetMedian: data.targetMedian,
        numberOfAnalysts: data.numberOfAnalysts,
      };
    }
  } catch (error) {
    console.error(`[FINNHUB] ${ticker} - Error fetching price target:`, error);
  }
  return {};
}

/**
 * Fetch earnings calendar from Finnhub
 */
export async function fetchEarningsCalendar(ticker: string): Promise<EarningsEvent[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn(`[FINNHUB] ${ticker} - API key not configured for earnings`);
    return [];
  }

  try {
    const url = `https://finnhub.io/api/v1/calendar/earnings?symbol=${ticker}&token=${apiKey}`;
    const response = await fetch(url, {
      next: { revalidate: 86400 } // Cache for 1 day
    } as any);

    if (response.ok) {
      const data = await response.json();
      if (data.earningsCalendar && Array.isArray(data.earningsCalendar)) {
        return data.earningsCalendar.map((event: any) => ({
          date: event.date,
          epsEstimate: event.epsEstimate,
          epsActual: event.epsActual,
          revenueEstimate: event.revenueEstimate,
          revenueActual: event.revenueActual,
          quarter: event.quarter,
          year: event.year,
        }));
      }
    }
  } catch (error) {
    console.error(`[FINNHUB] ${ticker} - Error fetching earnings calendar:`, error);
  }
  return [];
}

/**
 * Fetch earnings surprises from Finnhub
 */
export async function fetchEarningsSurprises(ticker: string): Promise<EarningsSurprise[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn(`[FINNHUB] ${ticker} - API key not configured for earnings surprises`);
    return [];
  }

  try {
    const url = `https://finnhub.io/api/v1/stock/earnings?symbol=${ticker}&token=${apiKey}`;
    const response = await fetch(url, {
      next: { revalidate: 86400 } // Cache for 1 day
    } as any);

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data)) {
        return data.map((item: any) => ({
          actual: item.actual,
          estimate: item.estimate,
          period: item.period,
          quarter: item.quarter,
          year: item.year,
          surprise: item.surprise,
          surprisePercent: item.surprisePercent,
        }));
      }
    }
  } catch (error) {
    console.error(`[FINNHUB] ${ticker} - Error fetching earnings surprises:`, error);
  }
  return [];
}

/**
 * Fetch recommendation trends from Finnhub
 */
export async function fetchRecommendationTrends(ticker: string): Promise<AnalystRecommendation[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn(`[FINNHUB] ${ticker} - API key not configured for recommendations`);
    return [];
  }

  try {
    const url = `https://finnhub.io/api/v1/stock/recommendation?symbol=${ticker}&token=${apiKey}`;
    const response = await fetch(url, {
      next: { revalidate: 86400 } // Cache for 1 day
    } as any);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((rec: any) => ({
          period: rec.period,
          strongBuy: rec.strongBuy || 0,
          buy: rec.buy || 0,
          hold: rec.hold || 0,
          sell: rec.sell || 0,
          strongSell: rec.strongSell || 0,
        }));
      }
    }
  } catch (error) {
    console.error(`[FINNHUB] ${ticker} - Error fetching recommendations:`, error);
  }
  return [];
}

/**
 * Fetch balance sheet data from Finnhub
 */
export async function fetchBalanceSheet(ticker: string): Promise<BalanceSheet> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn(`[FINNHUB] ${ticker} - API key not configured for balance sheet`);
    return {};
  }

  try {
    const url = `https://finnhub.io/api/v1/stock/financials-reported?symbol=${ticker}&token=${apiKey}`;
    const response = await fetch(url, {
      next: { revalidate: METRICS_CACHE_TTL_SECONDS }
    } as any);

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        // Get most recent annual report
        const report = data.data.find((r: any) => r.form === '10-K') || data.data[0];
        if (report && report.report && report.report.bs) {
          const bs = report.report.bs;
          // Find assets and liabilities in the balance sheet
          const assetsItem = bs.find((item: any) => 
            item.label && (item.label.toLowerCase().includes('total assets') || item.label.toLowerCase() === 'assets')
          );
          const liabilitiesItem = bs.find((item: any) => 
            item.label && (item.label.toLowerCase().includes('total liabilities') || item.label.toLowerCase() === 'liabilities')
          );
          const equityItem = bs.find((item: any) => 
            item.label && item.label.toLowerCase().includes('equity')
          );

          return {
            assets: assetsItem?.value,
            liabilities: liabilitiesItem?.value,
            equity: equityItem?.value,
            currency: report.report.currency || 'USD',
          };
        }
      }
    }
  } catch (error) {
    console.error(`[FINNHUB] ${ticker} - Error fetching balance sheet:`, error);
  }
  return {};
}
