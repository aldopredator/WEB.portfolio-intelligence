/**
 * Clear all existing metrics and repopulate with corrected field mapping
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAndRepopulate() {
  try {
    console.log('🗑️  Deleting all existing metrics...');
    const deleted = await prisma.metrics.deleteMany({});
    console.log(`✅ Deleted ${deleted.count} metrics records`);
    
    console.log('\n🔄 Now run: npm run populate-metrics');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAndRepopulate();
