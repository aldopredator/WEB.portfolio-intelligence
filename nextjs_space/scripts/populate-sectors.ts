/**
 * Migration script to populate sector and industry for all stocks
 * Run this once to fill in all missing sector/industry data
 */

import { PrismaClient } from '@prisma/client';
import { fetchYahooProfile } from '../lib/yahoo-finance';

const prisma = new PrismaClient();

async function populateSectors() {
  console.log('🚀 Starting sector/industry population...');

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
      industry: true
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

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    const progress = `[${i + 1}/${stocks.length}]`;

    try {
      console.log(`${progress} Fetching ${stock.ticker} (${stock.company})...`);

      const profile = await fetchYahooProfile(stock.ticker);

      if (profile?.sector || profile?.industry) {
        await prisma.stock.update({
          where: { id: stock.id },
          data: {
            sector: profile.sector || stock.sector,
            industry: profile.industry || stock.industry,
          }
        });

        console.log(`${progress} ✅ ${stock.ticker}: ${profile.sector || 'N/A'} / ${profile.industry || 'N/A'}`);
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
