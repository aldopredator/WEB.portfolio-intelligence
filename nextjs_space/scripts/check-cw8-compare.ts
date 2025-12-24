#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCW8() {
  try {
    console.log('Checking for CW8U.PA in database...\n');
    
    const cw8Stock = await prisma.stock.findFirst({
      where: { 
        ticker: 'CW8U.PA',
        isActive: true
      },
      include: {
        portfolio: true,
        priceHistory: {
          orderBy: { date: 'desc' },
          take: 5
        }
      }
    });

    if (cw8Stock) {
      console.log('✅ CW8U.PA found!');
      console.log(`   Company: ${cw8Stock.company}`);
      console.log(`   Portfolio: ${cw8Stock.portfolio?.name || 'N/A'}`);
      console.log(`   Active: ${cw8Stock.isActive}`);
      console.log(`   Price History Records: ${cw8Stock.priceHistory?.length || 0}`);
      
      if (cw8Stock.priceHistory && cw8Stock.priceHistory.length > 0) {
        console.log('\n   Latest prices:');
        cw8Stock.priceHistory.forEach(p => {
          console.log(`     ${p.date.toISOString().substring(0, 10)}: €${p.price}`);
        });
      }
    } else {
      console.log('❌ CW8U.PA not found in database');
      
      console.log('\nSearching for similar tickers...');
      const similarStocks = await prisma.stock.findMany({
        where: {
          OR: [
            { ticker: { contains: 'CW8', mode: 'insensitive' } },
            { ticker: { contains: 'MSCI', mode: 'insensitive' } },
            { company: { contains: 'MSCI', mode: 'insensitive' } },
          ],
          isActive: true
        },
        include: {
          portfolio: true
        }
      });
      
      if (similarStocks.length > 0) {
        console.log(`Found ${similarStocks.length} similar tickers:`);
        similarStocks.forEach(s => {
          console.log(`  - ${s.ticker}: ${s.company} (${s.portfolio?.name || 'No Portfolio'})`);
        });
      }
    }

    console.log('\n\nChecking all active stocks in BENCHMARK portfolio:');
    const benchmarkStocks = await prisma.stock.findMany({
      where: {
        isActive: true,
        portfolio: {
          name: 'BENCHMARK'
        }
      },
      include: {
        portfolio: true,
        priceHistory: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });

    console.log(`Found ${benchmarkStocks.length} active stocks in BENCHMARK portfolio:`);
    benchmarkStocks.forEach(s => {
      const latestPrice = s.priceHistory?.[0];
      console.log(`  - ${s.ticker}: ${s.company}`);
      if (latestPrice) {
        console.log(`    Latest: ${latestPrice.date.toISOString().substring(0, 10)} @ $${latestPrice.price}`);
      } else {
        console.log(`    ⚠️ No price history`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCW8();
