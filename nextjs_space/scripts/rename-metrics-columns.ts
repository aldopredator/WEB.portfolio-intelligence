/**
 * Rename unused metrics columns to UDF fields
 */

import { Client } from 'pg';

const databaseUrl = process.env.DIRECT_DATABASE_URL;

if (!databaseUrl || databaseUrl.startsWith('prisma+postgres://')) {
  console.error('❌ Need DIRECT_DATABASE_URL in .env file');
  process.exit(1);
}

console.log('✅ Using direct database connection\n');

async function renameColumns() {
  const client = new Client({ 
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');
    console.log('🔄 Renaming columns in Metrics table...\n');
    
    const renames = [
      { from: 'bookValuePerShare', to: 'udf1' },
      { from: 'currentRatio', to: 'udf2' },
      { from: 'dividendYield', to: 'udf3' },
      { from: 'earningsGrowthYoY', to: 'udf4' },
      { from: 'eps', to: 'udf5' },
      { from: 'grossMargin', to: 'udf6' },
      { from: 'operatingMargin', to: 'udf7' },
      { from: 'payoutRatio', to: 'udf8' },
      { from: 'pegRatio', to: 'udf9' },
      { from: 'revenueGrowthYoY', to: 'udf10' },
      { from: 'volume', to: 'udf11' },
      { from: 'week52Return', to: 'udf12' },
      { from: 'ytdReturn', to: 'udf13' },
    ];
    
    for (const { from, to } of renames) {
      console.log(`  ${from} → ${to}`);
      await client.query(`ALTER TABLE "Metrics" RENAME COLUMN "${from}" TO "${to}";`);
    }
    
    console.log('\n⚠️  Note: quickRatio was skipped (duplicate udf9 in your mapping)');
    console.log('✅ All columns renamed successfully!\n');
    
    // Verify
    const result = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Metrics'
      ORDER BY ordinal_position;
    `);
    
    console.log(`📊 Total columns: ${result.rows.length}`);
    const udfColumns = result.rows.filter(r => r.column_name.startsWith('udf'));
    console.log(`📝 UDF columns: ${udfColumns.length}`);
    udfColumns.forEach((col) => {
      console.log(`  - ${col.column_name}`);
    });
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Database connection timed out.');
      console.error('   Run this SQL manually in your database admin panel:');
      console.error('   See: scripts/rename-metrics-columns.sql');
    }
  } finally {
    await client.end();
  }
}

renameColumns();
