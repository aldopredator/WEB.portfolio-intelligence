import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Checking BENCHMARK Portfolio Setup ===\n');
  
  // Find or create BENCHMARK portfolio
  let benchmarkPortfolio = await prisma.portfolio.findFirst({
    where: { name: 'BENCHMARK' }
  });
  
  if (!benchmarkPortfolio) {
    console.log('❌ BENCHMARK portfolio does not exist. Creating it...');
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
  
  // Find CW8U.PA
  const cw8Stock = await prisma.stock.findFirst({
    where: { ticker: 'CW8U.PA' },
    include: { portfolio: true }
  });
  
  if (cw8Stock) {
    console.log('\n📊 CW8U.PA Stock:');
    console.log('  - Ticker:', cw8Stock.ticker);
    console.log('  - Company:', cw8Stock.company);
    console.log('  - isActive:', cw8Stock.isActive);
    console.log('  - Current Portfolio:', cw8Stock.portfolio?.name || 'None');
    
    if (cw8Stock.portfolioId !== benchmarkPortfolio.id) {
      console.log('\n🔄 Moving CW8U.PA to BENCHMARK portfolio...');
      await prisma.stock.update({
        where: { id: cw8Stock.id },
        data: {
          portfolioId: benchmarkPortfolio.id,
          isActive: true,
        }
      });
      console.log('✅ CW8U.PA moved to BENCHMARK portfolio');
    } else {
      console.log('✅ CW8U.PA is already in BENCHMARK portfolio');
    }
  } else {
    console.log('\n❌ CW8U.PA not found in database');
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
  if (benchmarkStocks.length === 0) {
    console.log('  (none)');
  } else {
    benchmarkStocks.forEach(s => {
      console.log(`  - ${s.ticker} (${s.company})`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
