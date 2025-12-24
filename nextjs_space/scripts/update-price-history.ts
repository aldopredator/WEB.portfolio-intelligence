/**
 * Update PriceHistory table with latest 90 days of price data for all active stocks
 * Run with: npx tsx --require dotenv/config scripts/update-price-history.ts
 */

import { PrismaClient } from '@prisma/client';
import { fetchYahooPriceHistory } from '../lib/yahoo-finance';

const prisma = new PrismaClient();

async function updatePriceHistory() {
  try {
    console.log('🔄 Fetching active stocks from database...\n');
    
    const stocks = await prisma.stock.findMany({
      where: { isActive: true },
      select: { id: true, ticker: true }
    });

    console.log(`Found ${stocks.length} active stocks\n`);

    for (const stock of stocks) {
      console.log(`📊 Updating ${stock.ticker}...`);
      
      try {
        // Fetch 90 days of price history from Yahoo Finance
        const priceHistory = await fetchYahooPriceHistory(stock.ticker);
        
        if (priceHistory && priceHistory.length > 0) {
          // Delete existing price history for this stock (we'll replace with fresh data)
          await prisma.priceHistory.deleteMany({
            where: { stockId: stock.id }
          });

          // Insert new price history records
          const records = priceHistory.map((item: any) => ({
            stockId: stock.id,
            date: new Date(item.Date),
            price: item.Close,
            volume: null, // Yahoo API doesn't return volume in our current implementation
          }));

          await prisma.priceHistory.createMany({
            data: records,
            skipDuplicates: true
          });

          console.log(`   ✅ Added ${records.length} data points`);
        } else {
          console.log(`   ⚠️  No data returned`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ Price history update complete!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updatePriceHistory();
