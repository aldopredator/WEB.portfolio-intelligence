/**
 * Migration script to populate sector, industry, and alternative tickers for all stocks
 * Run this once to fill in all missing data
 */

import { PrismaClient } from '@prisma/client';
import { fetchYahooCompanyProfile } from '../lib/yahoo-finance';

const prisma = new PrismaClient();

// Known alternative ticker mappings (bank statement format → database ticker)
const ALTERNATIVE_TICKER_MAPPINGS: Record<string, string[]> = {
  'BRK.B': ['BRK/B'],
  'HSBC': ['HSBA'],
  'ENGI.PA': ['ENGI'],
  'IBDRY': ['IBE'],
  'NESN.SW': ['NESN'],
  'PBR': ['PBA/A'],
  // Add more mappings as needed
};

async function populateSectors() {
  console.log('🚀 Starting sector/industry/alternative ticker population...');

  // Get all stocks without sector or industry
  const stocks = await prisma.stock.findMany({
    where: {
      OR: [
        { sector: null },
        { industry: null }
      ]
    },
    select: {
      id: true,
      ticker: true,
      company: true,
      sector: true,
      industry: true,
      alternativeTickers: true
    }
  });

  console.log(`📊 Found ${stocks.length} stocks to update`);

  if (stocks.length === 0) {
    console.log('✅ All stocks already have sector/industry data');
    await prisma.$disconnect();
    return;
  }

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  let alternativeTickersUpdated = 0;

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    const progress = `[${i + 1}/${stocks.length}]`;

    try {
      console.log(`${progress} Fetching ${stock.ticker} (${stock.company})...`);

      const profile = await fetchYahooCompanyProfile(stock.ticker);

      // Check if this ticker has known alternative tickers
      const alternativeTickers = ALTERNATIVE_TICKER_MAPPINGS[stock.ticker] || stock.alternativeTickers;
      const shouldUpdateAlternatives = alternativeTickers.length > 0 && 
        JSON.stringify(alternativeTickers) !== JSON.stringify(stock.alternativeTickers);

      if (profile?.sector || profile?.industry || shouldUpdateAlternatives) {
        await prisma.stock.update({
          where: { id: stock.id },
          data: {
            sector: profile?.sector || stock.sector,
            industry: profile?.industry || stock.industry,
            alternativeTickers: alternativeTickers
          }
        });

        const altTickerInfo = shouldUpdateAlternatives 
          ? ` [Alt: ${alternativeTickers.join(', ')}]` 
          : '';
        console.log(`${progress} ✅ ${stock.ticker}: ${profile?.sector || 'N/A'} / ${profile?.industry || 'N/A'}${altTickerInfo}`);
        
        if (shouldUpdateAlternatives) alternativeTickersUpdated++;
        successCount++;
      } else {
        console.log(`${progress} ⚠️  ${stock.ticker}: No sector/industry data available`);
        skippedCount++;
      }

      // Add delay to avoid rate limiting (200ms between requests)
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`${progress} ❌ ${stock.ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failCount++;

      // Continue even if one fails
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n📈 Summary:');
  console.log(`   ✅ Successfully updated: ${successCount}`);
  console.log(`   🔗 Alternative tickers added: ${alternativeTickersUpdated}`);
  console.log(`   ⚠️  No data available: ${skippedCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📊 Total processed: ${stocks.length}`);

  await prisma.$disconnect();
  console.log('\n✨ Done!');
}

populateSectors()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
