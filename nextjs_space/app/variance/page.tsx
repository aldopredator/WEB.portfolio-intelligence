import { PrismaClient } from '@prisma/client';
import VarianceMatrix from './VarianceMatrix';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface VariancePageProps {
  searchParams: { portfolio?: string };
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

  // Fetch stocks for the selected portfolio (or all if no portfolio selected)
  const stocks = await prisma.stock.findMany({
    where: {
      isActive: true,
      ...(portfolioId ? { portfolioId } : {}),
    },
    include: {
      priceHistory: {
        orderBy: { date: 'desc' },
        take: 90, // Last 90 days for variance calculation
      },
    },
  });

  await prisma.$disconnect();

  // Prepare data for variance calculation
  const stockData = stocks.map(stock => ({
    ticker: stock.ticker,
    company: stock.company,
    prices: stock.priceHistory
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(ph => ph.price),
  }));

  return (
    <VarianceMatrix 
      stocks={stockData}
      portfolios={portfolios}
      selectedPortfolioId={portfolioId}
    />
  );
}
