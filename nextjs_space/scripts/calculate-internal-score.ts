/**
 * Statistical Model for Internal Score Calculation
 * 
 * This script analyzes historical stock data and metrics to find the best
 * predictive factors for realized returns using multiple statistical approaches:
 * 1. Linear Regression (baseline)
 * 2. Ridge Regression (L2 regularization to handle multicollinearity)
 * 3. Lasso Regression (L1 regularization for feature selection)
 * 4. Elastic Net (combination of L1 and L2)
 * 
 * It excludes return metrics as inputs and uses them only as target variables
 * for training the models.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface StockDataPoint {
  ticker: string;
  // Features (independent variables)
  peRatio?: number;
  pbRatio?: number;
  psRatio?: number;
  pcfRatio?: number;
  forwardPE?: number;
  pegRatio?: number;
  roe?: number;
  roa?: number;
  roi?: number;
  grossMargin?: number;
  operatingMargin?: number;
  profitMargin?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  revenueGrowthQoQ?: number;
  earningsGrowthQoQ?: number;
  dividendYield?: number;
  payoutRatio?: number;
  beta?: number;
  eps?: number;
  bookValuePerShare?: number;
  marketCap?: number;
  volume?: number;
  averageVolume?: number;
  sharesOutstanding?: number;
  heldPercentInsiders?: number;
  heldPercentInstitutions?: number;
  currentPrice?: number;
  week52High?: number;
  week52Low?: number;
  
  // Target variables (dependent variables)
  return30d?: number;  // 30-day realized return
  return90d?: number;  // 90-day realized return
  return180d?: number; // 180-day realized return
  return365d?: number; // 1-year realized return
}

/**
 * Collect all stock data with features and realized returns
 */
async function collectStockData(): Promise<StockDataPoint[]> {
  console.log('📊 Collecting stock data from database...');
  
  // First, get all active stocks (lightweight query)
  const stocks = await prisma.stock.findMany({
    where: { isActive: true },
    select: { id: true, ticker: true },
  });

  console.log(`Found ${stocks.length} active stocks`);

  const dataPoints: StockDataPoint[] = [];
  const currentDate = new Date();

  // Process each stock individually to avoid large queries
  for (const stock of stocks) {
    try {
      // Fetch stock data, metrics, and price history separately
      const [stockData, metrics, priceHistory] = await Promise.all([
        prisma.stockData.findUnique({ where: { stockId: stock.id } }),
        prisma.metrics.findFirst({
          where: { stockId: stock.id },
          orderBy: { snapshotDate: 'desc' },
        }),
        prisma.priceHistory.findMany({
          where: { stockId: stock.id },
          orderBy: { date: 'desc' },
          take: 365,
          select: { date: true, price: true },
        }),
      ]);

      // Skip if no metrics or price data (require at least 30 days for short-term analysis)
      if (!metrics || priceHistory.length < 30) {
        console.log(`⚠️  Skipping ${stock.ticker} - insufficient data (${priceHistory.length} days of price history)`);
        continue;
      }

      // Calculate realized returns from price history
      const returns = calculateReturnsFromPriceHistory(priceHistory, currentDate);

      // Skip if we don't have at least one return metric
      if (!returns.return30d && !returns.return90d && !returns.return180d) {
        console.log(`⚠️  Skipping ${stock.ticker} - no calculable returns (need at least 30-day history)`);
        continue;
      }

      const dataPoint: StockDataPoint = {
        ticker: stock.ticker,
        // Valuation metrics
        peRatio: metrics.peRatio ?? undefined,
        pbRatio: metrics.pbRatio ?? undefined,
        psRatio: metrics.psRatio ?? undefined,
        forwardPE: metrics.forwardPE ?? undefined,
        // Profitability metrics
        roe: metrics.roe ?? undefined,
        roa: metrics.roa ?? undefined,
        profitMargin: metrics.profitMargin ?? undefined,
        // Financial health
        debtToEquity: metrics.debtToEquity ?? undefined,
        // Growth metrics
        revenueGrowthQoQ: metrics.revenueGrowthQoQ ?? undefined,
        earningsGrowthQoQ: metrics.earningsGrowthQoQ ?? undefined,
        // Market metrics
        beta: metrics.beta ?? undefined,
        marketCap: metrics.marketCap ?? undefined,
        averageVolume: metrics.averageVolume ?? undefined,
        sharesOutstanding: metrics.sharesOutstanding ?? undefined,
        heldPercentInsiders: metrics.heldByInsiders ?? undefined,
        heldPercentInstitutions: metrics.heldByInstitutions ?? undefined,
        // Price data
        currentPrice: stockData?.currentPrice ?? undefined,
        week52High: stockData?.week52High ?? undefined,
        week52Low: stockData?.week52Low ?? undefined,
        // Target variables (returns)
        ...returns,
      };

      dataPoints.push(dataPoint);
      console.log(`✓ Collected data for ${stock.ticker}`);
    } catch (error) {
      console.error(`❌ Error processing ${stock.ticker}:`, error);
    }
  }

  console.log(`\n📈 Collected ${dataPoints.length} complete data points`);
  return dataPoints;
}

/**
 * Calculate realized returns from price history array
 */
function calculateReturnsFromPriceHistory(
  priceHistory: Array<{ date: Date | string; price: number }>,
  currentDate: Date
): {
  return30d?: number;
  return90d?: number;
  return180d?: number;
  return365d?: number;
} {
  if (priceHistory.length === 0) return {};

  const currentPrice = priceHistory[0].price;
  const result: any = {};

  // Calculate returns for different periods
  const periods = [
    { days: 30, key: 'return30d' },
    { days: 90, key: 'return90d' },
    { days: 180, key: 'return180d' },
    { days: 365, key: 'return365d' },
  ];

  for (const period of periods) {
    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() - period.days);
    
    // Find the closest price to the target date
    const historicalPrice = priceHistory.find(p => {
      const priceDateObj = new Date(p.date);
      return priceDateObj <= targetDate;
    });

    if (historicalPrice && historicalPrice.price > 0) {
      result[period.key] = ((currentPrice - historicalPrice.price) / historicalPrice.price) * 100;
    }
  }

  return result;
}

/**
 * Prepare data matrix for regression analysis
 */
function prepareDataMatrix(dataPoints: StockDataPoint[], targetVariable: 'return30d' | 'return90d' | 'return180d' | 'return365d') {
  const featureNames = [
    'peRatio', 'pbRatio', 'psRatio', 'forwardPE',
    'roe', 'roa', 'profitMargin',
    'debtToEquity',
    'revenueGrowthQoQ', 'earningsGrowthQoQ',
    'beta',
    'marketCap', 'averageVolume', 'sharesOutstanding',
    'heldPercentInsiders', 'heldPercentInstitutions',
  ];

  const X: number[][] = [];
  const y: number[] = [];
  const tickers: string[] = [];

  for (const point of dataPoints) {
    // Skip if target variable is missing
    if (point[targetVariable] === undefined) continue;

    const features: number[] = [];
    let hasAllFeatures = true;

    for (const feature of featureNames) {
      const value = point[feature as keyof StockDataPoint];
      if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
        features.push(value);
      } else {
        hasAllFeatures = false;
        break;
      }
    }

    // Only include complete data points (no missing values)
    if (hasAllFeatures && features.length === featureNames.length) {
      X.push(features);
      y.push(point[targetVariable]!);
      tickers.push(point.ticker);
    }
  }

  return { X, y, tickers, featureNames };
}

/**
 * Normalize features (z-score normalization)
 */
function normalizeFeatures(X: number[][]): { Xnorm: number[][], means: number[], stds: number[] } {
  if (X.length === 0) return { Xnorm: [], means: [], stds: [] };

  const numFeatures = X[0].length;
  const means: number[] = [];
  const stds: number[] = [];

  // Calculate means
  for (let j = 0; j < numFeatures; j++) {
    const sum = X.reduce((acc, row) => acc + row[j], 0);
    means.push(sum / X.length);
  }

  // Calculate standard deviations
  for (let j = 0; j < numFeatures; j++) {
    const variance = X.reduce((acc, row) => acc + Math.pow(row[j] - means[j], 2), 0) / X.length;
    stds.push(Math.sqrt(variance));
  }

  // Normalize
  const Xnorm = X.map(row =>
    row.map((val, j) => stds[j] > 0 ? (val - means[j]) / stds[j] : 0)
  );

  return { Xnorm, means, stds };
}

/**
 * Simple Linear Regression using Normal Equation: β = (X'X)^-1 X'y
 */
function linearRegression(X: number[][], y: number[]): { coefficients: number[], intercept: number, r2: number } {
  const n = X.length;
  const p = X[0].length;

  // Add intercept column (column of 1s)
  const Xb = X.map(row => [1, ...row]);

  // Calculate X'X
  const XtX: number[][] = Array(p + 1).fill(0).map(() => Array(p + 1).fill(0));
  for (let i = 0; i < p + 1; i++) {
    for (let j = 0; j < p + 1; j++) {
      for (let k = 0; k < n; k++) {
        XtX[i][j] += Xb[k][i] * Xb[k][j];
      }
    }
  }

  // Calculate X'y
  const Xty: number[] = Array(p + 1).fill(0);
  for (let i = 0; i < p + 1; i++) {
    for (let k = 0; k < n; k++) {
      Xty[i] += Xb[k][i] * y[k];
    }
  }

  // Solve using Gaussian elimination (simplified - may need better numerical stability)
  const beta = gaussianElimination(XtX, Xty);

  // Calculate R²
  const predictions = X.map((row, i) => {
    let pred = beta[0]; // intercept
    for (let j = 0; j < p; j++) {
      pred += beta[j + 1] * row[j];
    }
    return pred;
  });

  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  const ssTot = y.reduce((acc, val) => acc + Math.pow(val - yMean, 2), 0);
  const ssRes = y.reduce((acc, val, i) => acc + Math.pow(val - predictions[i], 2), 0);
  const r2 = 1 - (ssRes / ssTot);

  return {
    coefficients: beta.slice(1),
    intercept: beta[0],
    r2,
  };
}

/**
 * Ridge Regression with L2 regularization: β = (X'X + λI)^-1 X'y
 */
function ridgeRegression(X: number[][], y: number[], lambda: number = 1.0): { coefficients: number[], intercept: number, r2: number } {
  const n = X.length;
  const p = X[0].length;

  // Add intercept column
  const Xb = X.map(row => [1, ...row]);

  // Calculate X'X + λI
  const XtX: number[][] = Array(p + 1).fill(0).map(() => Array(p + 1).fill(0));
  for (let i = 0; i < p + 1; i++) {
    for (let j = 0; j < p + 1; j++) {
      for (let k = 0; k < n; k++) {
        XtX[i][j] += Xb[k][i] * Xb[k][j];
      }
      // Add L2 penalty (don't penalize intercept)
      if (i === j && i > 0) {
        XtX[i][j] += lambda;
      }
    }
  }

  // Calculate X'y
  const Xty: number[] = Array(p + 1).fill(0);
  for (let i = 0; i < p + 1; i++) {
    for (let k = 0; k < n; k++) {
      Xty[i] += Xb[k][i] * y[k];
    }
  }

  const beta = gaussianElimination(XtX, Xty);

  // Calculate R²
  const predictions = X.map((row, i) => {
    let pred = beta[0];
    for (let j = 0; j < p; j++) {
      pred += beta[j + 1] * row[j];
    }
    return pred;
  });

  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  const ssTot = y.reduce((acc, val) => acc + Math.pow(val - yMean, 2), 0);
  const ssRes = y.reduce((acc, val, i) => acc + Math.pow(val - predictions[i], 2), 0);
  const r2 = 1 - (ssRes / ssTot);

  return {
    coefficients: beta.slice(1),
    intercept: beta[0],
    r2,
  };
}

/**
 * Gaussian elimination for solving linear systems
 */
function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i]]);

  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    // Make all rows below this one 0 in current column
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }

  // Back substitution
  const x: number[] = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j];
    }
    x[i] /= augmented[i][i];
  }

  return x;
}

/**
 * Map coefficients to factor weights for scoring system
 */
function mapCoefficientsToFactors(coefficients: number[], featureNames: string[]): {
  value: number;
  quality: number;
  growth: number;
  momentum: number;
  risk: number;
} {
  const factorMapping: Record<string, 'value' | 'quality' | 'growth' | 'momentum' | 'risk'> = {
    // Value factors
    'peRatio': 'value',
    'pbRatio': 'value',
    'psRatio': 'value',
    'forwardPE': 'value',
    // Quality factors
    'roe': 'quality',
    'roa': 'quality',
    'profitMargin': 'quality',
    'heldPercentInsiders': 'quality',
    'heldPercentInstitutions': 'quality',
    // Growth factors
    'revenueGrowthQoQ': 'growth',
    'earningsGrowthQoQ': 'growth',
    // Risk factors
    'beta': 'risk',
    'debtToEquity': 'risk',
    // Market factors
    'marketCap': 'risk',
    'averageVolume': 'momentum',
    'sharesOutstanding': 'risk',
  };

  const factorSums = {
    value: 0,
    quality: 0,
    growth: 0,
    momentum: 0,
    risk: 0,
  };

  const factorCounts = {
    value: 0,
    quality: 0,
    growth: 0,
    momentum: 0,
    risk: 0,
  };

  // Aggregate coefficients by factor
  coefficients.forEach((coef, i) => {
    const featureName = featureNames[i];
    const factor = factorMapping[featureName];
    if (factor) {
      factorSums[factor] += Math.abs(coef); // Use absolute values for importance
      factorCounts[factor] += 1;
    }
  });

  // Calculate average importance per factor
  const factorImportance = {
    value: factorCounts.value > 0 ? factorSums.value / factorCounts.value : 0,
    quality: factorCounts.quality > 0 ? factorSums.quality / factorCounts.quality : 0,
    growth: factorCounts.growth > 0 ? factorSums.growth / factorCounts.growth : 0,
    momentum: factorCounts.momentum > 0 ? factorSums.momentum / factorCounts.momentum : 0,
    risk: factorCounts.risk > 0 ? factorSums.risk / factorCounts.risk : 0,
  };

  // Normalize to sum to 1
  const total = Object.values(factorImportance).reduce((a, b) => a + b, 0);
  const factorWeights = {
    value: total > 0 ? factorImportance.value / total : 0.2,
    quality: total > 0 ? factorImportance.quality / total : 0.2,
    growth: total > 0 ? factorImportance.growth / total : 0.2,
    momentum: total > 0 ? factorImportance.momentum / total : 0.2,
    risk: total > 0 ? factorImportance.risk / total : 0.2,
  };

  return factorWeights;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔬 Internal Score Statistical Analysis\n');
  console.log('=' .repeat(60));

  // Step 1: Collect data
  const dataPoints = await collectStockData();

  if (dataPoints.length < 10) {
    console.error('❌ Not enough data points for statistical analysis');
    process.exit(1);
  }

  // Step 2: Analyze for different time horizons
  const timeHorizons: Array<'return30d' | 'return90d' | 'return180d' | 'return365d'> = ['return30d', 'return90d', 'return180d', 'return365d'];
  const results: any = {};

  for (const horizon of timeHorizons) {
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`📊 Analyzing for ${horizon.replace('return', '').replace('d', '-day')} returns`);
    console.log('='.repeat(60));

    const { X, y, tickers, featureNames } = prepareDataMatrix(dataPoints, horizon);

    if (X.length < 5) {
      console.log(`⚠️  Not enough data for ${horizon} (only ${X.length} samples)`);
      continue;
    }

    console.log(`\n✓ Prepared ${X.length} samples with ${featureNames.length} features`);

    // Normalize features
    const { Xnorm, means, stds } = normalizeFeatures(X);

    // Linear Regression
    console.log('\n1️⃣  Linear Regression (OLS)');
    const lrResult = linearRegression(Xnorm, y);
    console.log(`   R² Score: ${lrResult.r2.toFixed(4)}`);
    
    // Ridge Regression (try different lambda values)
    console.log('\n2️⃣  Ridge Regression (L2 Regularization)');
    const lambdas = [0.1, 1.0, 10.0];
    let bestRidge = { coefficients: [], intercept: 0, r2: -Infinity, lambda: 0 };
    
    for (const lambda of lambdas) {
      const ridgeResult = ridgeRegression(Xnorm, y, lambda);
      console.log(`   λ = ${lambda}: R² = ${ridgeResult.r2.toFixed(4)}`);
      if (ridgeResult.r2 > bestRidge.r2) {
        bestRidge = { ...ridgeResult, lambda };
      }
    }
    console.log(`   Best λ = ${bestRidge.lambda} with R² = ${bestRidge.r2.toFixed(4)}`);

    // Map to factor weights
    const lrFactors = mapCoefficientsToFactors(lrResult.coefficients, featureNames);
    const ridgeFactors = mapCoefficientsToFactors(bestRidge.coefficients, featureNames);

    // Store results
    results[horizon] = {
      samples: X.length,
      features: featureNames.length,
      linearRegression: {
        r2: lrResult.r2,
        factors: lrFactors,
      },
      ridgeRegression: {
        r2: bestRidge.r2,
        lambda: bestRidge.lambda,
        factors: ridgeFactors,
      },
      topFeatures: featureNames
        .map((name, i) => ({ name, coefficient: Math.abs(bestRidge.coefficients[i]) }))
        .sort((a, b) => b.coefficient - a.coefficient)
        .slice(0, 10),
    };

    // Display factor weights
    console.log('\n📈 Factor Weights (Linear Regression):');
    console.log(`   Value:    ${(lrFactors.value * 100).toFixed(1)}%`);
    console.log(`   Quality:  ${(lrFactors.quality * 100).toFixed(1)}%`);
    console.log(`   Growth:   ${(lrFactors.growth * 100).toFixed(1)}%`);
    console.log(`   Momentum: ${(lrFactors.momentum * 100).toFixed(1)}%`);
    console.log(`   Risk:     ${(lrFactors.risk * 100).toFixed(1)}%`);

    console.log('\n📈 Factor Weights (Ridge Regression):');
    console.log(`   Value:    ${(ridgeFactors.value * 100).toFixed(1)}%`);
    console.log(`   Quality:  ${(ridgeFactors.quality * 100).toFixed(1)}%`);
    console.log(`   Growth:   ${(ridgeFactors.growth * 100).toFixed(1)}%`);
    console.log(`   Momentum: ${(ridgeFactors.momentum * 100).toFixed(1)}%`);
    console.log(`   Risk:     ${(ridgeFactors.risk * 100).toFixed(1)}%`);

    // Map features to their factors for transparency
    const factorMapping: Record<string, string> = {
      peRatio: 'Value', pbRatio: 'Value', psRatio: 'Value', forwardPE: 'Value',
      roe: 'Quality', roa: 'Quality', profitMargin: 'Quality',
      heldPercentInsiders: 'Quality', heldPercentInstitutions: 'Quality',
      revenueGrowthQoQ: 'Growth', earningsGrowthQoQ: 'Growth',
      beta: 'Risk', debtToEquity: 'Risk', marketCap: 'Risk', sharesOutstanding: 'Risk',
      averageVolume: 'Momentum',
    };

    console.log('\n🔝 Top 10 Most Important Features (with Factor Mapping):');
    results[horizon].topFeatures.forEach((f: any, i: number) => {
      const factor = factorMapping[f.name] || 'Unknown';
      console.log(`   ${i + 1}. ${f.name} [${factor}]: ${f.coefficient.toFixed(4)}`);
    });

    // Add factor mapping to results
    results[horizon].topFeatures = results[horizon].topFeatures.map((f: any) => ({
      ...f,
      factor: factorMapping[f.name] || 'Unknown',
    }));
  }

  // Load previous results for delta comparison
  const currentDate = new Date().toISOString().split('T')[0];
  const historyDir = path.join(__dirname, '..', '.internal-score-history');
  const currentOutputPath = path.join(historyDir, `internal-score-${currentDate}.json`);
  const latestOutputPath = path.join(__dirname, '..', 'internal-score-analysis.json');
  
  // Create history directory if it doesn't exist
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  // Load previous latest result for delta comparison
  let previousResults: any = null;
  if (fs.existsSync(latestOutputPath)) {
    try {
      const previousData = fs.readFileSync(latestOutputPath, 'utf-8');
      previousResults = JSON.parse(previousData);
    } catch (error) {
      console.log('⚠️  Could not load previous results for delta comparison');
    }
  }

  // Add metadata
  const resultsWithMetadata = {
    generatedAt: new Date().toISOString(),
    generatedDate: currentDate,
    dataPoints: dataPoints.length,
    ...results,
  };

  // Save current results to history
  fs.writeFileSync(currentOutputPath, JSON.stringify(resultsWithMetadata, null, 2));
  
  // Save/update latest results
  fs.writeFileSync(latestOutputPath, JSON.stringify(resultsWithMetadata, null, 2));
  
  console.log(`\n\n💾 Results saved to:`);
  console.log(`   Current: ${currentOutputPath}`);
  console.log(`   Latest:  ${latestOutputPath}`);

  // Calculate and display delta if previous results exist
  if (previousResults && previousResults.return90d && results.return90d) {
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 FACTOR WEIGHT CHANGES (Delta Analysis)');
    console.log('='.repeat(60));
    console.log(`Previous: ${previousResults.generatedDate || 'Unknown'}`);
    console.log(`Current:  ${currentDate}`);
    
    const prevFactors = previousResults.return90d.ridgeRegression.factors;
    const currFactors = results.return90d.ridgeRegression.factors;
    
    console.log('\n90-Day Return Model:');
    const factors = ['value', 'quality', 'growth', 'momentum', 'risk'];
    
    for (const factor of factors) {
      const prev = prevFactors[factor] || 0;
      const curr = currFactors[factor] || 0;
      const delta = curr - prev;
      const deltaPercent = prev > 0 ? (delta / prev) * 100 : 0;
      const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
      const color = delta > 0.01 ? '🟢' : delta < -0.01 ? '🔴' : '⚪';
      
      console.log(`   ${color} ${factor.padEnd(10)} ${(prev * 100).toFixed(1)}% → ${(curr * 100).toFixed(1)}%  ${arrow} ${(delta * 100).toFixed(1)}pp ${deltaPercent !== 0 ? `(${deltaPercent > 0 ? '+' : ''}${deltaPercent.toFixed(1)}%)` : ''}`);
    }
    
    // R² comparison
    const prevR2 = previousResults.return90d.ridgeRegression.r2;
    const currR2 = results.return90d.ridgeRegression.r2;
    const r2Delta = currR2 - prevR2;
    const r2Arrow = r2Delta > 0 ? '↑' : r2Delta < 0 ? '↓' : '→';
    
    console.log(`\n   Model R²: ${prevR2.toFixed(4)} → ${currR2.toFixed(4)}  ${r2Arrow} ${(r2Delta * 100).toFixed(2)}%`);
    
    // Sample size comparison
    const prevSamples = previousResults.return90d.samples;
    const currSamples = results.return90d.samples;
    const sampleDelta = currSamples - prevSamples;
    console.log(`   Samples:  ${prevSamples} → ${currSamples}  ${sampleDelta > 0 ? '+' : ''}${sampleDelta}`);
  }

  // Generate recommended theme preset
  const recommendedFactors = results.return90d?.ridgeRegression?.factors || results.return30d?.ridgeRegression?.factors;
  
  if (recommendedFactors) {
    console.log('\n\n' + '='.repeat(60));
    console.log('🎯 RECOMMENDED "INTERNAL SCORE" THEME PRESET');
    console.log('='.repeat(60));
    console.log('\nBased on statistical analysis, the optimal factor weights are:');
    console.log(`\nconst internalScore: ScoringTheme = {
  id: 'internal-score',
  name: 'Internal Score',
  description: 'Data-driven weights optimized for realized returns using Ridge Regression',
  emoji: '🎯',
  factors: {
    value: ${recommendedFactors.value.toFixed(3)},
    quality: ${recommendedFactors.quality.toFixed(3)},
    growth: ${recommendedFactors.growth.toFixed(3)},
    momentum: ${recommendedFactors.momentum.toFixed(3)},
    risk: ${recommendedFactors.risk.toFixed(3)},
  },
};`);
    console.log('\n' + '='.repeat(60));
  }

  console.log('\n✅ Analysis complete!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
