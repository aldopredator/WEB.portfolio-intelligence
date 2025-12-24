#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import { fetchYahooPriceHistory } from '../lib/yahoo-finance';

const prisma = new PrismaClient();

async function testUpdatePrices() {
  try {
    console.log('Testing price history update...\n');
    
    // Get a single stock for testing
    const stock = await prisma.stock.findFirst({
      where: { isActive: true },
      select: { id: true, ticker: true }
    });

    if (!stock) {
      console.log('No active stocks found in database');
      return;
    }

    console.log(`Testing with stock: ${stock.ticker}`);
    console.log(`Stock ID: ${stock.id}\n`);

    // Fetch price history
    console.log('Fetching price history from Yahoo Finance...');
    const priceHistory = await fetchYahooPriceHistory(stock.ticker);
    
    console.log(`Received ${priceHistory.length} data points`);
    
    if (priceHistory.length > 0) {
      console.log('\nFirst 3 data points:');
      priceHistory.slice(0, 3).forEach((item: any) => {
        console.log(`  ${item.Date.substring(0, 10)}: $${item.Close}`);
      });
      
      console.log('\nLast 3 data points:');
      priceHistory.slice(-3).forEach((item: any) => {
        console.log(`  ${item.Date.substring(0, 10)}: $${item.Close}`);
      });

      // Delete old data
      console.log(`\nDeleting old price history for ${stock.ticker}...`);
      const deleteResult = await prisma.priceHistory.deleteMany({
        where: { stockId: stock.id }
      });
      console.log(`Deleted ${deleteResult.count} old records`);

      // Insert new data
      console.log(`\nInserting ${priceHistory.length} new records...`);
      const records = priceHistory.map((item: any) => ({
        stockId: stock.id,
        date: new Date(item.Date),
        price: item.Close,
        volume: null,
      }));

      const createResult = await prisma.priceHistory.createMany({
        data: records,
        skipDuplicates: true
      });
      console.log(`Inserted ${createResult.count} records`);

      // Verify data was inserted
      const verifyCount = await prisma.priceHistory.count({
        where: { stockId: stock.id }
      });
      console.log(`\n✅ Verification: Database now contains ${verifyCount} records for ${stock.ticker}`);

      // Show latest 5 records from database
      const latest = await prisma.priceHistory.findMany({
        where: { stockId: stock.id },
        orderBy: { date: 'desc' },
        take: 5
      });
      console.log('\nLatest 5 records in database:');
      latest.forEach(record => {
        console.log(`  ${record.date.toISOString().substring(0, 10)}: $${record.price}`);
      });
    } else {
      console.log('❌ No price history returned from Yahoo Finance API');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdatePrices();
