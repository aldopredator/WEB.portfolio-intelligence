import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/portfolios/[id]/stocks/[stockId] - Remove stock from portfolio
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; stockId: string } }
) {
  try {
    const { id: portfolioId, stockId } = params;

    // Verify portfolio exists
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
    });

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Remove stock from portfolio by setting portfolioId to null
    const updatedStock = await prisma.stock.update({
      where: { id: stockId },
      data: { portfolioId: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Stock removed from portfolio',
      stock: updatedStock,
    });
  } catch (error) {
    console.error('Error removing stock from portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove stock from portfolio' },
      { status: 500 }
    );
  }
}
