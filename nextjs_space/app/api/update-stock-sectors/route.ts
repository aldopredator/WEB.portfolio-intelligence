import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchYahooCompanyProfile } from '@/lib/yahoo-finance';

export const dynamic = 'force-dynamic';

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

/**
 * Update sector, industry, and alternative tickers for stocks in the database
 * Can update specific tickers or all stocks without sector/industry data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tickers } = body as { tickers?: string[] };

    let stocksToUpdate;

    if (tickers && tickers.length > 0) {
      // Update specific tickers
      stocksToUpdate = await prisma.stock.findMany({
        where: {
          ticker: { in: tickers }
        },
        select: { id: true, ticker: true }
      });
    } else {
      // Update all stocks without sector/industry
      stocksToUpdate = await prisma.stock.findMany({
        where: {
          OR: [
            { sector: null },
            { industry: null }
          ]
        },
        select: { id: true, ticker: true }
      });
    }

    if (stocksToUpdate.length === 0) {
      return NextResponse.json({ 
        message: 'No stocks to update',
        updated: 0
      });
    }

    console.log(`[Update Sectors] Updating ${stocksToUpdate.length} stocks...`);

    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const stock of stocksToUpdate) {
      try {
        const profile = await fetchYahooCompanyProfile(stock.ticker);
        
        // Check if this ticker has known alternative tickers
        const alternativeTickers = ALTERNATIVE_TICKER_MAPPINGS[stock.ticker] || [];
        
        if (profile?.sector || profile?.industry || alternativeTickers.length > 0) {
          await prisma.stock.update({
            where: { id: stock.id },
            data: {
              sector: profile?.sector || null,
              industry: profile?.industry || null,
              alternativeTickers: alternativeTickers.length > 0 ? alternativeTickers : undefined,
            }
          });
          
          successCount++;
          const altTickerInfo = alternativeTickers.length > 0 
            ? ` [Alt: ${alternativeTickers.join(', ')}]` 
            : '';
          results.push({
            ticker: stock.ticker,
            status: 'success',
            sector: profile?.sector,
            industry: profile?.industry,
            alternativeTickers: alternativeTickers
          });
          console.log(`[Update Sectors] ✅ ${stock.ticker}: ${profile?.sector || 'N/A'} / ${profile?.industry || 'N/A'}${altTickerInfo}`);
        } else {
          failCount++;
          results.push({
            ticker: stock.ticker,
            status: 'no_data',
            message: 'No sector/industry data available'
          });
          console.log(`[Update Sectors] ⚠️  ${stock.ticker}: No data available`);
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        failCount++;
        results.push({
          ticker: stock.ticker,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`[Update Sectors] ❌ ${stock.ticker}:`, error);
      }
    }

    return NextResponse.json({
      message: `Updated ${successCount} stocks, ${failCount} failed`,
      updated: successCount,
      failed: failCount,
      results
    });

  } catch (error) {
    console.error('[Update Sectors] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update stock sectors', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
