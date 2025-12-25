import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMissingData() {
  try {
    const nvda = await prisma.stock.findUnique({
      where: { ticker: 'NVDA' },
      include: {
        stockData: true,
        metrics: {
          orderBy: { snapshotDate: 'desc' },
          take: 1,
        }
      }
    });

    console.log('=== NVDA Data Check ===\n');
    
    console.log('StockData.marketCap:', nvda?.stockData?.marketCap);
    
    if (nvda?.metrics?.[0]) {
      const metrics = nvda.metrics[0];
      console.log('\nMetrics (latest):');
      console.log('  marketCap:', metrics.marketCap);
      console.log('  beta:', metrics.beta);
      console.log('  sharesOutstanding:', metrics.sharesOutstanding);
      console.log('  snapshotDate:', metrics.snapshotDate);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMissingData();
