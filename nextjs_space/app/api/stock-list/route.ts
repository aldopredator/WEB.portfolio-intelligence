import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const portfolioId = searchParams.get('portfolio');

    console.log('[API /stock-list] Portfolio filter:', portfolioId || 'ALL');

    // Build where clause
    const where: any = { isActive: true };
    if (portfolioId) {
      where.portfolioId = portfolioId;
    }

    // Fetch stocks from database
    const stocks = await prisma.stock.findMany({
      where,
      select: {
        ticker: true,
        company: true,
      },
      orderBy: { ticker: 'asc' },
    });

    console.log(`[API /stock-list] Found ${stocks.length} stocks`);

    // Enrich with change_percent if needed (can be fetched from StockData table)
    const enrichedStocks = stocks.map(stock => ({
      ticker: stock.ticker,
      change_percent: 0, // TODO: Fetch from StockData if needed
    }));

    return NextResponse.json({
      success: true,
      stocks: enrichedStocks,
      count: enrichedStocks.length,
    });
  } catch (error) {
    console.error('[API /stock-list] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stocks', stocks: [] },
      { status: 500 }
    );
  }
}
