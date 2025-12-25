/**
 * Daily Metrics Population Script
 * 
 * Fetches financial metrics from Finnhub, Polygon, and Yahoo Finance APIs
 * and stores daily snapshots in the Metrics table for historical analysis,
 * ML training, and multi-factor modeling.
 * 
 * Run daily via cron: npm run populate-metrics
 */

import { PrismaClient } from '@prisma/client';
import { fetchFinnhubMetrics, fetchCompanyProfile } from '../lib/finnhub-metrics';
import { fetchPolygonStockStats } from '../lib/polygon';

const prisma = new PrismaClient();

interface MetricsSnapshot {
  // Valuation metrics
  peRatio?: number;
  forwardPE?: number;
  pbRatio?: number;
  psRatio?: number;
  priceToBook?: number;
  evToRevenue?: number;
  evToEbitda?: number;
  pegRatio?: number;
  
  // Performance metrics
  beta?: number;
  ytdReturn?: number;
  week52Return?: number;
  
  // Financial health
  debtToEquity?: number;
  roe?: number;
  roa?: number;
  operatingMargin?: number;
  profitMargin?: number;
  grossMargin?: number;
  currentRatio?: number;
  quickRatio?: number;
  
  // Growth metrics
  revenueGrowthQoQ?: number;
  earningsGrowthQoQ?: number;
  revenueGrowthYoY?: number;
  earningsGrowthYoY?: number;
  
  // Market data
  marketCap?: number;
  volume?: number;
  averageVolume?: number;
  averageVolume10Day?: number;
  sharesOutstanding?: number;
  floatShares?: number;
  
  // Ownership
  heldByInsiders?: number;
  heldByInstitutions?: number;
  
  // Dividend metrics
  dividendYield?: number;
  payoutRatio?: number;
  
  // Per share metrics
  eps?: number;
  bookValuePerShare?: number;
}

/**
 * Fetch comprehensive metrics from all sources for a ticker
 */
async function fetchComprehensiveMetrics(ticker: string): Promise<MetricsSnapshot> {
  console.log(`  📊 Fetching metrics for ${ticker}...`);
  
  const snapshot: MetricsSnapshot = {};
  
  try {
    // Fetch from Finnhub (primary source for financial ratios)
    const finnhubData = await fetchFinnhubMetrics(ticker);
    if (finnhubData) {
      // Valuation metrics
      snapshot.peRatio = finnhubData.pe_ratio;
      snapshot.pbRatio = finnhubData.pb_ratio;
      snapshot.psRatio = finnhubData.ps_ratio;
      
      // Financial health
      snapshot.debtToEquity = finnhubData.debt_to_equity;
      snapshot.roe = finnhubData.roe;
      snapshot.roa = finnhubData.roa;
      snapshot.operatingMargin = finnhubData.operating_margin;
      snapshot.profitMargin = finnhubData.profit_margin;
      snapshot.grossMargin = finnhubData.gross_margin;
      snapshot.currentRatio = finnhubData.current_ratio;
      snapshot.quickRatio = finnhubData.quick_ratio;
      
      // Growth metrics
      snapshot.revenueGrowthQoQ = finnhubData.revenue_growth;
      snapshot.earningsGrowthQoQ = finnhubData.earnings_growth;
      
      // Dividend metrics
      snapshot.dividendYield = finnhubData.dividend_yield;
      snapshot.payoutRatio = finnhubData.payout_ratio;
      
      // Per share metrics
      snapshot.eps = finnhubData.eps;
      snapshot.bookValuePerShare = finnhubData.book_value_per_share;
      
      // Beta
      snapshot.beta = finnhubData.beta;
    }
  } catch (error) {
    console.error(`    ❌ Finnhub error for ${ticker}:`, error);
  }
  
  try {
    // Fetch from Polygon (market data and advanced metrics)
    const polygonData = await fetchPolygonStockStats(ticker);
    if (polygonData) {
      // Market data
      snapshot.averageVolume = polygonData.averageVolume;
      snapshot.averageVolume10Day = polygonData.averageVolume10Day;
      snapshot.sharesOutstanding = polygonData.sharesOutstanding;
      snapshot.floatShares = polygonData.floatShares;
      snapshot.volume = polygonData.dailyVolume;
      
      // Ownership metrics
      snapshot.heldByInsiders = polygonData.heldPercentInsiders;
      snapshot.heldByInstitutions = polygonData.heldPercentInstitutions;
      
      // Financial health metrics
      snapshot.roa = polygonData.returnOnAssets;
      snapshot.roe = polygonData.returnOnEquity;
      snapshot.profitMargin = polygonData.profitMargins;
      snapshot.debtToEquity = polygonData.debtToEquity;
      
      // Growth metrics
      snapshot.revenueGrowthQoQ = polygonData.quarterlyRevenueGrowth;
      snapshot.earningsGrowthQoQ = polygonData.quarterlyEarningsGrowth;
      
      // Valuation metrics
      snapshot.psRatio = polygonData.priceToSales;
      snapshot.peRatio = polygonData.trailingPE;
      snapshot.forwardPE = polygonData.forwardPE;
      snapshot.pegRatio = polygonData.pegRatio;
      snapshot.priceToBook = polygonData.priceToBook;
      snapshot.evToRevenue = polygonData.enterpriseToRevenue;
      snapshot.evToEbitda = polygonData.enterpriseToEbitda;
      
      // Override with Polygon data if Finnhub didn't provide it
      if (polygonData.trailingPE !== undefined && !snapshot.peRatio) snapshot.peRatio = polygonData.trailingPE;
      if (polygonData.priceToBook !== undefined && !snapshot.pbRatio) snapshot.pbRatio = polygonData.priceToBook;
    }
  } catch (error) {
    console.error(`    ❌ Polygon error for ${ticker}:`, error);
  }
  
  // Calculate data completeness
  const totalFields = Object.keys(snapshot).length;
  const filledFields = Object.values(snapshot).filter(v => v !== undefined && v !== null).length;
  const completeness = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  
  console.log(`    ✅ ${ticker}: ${filledFields}/${totalFields} fields (${completeness}% complete)`);
  
  return snapshot;
}

/**
 * Fetch and update company profile information
 */
async function updateCompanyProfile(stockId: string, ticker: string) {
  try {
    console.log(`  🏢 Fetching company profile for ${ticker}...`);
    
    // Fetch company profile from Yahoo Finance/Finnhub via fetchCompanyProfile
    const profile = await fetchCompanyProfile(ticker);
    
    if (profile) {
      // Update Stock record with company profile data
      await prisma.stock.update({
        where: { id: stockId },
        data: {
          sector: profile.sector || undefined,
          industry: profile.industry || undefined,
          country: profile.country || undefined,
          description: profile.description || undefined,
          website: profile.weburl || undefined,
          employees: profile.totalEmployees || undefined,
          logoUrl: profile.logo || undefined,
        },
      });
      
      console.log(`    ✅ ${ticker}: Profile updated`);
    } else {
      console.log(`    ⚠️  ${ticker}: No profile data available`);
    }
  } catch (error) {
    console.error(`    ⚠️  ${ticker}: Profile fetch failed:`, error);
  }
}

/**
 * Main function to populate metrics for all active stocks
 */
async function populateMetrics() {
  const startTime = Date.now();
  console.log('🚀 Starting daily metrics population...');
  console.log(`📅 Snapshot date: ${new Date().toISOString().split('T')[0]}`);
  
  try {
    // Get today's date (without time for consistent snapshots)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fetch all active stocks
    const stocks = await prisma.stock.findMany({
      where: { isActive: true },
      select: {
        id: true,
        ticker: true,
        company: true,
      },
      orderBy: { ticker: 'asc' },
    });
    
    console.log(`📊 Found ${stocks.length} active stocks to process`);
    
    if (stocks.length === 0) {
      console.log('⚠️  No active stocks found. Exiting.');
      return;
    }
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const stock of stocks) {
      try {
        // Check if metrics already exist for today
        const existing = await prisma.metrics.findUnique({
          where: {
            stockId_snapshotDate: {
              stockId: stock.id,
              snapshotDate: today,
            },
          },
        });
        
        // Update company profile (sector, industry, country) - runs once daily regardless of metrics
        await updateCompanyProfile(stock.id, stock.ticker);
        
        if (existing) {
          console.log(`⏭️  ${stock.ticker}: Metrics already exist for today, skipping metrics update...`);
          skipCount++;
          continue;
        }
        
        // Fetch comprehensive metrics
        const metrics = await fetchComprehensiveMetrics(stock.ticker);
        
        // Only create record if we have at least some data
        const hasData = Object.values(metrics).some(v => v !== undefined && v !== null);
        
        if (!hasData) {
          console.log(`  ⚠️  ${stock.ticker}: No metrics data available, skipping...`);
          skipCount++;
          continue;
        }
        
        // Store metrics snapshot
        await prisma.metrics.create({
          data: {
            stockId: stock.id,
            snapshotDate: today,
            ...metrics,
          },
        });
        
        successCount++;
        console.log(`  💾 ${stock.ticker}: Snapshot saved successfully`);
        
        // Rate limiting: wait 1 second between API calls to avoid hitting limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing ${stock.ticker}:`, error);
      }
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n✅ Metrics population completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Processed: ${stocks.length} stocks`);
    console.log(`   - Success: ${successCount} snapshots created`);
    console.log(`   - Skipped: ${skipCount} (already exist)`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Duration: ${duration}s`);
    
    // Calculate and display metrics history statistics
    const metricsCount = await prisma.metrics.count();
    const uniqueDates = await prisma.metrics.groupBy({
      by: ['snapshotDate'],
    });
    
    console.log(`\n📈 Historical Data:`);
    console.log(`   - Total snapshots: ${metricsCount}`);
    console.log(`   - Unique dates: ${uniqueDates.length}`);
    console.log(`   - Average per day: ${Math.round(metricsCount / Math.max(uniqueDates.length, 1))}`);
    
  } catch (error) {
    console.error('❌ Fatal error during metrics population:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateMetrics()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
