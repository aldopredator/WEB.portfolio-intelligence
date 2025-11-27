
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
import { fetchMultipleQuotes } from '@/lib/yahoo-finance';
import { fetchAndScoreSentiment } from '@/lib/stock-utils';

// Force dynamic rendering so prices are fetched at runtime, not build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Stock configuration - must be defined before getStockData
const STOCK_CONFIG = [
  { ticker: 'GOOG', name: 'Alphabet Inc. (GOOG)', color: 'bg-rose-500', letter: 'G' },
  { ticker: 'TSLA', name: 'Tesla, Inc. (TSLA)', color: 'bg-red-600', letter: 'T' },
  { ticker: 'NVDA', name: 'Nvidia Corporation (NVDA)', color: 'bg-emerald-500', letter: 'N' },
  { ticker: 'AMZN', name: 'Amazon.com Inc. (AMZN)', color: 'bg-orange-500', letter: 'A' },
  { ticker: 'BRKB', name: 'Berkshire Hathaway Inc. (BRKB)', color: 'bg-slate-600', letter: 'B' },
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
    // Read static data (analyst recommendations, sentiment, trends, etc.)
    const filePath = path.join(process.cwd(), 'public', 'stock_insights_data.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const staticData = JSON.parse(fileContents);

    // Get all stock tickers from the config
    const tickers = STOCK_CONFIG.map(config => config.ticker).join(',');

    // Fetch real-time prices directly (no HTTP call needed for server components)
    try {
      const realTimePrices = await fetchMultipleQuotes(tickers.split(','));

      if (realTimePrices && Object.keys(realTimePrices).length > 0) {
        // Merge real-time prices with static data
        const mergedData: StockInsightsData = { ...staticData };

        Object.keys(realTimePrices).forEach((ticker) => {
          const stockInfo = mergedData[ticker];
          if (stockInfo && typeof stockInfo === 'object' && 'stock_data' in stockInfo) {
            // Update price-related fields with real-time data
            stockInfo.stock_data = {
              ...stockInfo.stock_data,
              current_price: realTimePrices[ticker].current_price,
              change: realTimePrices[ticker].change,
              change_percent: realTimePrices[ticker].change_percent,
              '52_week_high': realTimePrices[ticker]['52_week_high'],
              '52_week_low': realTimePrices[ticker]['52_week_low'],
                    price_movement_30_days: realTimePrices[ticker].price_history,
                    market_cap: realTimePrices[ticker].market_cap ?? stockInfo.stock_data?.market_cap,
                    volume: realTimePrices[ticker].volume ?? stockInfo.stock_data?.volume,
                    currency: realTimePrices[ticker].currency ?? stockInfo.stock_data?.currency,
            };

            // Update target price if available
            if (realTimePrices[ticker].target_price > 0) {
              stockInfo.analyst_recommendations = {
                ...stockInfo.analyst_recommendations,
                target_price: realTimePrices[ticker].target_price
              };
            }
          }
        });

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

        // Attempt to enrich social sentiment using NewsAPI (if key provided) or fallback to static latest_news
        await Promise.allSettled(Object.keys(mergedData).map(async (ticker) => {
          try {
            const cfg = STOCK_CONFIG.find(c => c.ticker === ticker);
            const companyName = cfg?.name;
            const stockEntry = mergedData[ticker];
            const fallbackArticles = (stockEntry && typeof stockEntry === 'object' && 'latest_news' in stockEntry) ? (stockEntry as any).latest_news : [];
            const sentiment = await fetchAndScoreSentiment(ticker, companyName, fallbackArticles as any[]);
            if (sentiment && stockEntry && typeof stockEntry === 'object') {
              (stockEntry as any).social_sentiment = sentiment;
            }
          } catch (e) {
            // ignore per-ticker sentiment errors
          }
        }));

        return {
          ...mergedData,
          timestamp: new Date().toISOString()
        };
      }
    } catch (apiError) {
      console.error('Error fetching real-time prices, using static data:', apiError);
    }

    // Fallback to static data if API fails or returns no data
    return {
      ...staticData,
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

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {STOCK_CONFIG.map((config, index) => {
          const data = stockData?.[config.ticker];

          // Type guard to ensure data is StockInfo object and not string/undefined
          if (!data || typeof data === 'string' || !('stock_data' in data)) return null;

          return (
            <div key={config.ticker} className={index > 0 ? "mt-16" : ""}>
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
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">No stock data available</p>
          </div>
        )}
      </div>
    </main>
  );
}
