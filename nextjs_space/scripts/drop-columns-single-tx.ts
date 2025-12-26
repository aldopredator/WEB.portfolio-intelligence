/**
 * Drop unused columns from Metrics table - Single transaction version
 */

import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL;

if (!databaseUrl || databaseUrl.startsWith('prisma+postgres://')) {
  console.error('❌ Need DIRECT_DATABASE_URL in .env file');
  process.exit(1);
}

console.log('✅ Using direct database connection\n');

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

async function dropUnusedColumns() {
  console.log('🗑️  Dropping unused columns from Metrics table...\n');
  
  try {
    // Drop all columns in a single SQL statement
    const sql = `
      ALTER TABLE "Metrics" 
      DROP COLUMN IF EXISTS "bookValuePerShare",
      DROP COLUMN IF EXISTS "currentRatio",
      DROP COLUMN IF EXISTS "dividendYield",
      DROP COLUMN IF EXISTS "earningsGrowthYoY",
      DROP COLUMN IF EXISTS "eps",
      DROP COLUMN IF EXISTS "grossMargin",
      DROP COLUMN IF EXISTS "operatingMargin",
      DROP COLUMN IF EXISTS "payoutRatio",
      DROP COLUMN IF EXISTS "pegRatio",
      DROP COLUMN IF EXISTS "quickRatio",
      DROP COLUMN IF EXISTS "revenueGrowthYoY",
      DROP COLUMN IF EXISTS "volume",
      DROP COLUMN IF EXISTS "week52Return",
      DROP COLUMN IF EXISTS "ytdReturn";
    `;
    
    console.log('Executing SQL...');
    await prisma.$executeRawUnsafe(sql);
    
    console.log('✅ All 14 unused columns dropped successfully!\n');
    
    // Verify
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Metrics'
      ORDER BY ordinal_position;
    `;
    
    console.log(`📊 Remaining columns: ${result.length}`);
    result.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name}`);
    });
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

dropUnusedColumns();
