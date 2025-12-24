import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchYahooPriceHistory } from '@/lib/yahoo-finance';

const prisma = new PrismaClient();

// Vercel timeout: Free tier = 10s, Hobby = 10s, Pro = 60s (with config)
// We'll process stocks in batches to respect timeout limits
export const maxDuration = 60; // 1 minute max
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 55000; // 55 seconds to be safe
  
  try {
    console.log('🔄 Starting price history update...');
    
    // Get URL parameters for batch processing
    const { searchParams } = new URL(request.url);
    const batchSize = parseInt(searchParams.get('batch') || '5');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const stocks = await prisma.stock.findMany({
      where: { isActive: true },
      select: { id: true, ticker: true },
      skip: offset,
      take: batchSize
    });

    const totalStocks = await prisma.stock.count({
      where: { isActive: true }
    });

    console.log(`Processing batch: ${offset + 1} to ${offset + stocks.length} of ${totalStocks} stocks`);

    if (stocks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No more stocks to process',
        stats: { 
          total: totalStocks, 
          processed: offset,
          remaining: 0,
          success: 0, 
          errors: 0 
        }
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const stock of stocks) {
      // Check if we're running out of time
      if (Date.now() - startTime > MAX_EXECUTION_TIME) {
        console.log('⏱️ Approaching timeout, stopping early');
        break;
      }

      try {
        console.log(`Fetching ${stock.ticker}...`);
        const priceHistory = await fetchYahooPriceHistory(stock.ticker);
        
        if (priceHistory && priceHistory.length > 0) {
          console.log(`Got ${priceHistory.length} data points for ${stock.ticker}`);
          
          await prisma.priceHistory.deleteMany({
            where: { stockId: stock.id }
          });

          const records = priceHistory.map((item: any) => ({
            stockId: stock.id,
            date: new Date(item.Date),
            price: item.Close,
            volume: null,
          }));

          await prisma.priceHistory.createMany({
            data: records,
            skipDuplicates: true
          });

          successCount++;
          console.log(`✅ ${stock.ticker}: ${records.length} data points saved`);
        } else {
          errorCount++;
          const msg = `${stock.ticker}: No data returned from API`;
          errors.push(msg);
          console.warn(`⚠️ ${msg}`);
        }
      } catch (error) {
        errorCount++;
        const msg = `${stock.ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(msg);
        console.error(`❌ ${msg}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const remainingStocks = totalStocks - (offset + successCount + errorCount);
    const nextOffset = offset + successCount + errorCount;

    return NextResponse.json({
      success: true,
      message: `Processed ${successCount + errorCount} stocks in batch`,
      stats: { 
        total: totalStocks,
        processed: nextOffset,
        remaining: remainingStocks,
        success: successCount, 
        errors: errorCount 
      },
      nextBatchUrl: remainingStocks > 0 
        ? `/api/update-prices?batch=${batchSize}&offset=${nextOffset}` 
        : null,
      errors: errors.length > 0 ? errors : undefined,
      executionTime: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
    });
    
  } catch (error) {
    console.error('Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
