import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[DEBUG-DB] Checking database state...');
    
    // Get sample stock with all relations
    const sampleStock = await prisma.stock.findFirst({
      where: { ticker: 'NVDA' },
      include: {
        stockData: true,
        metrics: { take: 1, orderBy: { snapshotDate: 'desc' } },
        priceHistory: { take: 5, orderBy: { date: 'desc' } },
      }
    });
    
    // Count various tables
    const counts = {
      stocks: await prisma.stock.count(),
      stockData: await prisma.stockData.count(),
      metrics: await prisma.metrics.count(),
      priceHistory: await prisma.priceHistory.count(),
    };

    return NextResponse.json({
      success: true,
      counts,
      sampleStock,
      dbUrl: process.env.PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL?.includes('prisma+postgres') 
        ? 'Using Prisma Accelerate' 
        : 'Using direct connection',
    });
  } catch (error) {
    console.error('[DEBUG-DB] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
