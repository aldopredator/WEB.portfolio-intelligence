import { PageHeader } from '@/components/page-header';
import { getStockData } from '@/lib/stock-data';
import { PrismaClient } from '@prisma/client';
import IndustriesClient from './IndustriesClient';

const prisma = new PrismaClient();

export const revalidate = 1800; // 30 minutes

interface IndustriesPageProps {
  searchParams: { portfolio?: string; portfolio2?: string };
}

export default async function IndustriesPage({ searchParams }: IndustriesPageProps) {
  // Fetch portfolios for the filter
  const portfolios = await prisma.portfolio.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  // Default to BARCLAYS portfolio if no portfolio specified
  let portfolioId = searchParams.portfolio || null;
  if (!portfolioId) {
    const barclaysPortfolio = portfolios.find(p => p.name === 'BARCLAYS');
    portfolioId = barclaysPortfolio?.id || null;
  }

  // Get second portfolio for combination (optional)
  const portfolioId2 = searchParams.portfolio2 || null;

  // Fetch stocks for the selected portfolio(s)
  const portfolioIds = [portfolioId, portfolioId2].filter(Boolean) as string[];
  
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
    
    // Use industry from company_profile.industry, fallback to 'N/A'
    const industry = (companyProfile && typeof companyProfile === 'object' && 'industry' in companyProfile 
      ? (companyProfile as any).industry
      : null) || 'N/A';
    
    // Get sector for grouping
    const sector = (companyProfile && typeof companyProfile === 'object' && 'sector' in companyProfile 
      ? (companyProfile as any).sector
      : null) || 'N/A';

    return {
      ticker: dbStock.ticker,
      name: dbStock.company,
      industry: industry,
      sector: sector,
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
        title="Industry Matrix"
        description="Visual grouping of stocks by industry classifications"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <IndustriesClient 
          allStocks={allStocks} 
          portfolios={portfolios}
          selectedPortfolioId={portfolioId}
          selectedPortfolioId2={portfolioId2}
        />
      </div>
    </main>
  );
}
