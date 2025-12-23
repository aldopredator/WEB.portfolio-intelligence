import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { stockId, alternativeTickers } = await request.json();

    if (!stockId || !Array.isArray(alternativeTickers)) {
      return NextResponse.json(
        { error: 'stockId and alternativeTickers array are required' },
        { status: 400 }
      );
    }

    // Update the stock with new alternative tickers
    const updatedStock = await prisma.stock.update({
      where: { id: stockId },
      data: { alternativeTickers },
      select: {
        id: true,
        ticker: true,
        company: true,
        alternativeTickers: true
      }
    });

    return NextResponse.json(updatedStock);
  } catch (error) {
    console.error('Error updating alternative tickers:', error);
    return NextResponse.json(
      { error: 'Failed to update alternative tickers' },
      { status: 500 }
    );
  }
}
