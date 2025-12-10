
import { promises as fs } from 'fs';
import path from 'path';
import { PriceCard } from '@/components/price-card';
import { PriceChart } from '@/components/price-chart';
import { CompanyHighlights } from '@/components/company-highlights';
import { SentimentCard } from '@/components/sentiment-card';
import { ProsConsCard } from '@/components/pros-cons-card';
import { RecommendationCard } from '@/components/recommendation-card';
import { BarChart3, RefreshCw } from 'lucide-react';
import type { StockInsightsData } from '@/lib/types';
// import { fetchMultipleQuotes } from '@/lib/yahoo-finance';
import { fetchYahooPriceHistory } from '@/lib/yahoo-finance';
import { fetchAndScoreSentiment } from '@/lib/sentiment';
import { fetchFinnhubMetrics } from '@/lib/finnhub-metrics';
import { isRecord } from '@/lib/utils';

// Use ISR (Incremental Static Regeneration) with 30-day revalidation
// This allows Next.js to cache the page and data fetches, respecting individual fetch cache times
// Financial metrics are cached for 30 days at the fetch level
export const revalidate = 2592000; // 30 days - aligns with quarterly financial reporting

// Stock configuration - must be defined before getStockData
const STOCK_CONFIG = [
  { ticker: 'GOOG', name: 'Alphabet Inc. (GOOG)', color: 'bg-rose-500', letter: 'G' },
  { ticker: 'TSLA', name: 'Tesla, Inc. (TSLA)', color: 'bg-red-600', letter: 'T' },
  { ticker: 'NVDA', name: 'Nvidia Corporation (NVDA)', color: 'bg-emerald-500', letter: 'N' },
  { ticker: 'AMZN', name: 'Amazon.com Inc. (AMZN)', color: 'bg-orange-500', letter: 'A' },
  { ticker: 'BRK-B', name: 'Berkshire Hathaway Inc. (BRK-B)', color: 'bg-slate-600', letter: 'B' },
  { ticker: 'ISRG', name: 'Intuitive Surgical Inc. (ISRG)', color: 'bg-indigo-500', letter: 'I' },
  { ticker: 'NFLX', name: 'Netflix Inc. (NFLX)', color: 'bg-red-700', letter: 'N' },

  { ticker: 'IDXX', name: 'IDEXX Laboratories Inc. (IDXX)', color: 'bg-yellow-600', letter: 'I' },
  { ticker: 'III', name: '3i Group plc (III)', color: 'bg-sky-600', letter: '3' },
  { ticker: 'PLTR', name: 'Palantir Technologies Inc. (PLTR)', color: 'bg-stone-500', letter: 'P' },
  { ticker: 'QBTS', name: 'D-Wave Quantum Inc. (QBTS)', color: 'bg-violet-600', letter: 'Q' },
  { ticker: 'RGTI', name: 'Rigetti Computing Inc. (RGTI)', color: 'bg-cyan-600', letter: 'R' },
];

async function getStockData(): Promise<StockInsightsData> {
  try {
    console.log('[INIT] Starting data fetch...');
    console.log('[INIT] Environment check:', {
      hasFinnhubKey: !!process.env.FINNHUB_API_KEY,
      hasNewsApiKey: !!process.env.NEWS_API_KEY,
      nodeEnv: process.env.NODE_ENV
    });

    // Read static data (analyst recommendations, sentiment, trends, etc.)
    const filePath = path.join(process.cwd(), 'public', 'stock_insights_data.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const staticData = JSON.parse(fileContents);

    // Get all stock tickers from the config
    const tickers = STOCK_CONFIG.map(config => config.ticker).join(',');

    // Fetch real-time prices from Finnhub metrics only
    // All real-time fields will be updated in the enrichment loop below
    const mergedData: StockInsightsData = { ...staticData };


    // Map static emerging_trends to pros (temporary migration)
    Object.keys(mergedData).forEach((ticker) => {
      const stockInfo = mergedData[ticker];
      if (stockInfo && typeof stockInfo === 'object') {
        // Handle migration from emerging_trends to pros/cons
        // @ts-ignore - emerging_trends might still exist in the static JSON
        const trends = stockInfo.emerging_trends || [];
        stockInfo.pros = trends; // Use existing trends as pros for now
        stockInfo.cons = []; // Initialize empty cons
      }
    });

    // Attempt to enrich social sentiment and financial metrics
    console.log('[DATA] Starting enrichment for all tickers...');
    await Promise.allSettled(Object.keys(mergedData).map(async (ticker) => {
      try {
        console.log(`[DATA] Enriching ${ticker}...`);
        const cfg = STOCK_CONFIG.find(c => c.ticker === ticker);
        const companyName = cfg?.name;
        const stockEntry = mergedData[ticker];

        // Fetch sentiment
        // We pass empty array for fallback to ensure we only use real-time news
        const sentiment = await fetchAndScoreSentiment(ticker, companyName, []);
        if (sentiment && isRecord(stockEntry)) {
          stockEntry.social_sentiment = sentiment as any;
          console.log(`[DATA] ${ticker} - Sentiment updated`);
        } else {
          console.warn(`[DATA] ${ticker} - No sentiment data received`);
        }

        // Fetch financial metrics and real-time price from Finnhub
        const metrics = await fetchFinnhubMetrics(ticker);
        if (metrics && isRecord(stockEntry) && stockEntry.stock_data) {
          // Merge all Finnhub fields into stock_data (overwrites Yahoo fields)
          Object.assign(stockEntry.stock_data, metrics);
          // For absolute price change, use Finnhub d (change)
          if (typeof metrics.change === 'number') {
            (stockEntry.stock_data as any).change = metrics.change;
          }
          // For current price, use Finnhub c
          if (typeof metrics.current_price === 'number') {
            (stockEntry.stock_data as any).current_price = metrics.current_price;
          }
          // For previous close, use Finnhub pc
          if (typeof metrics.previous_close === 'number') {
            (stockEntry.stock_data as any).previous_close = metrics.previous_close;
          }
          // For 52-week high/low
          if (typeof metrics['52_week_high'] === 'number') {
            (stockEntry.stock_data as any)['52_week_high'] = metrics['52_week_high'];
          }
          if (typeof metrics['52_week_low'] === 'number') {
            (stockEntry.stock_data as any)['52_week_low'] = metrics['52_week_low'];
          }
          // For percent change, use Finnhub dp (already handled above)
          console.log(`[DATA] ${ticker} - Finnhub metrics merged`);
        } else {
          console.warn(`[DATA] ${ticker} - No Finnhub metrics received`);
        }

        // Fetch 30-day price history from Yahoo Finance (free, no auth required)
        const priceHistory = await fetchYahooPriceHistory(ticker);
        if (priceHistory && priceHistory.length > 0 && isRecord(stockEntry) && stockEntry.stock_data) {
          (stockEntry.stock_data as any).price_movement_30_days = priceHistory;
          console.log(`[DATA] ${ticker} - Yahoo price history merged (${priceHistory.length} days)`);
        } else {
          console.warn(`[DATA] ${ticker} - No price history received from Yahoo`);
        }
      } catch (e) {
        console.error(`[DATA] ${ticker} - Error during enrichment:`, e);
      }
    }));
    console.log('[DATA] Enrichment complete for all tickers');

    // Always return mergedData (enriched or fallback)
    return {
      ...mergedData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error reading stock data:', error);
    return {} as StockInsightsData;
  }
}

export default async function Home() {
  const stockData = await getStockData();

  const lastUpdated = stockData?.timestamp
    ? new Date(stockData.timestamp as string).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    : 'Unknown';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Stock Insights Dashboard</h1>
                <p className="text-slate-400 text-sm">Your tracker for Stocks & ETF</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-700">
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <div className="text-right">
                <p className="text-slate-400 text-xs">Last Updated</p>
                <p className="text-white text-sm font-semibold">{lastUpdated}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-8 snap-x snap-mandatory gap-8 px-6 py-8 min-h-[calc(100vh-100px)]">
        {STOCK_CONFIG.map((config, index) => {
          const data = stockData?.[config.ticker];

          // Type guard to ensure data is StockInfo object and not string/undefined
          if (!data || typeof data === 'string' || !('stock_data' in data)) return null;

          return (
            <div key={config.ticker} className="min-w-[90vw] xl:min-w-[1400px] snap-center bg-slate-900/20 rounded-3xl p-6 border border-slate-800/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center`}>
                  <img src={`/logos/${config.ticker}.svg`} alt={`${config.ticker} logo`} className="w-10 h-10 object-cover" />
                </div>
                <h2 className="text-3xl font-bold text-white">{config.name}</h2>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <PriceCard stock={data.stock_data} />
                <PriceChart
                  data={data.stock_data.price_movement_30_days ?? []}
                  ticker={config.ticker}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                <CompanyHighlights
                  data={data}
                  ticker={config.ticker}
                />
                <SentimentCard
                  sentiment={data.social_sentiment}
                  ticker={config.ticker}
                />
                <ProsConsCard
                  pros={data.pros ?? []}
                  cons={data.cons ?? []}
                  ticker={config.ticker}
                />
              </div>
            </div>
          );
        })}

        {Object.keys(stockData || {}).length === 0 && (
          <div className="text-center py-20 min-w-full">
            <p className="text-slate-400 text-lg">No stock data available</p>
          </div>
        )}
      </div>
    </main>
  );
}
