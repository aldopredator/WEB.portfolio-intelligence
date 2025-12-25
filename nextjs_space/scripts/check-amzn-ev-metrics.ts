import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkAMZNEVMetrics() {
  try {
    const stock = await prisma.stock.findFirst({
      where: { ticker: 'AMZN' },
      include: {
        metrics: {
          orderBy: { snapshotDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!stock) {
      console.log('❌ AMZN stock not found');
      return;
    }

    console.log('✅ AMZN Stock ID:', stock.id);
    
    if (stock.metrics.length === 0) {
      console.log('❌ No metrics found for AMZN');
      return;
    }

    const metrics = stock.metrics[0];
    console.log('\n📊 Enterprise Value Metrics:');
    console.log('evToRevenue:', metrics.evToRevenue);
    console.log('evToEbitda:', metrics.evToEbitda);
    
    console.log('\n📊 Other Valuation Metrics:');
    console.log('peRatio:', metrics.peRatio);
    console.log('pbRatio:', metrics.pbRatio);
    console.log('psRatio:', metrics.psRatio);
    console.log('forwardPE:', metrics.forwardPE);
    
    console.log('\n📊 Financial Health:');
    console.log('roe:', metrics.roe);
    console.log('roa:', metrics.roa);
    console.log('profitMargin:', metrics.profitMargin);
    console.log('operatingMargin:', metrics.operatingMargin);
    
    console.log('\nsnapshotDate:', metrics.snapshotDate);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAMZNEVMetrics();
