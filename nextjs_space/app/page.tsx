
import { promises as fs } from 'fs';
import path from 'path';
import { PriceCard } from '@/components/price-card';
import { PriceChart } from '@/components/price-chart';
import { AnalystCard } from '@/components/analyst-card';
import { SentimentCard } from '@/components/sentiment-card';
import { TrendsCard } from '@/components/trends-card';
import { RecommendationCard } from '@/components/recommendation-card';
import { BarChart3, RefreshCw } from 'lucide-react';
import type { StockInsightsData } from '@/lib/types';

async function getStockData(): Promise<StockInsightsData> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'stock_insights_data.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return {
      ...data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error reading stock data:', error);
    return {} as StockInsightsData;
  }
}

export default async function Home() {
  const stockData = await getStockData();
  const metaData = stockData?.META;
  const nvdaData = stockData?.NVDA;
  
  const lastUpdated = stockData?.timestamp 
    ? new Date(stockData.timestamp).toLocaleString('en-US', {
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
                <p className="text-slate-400 text-sm">Real-time analysis for Stocks, Bonds & ETF</p>
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
        {/* Meta Section */}
        {metaData && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Meta Platforms (META)</h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <PriceCard stock={metaData?.stock_data} />
              <PriceChart 
                data={metaData?.stock_data?.price_movement_30_days ?? []} 
                ticker="META" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              <AnalystCard 
                data={metaData?.analyst_recommendations} 
                currentPrice={metaData?.stock_data?.current_price ?? 0}
              />
              <SentimentCard 
                sentiment={metaData?.social_sentiment} 
                ticker="META"
              />
              <TrendsCard 
                trends={metaData?.emerging_trends ?? []} 
                ticker="META"
              />
            </div>

            <RecommendationCard stock={metaData} ticker="META" />
          </div>
        )}

        {/* Nvidia Section */}
        {nvdaData && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Nvidia Corporation (NVDA)</h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <PriceCard stock={nvdaData?.stock_data} />
              <PriceChart 
                data={nvdaData?.stock_data?.price_movement_30_days ?? []} 
                ticker="NVDA" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              <AnalystCard 
                data={nvdaData?.analyst_recommendations} 
                currentPrice={nvdaData?.stock_data?.current_price ?? 0}
              />
              <SentimentCard 
                sentiment={nvdaData?.social_sentiment} 
                ticker="NVDA"
              />
              <TrendsCard 
                trends={nvdaData?.emerging_trends ?? []} 
                ticker="NVDA"
              />
            </div>

            <RecommendationCard stock={nvdaData} ticker="NVDA" />
          </div>
        )}

        {!metaData && !nvdaData && (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">No stock data available</p>
          </div>
        )}
      </div>
    </main>
  );
}
