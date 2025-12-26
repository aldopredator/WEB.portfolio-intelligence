import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker is required' },
        { status: 400 }
      );
    }

    console.log('[Price History API] Fetching price history for:', ticker);

    // Find the stock first
    const stock = await prisma.stock.findUnique({
      where: { ticker },
      select: { id: true },
    });

    if (!stock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    // Fetch price history for the stock (last 90 days)
    const priceHistory = await prisma.priceHistory.findMany({
      where: { stockId: stock.id },
      orderBy: { date: 'desc' },
      take: 90,
      select: {
        date: true,
        price: true,
        volume: true,
      },
    });

    await prisma.$disconnect();

    // Format response to include 'close' field (alias for 'price')
    const formattedHistory = priceHistory.map(ph => ({
      date: ph.date,
      close: ph.price,
      price: ph.price,
      volume: ph.volume,
    }));

    return NextResponse.json({
      success: true,
      priceHistory: formattedHistory
    });
  } catch (error: any) {
    console.error('[Price History API] Error:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: error.message || 'Failed to fetch price history' },
      { status: 500 }
    );
  }
}
