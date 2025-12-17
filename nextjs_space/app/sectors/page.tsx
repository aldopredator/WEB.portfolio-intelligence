import { PageHeader } from '@/components/page-header';
import { getStockData, STOCK_CONFIG } from '@/lib/stock-data';
import { PrismaClient } from '@prisma/client';
import SectorsClient from './SectorsClient';

const prisma = new PrismaClient();

export const revalidate = 1800; // 30 minutes

interface SectorsPageProps {
  searchParams: { portfolio?: string; portfolio2?: string };
}

export default async function SectorsPage({ searchParams }: SectorsPageProps) {
  const portfolioId = searchParams.portfolio || null;
  const portfolioId2 = searchParams.portfolio2 || null;
  
  // Fetch ALL stock data (no portfolio filter at server level)
  const stockData = await getStockData(null);
  
  // Fetch portfolios for filter
  const portfolios = await prisma.portfolio.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  // Fetch ALL stock ratings from database (combined portfolio filter if specified)
  const portfolioIds = [portfolioId, portfolioId2].filter(Boolean) as string[];
  const dbStocks = await prisma.stock.findMany({
    where: { 
      isActive: true,
      ...(portfolioIds.length > 0 ? { portfolioId: { in: portfolioIds } } : {}),
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
  
  // Prepare all stocks with their data (no filtering - client will handle it)
  const allStocks = STOCK_CONFIG.map((config) => {
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
          selectedPortfolioId2={portfolioId2}
        />
      </div>
    </main>
  );
}
