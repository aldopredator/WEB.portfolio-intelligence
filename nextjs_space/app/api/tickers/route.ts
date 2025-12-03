import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET all tickers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category'); // 'portfolio' or 'watchlist'

    const where = category ? { category } : {};

    const tickers = await prisma.ticker.findMany({
      where,
      orderBy: [
        { category: 'asc' }, // portfolio first
        { addedAt: 'desc' },
      ],
    });

    return NextResponse.json({ tickers });
  } catch (error) {
    console.error('[Tickers API] Error fetching tickers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickers' },
      { status: 500 }
    );
  }
}

// POST - Add new ticker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, name, exchange, type = 'Equity', category = 'watchlist' } = body;

    if (!symbol || !name) {
      return NextResponse.json(
        { error: 'Symbol and name are required' },
        { status: 400 }
      );
    }

    // Check if ticker already exists
    const existing = await prisma.ticker.findUnique({
      where: { symbol },
    });

    if (existing) {
      return NextResponse.json(
        { 
          message: 'Ticker already exists',
          ticker: existing,
          existed: true 
        },
        { status: 200 }
      );
    }

    // Create new ticker
    const ticker = await prisma.ticker.create({
      data: {
        symbol,
        name,
        exchange,
        type,
        category,
      },
    });

    console.log('[Tickers API] Added new ticker:', ticker);

    return NextResponse.json({ 
      message: 'Ticker added successfully',
      ticker,
      existed: false
    });
  } catch (error) {
    console.error('[Tickers API] Error adding ticker:', error);
    return NextResponse.json(
      { error: 'Failed to add ticker' },
      { status: 500 }
    );
  }
}

// PATCH - Update ticker (e.g., move from watchlist to portfolio)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, category } = body;

    if (!symbol || !category) {
      return NextResponse.json(
        { error: 'Symbol and category are required' },
        { status: 400 }
      );
    }

    const ticker = await prisma.ticker.update({
      where: { symbol },
      data: { category },
    });

    return NextResponse.json({ 
      message: 'Ticker updated successfully',
      ticker 
    });
  } catch (error) {
    console.error('[Tickers API] Error updating ticker:', error);
    return NextResponse.json(
      { error: 'Failed to update ticker' },
      { status: 500 }
    );
  }
}

// DELETE - Remove ticker
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    await prisma.ticker.delete({
      where: { symbol },
    });

    return NextResponse.json({ 
      message: 'Ticker deleted successfully'
    });
  } catch (error) {
    console.error('[Tickers API] Error deleting ticker:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticker' },
      { status: 500 }
    );
  }
}
