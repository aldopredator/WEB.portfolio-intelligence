/**
 * Check actual database columns in Metrics table
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseColumns() {
  try {
    // Query the database schema directly
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Metrics'
      ORDER BY ordinal_position;
    `;
    
    console.log('📊 Database columns in Metrics table:\n');
    result.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });
    
    console.log(`\n✅ Total columns: ${result.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseColumns();
