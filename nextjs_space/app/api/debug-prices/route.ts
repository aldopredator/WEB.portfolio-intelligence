import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'CW8U.PA';

    const history = await prisma.priceHistory.findMany({
      where: {
        stock: {
          ticker
        }
      },
      orderBy: { date: 'asc' }
    });

    // Check Sept 24 - Nov 13 period
    const sept24ToNov13 = history.filter(h => {
      const d = new Date(h.date);
      return d >= new Date('2024-09-24') && d <= new Date('2024-11-13');
    });

    const uniquePrices = new Set(sept24ToNov13.map(h => h.price));

    return NextResponse.json({
      ticker,
      totalRecords: history.length,
      dateRange: {
        start: history[0]?.date,
        end: history[history.length - 1]?.date
      },
      sept24ToNov13Analysis: {
        recordCount: sept24ToNov13.length,
        uniquePrices: uniquePrices.size,
        prices: Array.from(uniquePrices),
        firstFive: sept24ToNov13.slice(0, 5).map(h => ({
          date: h.date.toISOString().split('T')[0],
          price: h.price
        })),
        lastFive: sept24ToNov13.slice(-5).map(h => ({
          date: h.date.toISOString().split('T')[0],
          price: h.price
        })),
        isFlatLine: uniquePrices.size === 1
      },
      recentTen: history.slice(-10).map(h => ({
        date: h.date.toISOString().split('T')[0],
        price: h.price
      }))
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
