import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/portfolios/[id]
 * Updates a portfolio's name and/or description
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description } = await request.json();
    const { id } = params;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Portfolio name is required' },
        { status: 400 }
      );
    }

    // Check if portfolio exists
    const portfolio = await prisma.portfolio.findUnique({
      where: { id }
    });

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
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

    const updatedPortfolio = await prisma.portfolio.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    });

    return NextResponse.json({
      success: true,
      portfolio: updatedPortfolio
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
      select: {
        id: true,
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
