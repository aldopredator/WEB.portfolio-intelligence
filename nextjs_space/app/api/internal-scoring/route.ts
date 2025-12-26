import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateComponentScores, calculateFinalScore, type FactorWeights, type ScoringMetrics } from '@/lib/scoring-utils';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { portfolioId, weights } = await request.json();

    // Fetch stocks with their latest metrics
    const stocks = await prisma.stock.findMany({
      where: portfolioId && portfolioId !== 'all' ? { portfolioId } : {},
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
        metrics: {
          orderBy: { snapshotDate: 'desc' },
          take: 1,
        },
        stockData: true,
        priceHistory: {
          orderBy: { date: 'desc' },
          take: 60, // Get last 60 days for volatility calculation
        },
      },
    });

    // Calculate returns and volatility from price history
    const stocksWithCalculatedMetrics = stocks.map(stock => {
      const prices = stock.priceHistory.map(p => p.price);
      
      let return30d: number | undefined;
      let return60d: number | undefined;
      let volatility30d: number | undefined;
      let volatility60d: number | undefined;
      
      if (prices.length >= 30) {
        return30d = prices.length > 0 && prices[29] ? (prices[0] - prices[29]) / prices[29] : undefined;
        const returns30 = [];
        for (let i = 0; i < Math.min(30, prices.length - 1); i++) {
          if (prices[i] && prices[i + 1]) {
            returns30.push((prices[i] - prices[i + 1]) / prices[i + 1]);
          }
        }
        if (returns30.length > 0) {
          const mean30 = returns30.reduce((sum, r) => sum + r, 0) / returns30.length;
          const variance30 = returns30.reduce((sum, r) => sum + Math.pow(r - mean30, 2), 0) / returns30.length;
          volatility30d = Math.sqrt(variance30);
        }
      }
      
      if (prices.length >= 60) {
        return60d = prices.length > 0 && prices[59] ? (prices[0] - prices[59]) / prices[59] : undefined;
        const returns60 = [];
        for (let i = 0; i < Math.min(60, prices.length - 1); i++) {
          if (prices[i] && prices[i + 1]) {
            returns60.push((prices[i] - prices[i + 1]) / prices[i + 1]);
          }
        }
        if (returns60.length > 0) {
          const mean60 = returns60.reduce((sum, r) => sum + r, 0) / returns60.length;
          const variance60 = returns60.reduce((sum, r) => sum + Math.pow(r - mean60, 2), 0) / returns60.length;
          volatility60d = Math.sqrt(variance60);
        }
      }
      
      return {
        ...stock,
        calculatedMetrics: {
          return30d,
          return60d,
          volatility30d,
          volatility60d,
        },
      };
    });

    // Build metrics array for all stocks
    const allMetrics: ScoringMetrics[] = stocksWithCalculatedMetrics.map(stock => {
      const latestMetrics = stock.metrics[0];
      
      return {
        pe: latestMetrics?.peRatio || undefined,
        forwardPe: latestMetrics?.forwardPE || undefined,
        pb: latestMetrics?.pbRatio || undefined,
        ps: latestMetrics?.psRatio || undefined,
        evToRevenue: latestMetrics?.evToRevenue || undefined,
        evToEbitda: latestMetrics?.evToEbitda || undefined,
        roe: latestMetrics?.roe || undefined,
        roa: latestMetrics?.roa || undefined,
        profitMargin: latestMetrics?.profitMargin || undefined,
        revenueGrowth: latestMetrics?.revenueGrowthQoQ || undefined,
        earningsGrowth: latestMetrics?.earningsGrowthQoQ || undefined,
        return30d: stock.calculatedMetrics.return30d,
        return60d: stock.calculatedMetrics.return60d,
        volatility30d: stock.calculatedMetrics.volatility30d,
        volatility60d: stock.calculatedMetrics.volatility60d,
        beta: latestMetrics?.beta || undefined,
        debtToEquity: latestMetrics?.debtToEquity || undefined,
      };
    });

    // Calculate scores for each stock
    const scoredStocks = stocksWithCalculatedMetrics.map((stock, index) => {
      const stockMetrics = allMetrics[index];
      const componentScores = calculateComponentScores(allMetrics, stockMetrics);
      const finalScore = calculateFinalScore(componentScores, weights as FactorWeights);
      
      const latestMetrics = stock.metrics[0];
      
      return {
        ticker: stock.ticker,
        company: stock.company,
        portfolio: stock.portfolio?.name || 'No Portfolio',
        rating: stock.rating,
        sector: stock.stockData?.sector || 'N/A',
        industry: stock.stockData?.industry || 'N/A',
        country: stock.stockData?.country || 'N/A',
        finalScore,
        valueScore: componentScores.valueScore,
        qualityScore: componentScores.qualityScore,
        growthScore: componentScores.growthScore,
        momentumScore: componentScores.momentumScore,
        riskScore: componentScores.riskScore,
        // Include raw metrics for display
        pe: latestMetrics?.peRatio,
        pb: latestMetrics?.pbRatio,
        ps: latestMetrics?.psRatio,
        roe: latestMetrics?.returnOnEquity,
        roa: latestMetrics?.returnOnAssets,
        profitMargin: latestMetrics?.profitMargin,
        revenueGrowth: latestMetrics?.quarterlyRevenueGrowth,
        return30d: stock.calculatedMetrics.return30d,
        return60d: stock.calculatedMetrics.return60d,
        beta: latestMetrics?.beta,
        marketCap: stock.stockData?.marketCap,
      };
    });

    // Sort by final score descending
    scoredStocks.sort((a, b) => b.finalScore - a.finalScore);

    return NextResponse.json({ 
      success: true, 
      stocks: scoredStocks,
      totalStocks: scoredStocks.length,
    });
  } catch (error) {
    console.error('Internal scoring error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate scores' },
      { status: 500 }
    );
  }
}
