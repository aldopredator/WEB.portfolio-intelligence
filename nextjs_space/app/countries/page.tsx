import { PageHeader } from '@/components/page-header';
import { getStockData } from '@/lib/stock-data';
import { PrismaClient } from '@prisma/client';
import CountriesClient from './CountriesClient';

const prisma = new PrismaClient();

export const revalidate = 1800; // 30 minutes

interface CountriesPageProps {
  searchParams: { portfolio?: string; portfolio2?: string };
}

export default async function CountriesPage({ searchParams }: CountriesPageProps) {
  // Fetch portfolios first to determine defaults
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
  
  // Build portfolio filter array with defaults applied
  const portfolioIds = [portfolioId, portfolioId2].filter(Boolean) as string[];
  
  // Fetch stocks filtered by the selected portfolios (with defaults)
  const dbStocks = await prisma.stock.findMany({
    where: { 
      isActive: true,
      ...(portfolioIds.length > 0 ? { portfolioId: { in: portfolioIds } } : {}),
    },
    select: {
      ticker: true,
      company: true,
      rating: true,
      portfolioId: true,
    },
  });
  
  // Fetch stock data for all tickers from database
  const stockData = await getStockData(null);

  await prisma.$disconnect();
  
  // Prepare all stocks with their data from database + JSON data
  const allStocks = dbStocks.map((dbStock) => {
    const data = stockData[dbStock.ticker];
    const stockInfo = data && typeof data === 'object' && 'stock_data' in data ? data.stock_data : null;
    const companyProfile = data && typeof data === 'object' && 'company_profile' in data ? data.company_profile : null;
    
    // Use country from company_profile, fallback to 'Unknown'
    const country = (companyProfile && typeof companyProfile === 'object' && 'country' in companyProfile 
      ? (companyProfile as any).country
      : null) || 'Unknown';

    return {
      ticker: dbStock.ticker,
      name: dbStock.company,
      country: country,
      marketCap: stockInfo?.market_cap,
      change: stockInfo?.change,
      changePercent: stockInfo?.change_percent,
      rating: dbStock.rating || 0,
      portfolioId: dbStock.portfolioId || null,
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
