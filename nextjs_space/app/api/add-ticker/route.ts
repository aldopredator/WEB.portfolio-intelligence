import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchYahooPriceHistory, fetchYahooCompanyProfile } from '@/lib/yahoo-finance';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Known alternative ticker mappings (bank statement format → database ticker)
const ALTERNATIVE_TICKER_MAPPINGS: Record<string, string[]> = {
  'BRK.B': ['BRK/B', 'BRK-B'],
  'BRK.A': ['BRK/A', 'BRK-A'],
  'HSBC': ['HSBA'],
  'ENGI.PA': ['ENGI'],
  'IBDRY': ['IBE'],
  'NESN.SW': ['NESN'],
  'PBR': ['PBA/A'],
  // Add more mappings as needed
};

interface AddTickerRequest {
  ticker: string;
  name: string;
  type?: string;
  exchange?: string;
  portfolioId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AddTickerRequest = await request.json();
    const { ticker, name, type, exchange, portfolioId } = body;

    if (!ticker || !name) {
      return NextResponse.json(
        { error: 'Ticker and name are required' },
        { status: 400 }
      );
    }

    console.log('[Add Ticker API] Adding ticker:', ticker, name);

    // Check if ticker already exists
    const existingStock = await prisma.stock.findUnique({
      where: { ticker },
    });

    if (existingStock) {
      // If it exists but is inactive, reactivate it in the same portfolio
      if (!existingStock.isActive) {
        await prisma.stock.update({
          where: { ticker },
          data: { 
            isActive: true,
            portfolioId: portfolioId || existingStock.portfolioId
          },
        });
        return NextResponse.json({
          success: true,
          message: `${ticker} has been reactivated in your portfolio`,
          ticker,
        });
      }

      // If portfolioId is provided and different, return an error instead of updating
      if (portfolioId && existingStock.portfolioId !== portfolioId) {
        // Get the portfolio name for a better error message
        const existingPortfolio = await prisma.portfolio.findUnique({
          where: { id: existingStock.portfolioId || '' },
          select: { name: true },
        });
        
        return NextResponse.json(
          { error: `${ticker} already exists in portfolio "${existingPortfolio?.name || 'Unknown'}"` },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { message: 'Ticker already exists in this portfolio', ticker },
        { status: 200 }
      );
    }

    // Fetch profile information from Yahoo Finance for sector/industry
    const profile = await fetchYahooCompanyProfile(ticker);

    // Get alternative tickers if available
    const alternativeTickers = ALTERNATIVE_TICKER_MAPPINGS[ticker] || [];

    // Create new stock in database
    const stock = await prisma.stock.create({
      data: {
        ticker,
        company: name,
        type: type || 'Equity',
        exchange: exchange,
        sector: profile?.sector || null,
        industry: profile?.industry || null,
        alternativeTickers: alternativeTickers,
        isActive: true,
        portfolioId: portfolioId || null,
      },
    });

    // Create placeholder stock data
    await prisma.stockData.create({
      data: {
        stockId: stock.id,
        currentPrice: 0,
        change: 0,
        changePercent: 0,
        week52High: 0,
        week52Low: 0,
      },
    });

    // Create placeholder analyst recommendations
    await prisma.analystRecommendation.create({
      data: {
        stockId: stock.id,
        strongBuy: 0,
        buy: 0,
        hold: 0,
        sell: 0,
        strongSell: 0,
        consensus: 'N/A',
      },
    });

    // Create placeholder social sentiment
    await prisma.socialSentiment.create({
      data: {
        stockId: stock.id,
        positive: 0,
        neutral: 0,
        negative: 0,
        overall: 'N/A',
      },
    });

    // Fetch and store 30-day price history
    try {
      console.log('[Add Ticker API] Fetching price history for:', ticker);
      const priceHistory = await fetchYahooPriceHistory(ticker);
      
      if (priceHistory && priceHistory.length > 0) {
        // Store last 30 days of price history
        const last30Days = priceHistory.slice(-30);
        
        for (const dataPoint of last30Days) {
          await prisma.priceHistory.upsert({
            where: {
              stockId_date: {
                stockId: stock.id,
                date: new Date(dataPoint.Date),
              },
            },
            update: {
              price: dataPoint.Close,
            },
            create: {
              stockId: stock.id,
              date: new Date(dataPoint.Date),
              price: dataPoint.Close,
            },
          });
        }
        
        console.log('[Add Ticker API] Stored', last30Days.length, 'price history records');
      }
    } catch (priceError) {
      console.error('[Add Ticker API] Error fetching price history:', priceError);
      // Continue even if price history fails - not critical
    }

    console.log('[Add Ticker API] Successfully added ticker:', ticker);

    return NextResponse.json({
      success: true,
      message: `${ticker} has been added to your portfolio`,
      ticker,
      stockId: stock.id,
    });

  } catch (error) {
    console.error('[Add Ticker API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to add ticker', details: errorMessage },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
