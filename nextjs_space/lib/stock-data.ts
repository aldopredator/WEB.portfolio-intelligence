// Shared stock data fetching logic
import { promises as fs } from 'fs';
import path from 'path';
import type { StockInsightsData } from '@/lib/types';
import { fetchAndScoreSentiment } from '@/lib/sentiment';
import { fetchFinnhubMetrics, fetchBalanceSheet, fetchCompanyProfile } from '@/lib/finnhub-metrics';
import { fetchPolygonStockStats } from '@/lib/polygon';
import { getPolygonCached, setPolygonCached, getNextTickerToFetch } from '@/lib/polygon-cache';
import { isRecord } from '@/lib/utils';

export const STOCK_CONFIG = [
  { ticker: 'GOOG', name: 'Alphabet Inc. (GOOG)', sector: 'Technology' },
  { ticker: 'TSLA', name: 'Tesla, Inc. (TSLA)', sector: 'Consumer Cyclical' },
  { ticker: 'NVDA', name: 'Nvidia Corporation (NVDA)', sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon.com Inc. (AMZN)', sector: 'Consumer Cyclical' },
  { ticker: 'BRK-B', name: 'Berkshire Hathaway Inc. (BRK-B)', sector: 'Financial Services' },
  { ticker: 'ISRG', name: 'Intuitive Surgical Inc. (ISRG)', sector: 'Healthcare' },
  { ticker: 'NFLX', name: 'Netflix Inc. (NFLX)', sector: 'Communication Services' },
  { ticker: 'IDXX', name: 'IDEXX Laboratories Inc. (IDXX)', sector: 'Healthcare' },
  { ticker: 'III', name: '3i Group plc (III)', sector: 'Financial Services' },
  { ticker: 'PLTR', name: 'Palantir Technologies Inc. (PLTR)', sector: 'Technology' },
  { ticker: 'QBTS', name: 'D-Wave Quantum Inc. (QBTS)', sector: 'Technology' },
  { ticker: 'RGTI', name: 'Rigetti Computing Inc. (RGTI)', sector: 'Technology' },
];

/**
 * Fetch and enrich stock data from all sources
 * This is the single source of truth for stock data across the application
 */
export async function getStockData(): Promise<StockInsightsData> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'stock_insights_data.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const staticData = JSON.parse(fileContents);
    const mergedData: StockInsightsData = { ...staticData };

    // Enrich with real-time data (skip non-ticker keys like 'timestamp')
    const validTickers = Object.keys(mergedData).filter(key => 
      key !== 'timestamp' && isRecord(mergedData[key]) && 'stock_data' in (mergedData[key] as any)
    );
    
    // Process other APIs in parallel (Finnhub, sentiment, balance sheet)
    await Promise.allSettled(validTickers.map(async (ticker) => {
      try {
        const cfg = STOCK_CONFIG.find(c => c.ticker === ticker);
        const companyName = cfg?.name;
        const stockEntry = mergedData[ticker];

        // Fetch sentiment
        const sentiment = await fetchAndScoreSentiment(ticker, companyName, []);
        if (sentiment && isRecord(stockEntry)) {
          stockEntry.social_sentiment = sentiment as any;
        }

        // Fetch company profile (includes country, industry, etc.)
        const profile = await fetchCompanyProfile(ticker);
        if (profile && isRecord(stockEntry)) {
          stockEntry.company_profile = profile as any;
        }

        // Fetch financial metrics
        const metrics = await fetchFinnhubMetrics(ticker);
        if (metrics && isRecord(stockEntry) && stockEntry.stock_data) {
          Object.assign(stockEntry.stock_data, metrics);
        }

        // Fetch balance sheet
        const balanceSheet = await fetchBalanceSheet(ticker);
        if (balanceSheet && isRecord(stockEntry) && stockEntry.company_profile) {
          Object.assign(stockEntry.company_profile, balanceSheet);
        }
      } catch (error) {
        console.error(`Error enriching ${ticker}:`, error);
      }
    }));

    // Process Polygon.io stats with smart caching (24-hour TTL, one ticker every 5 minutes)
    // This respects the free tier limit of 5 calls/minute while keeping data fresh
    console.log('[STOCK-DATA] 🚀 Starting Polygon.io data fetch with smart caching...');
    console.log('[STOCK-DATA] 📋 Valid tickers:', validTickers);
    
    // First, load all cached data
    for (const ticker of validTickers) {
      const stockEntry = mergedData[ticker];
      if (!isRecord(stockEntry) || !stockEntry.stock_data) continue;
      
      const cachedStats = await getPolygonCached(ticker);
      if (cachedStats) {
        Object.assign(stockEntry.stock_data, cachedStats);
        console.log(`[STOCK-DATA] ✅ Using cached Polygon data for ${ticker}`);
      }
    }
    
    // Determine if we should fetch fresh data for any ticker (max one per request)
    const nextTicker = await getNextTickerToFetch(validTickers);
    
    if (nextTicker) {
      try {
        console.log(`[STOCK-DATA] 🔄 Fetching fresh Polygon data for ${nextTicker}...`);
        const stockEntry = mergedData[nextTicker];
        
        if (isRecord(stockEntry) && stockEntry.stock_data) {
          const polygonStats = await fetchPolygonStockStats(nextTicker);
          
          if (polygonStats) {
            // Save to cache
            await setPolygonCached(nextTicker, polygonStats);
            
            // Merge into stock data
            Object.assign(stockEntry.stock_data, polygonStats);
            console.log(`[STOCK-DATA] ✅ Updated ${nextTicker} with fresh Polygon data:`, JSON.stringify(polygonStats));
          } else {
            console.log(`[STOCK-DATA] ⚠️ No Polygon stats returned for ${nextTicker}`);
          }
        }
      } catch (error) {
        console.error(`[STOCK-DATA] ❌ Error fetching Polygon stats for ${nextTicker}:`, error);
      }
    } else {
      console.log('[STOCK-DATA] ⏭️  Skipping Polygon fetch (rate limit or all data fresh)');
    }
    
    console.log('[STOCK-DATA] 🏁 Completed Polygon.io data processing');

    // Note: Price history is already in the JSON file (updates once per day)
    // No need to fetch from Yahoo Finance on every request

    return mergedData;
  } catch (error) {
    console.error('Error loading stock data:', error);
    return {};
  }
}
