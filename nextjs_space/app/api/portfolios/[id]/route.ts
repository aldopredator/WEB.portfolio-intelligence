import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/portfolios/[id]
 * Retrieves a single portfolio with its stocks
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        stocks: {
          orderBy: { ticker: 'asc' },
          select: {
            id: true,
            ticker: true,
            company: true,
            type: true,
            exchange: true,
          }
        }
      }
    });

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      portfolio
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/portfolios/[id]
 * Updates a portfolio's name, description, and/or lock status
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, isLocked } = body;
    const { id } = params;

    // If only updating lock status
    if (isLocked !== undefined && name === undefined) {
      const portfolio = await prisma.portfolio.update({
        where: { id },
        data: { isLocked }
      });

      return NextResponse.json({
        success: true,
        portfolio
      });
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Portfolio name is required' },
        { status: 400 }
      );
    }

    // Check if another portfolio with this name exists
    const existingPortfolio = await prisma.portfolio.findFirst({
      where: {
        name: name.trim(),
        id: { not: id }
      }
    });

    if (existingPortfolio) {
      return NextResponse.json(
        { success: false, error: 'A portfolio with this name already exists' },
        { status: 409 }
      );
    }

    const updateData: any = {
      name: name.trim(),
      description: description?.trim() || null
    };

    if (isLocked !== undefined) {
      updateData.isLocked = isLocked;
    }

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      portfolio
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update portfolio' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portfolios/[id]
 * Deletes a portfolio (stocks will have portfolioId set to null)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if portfolio exists
    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        _count: {
          select: { stocks: true }
        }
      }
    });

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Delete the portfolio (stocks will have portfolioId set to null due to onDelete: SetNull)
    await prisma.portfolio.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: `Portfolio deleted. ${portfolio._count.stocks} stock(s) removed from portfolio.`
    });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete portfolio' },
      { status: 500 }
    );
  }
}
