import type { StockInsightsData } from '@/lib/types';
import { getStockData, STOCK_CONFIG } from '@/lib/stock-data';
import DashboardClient from './DashboardClient';

export const revalidate = 1800; // 30 minutes

export default async function DashboardPage() {
  const stockData = await getStockData();

  // Debug: Check if Polygon data exists
  console.log('[DashboardPage] Sample stock data for GOOG:', {
    floatShares: stockData.GOOG?.stock_data?.floatShares,
    sharesOutstanding: stockData.GOOG?.stock_data?.sharesOutstanding,
    dailyVolume: stockData.GOOG?.stock_data?.dailyVolume,
  });

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
