import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Adding NIKE as test benchmark ticker ===\n');
  
  // Find or create BENCHMARK portfolio
  let benchmarkPortfolio = await prisma.portfolio.findFirst({
    where: { name: 'BENCHMARK' }
  });
  
  if (!benchmarkPortfolio) {
    console.log('Creating BENCHMARK portfolio...');
    benchmarkPortfolio = await prisma.portfolio.create({
      data: {
        name: 'BENCHMARK',
        description: 'Market benchmark indices and ETFs for comparison',
        isLocked: false,
      }
    });
    console.log('✅ Created BENCHMARK portfolio:', benchmarkPortfolio.id);
  } else {
    console.log('✅ BENCHMARK portfolio exists:', benchmarkPortfolio.id);
  }
  
  // Check if NIKE already exists
  let nikeStock = await prisma.stock.findFirst({
    where: { ticker: 'NKE' }
  });
  
  if (!nikeStock) {
    console.log('\nCreating NIKE stock...');
    nikeStock = await prisma.stock.create({
      data: {
        ticker: 'NKE',
        company: 'Nike Inc.',
        exchange: 'NYSE',
        currency: 'USD',
        portfolioId: benchmarkPortfolio.id,
        isActive: true,
      }
    });
    console.log('✅ Created NIKE stock:', nikeStock.ticker);
  } else {
    console.log('\n✅ NIKE stock exists, updating portfolio...');
    await prisma.stock.update({
      where: { id: nikeStock.id },
      data: {
        portfolioId: benchmarkPortfolio.id,
        isActive: true,
      }
    });
    console.log('✅ NIKE moved to BENCHMARK portfolio');
  }
  
  // Show all stocks in BENCHMARK portfolio
  const benchmarkStocks = await prisma.stock.findMany({
    where: {
      portfolioId: benchmarkPortfolio.id,
      isActive: true,
    },
    select: {
      ticker: true,
      company: true,
    }
  });
  
  console.log('\n📋 All active stocks in BENCHMARK portfolio:');
  benchmarkStocks.forEach(s => {
    console.log(`  ✓ ${s.ticker} - ${s.company}`);
  });
  
  console.log('\n✅ Done! Refresh your browser to see NIKE in the comparison dropdown.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
