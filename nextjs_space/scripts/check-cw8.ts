import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for CW8 tickers in database...\n');
  
  const cw8Stocks = await prisma.stock.findMany({
    where: {
      ticker: {
        contains: 'CW8',
      },
    },
    include: {
      portfolio: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  console.log(`Found ${cw8Stocks.length} CW8 stock(s):`);
  cw8Stocks.forEach(stock => {
    console.log(`- Ticker: ${stock.ticker}`);
    console.log(`  Company: ${stock.company}`);
    console.log(`  isActive: ${stock.isActive}`);
    console.log(`  Portfolio: ${stock.portfolio?.name || 'No Portfolio'}`);
    console.log(`  Portfolio ID: ${stock.portfolioId || 'null'}`);
    console.log('');
  });

  console.log('\nAll active stocks:');
  const allStocks = await prisma.stock.findMany({
    where: {
      isActive: true,
    },
    select: {
      ticker: true,
      company: true,
      portfolioId: true,
    },
  });
  console.log(`Total active stocks: ${allStocks.length}`);
  console.log(`Tickers: ${allStocks.map(s => s.ticker).sort().join(', ')}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
