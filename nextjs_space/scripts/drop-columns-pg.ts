/**
 * Drop unused columns using native pg client
 */

import { Client } from 'pg';

const databaseUrl = process.env.DIRECT_DATABASE_URL;

if (!databaseUrl || databaseUrl.startsWith('prisma+postgres://')) {
  console.error('❌ Need DIRECT_DATABASE_URL in .env file');
  process.exit(1);
}

console.log('✅ Using direct database connection\n');

async function dropUnusedColumns() {
  const client = new Client({ 
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false } // Required for hosted databases
  });
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');
    console.log('🗑️  Dropping unused columns from Metrics table...\n');
    
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
    await client.query(sql);
    
    console.log('✅ All 14 unused columns dropped successfully!\n');
    
    // Verify
    const result = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Metrics'
      ORDER BY ordinal_position;
    `);
    
    console.log(`📊 Remaining columns: ${result.rows.length}`);
    result.rows.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name}`);
    });
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

dropUnusedColumns();
