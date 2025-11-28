import { promises as fs } from 'fs';
import path from 'path';
import type { StockInsightsData } from '@/lib/types';
import { fetchYahooPriceHistory } from '@/lib/yahoo-finance';
import { fetchAndScoreSentiment } from '@/lib/sentiment';
import { fetchFinnhubMetrics, fetchCompanyProfile } from '@/lib/finnhub-metrics';
import { isRecord } from '@/lib/utils';
import DashboardClient from './DashboardClient';

export const revalidate = 1800; // 30 minutes

const STOCK_CONFIG = [
  { ticker: 'GOOG', name: 'Alphabet Inc. (GOOG)' },
  { ticker: 'TSLA', name: 'Tesla, Inc. (TSLA)' },
  { ticker: 'NVDA', name: 'Nvidia Corporation (NVDA)' },
  { ticker: 'AMZN', name: 'Amazon.com Inc. (AMZN)' },
  { ticker: 'BRK-B', name: 'Berkshire Hathaway Inc. (BRK-B)' },
  { ticker: 'ISRG', name: 'Intuitive Surgical Inc. (ISRG)' },
  { ticker: 'NFLX', name: 'Netflix Inc. (NFLX)' },
  { ticker: 'IDXX', name: 'IDEXX Laboratories Inc. (IDXX)' },
  { ticker: 'III', name: '3i Group plc (III)' },
  { ticker: 'PLTR', name: 'Palantir Technologies Inc. (PLTR)' },
  { ticker: 'QBTS', name: 'D-Wave Quantum Inc. (QBTS)' },
  { ticker: 'RGTI', name: 'Rigetti Computing Inc. (RGTI)' },
];

async function getStockData(): Promise<StockInsightsData> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'stock_insights_data.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const staticData = JSON.parse(fileContents);
    const mergedData: StockInsightsData = { ...staticData };

    // Enrich with real-time data
    await Promise.allSettled(Object.keys(mergedData).map(async (ticker) => {
      try {
        const cfg = STOCK_CONFIG.find(c => c.ticker === ticker);
        const companyName = cfg?.name;
        const stockEntry = mergedData[ticker];

        // Fetch company profile
        const profile = await fetchCompanyProfile(ticker);
        if (profile && isRecord(stockEntry)) {
          stockEntry.company_profile = profile as any;
        }

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

export default async function DashboardPage() {
  const stockData = await getStockData();

  const stocks = STOCK_CONFIG.map((config) => {
    const data = stockData[config.ticker];
    const stockInfo = data && typeof data === 'object' && 'stock_data' in data ? data.stock_data : null;
    return {
      ticker: config.ticker,
      company: config.name,
      change_percent: stockInfo?.change_percent,
    };
  });

  return <DashboardClient initialData={stockData} stocks={stocks} />;
}
