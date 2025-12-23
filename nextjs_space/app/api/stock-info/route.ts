import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tickers = searchParams.get('tickers')?.split(',').filter(t => t.trim());

    if (!tickers || tickers.length === 0) {
      return NextResponse.json({ error: 'No tickers provided' }, { status: 400 });
    }

    const stocks = await prisma.stock.findMany({
      where: {
        ticker: {
          in: tickers
        }
      },
      select: {
        ticker: true,
        company: true,
        sector: true,
        industry: true,
        type: true,
        exchange: true,
        region: true
      }
    });

    // Create a map for quick lookup
    const stockMap = stocks.reduce((acc, stock) => {
      acc[stock.ticker] = stock;
      return acc;
    }, {} as Record<string, typeof stocks[0]>);

    return NextResponse.json(stockMap);
  } catch (error) {
    console.error('Error fetching stock info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock information' },
      { status: 500 }
    );
  }
}
