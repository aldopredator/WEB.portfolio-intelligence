import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * POST /api/save-cost-prices
 * Save cost price snapshots from bank statement to Stock table
 * Body: { costPrices: Array<{ identifier: string, costPrice: number }> }
 */
export async function POST(request: NextRequest) {
  try {
    const { costPrices } = await request.json();

    if (!costPrices || !Array.isArray(costPrices)) {
      return NextResponse.json(
        { error: 'Invalid request: costPrices array required' },
        { status: 400 }
      );
    }

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const { identifier, costPrice } of costPrices) {
      if (!identifier || costPrice == null) {
        skipped++;
        continue;
      }

      try {
        // Find stock by ticker or alternativeTickers
        const stock = await prisma.stock.findFirst({
          where: {
            OR: [
              { ticker: identifier },
              { alternativeTickers: { has: identifier } }
            ]
          }
        });

        if (stock) {
          // Update cost price
          await prisma.stock.update({
            where: { id: stock.id },
            data: {
              costPrice: costPrice,
              costPriceUpdatedAt: new Date()
            }
          });
          updated++;
        } else {
          skipped++;
          errors.push(`Ticker not found: ${identifier}`);
        }
      } catch (error) {
        console.error(`Error updating cost price for ${identifier}:`, error);
        errors.push(`Failed to update ${identifier}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error saving cost prices:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
