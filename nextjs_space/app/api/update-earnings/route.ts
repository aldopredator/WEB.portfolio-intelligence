import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchEarningsSurprises } from '@/lib/finnhub-metrics';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for long-running task

/**
 * POST /api/update-earnings
 * Fetch and store earnings surprises for all active stocks
 */
export async function POST(request: NextRequest) {
  try {
    const stocks = await prisma.stock.findMany({
      where: { isActive: true },
      select: { id: true, ticker: true },
    });

    console.log(`[UPDATE-EARNINGS] Fetching earnings for ${stocks.length} stocks...`);

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const stock of stocks) {
      try {
        const earningsSurprises = await fetchEarningsSurprises(stock.ticker);
        
        if (earningsSurprises && Array.isArray(earningsSurprises) && earningsSurprises.length > 0) {
          // Delete existing earnings for this stock
          await prisma.earningsSurprise.deleteMany({
            where: { stockId: stock.id },
          });

          // Insert new earnings surprises
          for (const surprise of earningsSurprises) {
            if (surprise.period) {
              await prisma.earningsSurprise.create({
                data: {
                  stockId: stock.id,
                  period: new Date(surprise.period),
                  actual: surprise.actual || null,
                  estimate: surprise.estimate || null,
                  surprise: surprise.surprise || null,
                  surprisePercent: surprise.surprisePercent || null,
                },
              });
            }
          }

          console.log(`✅ ${stock.ticker}: Saved ${earningsSurprises.length} earnings surprises`);
          updated++;
        } else {
          console.log(`⏭️  ${stock.ticker}: No earnings data available`);
          skipped++;
        }

        // Rate limiting: wait 200ms between API calls (5 calls/second max)
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        const errorMsg = `Failed to update ${stock.ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      skipped,
      total: stocks.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('[UPDATE-EARNINGS] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
