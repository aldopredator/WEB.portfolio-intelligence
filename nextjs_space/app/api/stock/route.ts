import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/stock?portfolioId=xxx
 * Returns all stocks, optionally filtered by portfolio
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');

    const where = portfolioId && portfolioId !== 'all'
      ? { portfolioId, isActive: true }
      : { isActive: true };

    const stocks = await prisma.stock.findMany({
      where,
      include: {
        stockData: true,
        metrics: true,
        analystRecommendations: true,
        socialSentiments: true,
        priceHistory: {
          orderBy: { date: 'desc' },
          take: 365 // Last year of data
        },
        news: {
          orderBy: { publishedAt: 'desc' },
          take: 5
        },
        portfolio: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { addedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      stocks
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}
