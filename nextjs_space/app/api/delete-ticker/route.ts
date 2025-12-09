import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker is required' },
        { status: 400 }
      );
    }

    console.log('[Delete Ticker API] Deleting ticker:', ticker);

    // Check if ticker exists and get portfolio info
    const existingStock = await prisma.stock.findUnique({
      where: { ticker },
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
            isLocked: true,
          }
        }
      }
    });

    if (!existingStock) {
      return NextResponse.json(
        { error: 'Ticker not found' },
        { status: 404 }
      );
    }

    // Check if the portfolio is locked
    if (existingStock.portfolio?.isLocked) {
      return NextResponse.json(
        { 
          error: `Cannot delete ${ticker}. The portfolio "${existingStock.portfolio.name}" is locked. Please unlock it in the Portfolios tab first.`,
          isLocked: true,
          portfolioName: existingStock.portfolio.name
        },
        { status: 403 }
      );
    }

    // Delete the stock from the database
    await prisma.stock.delete({
      where: { ticker },
    });

    return NextResponse.json({
      success: true,
      message: `${ticker} has been deleted successfully`,
      ticker,
    });
  } catch (error: any) {
    console.error('[Delete Ticker API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete ticker' },
      { status: 500 }
    );
  }
}
