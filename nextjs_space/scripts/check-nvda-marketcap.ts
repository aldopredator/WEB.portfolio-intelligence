import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNVDA() {
  try {
    const stockData = await prisma.stockData.findFirst({
      where: { stock: { ticker: 'NVDA' } },
      select: {
        marketCap: true,
        currentPrice: true,
        volume: true,
      },
    });

    const metrics = await prisma.metrics.findFirst({
      where: { stock: { ticker: 'NVDA' } },
      orderBy: { snapshotDate: 'desc' },
      select: {
        marketCap: true,
        volume: true,
        snapshotDate: true,
      },
    });

    console.log('NVDA StockData.marketCap:', stockData?.marketCap);
    console.log('NVDA Metrics.marketCap:', metrics?.marketCap);
    console.log('NVDA Metrics snapshot date:', metrics?.snapshotDate);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNVDA();
