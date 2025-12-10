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

    // Verify the target portfolio exists
    const targetPortfolio = await prisma.portfolio.findUnique({
      where: { id: targetPortfolioId },
      select: {
        id: true,
        name: true
      }
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
