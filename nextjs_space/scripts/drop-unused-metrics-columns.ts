/**
 * Drop unused columns from Metrics table
 * REQUIRES: DIRECT_DATABASE_URL environment variable (not Prisma Accelerate proxy)
 */

import { PrismaClient } from '@prisma/client';

// Use direct database URL if available, otherwise use default
const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found. Set DIRECT_DATABASE_URL or PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL');
  process.exit(1);
}

if (databaseUrl.startsWith('prisma+postgres://')) {
  console.error('❌ ERROR: Cannot use Prisma Accelerate URL for schema changes!');
  console.error('   Prisma Accelerate is a read-only proxy.');
  console.error('\n📝 To fix this:');
  console.error('   1. Go to your Prisma Console (https://console.prisma.io)');
  console.error('   2. Find your project');
  console.error('   3. Look for "Connection Details" or "Direct Database URL"');
  console.error('   4. Copy the PostgreSQL connection string (starts with postgresql://)');
  console.error('   5. Add to .env file: DIRECT_DATABASE_URL=postgresql://...');
  console.error('\n   Example format:');
  console.error('   DIRECT_DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public');
  process.exit(1);
}

console.log('✅ Using direct database connection');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function dropUnusedColumns() {
  console.log('🗑️  Dropping unused columns from Metrics table...\n');
  
  try {
    const columns = [
      'bookValuePerShare',
      'currentRatio',
      'dividendYield',
      'earningsGrowthYoY',
      'eps',
      'grossMargin',
      'operatingMargin',
      'payoutRatio',
      'pegRatio',
      'quickRatio',
      'revenueGrowthYoY',
      'volume',
      'week52Return',
      'ytdReturn'
    ];
    
    for (const column of columns) {
      console.log(`  ❌ Dropping column: ${column}`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "${column}"`);
    }
    
    console.log('\n✅ All unused columns dropped successfully!');
    
    // Verify
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Metrics'
      ORDER BY ordinal_position;
    `;
    
    console.log(`\n📊 Remaining columns: ${result.length}`);
    result.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name}`);
    });
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'P2010' && error.meta?.code === '42501') {
      console.error('\n💡 The database user does not have permission to alter tables.');
      console.error('   You need to run this SQL manually in your database admin panel:');
      console.error('   See: scripts/drop-unused-metrics-columns.sql');
    }
  } finally {
    await prisma.$disconnect();
  }
}

dropUnusedColumns();
