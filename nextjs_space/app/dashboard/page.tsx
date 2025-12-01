import { Suspense } from 'react';
import type { StockInsightsData } from '@/lib/types';
import { getStockData, STOCK_CONFIG } from '@/lib/stock-data';
import DashboardClient from './DashboardClient';

// Force dynamic rendering - runs on every request for Polygon POC testing
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for POC

export default async function DashboardPage() {
  const stockData = await getStockData();

  // Debug: Check if Polygon data exists
  const googData = stockData.GOOG;
  if (googData && typeof googData === 'object' && 'stock_data' in googData) {
    console.log('[DashboardPage] Sample stock data for GOOG:', {
      floatShares: googData.stock_data?.floatShares,
      sharesOutstanding: googData.stock_data?.sharesOutstanding,
      dailyVolume: googData.stock_data?.dailyVolume,
    });
  }

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
