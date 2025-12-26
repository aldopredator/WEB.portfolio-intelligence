/**
 * Test populate-metrics for a single ticker
 */

import { PrismaClient } from '@prisma/client';
import { fetchFinnhubMetrics, fetchCompanyProfile } from '../lib/finnhub-metrics';
import { fetchPolygonStockStats } from '../lib/polygon';
import { fetchYahooStatistics, fetchYahooReturns } from '../lib/yahoo-finance';

const prisma = new PrismaClient();

async function testSingleTicker() {
  const ticker = 'AAPL';
  
  console.log(`🧪 Testing metrics population for ${ticker}...\n`);
  
  // Find stock
  const stock = await prisma.stock.findFirst({
    where: { ticker, isActive: true },
  });
  
  if (!stock) {
    console.log(`❌ Stock ${ticker} not found in database`);
    return;
  }
  
  console.log(`✅ Found stock: ${stock.company} (${stock.ticker})`);
  
  const snapshot: any = {};
  
  // Fetch from Finnhub
  console.log('\n📊 Fetching from Finnhub...');
  const finnhubData = await fetchFinnhubMetrics(ticker);
  if (finnhubData) {
    snapshot.peRatio = finnhubData.pe_ratio;
    snapshot.pbRatio = finnhubData.pb_ratio;
    snapshot.psRatio = finnhubData.ps_ratio;
    snapshot.pegRatio = finnhubData.pcf_ratio;
    snapshot.roe = finnhubData.roe;
    snapshot.roa = finnhubData.roa;
    snapshot.operatingMargin = finnhubData.operating_margin;
    snapshot.profitMargin = finnhubData.profit_margin;
    snapshot.grossMargin = finnhubData.gross_margin;
    snapshot.currentRatio = finnhubData.current_ratio;
    snapshot.quickRatio = finnhubData.quick_ratio;
    snapshot.debtToEquity = finnhubData.debt_to_equity;
    snapshot.revenueGrowthQoQ = finnhubData.revenue_growth;
    snapshot.earningsGrowthQoQ = finnhubData.earnings_growth;
    snapshot.dividendYield = finnhubData.dividend_yield;
    snapshot.payoutRatio = finnhubData.payout_ratio;
    snapshot.eps = finnhubData.eps;
    snapshot.bookValuePerShare = finnhubData.book_value_per_share;
    snapshot.beta = finnhubData.beta;
    snapshot.marketCap = finnhubData.market_cap;
    
    console.log('   ✅ Finnhub data fetched');
    console.log(`      - PE Ratio: ${snapshot.peRatio}`);
    console.log(`      - EPS: ${snapshot.eps}`);
    console.log(`      - Book Value/Share: ${snapshot.bookValuePerShare}`);
    console.log(`      - Current Ratio: ${snapshot.currentRatio}`);
    console.log(`      - Quick Ratio: ${snapshot.quickRatio}`);
    console.log(`      - Gross Margin: ${snapshot.grossMargin}%`);
    console.log(`      - Operating Margin: ${snapshot.operatingMargin}%`);
    console.log(`      - Dividend Yield: ${snapshot.dividendYield}%`);
    console.log(`      - Payout Ratio: ${snapshot.payoutRatio}%`);
  }
  
  // Fetch from Polygon
  console.log('\n📊 Fetching from Polygon...');
  const polygonData = await fetchPolygonStockStats(ticker);
  if (polygonData) {
    snapshot.volume = polygonData.dailyVolume;
    snapshot.averageVolume = polygonData.averageVolume;
    snapshot.averageVolume10Day = polygonData.averageVolume10Day;
    
    console.log('   ✅ Polygon data fetched');
    console.log(`      - Volume: ${snapshot.volume}`);
    console.log(`      - Avg Volume: ${snapshot.averageVolume}`);
  }
  
  // Fetch from Yahoo Finance
  console.log('\n📊 Fetching from Yahoo Finance...');
  const yahooData = await fetchYahooStatistics(ticker);
  if (yahooData) {
    if (!snapshot.pegRatio && yahooData.pegRatio) snapshot.pegRatio = yahooData.pegRatio;
    if (!snapshot.revenueGrowthQoQ && yahooData.quarterlyRevenueGrowth) snapshot.revenueGrowthQoQ = yahooData.quarterlyRevenueGrowth;
    if (!snapshot.earningsGrowthQoQ && yahooData.quarterlyEarningsGrowth) snapshot.earningsGrowthQoQ = yahooData.quarterlyEarningsGrowth;
    
    // Use QoQ as YoY fallback
    snapshot.revenueGrowthYoY = yahooData.quarterlyRevenueGrowth;
    snapshot.earningsGrowthYoY = yahooData.quarterlyEarningsGrowth;
    
    console.log('   ✅ Yahoo Finance data fetched');
    console.log(`      - PEG Ratio: ${snapshot.pegRatio}`);
    console.log(`      - Revenue Growth (QoQ→YoY): ${snapshot.revenueGrowthYoY}%`);
    console.log(`      - Earnings Growth (QoQ→YoY): ${snapshot.earningsGrowthYoY}%`);
  }
  
  // Fetch returns
  console.log('\n📊 Fetching returns from Yahoo Finance...');
  const returnsData = await fetchYahooReturns(ticker);
  if (returnsData) {
    snapshot.ytdReturn = returnsData.ytdReturn;
    snapshot.week52Return = returnsData.week52Return;
    
    console.log('   ✅ Returns data fetched');
    console.log(`      - YTD Return: ${snapshot.ytdReturn}%`);
    console.log(`      - 52-Week Return: ${snapshot.week52Return}%`);
  }
  
  // Show completeness
  console.log('\n📈 Metrics Completeness:');
  const targetFields = [
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
    'ytdReturn',
  ];
  
  targetFields.forEach(field => {
    const value = snapshot[field];
    const status = value !== undefined && value !== null ? '✅' : '❌';
    console.log(`   ${status} ${field}: ${value}`);
  });
  
  console.log('\n✅ Test completed!');
}

testSingleTicker()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    prisma.$disconnect();
    process.exit(1);
  });
