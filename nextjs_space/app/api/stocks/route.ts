import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { fetchYahooPriceHistory } from '@/lib/yahoo-finance';
import { fetchAndScoreSentiment } from '@/lib/sentiment';
import { fetchFinnhubMetrics } from '@/lib/finnhub-metrics';
import { isRecord } from '@/lib/utils';
import type { StockInsightsData } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    // Read static data
    const filePath = path.join(process.cwd(), 'public', 'stock_insights_data.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const staticData = JSON.parse(fileContents);

    const mergedData: StockInsightsData = { ...staticData };

    // Map emerging_trends to pros
    Object.keys(mergedData).forEach((ticker) => {
      const stockInfo = mergedData[ticker];
      if (stockInfo && typeof stockInfo === 'object') {
        // @ts-ignore
        const trends = stockInfo.emerging_trends || [];
        stockInfo.pros = trends;
        stockInfo.cons = [];
      }
    });

    // Enrich with real-time data
    await Promise.allSettled(Object.keys(mergedData).map(async (ticker) => {
      try {
        const cfg = STOCK_CONFIG.find(c => c.ticker === ticker);
        const companyName = cfg?.name;
        const stockEntry = mergedData[ticker];

        // Fetch sentiment
        const sentiment = await fetchAndScoreSentiment(ticker, companyName, []);
        if (sentiment && isRecord(stockEntry)) {
          stockEntry.social_sentiment = sentiment as any;
        }

        // Fetch financial metrics from Finnhub
        const metrics = await fetchFinnhubMetrics(ticker);
        if (metrics && isRecord(stockEntry) && stockEntry.stock_data) {
          Object.assign(stockEntry.stock_data, metrics);
          if (typeof metrics.change === 'number') {
            (stockEntry.stock_data as any).change = metrics.change;
          }
        }

        // Fetch price history from Yahoo
        const history = await fetchYahooPriceHistory(ticker);
        if (history && history.length > 0 && isRecord(stockEntry)) {
          stockEntry.price_movement_30_days = history;
        }
      } catch (error) {
        console.error(`Error enriching ${ticker}:`, error);
      }
    }));

    return mergedData;
  } catch (error) {
    console.error('Error in getStockData:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const data = await getStockData();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error in /api/stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
