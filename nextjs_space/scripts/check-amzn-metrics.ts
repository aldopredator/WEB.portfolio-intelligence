import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAMZN() {
  const stock = await prisma.stock.findFirst({
    where: { ticker: 'AMZN' },
    include: {
      metrics: {
        orderBy: { snapshotDate: 'desc' },
        take: 1,
      },
    },
  });

  console.log('AMZN Stock ID:', stock?.id);
  console.log('Has metrics:', stock?.metrics.length);
  if (stock?.metrics[0]) {
    const m = stock.metrics[0];
    console.log('\nMetrics data:');
    console.log('  floatShares:', m.floatShares);
    console.log('  sharesOutstanding:', m.sharesOutstanding);
    console.log('  averageVolume:', m.averageVolume);
    console.log('  averageVolume10Day:', m.averageVolume10Day);
    console.log('  roe:', m.roe);
    console.log('  roa:', m.roa);
    console.log('  snapshotDate:', m.snapshotDate);
  }

  await prisma.$disconnect();
}

checkAMZN();
