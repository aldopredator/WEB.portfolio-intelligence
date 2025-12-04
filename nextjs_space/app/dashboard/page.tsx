import { Suspense } from 'react';
import type { StockInsightsData } from '@/lib/types';
import { getStockData, STOCK_CONFIG } from '@/lib/stock-data';
import DashboardClient from './DashboardClient';

// Force dynamic rendering - runs on every request for Polygon POC testing
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for POC

interface DashboardPageProps {
  searchParams: { portfolio?: string };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const portfolioId = searchParams.portfolio || null;
  console.log('[DashboardPage] 🔍 Portfolio filter:', portfolioId ? portfolioId : 'ALL');
  const stockData = await getStockData(portfolioId);

  // Debug: Check if Polygon data exists
  const googData = stockData.GOOG;
  if (googData && typeof googData === 'object' && 'stock_data' in googData) {
    console.log('[DashboardPage] Sample stock data for GOOG:', {
      floatShares: googData.stock_data?.floatShares,
      sharesOutstanding: googData.stock_data?.sharesOutstanding,
      dailyVolume: googData.stock_data?.dailyVolume,
    });
  }

  // Use filtered stockData keys instead of STOCK_CONFIG to respect portfolio filter
  const stocks = Object.keys(stockData).map((ticker) => {
    const data = stockData[ticker];
    const stockInfo = data && typeof data === 'object' && 'stock_data' in data ? data.stock_data : null;
    const config = STOCK_CONFIG.find(c => c.ticker === ticker);
    return {
      ticker: ticker,
      company: config?.name || ticker,
      change_percent: stockInfo?.change_percent,
    };
  });
  
  console.log('[DashboardPage] 📊 Stocks to display:', stocks.length, stocks.map(s => s.ticker).join(', '));

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DashboardClient initialData={stockData} stocks={stocks} />
    </Suspense>
  );
}
