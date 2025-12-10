import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/portfolios
 * Returns all portfolios for the authenticated user with stock counts
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const portfolios = await prisma.portfolio.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        _count: {
          select: { stocks: true }
        },
        stocks: {
          select: {
            id: true,
            ticker: true,
            company: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      portfolios
    });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portfolios
 * Creates a new portfolio for the authenticated user
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Portfolio name is required' },
        { status: 400 }
      );
    }

    // Check if user already has a portfolio with this name
    const existingPortfolio = await prisma.portfolio.findFirst({
      where: { 
        name: name.trim(),
        userId: session.user.id
      }
    });

    if (existingPortfolio) {
      return NextResponse.json(
        { success: false, error: 'You already have a portfolio with this name' },
        { status: 409 }
      );
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      portfolio
    });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create portfolio' },
      { status: 500 }
    );
  }
}
