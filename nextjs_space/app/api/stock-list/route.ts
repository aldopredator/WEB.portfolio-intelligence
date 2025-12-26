import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const portfolioId = searchParams.get('portfolio');

    console.log('[API /stock-list] Portfolio filter:', portfolioId || 'ALL');

    // Build where clause - fetch stocks with costPrice populated (securities that user buys/sells)
    const where: any = { 
      isActive: true,
      costPrice: { not: null }
    };

    // Fetch stocks from database with portfolio info
    const stocks = await prisma.stock.findMany({
      where,
      select: {
        ticker: true,
        company: true,
        alternativeTickers: true,
        website: true,
        description: true,
        costPrice: true,
        isActive: true,
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { ticker: 'asc' },
    });

    console.log(`[API /stock-list] Found ${stocks.length} stocks`);

    return NextResponse.json({
      success: true,
      stocks,
      count: stocks.length,
    });
  } catch (error) {
    console.error('[API /stock-list] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stocks', stocks: [] },
      { status: 500 }
    );
  }
}
