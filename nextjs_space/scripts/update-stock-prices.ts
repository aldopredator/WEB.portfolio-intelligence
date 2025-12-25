/**
 * Update StockData table with current prices and 52-week ranges for all active stocks
 * Run with: npx tsx --require dotenv/config scripts/update-stock-prices.ts
 */

import { PrismaClient } from '@prisma/client';
import { fetchYahooQuote, fetchYahooStatistics } from '../lib/yahoo-finance';

const prisma = new PrismaClient();

async function updateStockPrices() {
  try {
    console.log('🔄 Fetching active stocks from database...\n');
    
    const stocks = await prisma.stock.findMany({
      where: { isActive: true },
      include: { stockData: true }
    });

    console.log(`Found ${stocks.length} active stocks\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const stock of stocks) {
      console.log(`📊 Updating ${stock.ticker}...`);
      
      try {
        // Fetch current quote from Yahoo Finance
        const quote = await fetchYahooQuote(stock.ticker);
        
        if (quote && quote.price !== undefined && quote.price !== null) {
          const currentPrice = quote.price;
          const change = quote.change || 0;
          const changePercent = quote.changePercent || 0;

          // Fetch statistics for 52-week high/low
          const stats = await fetchYahooStatistics(stock.ticker);
          const week52High = stats?.fiftyTwoWeekHigh || 0;
          const week52Low = stats?.fiftyTwoWeekLow || 0;

          // Update StockData
          if (stock.stockData) {
            await prisma.stockData.update({
              where: { id: stock.stockData.id },
              data: {
                currentPrice,
                change,
                changePercent,
                week52High,
                week52Low,
                lastUpdated: new Date(),
              }
            });
          } else {
            // Create if doesn't exist
            await prisma.stockData.create({
              data: {
                stockId: stock.id,
                currentPrice,
                change,
                changePercent,
                week52High,
                week52Low,
              }
            });
          }

          console.log(`   ✅ ${currentPrice} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%) | 52w: ${week52Low}-${week52High}`);
          successCount++;
        } else {
          console.log(`   ⚠️  No quote data returned`);
          errorCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n✅ Price update complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateStockPrices();
