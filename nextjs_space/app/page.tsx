import { promises as fs } from 'fs';
import path from 'path';
import { Suspense } from 'react';
import type { StockInsightsData } from '@/lib/types';
import { fetchAndScoreSentiment } from '@/lib/sentiment';
import { fetchPolygonStockStats } from '@/lib/polygon';
import { 
  fetchFinnhubMetrics, 
  fetchCompanyProfile, 
  fetchCompanyNews, 
  fetchPriceTarget, 
  fetchEarningsCalendar, 
  fetchEarningsSurprises,
  fetchRecommendationTrends 
} from '@/lib/finnhub-metrics';
import { isRecord } from '@/lib/utils';
import DashboardClient from './dashboard/DashboardClient';

// Force dynamic rendering - runs on every request for Polygon POC testing
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for POC

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
          console.log(`[PAGE] ${ticker} - Finnhub 52-week: ${metrics['52_week_low']} - ${metrics['52_week_high']}`);
        }

        // Fetch company profile
        const profile = await fetchCompanyProfile(ticker);
        if (profile && isRecord(stockEntry)) {
          stockEntry.company_profile = profile as any;
        }

        // Fetch company news
        const news = await fetchCompanyNews(ticker, 5);
        if (news && isRecord(stockEntry)) {
          stockEntry.latest_news = news as any;
        }

        // Fetch price target
        const priceTarget = await fetchPriceTarget(ticker);
        if (priceTarget && isRecord(stockEntry)) {
          stockEntry.price_target = priceTarget as any;
        }

        // Fetch earnings calendar
        const earnings = await fetchEarningsCalendar(ticker);
        if (earnings && isRecord(stockEntry)) {
          stockEntry.earnings_calendar = earnings as any;
        }

        // Fetch earnings surprises
        const earningSurprises = await fetchEarningsSurprises(ticker);
        if (earningSurprises && isRecord(stockEntry)) {
          stockEntry.earnings_surprises = earningSurprises as any;
        }

        // Fetch recommendation trends
        const recTrends = await fetchRecommendationTrends(ticker);
        if (recTrends && isRecord(stockEntry)) {
          stockEntry.recommendation_trends = recTrends as any;
        }

        // Note: Price history is already in the JSON file (updates once per day)
        // No need to fetch from Yahoo Finance on every request
      } catch (error) {
        console.error(`Error enriching ${ticker}:`, error);
      }
    }));

    // POC: Fetch Polygon.io data for GOOG only
    const timestamp = new Date().toISOString();
    console.log(`[PAGE] 🎯 POC: Fetching Polygon.io data for GOOG at ${timestamp}...`);
    
    const googEntry = mergedData['GOOG'];
    if (googEntry && isRecord(googEntry) && googEntry.stock_data) {
      try {
        const polygonStats = await fetchPolygonStockStats('GOOG');
        
        if (polygonStats) {
          Object.assign(googEntry.stock_data, polygonStats);
          console.log(`[PAGE] ✅ GOOG Polygon data at ${timestamp}:`, JSON.stringify(polygonStats, null, 2));
        } else {
          console.log(`[PAGE] ⚠️ No Polygon data returned for GOOG at ${timestamp}`);
        }
      } catch (error) {
        console.error(`[PAGE] ❌ Error fetching Polygon data for GOOG at ${timestamp}:`, error);
      }
    }

    return mergedData;
  } catch (error) {
    console.error('Error loading stock data:', error);
    return {};
  }
}

export default async function HomePage() {
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

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DashboardClient initialData={stockData} stocks={stocks} />
    </Suspense>
  );
}
