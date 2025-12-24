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

    let successCount = 0;
    let errorCount = 0;

    for (const stock of stocks) {
      try {
        const priceHistory = await fetchYahooPriceHistory(stock.ticker);
        
        if (priceHistory && priceHistory.length > 0) {
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
          console.log(`✅ ${stock.ticker}: ${records.length} data points`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ ${stock.ticker}:`, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${successCount} stocks, ${errorCount} errors`,
      stats: { total: stocks.length, success: successCount, errors: errorCount }
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
