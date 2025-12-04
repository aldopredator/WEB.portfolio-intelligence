import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

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
      // If it exists but is inactive, reactivate it
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

      // If portfolioId is provided and different, update it
      if (portfolioId && existingStock.portfolioId !== portfolioId) {
        await prisma.stock.update({
          where: { ticker },
          data: { portfolioId },
        });
        return NextResponse.json({
          success: true,
          message: `${ticker} has been moved to the selected portfolio`,
          ticker,
        });
      }

      return NextResponse.json(
        { message: 'Ticker already exists', ticker },
        { status: 200 }
      );
    }

    // Create new stock in database
    const stock = await prisma.stock.create({
      data: {
        ticker,
        company: name,
        type: type || 'Equity',
        exchange: exchange,
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
