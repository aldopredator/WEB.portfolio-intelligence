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

    // Fetch price history for the ticker (works for both stocks and benchmarks)
    const priceHistory = await prisma.priceHistory.findMany({
      where: { ticker },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        price: true,
        volume: true,
      },
    });

    await prisma.$disconnect();

    return NextResponse.json(priceHistory);
  } catch (error: any) {
    console.error('[Price History API] Error:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: error.message || 'Failed to fetch price history' },
      { status: 500 }
    );
  }
}
