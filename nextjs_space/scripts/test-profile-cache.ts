import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testProfileCache() {
  try {
    // Find NVDA stock
    const stock = await prisma.stock.findFirst({
      where: { ticker: 'NVDA' },
    });

    if (!stock) {
      console.log('❌ NVDA stock not found');
      return;
    }

    console.log('📊 NVDA Stock ID:', stock.id);
    console.log('🏢 Current Profile Data:');
    console.log('  - Industry:', stock.industry || '(empty)');
    console.log('  - Sector:', stock.sector || '(empty)');
    console.log('  - Country:', stock.country || '(empty)');
    console.log('  - Description:', stock.description ? `${stock.description.substring(0, 100)}...` : '(empty)');
    console.log('  - Website:', stock.website || '(empty)');
    console.log('  - Employees:', stock.employees || '(empty)');
    console.log('  - Logo URL:', stock.logoUrl || '(empty)');

    // Delete today's metrics to force repopulation
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const deleted = await prisma.metrics.deleteMany({
      where: {
        stockId: stock.id,
        snapshotDate: today,
      },
    });

    console.log(`\n✅ Deleted ${deleted.count} metrics records for NVDA today`);
    console.log('👉 Now run: npx tsx --require dotenv/config scripts/populate-metrics.ts');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProfileCache();
