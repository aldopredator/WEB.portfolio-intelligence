/**
 * Query Historical Metrics
 * 
 * Helper script to query and export historical metrics data
 * for analysis, visualization, and ML model training.
 * 
 * Usage:
 *   npm run query-metrics -- --ticker AAPL --days 90
 *   npm run query-metrics -- --export metrics.csv
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

interface QueryOptions {
  ticker?: string;
  startDate?: Date;
  endDate?: Date;
  export?: string;
  limit?: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): QueryOptions {
  const args = process.argv.slice(2);
  const options: QueryOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--ticker':
        options.ticker = args[++i];
        break;
      case '--days':
        const days = parseInt(args[++i]);
        options.startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        break;
      case '--start':
        options.startDate = new Date(args[++i]);
        break;
      case '--end':
        options.endDate = new Date(args[++i]);
        break;
      case '--export':
        options.export = args[++i];
        break;
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
    }
  }

  return options;
}

/**
 * Format metrics data as CSV
 */
function formatAsCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Get all unique keys from the data
  const keys = Array.from(new Set(data.flatMap(row => Object.keys(row))));
  
  // Header row
  const csv = [keys.join(',')];
  
  // Data rows
  for (const row of data) {
    const values = keys.map(key => {
      const value = row[key];
      if (value === null || value === undefined) return '';
      if (value instanceof Date) return value.toISOString().split('T')[0];
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
      return value;
    });
    csv.push(values.join(','));
  }
  
  return csv.join('\n');
}

/**
 * Query metrics with filters
 */
async function queryMetrics(options: QueryOptions) {
  console.log('📊 Querying metrics with options:', options);
  
  const where: any = {};
  
  // Filter by ticker
  if (options.ticker) {
    const stock = await prisma.stock.findUnique({
      where: { ticker: options.ticker },
      select: { id: true }
    });
    
    if (!stock) {
      console.error(`❌ Ticker ${options.ticker} not found`);
      process.exit(1);
    }
    
    where.stockId = stock.id;
  }
  
  // Filter by date range
  if (options.startDate || options.endDate) {
    where.snapshotDate = {};
    if (options.startDate) where.snapshotDate.gte = options.startDate;
    if (options.endDate) where.snapshotDate.lte = options.endDate;
  }
  
  // Fetch metrics
  const metrics = await prisma.metrics.findMany({
    where,
    include: {
      stock: {
        select: {
          ticker: true,
          company: true,
        }
      }
    },
    orderBy: [
      { stock: { ticker: 'asc' } },
      { snapshotDate: 'desc' }
    ],
    take: options.limit,
  });
  
  console.log(`✅ Found ${metrics.length} snapshots\n`);
  
  return metrics;
}

/**
 * Display metrics statistics
 */
function displayStats(metrics: any[]) {
  if (metrics.length === 0) {
    console.log('No metrics found.');
    return;
  }
  
  // Group by ticker
  const byTicker = metrics.reduce((acc, m) => {
    const ticker = m.stock.ticker;
    if (!acc[ticker]) acc[ticker] = [];
    acc[ticker].push(m);
    return acc;
  }, {} as Record<string, any[]>);
  
  console.log('📈 Metrics Summary:\n');
  
  for (const [ticker, snapshots] of Object.entries(byTicker)) {
    console.log(`${ticker}:`);
    console.log(`  Total snapshots: ${snapshots.length}`);
    
    const dates = snapshots.map(s => s.snapshotDate);
    const minDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())));
    
    console.log(`  Date range: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
    
    // Calculate averages for key metrics
    const latest = snapshots[0];
    if (latest.peRatio) console.log(`  Latest P/E: ${latest.peRatio.toFixed(2)}`);
    if (latest.pbRatio) console.log(`  Latest P/B: ${latest.pbRatio.toFixed(2)}`);
    if (latest.roe) console.log(`  Latest ROE: ${latest.roe.toFixed(2)}%`);
    if (latest.marketCap) console.log(`  Latest Market Cap: $${(latest.marketCap / 1e9).toFixed(2)}B`);
    
    // Field completeness
    const fields = Object.keys(latest).filter(k => !['id', 'stockId', 'snapshotDate', 'createdAt', 'stock'].includes(k));
    const filled = fields.filter(k => latest[k] !== null && latest[k] !== undefined).length;
    const completeness = Math.round((filled / fields.length) * 100);
    console.log(`  Data completeness: ${filled}/${fields.length} (${completeness}%)`);
    
    console.log('');
  }
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();
  
  if (Object.keys(options).length === 0) {
    console.log(`
Usage:
  npm run query-metrics -- [options]

Options:
  --ticker TICKER     Filter by specific ticker (e.g., AAPL)
  --days N            Get metrics from last N days
  --start YYYY-MM-DD  Filter from start date
  --end YYYY-MM-DD    Filter to end date
  --limit N           Limit number of results
  --export FILE.csv   Export results to CSV file

Examples:
  # Get last 30 days for AAPL
  npm run query-metrics -- --ticker AAPL --days 30

  # Export all metrics to CSV
  npm run query-metrics -- --export metrics.csv

  # Get specific date range for multiple stocks
  npm run query-metrics -- --start 2025-01-01 --end 2025-12-31 --export q4_2025.csv

  # Get latest 100 snapshots
  npm run query-metrics -- --limit 100
    `);
    process.exit(0);
  }
  
  try {
    const metrics = await queryMetrics(options);
    
    if (options.export) {
      // Flatten data for CSV export
      const flatData = metrics.map(m => ({
        ticker: m.stock.ticker,
        company: m.stock.company,
        snapshotDate: m.snapshotDate,
        peRatio: m.peRatio,
        forwardPE: m.forwardPE,
        pbRatio: m.pbRatio,
        psRatio: m.psRatio,
        pegRatio: m.pegRatio,
        beta: m.beta,
        roe: m.roe,
        roa: m.roa,
        profitMargin: m.profitMargin,
        operatingMargin: m.operatingMargin,
        grossMargin: m.grossMargin,
        debtToEquity: m.debtToEquity,
        currentRatio: m.currentRatio,
        quickRatio: m.quickRatio,
        revenueGrowthQoQ: m.revenueGrowthQoQ,
        earningsGrowthQoQ: m.earningsGrowthQoQ,
        marketCap: m.marketCap,
        volume: m.volume,
        averageVolume: m.averageVolume,
        dividendYield: m.dividendYield,
        payoutRatio: m.payoutRatio,
        eps: m.eps,
      }));
      
      const csv = formatAsCSV(flatData);
      writeFileSync(options.export, csv);
      console.log(`✅ Exported ${flatData.length} rows to ${options.export}`);
    } else {
      displayStats(metrics);
    }
    
    // Show sample data
    if (metrics.length > 0 && !options.export) {
      console.log('\n📋 Sample Data (latest 3 snapshots):\n');
      for (const m of metrics.slice(0, 3)) {
        console.log(`${m.stock.ticker} (${m.snapshotDate.toISOString().split('T')[0]}):`);
        console.log(`  P/E: ${m.peRatio || 'N/A'}, P/B: ${m.pbRatio || 'N/A'}, ROE: ${m.roe || 'N/A'}%`);
        console.log(`  Market Cap: $${m.marketCap ? (m.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}`);
        console.log(`  Beta: ${m.beta || 'N/A'}, Debt/Equity: ${m.debtToEquity || 'N/A'}`);
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error querying metrics:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
