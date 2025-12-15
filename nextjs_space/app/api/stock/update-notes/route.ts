import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { ticker, notes } = await request.json();

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker is required' },
        { status: 400 }
      );
    }

    // Validate notes length (max 100 characters)
    if (notes && notes.length > 100) {
      return NextResponse.json(
        { error: 'Notes must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Update the stock notes
    const updatedStock = await prisma.stock.update({
      where: { ticker },
      data: { 
        notes: notes || null,
        updatedAt: new Date(),
      },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      stock: updatedStock,
    });
  } catch (error) {
    console.error('Error updating stock notes:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: 'Failed to update notes' },
      { status: 500 }
    );
  }
}
