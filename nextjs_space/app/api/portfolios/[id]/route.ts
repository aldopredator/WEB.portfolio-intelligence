import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description } = await request.json();
    const { id } = params;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Portfolio name is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const portfolio = await prisma.portfolio.findUnique({
      where: { id }
    });

    if (!portfolio || portfolio.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found or access denied' },
        { status: 404 }
      );
    }

    // Check if another portfolio of the same user with this name exists
    const existingPortfolio = await prisma.portfolio.findFirst({
      where: {
        name: name.trim(),
        userId: session.user.id,
        id: { not: id }
      }
    });

    if (existingPortfolio) {
      return NextResponse.json(
        { success: false, error: 'You already have a portfolio with this name' },
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if portfolio exists and verify ownership
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

    if (portfolio.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
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
