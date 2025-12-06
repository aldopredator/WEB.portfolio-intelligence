import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { ticker, rating } = await request.json();

    if (!ticker || rating === undefined) {
      return NextResponse.json(
        { error: 'Ticker and rating are required' },
        { status: 400 }
      );
    }

    // Validate rating is between 0 and 5
    if (rating < 0 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 0 and 5' },
        { status: 400 }
      );
    }

    // Update the stock rating
    const updatedStock = await prisma.stock.update({
      where: { ticker },
      data: { rating },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      stock: updatedStock,
    });
  } catch (error) {
    console.error('Error updating stock rating:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: 'Failed to update rating' },
      { status: 500 }
    );
  }
}
