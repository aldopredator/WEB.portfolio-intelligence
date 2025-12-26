import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SCORING_FACTORS, type ScoringTheme } from '@/lib/scoring-config';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

// Calculate returns from price history
function calculateReturns(priceHistory: { date: Date; price: number }[]): {
  return30d: number | null;
  return60d: number | null;
  volatility30d: number | null;
} {
  if (priceHistory.length < 2) {
    return { return30d: null, return60d: null, volatility30d: null };
  }

  const sorted = [...priceHistory].sort((a, b) => b.date.getTime() - a.date.getTime());
  const currentPrice = sorted[0].price;
  
  // 30-day return
  const date30 = new Date();
  date30.setDate(date30.getDate() - 30);
  const price30 = sorted.find(p => p.date <= date30)?.price;
  const return30d = price30 ? ((currentPrice - price30) / price30) : null;
  
  // 60-day return
  const date60 = new Date();
  date60.setDate(date60.getDate() - 60);
  const price60 = sorted.find(p => p.date <= date60)?.price;
  const return60d = price60 ? ((currentPrice - price60) / price60) : null;
  
  // 30-day volatility (standard deviation of daily returns)
  const last30Prices = sorted.slice(0, Math.min(30, sorted.length));
  if (last30Prices.length >= 5) {
    const returns = [];
    for (let i = 0; i < last30Prices.length - 1; i++) {
      const dailyReturn = (last30Prices[i].price - last30Prices[i + 1].price) / last30Prices[i + 1].price;
      returns.push(dailyReturn);
    }
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility30d = Math.sqrt(variance) * Math.sqrt(252); // Annualized
    return { return30d, return60d, volatility30d };
  }
  
  return { return30d, return60d, volatility30d: null };
}

// Z-score normalization
function zScore(values: number[]): number[] {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return values.map(() => 0);
  
  return values.map(val => (val - mean) / stdDev);
}

// Calculate factor score for a stock
function calculateFactorScore(
  factorKey: string,
  stockData: any,
  allData: any[]
): number | null {
  const factor = SCORING_FACTORS[factorKey];
  if (!factor) return null;
  
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const metric of factor.metrics) {
    let value: number | null = null;
    
    // Get value based on source
    if (metric.source === 'metrics') {
      value = stockData.latestMetrics?.[metric.field] ?? null;
    } else if (metric.source === 'stockData') {
      value = stockData.stockData?.[metric.field] ?? null;
    } else if (metric.source === 'calculated') {
      value = stockData.calculated?.[metric.field] ?? null;
    }
    
    if (value === null || value === undefined || isNaN(value)) continue;
    
    // Collect all values for this metric to calculate z-score
    const allValues: number[] = [];
    for (const stock of allData) {
      let stockValue: number | null = null;
      if (metric.source === 'metrics') {
        stockValue = stock.latestMetrics?.[metric.field] ?? null;
      } else if (metric.source === 'stockData') {
        stockValue = stock.stockData?.[metric.field] ?? null;
      } else if (metric.source === 'calculated') {
        stockValue = stock.calculated?.[metric.field] ?? null;
      }
      if (stockValue !== null && !isNaN(stockValue)) {
        allValues.push(stockValue);
      }
    }
    
    if (allValues.length < 2) continue;
    
    // Calculate z-score
    const mean = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    const variance = allValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allValues.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) continue;
    
    let zScoreValue = (value - mean) / stdDev;
    
    // Invert if lower is better
    if (metric.direction === 'lower') {
      zScoreValue = -zScoreValue;
    }
    
    totalScore += zScoreValue * metric.weight;
    totalWeight += metric.weight;
  }
  
  return totalWeight > 0 ? totalScore / totalWeight : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portfolioId, themeFactors } = body as {
      portfolioId?: string;
      themeFactors: ScoringTheme['factors'];
    };
    
    // Fetch stocks with metrics and price history
    const stocks = await prisma.stock.findMany({
      where: portfolioId && portfolioId !== 'all' ? { portfolioId } : { isActive: true },
      select: {
        ticker: true,
        company: true,
        sector: true,
        industry: true,
        country: true,
        rating: true,
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
        stockData: {
          select: {
            currentPrice: true,
            change: true,
            changePercent: true,
            week52High: true,
            week52Low: true,
          },
        },
        priceHistory: {
          select: {
            date: true,
            price: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 90, // Last 90 days for calculations
        },
        metrics: {
          select: {
            peRatio: true,
            forwardPE: true,
            pbRatio: true,
            psRatio: true,
            evToRevenue: true,
            evToEbitda: true,
            beta: true,
            debtToEquity: true,
            roe: true,
            roa: true,
            profitMargin: true,
            revenueGrowthQoQ: true,
            earningsGrowthQoQ: true,
            marketCap: true,
            snapshotDate: true,
          },
          orderBy: {
            snapshotDate: 'desc',
          },
          take: 1,
        },
      },
    });
    
    // Calculate returns and enrich data
    const enrichedStocks = stocks.map(stock => {
      const calculated = calculateReturns(stock.priceHistory);
      return {
        ...stock,
        latestMetrics: stock.metrics[0] || null,
        calculated,
      };
    });
    
    // Calculate factor scores for each stock
    const scoredStocks = enrichedStocks.map(stock => {
      const factorScores = {
        value: calculateFactorScore('value', stock, enrichedStocks),
        quality: calculateFactorScore('quality', stock, enrichedStocks),
        growth: calculateFactorScore('growth', stock, enrichedStocks),
        momentum: calculateFactorScore('momentum', stock, enrichedStocks),
        risk: calculateFactorScore('risk', stock, enrichedStocks),
      };
      
      // Calculate final weighted score
      let finalScore = 0;
      let totalWeight = 0;
      
      for (const [factorKey, factorScore] of Object.entries(factorScores)) {
        if (factorScore !== null) {
          const weight = themeFactors[factorKey as keyof typeof themeFactors];
          finalScore += factorScore * weight;
          totalWeight += weight;
        }
      }
      
      return {
        ticker: stock.ticker,
        company: stock.company,
        sector: stock.sector,
        industry: stock.industry,
        country: stock.country,
        portfolio: stock.portfolio?.name || 'N/A',
        portfolioId: stock.portfolio?.id || null,
        rating: stock.rating || 0,
        currentPrice: stock.stockData?.currentPrice || null,
        marketCap: stock.latestMetrics?.marketCap || null,
        factorScores,
        finalScore: totalWeight > 0 ? finalScore / totalWeight : 0,
      };
    });
    
    // Sort by final score (descending)
    const rankedStocks = scoredStocks.sort((a, b) => b.finalScore - a.finalScore);
    
    return NextResponse.json({
      success: true,
      stocks: rankedStocks,
      count: rankedStocks.length,
    });
    
  } catch (error) {
    console.error('Scoring calculation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate scores' },
      { status: 500 }
    );
  }
}
