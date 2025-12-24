/**
 * Test Yahoo Finance data quality for CW8U.PA
 * Check if flat line exists in source data or is our DB issue
 */

import { fetchYahooPriceHistory } from '../lib/yahoo-finance';

async function testCW8UData() {
  console.log('🔍 Fetching CW8U.PA data from Yahoo Finance...\n');
  
  try {
    const priceHistory = await fetchYahooPriceHistory('CW8U.PA');
    
    if (!priceHistory || priceHistory.length === 0) {
      console.log('❌ No data returned');
      return;
    }

    console.log(`📊 Total records: ${priceHistory.length}\n`);

    // Check Sept 24 - Nov 13, 2024 period
    const sept24ToNov13 = priceHistory.filter((item: any) => {
      const d = new Date(item.Date);
      return d >= new Date('2024-09-24') && d <= new Date('2024-11-13');
    });

    console.log('--- Sept 24 - Nov 13, 2024 Period ---');
    console.log(`Records: ${sept24ToNov13.length}\n`);

    if (sept24ToNov13.length > 0) {
      console.log('First 5 records:');
      sept24ToNov13.slice(0, 5).forEach((item: any) => {
        console.log(`  ${item.Date}: $${item.Close}`);
      });

      console.log('\nLast 5 records:');
      sept24ToNov13.slice(-5).forEach((item: any) => {
        console.log(`  ${item.Date}: $${item.Close}`);
      });

      const uniquePrices = new Set(sept24ToNov13.map((item: any) => item.Close));
      console.log(`\nUnique prices: ${uniquePrices.size}`);
      console.log('Price values:', Array.from(uniquePrices));

      if (uniquePrices.size === 1) {
        console.log('\n⚠️  WARNING: All prices are identical in this period!');
        console.log('This is a Yahoo Finance data quality issue, not our DB.');
      } else {
        console.log('\n✅ Prices vary - data looks good from Yahoo');
      }
    }

    // Show some recent data
    console.log('\n--- Recent 10 Records ---');
    priceHistory.slice(-10).forEach((item: any) => {
      console.log(`  ${item.Date}: $${item.Close}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCW8UData();
