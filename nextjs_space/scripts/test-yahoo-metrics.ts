/**
 * Test script to verify Yahoo Finance metrics fetching
 */

import { fetchYahooStatistics, fetchYahooReturns } from '../lib/yahoo-finance';

async function testYahooMetrics() {
  const ticker = 'AAPL'; // Test with Apple
  
  console.log(`🧪 Testing Yahoo Finance metrics for ${ticker}...\n`);
  
  // Test statistics
  console.log('📊 Fetching Yahoo Statistics...');
  const stats = await fetchYahooStatistics(ticker);
  if (stats) {
    console.log('✅ Statistics fetched:');
    console.log(`   - Market Cap: ${stats.marketCap}`);
    console.log(`   - P/E Ratio: ${stats.trailingPE}`);
    console.log(`   - PEG Ratio: ${stats.pegRatio}`);
    console.log(`   - Beta: ${stats.beta}`);
    console.log(`   - EPS: N/A (not in statistics)`);
    console.log(`   - Book Value Per Share: N/A (not in statistics)`);
    console.log(`   - Current Ratio: N/A (not in statistics)`);
    console.log(`   - Quick Ratio: N/A (not in statistics)`);
    console.log(`   - Gross Margin: N/A (not in statistics)`);
    console.log(`   - Operating Margin: N/A (not in statistics)`);
    console.log(`   - Profit Margins: ${stats.profitMargins}`);
    console.log(`   - Dividend Yield: N/A (not in statistics)`);
    console.log(`   - Payout Ratio: N/A (not in statistics)`);
    console.log(`   - ROE: ${stats.returnOnEquity}`);
    console.log(`   - ROA: ${stats.returnOnAssets}`);
    console.log(`   - Quarterly Revenue Growth: ${stats.quarterlyRevenueGrowth}`);
    console.log(`   - Quarterly Earnings Growth: ${stats.quarterlyEarningsGrowth}`);
    console.log(`   - Volume: N/A (not in statistics)`);
  } else {
    console.log('❌ Failed to fetch statistics');
  }
  
  // Test returns
  console.log('\n📈 Fetching Yahoo Returns...');
  const returns = await fetchYahooReturns(ticker);
  if (returns) {
    console.log('✅ Returns fetched:');
    console.log(`   - YTD Return: ${returns.ytdReturn}%`);
    console.log(`   - 52-Week Return: ${returns.week52Return}%`);
  } else {
    console.log('❌ Failed to fetch returns');
  }
  
  console.log('\n✅ Test completed!');
  console.log('\n📝 Summary:');
  console.log('   Yahoo Finance provides:');
  console.log('   ✅ pegRatio');
  console.log('   ✅ ytdReturn');
  console.log('   ✅ week52Return');
  console.log('   ✅ Quarterly growth (can be used as YoY fallback)');
  console.log('   ❌ EPS (available in Finnhub)');
  console.log('   ❌ Book Value Per Share (available in Finnhub)');
  console.log('   ❌ Current/Quick Ratio (available in Finnhub)');
  console.log('   ❌ Gross/Operating Margin (available in Finnhub)');
  console.log('   ❌ Dividend Yield/Payout (available in Finnhub)');
}

testYahooMetrics()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
