/**
 * Seed script to populate portfolios with stocks
 * Run with: npx tsx scripts/seed-portfolios.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting portfolio seeding...');

  // Create or update BARCLAYS portfolio
  const barclaysPortfolio = await prisma.portfolio.upsert({
    where: { name: 'BARCLAYS' },
    update: {},
    create: {
      name: 'BARCLAYS',
      description: 'Main investment portfolio',
    },
  });
  console.log('✅ Created/Updated BARCLAYS portfolio:', barclaysPortfolio.id);

  // Create or update Watchlist portfolio
  const watchlistPortfolio = await prisma.portfolio.upsert({
    where: { name: 'Watchlist' },
    update: {},
    create: {
      name: 'Watchlist',
      description: 'Stocks I am following closely',
    },
  });
  console.log('✅ Created/Updated Watchlist portfolio:', watchlistPortfolio.id);

  // BARCLAYS stocks
  const barclaysStocks = [
    { ticker: 'GOOG', company: 'Alphabet Inc. Class C', type: 'CS', exchange: 'NASDAQ' },
    { ticker: 'TSLA', company: 'Tesla, Inc.', type: 'CS', exchange: 'NASDAQ' },
    { ticker: 'NVDA', company: 'Nvidia Corp', type: 'CS', exchange: 'NASDAQ' },
    { ticker: 'AMZN', company: 'Amazon.com Inc', type: 'CS', exchange: 'NASDAQ' },
    { ticker: 'BRK-B', company: 'Berkshire Hathaway Inc. Class B', type: 'CS', exchange: 'NYSE' },
    { ticker: 'ISRG', company: 'Intuitive Surgical Inc.', type: 'CS', exchange: 'NASDAQ' },
    { ticker: 'NFLX', company: 'Netflix Inc', type: 'CS', exchange: 'NASDAQ' },
    { ticker: 'IDXX', company: 'Idexx Laboratories Inc', type: 'CS', exchange: 'NASDAQ' },
  ];

  // Watchlist stocks
  const watchlistStocks = [
    { ticker: 'III', company: 'Information Services Group, Inc.', type: 'CS', exchange: 'NASDAQ' },
    { ticker: 'PLTR', company: 'Palantir Technologies Inc.', type: 'CS', exchange: 'NASDAQ' },
    { ticker: 'QBTS', company: 'D-Wave Quantum Inc.', type: 'CS', exchange: 'NYSE' },
    { ticker: 'RGTI', company: 'Rigetti Computing, Inc.', type: 'CS', exchange: 'NASDAQ' },
  ];

  // Add BARCLAYS stocks
  console.log('\n📊 Adding stocks to BARCLAYS portfolio...');
  for (const stock of barclaysStocks) {
    const createdStock = await prisma.stock.upsert({
      where: { ticker: stock.ticker },
      update: { portfolioId: barclaysPortfolio.id },
      create: {
        ticker: stock.ticker,
        company: stock.company,
        type: stock.type,
        exchange: stock.exchange,
        portfolioId: barclaysPortfolio.id,
        isActive: true,
      },
    });
    console.log(`  ✓ ${stock.ticker} - ${stock.company}`);
  }

  // Add Watchlist stocks
  console.log('\n👀 Adding stocks to Watchlist portfolio...');
  for (const stock of watchlistStocks) {
    const createdStock = await prisma.stock.upsert({
      where: { ticker: stock.ticker },
      update: { portfolioId: watchlistPortfolio.id },
      create: {
        ticker: stock.ticker,
        company: stock.company,
        type: stock.type,
        exchange: stock.exchange,
        portfolioId: watchlistPortfolio.id,
        isActive: true,
      },
    });
    console.log(`  ✓ ${stock.ticker} - ${stock.company}`);
  }

  console.log('\n✅ Portfolio seeding completed successfully!');
  console.log(`\n📈 Summary:`);
  console.log(`   - BARCLAYS: ${barclaysStocks.length} stocks`);
  console.log(`   - Watchlist: ${watchlistStocks.length} stocks`);
}

main()
  .catch((error) => {
    console.error('❌ Error seeding portfolios:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
