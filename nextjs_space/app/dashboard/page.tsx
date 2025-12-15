import { Suspense } from 'react';
import type { StockInsightsData } from '@/lib/types';
import { getStockData, STOCK_CONFIG } from '@/lib/stock-data';
import { PrismaClient } from '@prisma/client';
import DashboardClient from './DashboardClient';

const prisma = new PrismaClient();

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
      ratingUpdatedAt: true,
      portfolioId: true,
      portfolio: {
        select: {
          isLocked: true,
        },
      },
    },
  });

  const stockRatings = dbStocks.reduce((acc, stock) => {
    acc[stock.ticker] = {
      rating: stock.rating || 0,
      notes: (stock as any).notes || '',
      ratingUpdatedAt: stock.ratingUpdatedAt,
      portfolioId: stock.portfolioId,
      isLocked: stock.portfolio?.isLocked || false,
    };
    return acc;
  }, {} as Record<string, { rating: number; notes: string; ratingUpdatedAt: Date | null; portfolioId: string | null; isLocked: boolean }>);

  console.log('[DashboardPage] 📊 Stock ratings with lock status:', JSON.stringify(
    Object.entries(stockRatings).map(([ticker, data]) => ({ 
      ticker, 
      portfolioId: data.portfolioId, 
      isLocked: data.isLocked 
    })), 
    null, 2
  ));

  await prisma.$disconnect();

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
      rating: stockRatings[ticker]?.rating || 0,
      notes: stockRatings[ticker]?.notes || '',
      ratingUpdatedAt: stockRatings[ticker]?.ratingUpdatedAt || null,
      portfolioId: stockRatings[ticker]?.portfolioId || null,
      isLocked: stockRatings[ticker]?.isLocked || false,
    };
  });
  
  console.log('[DashboardPage] 📊 Stocks to display:', stocks.length, stocks.map(s => s.ticker).join(', '));

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DashboardClient initialData={stockData} stocks={stocks} />
    </Suspense>
  );
}
