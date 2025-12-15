import { Suspense } from 'react';
import type { StockInsightsData } from '@/lib/types';
import { getStockData, STOCK_CONFIG } from '@/lib/stock-data';
import { PrismaClient } from '@prisma/client';
import DashboardClient from './dashboard/DashboardClient';

const prisma = new PrismaClient();

// Force dynamic rendering - runs on every request for Polygon POC testing
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for POC

interface HomePageProps {
  searchParams: { portfolio?: string };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const portfolioId = searchParams.portfolio || null;
  console.log('[HomePage] 🔍 Portfolio filter:', portfolioId ? portfolioId : 'ALL');
  const stockData = await getStockData(portfolioId);

  // Fetch stock ratings from database
  const dbStocks = await prisma.stock.findMany({
    where: { 
      isActive: true,
      ...(portfolioId ? { portfolioId } : {}),
    },
    select: {
      ticker: true,
      rating: true,
      notes: true,
      portfolioId: true,
    },
  });

  console.log('[HomePage] DB Stocks with ratings:', dbStocks);

  const stockRatings = dbStocks.reduce((acc, stock) => {
    acc[stock.ticker] = {
      rating: stock.rating || 0,
      notes: (stock as any).notes || '',
      portfolioId: stock.portfolioId,
    };
    return acc;
  }, {} as Record<string, { rating: number; notes: string; portfolioId: string | null }>);

  console.log('[HomePage] Stock ratings map:', stockRatings);

  await prisma.$disconnect();

  // Use filtered stockData keys instead of STOCK_CONFIG to respect portfolio filter
  const stocks = Object.keys(stockData).filter(key => key !== 'timestamp').map((ticker) => {
    const data = stockData[ticker];
    const stockInfo = data && typeof data === 'object' && 'stock_data' in data ? data.stock_data : null;
    const config = STOCK_CONFIG.find(c => c.ticker === ticker);
    return {
      ticker: ticker,
      company: config?.name || ticker,
      change_percent: stockInfo?.change_percent,
      rating: stockRatings[ticker]?.rating || 0,
      notes: stockRatings[ticker]?.notes || '',
      portfolioId: stockRatings[ticker]?.portfolioId || null,
    };
  });
  
  console.log('[HomePage] 📊 Stocks to display:', stocks.length, stocks.map(s => s.ticker).join(', '));

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DashboardClient initialData={stockData} stocks={stocks} />
    </Suspense>
  );
}
