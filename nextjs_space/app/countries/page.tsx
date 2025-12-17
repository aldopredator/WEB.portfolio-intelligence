import { PageHeader } from '@/components/page-header';
import { getStockData, STOCK_CONFIG } from '@/lib/stock-data';
import { PrismaClient } from '@prisma/client';
import CountriesClient from './CountriesClient';

const prisma = new PrismaClient();

export const revalidate = 1800; // 30 minutes

interface CountriesPageProps {
  searchParams: { portfolio?: string; portfolio2?: string };
}

export default async function CountriesPage({ searchParams }: CountriesPageProps) {
  // Fetch portfolios for filter
  const portfolios = await prisma.portfolio.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  // Set defaults: BARCLAYS as portfolio 1, TO BUY as portfolio 2
  const barclaysPortfolio = portfolios.find(p => p.name === 'BARCLAYS');
  const toBuyPortfolio = portfolios.find(p => p.name === 'TO BUY');
  
  const portfolioId = searchParams.portfolio || barclaysPortfolio?.id || null;
  const portfolioId2 = searchParams.portfolio2 || toBuyPortfolio?.id || null;
  
  // Fetch ALL stock data (no portfolio filter at server level)
  const stockData = await getStockData(null);

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
    
    // Use country from company_profile, fallback to 'Unknown'
    const country = (companyProfile && typeof companyProfile === 'object' && 'country' in companyProfile 
      ? companyProfile.country 
      : 'Unknown') || 'Unknown';

    return {
      ticker: config.ticker,
      name: config.name,
      country: country,
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
        title="Country Matrix"
        description="Visual grouping of stocks by country"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <CountriesClient 
          allStocks={allStocks} 
          portfolios={portfolios}
          selectedPortfolioId={portfolioId}
          selectedPortfolioId2={portfolioId2}
        />
      </div>
    </main>
  );
}
