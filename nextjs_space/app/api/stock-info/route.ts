import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tickers = searchParams.get('tickers')?.split(',').filter(t => t.trim());

    if (!tickers || tickers.length === 0) {
      return NextResponse.json({ error: 'No tickers provided' }, { status: 400 });
    }

    // Search by primary ticker OR alternative tickers
    const stocks = await prisma.stock.findMany({
      where: {
        OR: [
          {
            ticker: {
              in: tickers
            }
          },
          {
            alternativeTickers: {
              hasSome: tickers
            }
          }
        ]
      },
      select: {
        ticker: true,
        company: true,
        sector: true,
        industry: true,
        type: true,
        exchange: true,
        region: true,
        alternativeTickers: true
      }
    });

    // Create a map for quick lookup
    // Map both primary ticker AND alternative tickers to the same stock data
    const stockMap = stocks.reduce((acc, stock) => {
      // Map primary ticker
      acc[stock.ticker] = stock;
      
      // Map all alternative tickers to the same stock data
      stock.alternativeTickers.forEach(altTicker => {
        acc[altTicker] = stock;
      });
      
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
