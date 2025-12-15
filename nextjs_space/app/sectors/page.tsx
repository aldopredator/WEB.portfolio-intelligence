import { PageHeader } from '@/components/page-header';
import { getStockData, STOCK_CONFIG } from '@/lib/stock-data';
import { PrismaClient } from '@prisma/client';
import SectorsClient from './SectorsClient';

const prisma = new PrismaClient();

export const revalidate = 1800; // 30 minutes

interface SectorsPageProps {
  searchParams: { portfolio?: string };
}

export default async function SectorsPage({ searchParams }: SectorsPageProps) {
  const portfolioId = searchParams.portfolio || null;
  
  // Fetch real stock data
  const stockData = await getStockData(portfolioId);
  
  // Fetch portfolios for filter
  const portfolios = await prisma.portfolio.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  // Fetch stock ratings from database
  const dbStocks = await prisma.stock.findMany({
    where: { 
      isActive: true,
      ...(portfolioId ? { portfolioId } : {}),
    },
    select: {
      ticker: true,
      rating: true,
      portfolioId: true,
    },
  });

  const stockRatings = dbStocks.reduce((acc, stock) => {
    acc[stock.ticker] = {
      rating: stock.rating || 0,
      portfolioId: stock.portfolioId,
    };
    return acc;
  }, {} as Record<string, { rating: number; portfolioId: string | null }>);

  await prisma.$disconnect();
  
  // Prepare all stocks with their data
  const allStocks = STOCK_CONFIG.filter(config => {
    // If portfolio filter is active, only include stocks from that portfolio
    if (portfolioId) {
      return stockRatings[config.ticker]?.portfolioId === portfolioId;
    }
    return true;
  }).map((config) => {
    const data = stockData[config.ticker];
    const stockInfo = data && typeof data === 'object' && 'stock_data' in data ? data.stock_data : null;
    const companyProfile = data && typeof data === 'object' && 'company_profile' in data ? data.company_profile : null;
    
    // Use industry from company_profile, fallback to sector from config, then 'Other'
    const industry = (companyProfile && typeof companyProfile === 'object' && 'industry' in companyProfile 
      ? companyProfile.industry 
      : config.sector) || 'Other';

    return {
      ticker: config.ticker,
      name: config.name,
      sector: industry,
      marketCap: stockInfo?.market_cap,
      change: stockInfo?.change,
      changePercent: stockInfo?.change_percent,
      rating: stockRatings[config.ticker]?.rating || 0,
      portfolioId: stockRatings[config.ticker]?.portfolioId || null,
    };
  });

  return (
    <main className="min-h-screen">
      <PageHeader
        title="Sector Matrix"
        description="Visual grouping of stocks by industry sectors"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <SectorsClient 
          allStocks={allStocks} 
          portfolios={portfolios}
          selectedPortfolioId={portfolioId}
        />
      </div>
    </main>
  );
}
