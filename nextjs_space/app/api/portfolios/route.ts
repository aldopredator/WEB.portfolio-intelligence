import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/portfolios
 * Returns all portfolios with stock counts
 */
export async function GET() {
  try {
    const portfolios = await prisma.portfolio.findMany({
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
 * Creates a new portfolio
 */
export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Portfolio name is required' },
        { status: 400 }
      );
    }

    // Check if portfolio with this name already exists
    const existingPortfolio = await prisma.portfolio.findFirst({
      where: { 
        name: name.trim()
      }
    });

    if (existingPortfolio) {
      return NextResponse.json(
        { success: false, error: 'A portfolio with this name already exists' },
        { status: 409 }
      );
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null
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
