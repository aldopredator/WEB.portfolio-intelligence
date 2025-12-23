import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const stocks = await prisma.stock.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        ticker: true,
        company: true,
        alternativeTickers: true
      },
      orderBy: {
        ticker: 'asc'
      }
    });

    return NextResponse.json(stocks);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json({ error: 'Failed to fetch stocks' }, { status: 500 });
  }
}
