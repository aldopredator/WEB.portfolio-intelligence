import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

// Helper functions from VarianceMatrix.tsx
function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

function mean(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function covariance(returns1: number[], returns2: number[]): number {
  const mean1 = mean(returns1);
  const mean2 = mean(returns2);
  let sum = 0;
  for (let i = 0; i < returns1.length; i++) {
    sum += (returns1[i] - mean1) * (returns2[i] - mean2);
  }
  return sum / (returns1.length - 1);
}

function calculateOptimalWeights(covarianceMatrix: number[][]): number[] {
  const n = covarianceMatrix.length;
  const invVariances = covarianceMatrix.map((row, i) => 1 / row[i]);
  const sumInvVar = invVariances.reduce((sum, iv) => sum + iv, 0);
  return invVariances.map(iv => iv / sumInvVar);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');

    if (!portfolioId) {
      return NextResponse.json({ error: 'portfolioId is required' }, { status: 400 });
    }

    // Fetch all stocks for the portfolio with price history
    const stocks = await prisma.stock.findMany({
      where: {
        portfolioId: portfolioId
      },
      include: {
        priceHistory: {
          orderBy: {
            date: 'desc'
          },
          take: 90
        }
      }
    });

    if (stocks.length === 0) {
      return NextResponse.json({ error: 'No stocks found for portfolio' }, { status: 404 });
    }

    // Filter stocks that have sufficient price history
    const validStocks = stocks.filter(stock => stock.priceHistory.length >= 30);

    if (validStocks.length === 0) {
      return NextResponse.json({ error: 'Insufficient price history for portfolio stocks' }, { status: 400 });
    }

    // Prepare price data for each stock
    const stockPrices = validStocks.map(stock => ({
      ticker: stock.ticker,
      prices: stock.priceHistory.map(ph => ph.closePrice).reverse() // Oldest to newest
    }));

    // Calculate returns for each stock
    const allReturns = stockPrices.map(sp => calculateReturns(sp.prices));

    // Build covariance matrix
    const n = allReturns.length;
    const covarianceMatrix: number[][] = [];
    
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        row.push(covariance(allReturns[i], allReturns[j]));
      }
      covarianceMatrix.push(row);
    }

    // Calculate optimal weights
    const optimalWeights = calculateOptimalWeights(covarianceMatrix);

    // Create ticker -> weight map
    const weightsMap: Record<string, number> = {};
    validStocks.forEach((stock, index) => {
      weightsMap[stock.ticker] = optimalWeights[index] * 100; // Convert to percentage
    });

    return NextResponse.json({ 
      success: true, 
      weights: weightsMap,
      stocksAnalyzed: validStocks.length,
      totalStocks: stocks.length
    });

  } catch (error: any) {
    console.error('Error calculating optimal weights:', error);
    return NextResponse.json({ 
      error: 'Failed to calculate optimal weights', 
      details: error.message 
    }, { status: 500 });
  }
}
