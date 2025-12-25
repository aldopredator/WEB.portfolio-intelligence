/**
 * Test updating a single stock (AAL) to verify the update process works
 */

import { PrismaClient } from '@prisma/client';
import { fetchYahooQuote } from '../lib/yahoo-finance';

const prisma = new PrismaClient();

async function updateAALPrice() {
  try {
    console.log('🔄 Fetching AAL stock from database...\n');
    
    const stock = await prisma.stock.findUnique({
      where: { ticker: 'AAL' },
      include: { stockData: true }
    });

    if (!stock) {
      console.log('❌ AAL not found in database');
      return;
    }

    console.log(`📊 Updating ${stock.ticker}...`);
    console.log(`   Current StockData: Price=$${stock.stockData?.currentPrice}, Change=${stock.stockData?.changePercent}%\n`);
    
    // Fetch current quote from Yahoo Finance
    const quote = await fetchYahooQuote(stock.ticker);
    
    if (quote && quote.current_price !== undefined && quote.current_price !== null && quote.current_price > 0) {
      const currentPrice = quote.current_price;
      const change = quote.change || 0;
      const changePercent = quote.change_percent || 0;
      const week52High = quote['52_week_high'] || 0;
      const week52Low = quote['52_week_low'] || 0;

      console.log(`   New data from Yahoo Finance:`);
      console.log(`     Price: $${currentPrice}`);
      console.log(`     Change: $${change} (${changePercent.toFixed(2)}%)`);
      console.log(`     52w Range: $${week52Low} - $${week52High}\n`);

      // Update StockData
      if (stock.stockData) {
        const updated = await prisma.stockData.update({
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
        console.log(`✅ Updated StockData successfully!`);
        console.log(`   New values: Price=$${updated.currentPrice}, Change=${updated.changePercent}%`);
      } else {
        // Create if doesn't exist
        const created = await prisma.stockData.create({
          data: {
            stockId: stock.id,
            currentPrice,
            change,
            changePercent,
            week52High,
            week52Low,
          }
        });
        console.log(`✅ Created StockData successfully!`);
      }
    } else {
      console.log(`   ⚠️  No valid quote data returned`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateAALPrice();
