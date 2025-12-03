import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding tickers...');

  // Existing portfolio tickers
  const portfolioTickers = [
    { symbol: 'GOOG', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc. Class B', exchange: 'NYSE', type: 'Equity' },
    { symbol: 'ISRG', name: 'Intuitive Surgical Inc.', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'IDXX', name: 'IDEXX Laboratories Inc.', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'III', name: '3i Group plc', exchange: 'LSE', type: 'Equity' },
    { symbol: 'PLTR', name: 'Palantir Technologies Inc.', exchange: 'NYSE', type: 'Equity' },
    { symbol: 'QBTS', name: 'D-Wave Quantum Inc.', exchange: 'NYSE', type: 'Equity' },
    { symbol: 'RGTI', name: 'Rigetti Computing Inc.', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', exchange: 'NASDAQ', type: 'Equity' },
  ];

  for (const ticker of portfolioTickers) {
    await prisma.ticker.upsert({
      where: { symbol: ticker.symbol },
      update: {},
      create: {
        ...ticker,
        category: 'portfolio',
      },
    });
    console.log(`✅ ${ticker.symbol} added to portfolio`);
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
