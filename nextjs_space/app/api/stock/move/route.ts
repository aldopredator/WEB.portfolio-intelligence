import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { ticker, targetPortfolioId } = await request.json();

    if (!ticker || !targetPortfolioId) {
      return NextResponse.json(
        { error: 'Ticker and target portfolio ID are required' },
        { status: 400 }
      );
    }

    // Get the current stock with its portfolio
    const currentStock = await prisma.stock.findUnique({
      where: { ticker },
      include: { portfolio: true },
    });

    if (!currentStock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    // Check if the source portfolio is locked
    if (currentStock.portfolio?.isLocked) {
      return NextResponse.json(
        { error: 'Cannot move stock from a locked portfolio' },
        { status: 403 }
      );
    }

    // Verify the target portfolio exists
    const targetPortfolio = await prisma.portfolio.findUnique({
      where: { id: targetPortfolioId },
    });

    if (!targetPortfolio) {
      return NextResponse.json(
        { error: 'Target portfolio not found' },
        { status: 404 }
      );
    }

    // Move the stock to the target portfolio
    const updatedStock = await prisma.stock.update({
      where: { ticker },
      data: { 
        portfolioId: targetPortfolioId,
        updatedAt: new Date(),
      },
      include: {
        portfolio: true,
      },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      stock: updatedStock,
      message: `${ticker} moved to ${targetPortfolio.name}`,
    });
  } catch (error) {
    console.error('Error moving stock:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: 'Failed to move stock' },
      { status: 500 }
    );
  }
}
