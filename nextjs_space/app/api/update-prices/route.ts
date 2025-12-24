import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchYahooPriceHistory } from '@/lib/yahoo-finance';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max (Vercel Pro limit)

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Starting price history update...');
    
    const stocks = await prisma.stock.findMany({
      where: { isActive: true },
      select: { id: true, ticker: true }
    });

    console.log(`Found ${stocks.length} active stocks`);

    if (stocks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active stocks found',
        stats: { total: 0, success: 0, errors: 0 }
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const stock of stocks) {
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
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${successCount} stocks, ${errorCount} errors`,
      stats: { total: stocks.length, success: successCount, errors: errorCount },
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Fatal error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
