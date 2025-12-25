import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteToday() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`🗑️  Deleting metrics from ${today.toISOString()}...`);
    
    const result = await prisma.metrics.deleteMany({
      where: {
        snapshotDate: {
          gte: today
        }
      }
    });
    
    console.log(`✅ Deleted ${result.count} metric records`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteToday();
