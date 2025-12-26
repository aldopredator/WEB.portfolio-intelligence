import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
        alternativeTickers: true,
        portfolio: {
          select: {
            name: true
          }
        }
      }
    });

    // Create a map for quick lookup
    // Map both primary ticker AND alternative tickers to the same stock data
    const stockMap = stocks.reduce((acc, stock) => {
      const stockData = {
        ticker: stock.ticker,
        company: stock.company,
        sector: stock.sector,
        industry: stock.industry,
        type: stock.type,
        exchange: stock.exchange,
        alternativeTickers: stock.alternativeTickers,
        portfolioName: stock.portfolio?.name || null
      };
      
      // Map primary ticker
      acc[stock.ticker] = stockData;
      
      // Map all alternative tickers to the same stock data
      stock.alternativeTickers.forEach(altTicker => {
        acc[altTicker] = stockData;
      });
      
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(stockMap);
  } catch (error) {
    console.error('Error fetching stock info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock information' },
      { status: 500 }
    );
  }
}
