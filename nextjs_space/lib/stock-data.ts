// Shared stock data fetching logic
import { promises as fs } from 'fs';
import path from 'path';
import type { StockInsightsData } from '@/lib/types';
import { fetchYahooPriceHistory } from '@/lib/yahoo-finance';
import { fetchAndScoreSentiment } from '@/lib/sentiment';
import { fetchFinnhubMetrics, fetchBalanceSheet } from '@/lib/finnhub-metrics';
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

        // Fetch price history
        const priceHistory = await fetchYahooPriceHistory(ticker);
        if (priceHistory && priceHistory.length > 0 && isRecord(stockEntry) && stockEntry.stock_data) {
          (stockEntry.stock_data as any).price_movement_30_days = priceHistory;
        }
      } catch (error) {
        console.error(`Error enriching ${ticker}:`, error);
      }
    }));

    return mergedData;
  } catch (error) {
    console.error('Error loading stock data:', error);
    return {};
  }
}
