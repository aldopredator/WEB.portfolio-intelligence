import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLogos() {
  try {
    const stocks = await prisma.stock.findMany({
      where: { ticker: { in: ['NVDA', 'AAL', 'AMZN'] } },
      select: {
        ticker: true,
        logoUrl: true,
      },
    });

    console.log('Logo URLs:');
    stocks.forEach(stock => {
      console.log(`${stock.ticker}: ${stock.logoUrl || 'NULL'}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogos();
