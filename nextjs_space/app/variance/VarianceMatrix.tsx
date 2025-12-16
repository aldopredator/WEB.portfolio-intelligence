'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

interface StockData {
  ticker: string;
  company: string;
  prices: number[];
}

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
}

interface VarianceMatrixProps {
  stocks: StockData[];
  portfolios: Portfolio[];
  selectedPortfolioId: string | null;
}

// Calculate returns from prices
function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] !== 0) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
  }
  return returns;
}

// Calculate mean of an array
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

// Calculate covariance between two return series
function covariance(returns1: number[], returns2: number[]): number {
  const minLength = Math.min(returns1.length, returns2.length);
  if (minLength === 0) return 0;
  
  const mean1 = mean(returns1.slice(0, minLength));
  const mean2 = mean(returns2.slice(0, minLength));
  
  let sum = 0;
  for (let i = 0; i < minLength; i++) {
    sum += (returns1[i] - mean1) * (returns2[i] - mean2);
  }
  
  return sum / (minLength - 1);
}

// Calculate correlation coefficient
function correlation(returns1: number[], returns2: number[]): number {
  const cov = covariance(returns1, returns2);
  const std1 = Math.sqrt(covariance(returns1, returns1));
  const std2 = Math.sqrt(covariance(returns2, returns2));
  
  if (std1 === 0 || std2 === 0) return 0;
  return cov / (std1 * std2);
}

export default function VarianceMatrix({ stocks, portfolios, selectedPortfolioId }: VarianceMatrixProps) {
  const router = useRouter();
  const [showCorrelation, setShowCorrelation] = useState(false);

  // Calculate variance-covariance matrix
  const { matrix, tickers } = useMemo(() => {
    const tickers = stocks.map(s => s.ticker);
    const returnsData = stocks.map(s => calculateReturns(s.prices));
    
    const matrix: number[][] = [];
    for (let i = 0; i < tickers.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < tickers.length; j++) {
        if (showCorrelation) {
          row.push(correlation(returnsData[i], returnsData[j]));
        } else {
          row.push(covariance(returnsData[i], returnsData[j]));
        }
      }
      matrix.push(row);
    }
    
    return { matrix, tickers };
  }, [stocks, showCorrelation]);

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const portfolioId = e.target.value;
    if (portfolioId) {
      router.push(`/variance?portfolio=${portfolioId}`);
    } else {
      router.push('/variance');
    }
  };

  // Get color based on correlation value (reversed: red = high positive correlation = bad diversification)
  const getCorrelationColor = (value: number): string => {
    if (value >= 0.8) return 'bg-red-600/80';      // Strong positive = very risky
    if (value >= 0.5) return 'bg-red-500/60';      // Moderate positive = risky
    if (value >= 0.2) return 'bg-orange-500/60';   // Weak positive = slightly risky
    if (value >= -0.2) return 'bg-gray-500/60';    // Neutral
    if (value >= -0.5) return 'bg-blue-500/60';    // Weak negative = good
    if (value >= -0.8) return 'bg-green-500/60';   // Moderate negative = very good
    return 'bg-green-600/80';                      // Strong negative = excellent diversification
  };

  // Get color based on covariance value (scaled, reversed: red = high positive = bad)
  const getCovarianceColor = (value: number, maxAbsValue: number): string => {
    const normalized = maxAbsValue > 0 ? value / maxAbsValue : 0;
    if (normalized >= 0.6) return 'bg-red-600/80';      // High positive covariance = risky
    if (normalized >= 0.3) return 'bg-red-500/60';
    if (normalized >= 0.1) return 'bg-orange-500/60';
    if (normalized >= -0.1) return 'bg-gray-500/60';
    if (normalized >= -0.3) return 'bg-blue-500/60';
    if (normalized >= -0.6) return 'bg-green-500/60';
    return 'bg-green-600/80';                           // High negative covariance = good diversification
  };

  const maxAbsCovariance = useMemo(() => {
    let max = 0;
    matrix.forEach(row => {
      row.forEach(val => {
        max = Math.max(max, Math.abs(val));
      });
    });
    return max;
  }, [matrix]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            {showCorrelation ? 'Correlation Matrix' : 'Variance-Covariance Matrix'}
          </h1>
          <p className="text-slate-400">
            {showCorrelation 
              ? 'Correlation coefficients between stock returns (90-day historical data)'
              : 'Variance-covariance between stock returns (90-day historical data)'}
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Filter by Portfolio
            </label>
            <select
              value={selectedPortfolioId || ''}
              onChange={handlePortfolioChange}
              className="w-full max-w-xs px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stocks</option>
              {portfolios.map(portfolio => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowCorrelation(!showCorrelation)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Show {showCorrelation ? 'Covariance' : 'Correlation'}
            </button>
          </div>
        </div>

        {/* Matrix */}
        {tickers.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400">No stocks found for the selected portfolio.</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-slate-800 p-2 text-left text-slate-300 font-semibold min-w-[80px]">
                    Ticker
                  </th>
                  {tickers.map(ticker => (
                    <th key={ticker} className="p-2 text-center text-slate-300 font-semibold min-w-[80px]">
                      {ticker}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickers.map((ticker, i) => (
                  <tr key={ticker} className="border-t border-slate-700">
                    <td className="sticky left-0 bg-slate-800 p-2 text-left text-white font-semibold">
                      {ticker}
                    </td>
                    {matrix[i].map((value, j) => {
                      // Only show lower triangle (j <= i) since matrix is symmetric
                      if (j > i) {
                        return (
                          <td key={j} className="p-2 text-center bg-slate-900/50">
                            <span className="text-slate-600">-</span>
                          </td>
                        );
                      }
                      return (
                        <td
                          key={j}
                          className={`p-2 text-center text-white ${
                            showCorrelation 
                              ? getCorrelationColor(value)
                              : getCovarianceColor(value, maxAbsCovariance)
                          }`}
                        >
                          {showCorrelation 
                            ? value.toFixed(3)
                            : value.toExponential(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                {showCorrelation ? 'Correlation Scale' : 'Intensity Scale'}
              </h3>
              {showCorrelation ? (
                <div className="flex gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-600/80 rounded"></div>
                    <span className="text-xs text-slate-400">Strong Negative (≤-0.8) - Excellent Diversification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500/60 rounded"></div>
                    <span className="text-xs text-slate-400">Moderate Negative (-0.8 to -0.5) - Very Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500/60 rounded"></div>
                    <span className="text-xs text-slate-400">Weak Negative (-0.5 to -0.2) - Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-500/60 rounded"></div>
                    <span className="text-xs text-slate-400">Neutral (-0.2 to 0.2)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-500/60 rounded"></div>
                    <span className="text-xs text-slate-400">Weak Positive (0.2-0.5) - Slightly Risky</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-500/60 rounded"></div>
                    <span className="text-xs text-slate-400">Moderate Positive (0.5-0.8) - Risky</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-600/80 rounded"></div>
                    <span className="text-xs text-slate-400">Strong Positive (≥0.8) - Poor Diversification</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Colors indicate relative covariance magnitude. Red = high positive covariance (risky), Green = negative covariance (good diversification). Only lower triangle shown (matrix is symmetric).
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
