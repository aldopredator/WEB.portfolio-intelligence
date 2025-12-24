import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stock-prices?ticker=XXX
 * Returns price history for a specific stock ticker
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
      return NextResponse.json(
        { success: false, error: 'Ticker parameter is required' },
        { status: 400 }
      );
    }

    // Find the stock
    const stock = await prisma.stock.findFirst({
      where: { 
        ticker,
        isActive: true 
      },
      include: {
        priceHistory: {
          orderBy: { date: 'desc' },
          take: 365 // Last year of data
        }
      }
    });

    if (!stock) {
      return NextResponse.json(
        { success: false, error: `Stock ${ticker} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ticker: stock.ticker,
      company: stock.company,
      priceHistory: stock.priceHistory
    });
  } catch (error) {
    console.error('Error fetching stock prices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock prices' },
      { status: 500 }
    );
  }
}
