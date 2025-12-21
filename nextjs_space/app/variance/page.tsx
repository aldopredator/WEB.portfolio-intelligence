import { PrismaClient } from '@prisma/client';
import VarianceMatrix from './VarianceMatrix';
import { getStockData } from '@/lib/stock-data';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface VariancePageProps {
  searchParams: { portfolio?: string; portfolio2?: string };
}

export default async function VariancePage({ searchParams }: VariancePageProps) {
  // Fetch portfolios for the filter
  const portfolios = await prisma.portfolio.findMany({
    orderBy: { name: 'asc' },
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
  
  const stocks = await prisma.stock.findMany({
    where: {
      isActive: true,
      ...(portfolioIds.length > 0 ? { portfolioId: { in: portfolioIds } } : {}),
    },
    select: {
      ticker: true,
      company: true,
      portfolioId: true,
      rating: true,
      priceHistory: {
        orderBy: { date: 'desc' },
        take: 90,
      },
    },
  });

  // Fetch stock data for all tickers to get sector information
  const stockData = await getStockData(null);

  await prisma.$disconnect();

  // Prepare data for variance calculation
  const stockDataMap = stocks.map(stock => {
    const portfolio = portfolios.find(p => p.id === stock.portfolioId);
    const data = stockData[stock.ticker];
    const companyProfile = data && typeof data === 'object' && 'company_profile' in data ? data.company_profile : null;
    
    // Extract sector from company_profile
    const sector = (companyProfile && typeof companyProfile === 'object' && 'sector' in companyProfile 
      ? (companyProfile as any).sector
      : null) || 'N/A';
    
    return {
      ticker: stock.ticker,
      company: stock.company,
      prices: stock.priceHistory
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(ph => ph.price),
      portfolioId: stock.portfolioId,
      portfolioName: portfolio?.name,
      sector: sector,
      rating: stock.rating || 0,
    };
  });

  return (
    <VarianceMatrix 
      stocks={stockDataMap}
      portfolios={portfolios}
      selectedPortfolioId={portfolioId}
      selectedPortfolioId2={portfolioId2}
    />
  );
}
