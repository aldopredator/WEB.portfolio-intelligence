import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function checkNVDAMetrics() {
  try {
    // Find NVDA stock
    const stock = await prisma.stock.findFirst({
      where: {
        ticker: 'NVDA',
      },
      include: {
        metrics: {
          orderBy: { snapshotDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!stock) {
      console.log('❌ NVDA stock not found');
      return;
    }

    console.log('✅ NVDA Stock ID:', stock.id);
    
    if (stock.metrics.length === 0) {
      console.log('❌ No metrics found for NVDA');
      return;
    }

    const metrics = stock.metrics[0];
    console.log('✅ Has metrics:', stock.metrics.length);
    console.log('floatShares:', metrics.floatShares);
    console.log('sharesOutstanding:', metrics.sharesOutstanding);
    console.log('averageVolume:', metrics.averageVolume);
    console.log('averageVolume10Day:', metrics.averageVolume10Day);
    console.log('roe:', metrics.roe);
    console.log('roa:', metrics.roa);
    console.log('snapshotDate:', metrics.snapshotDate);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNVDAMetrics();
