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
  selectedPortfolioId2?: string | null;
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

export default function VarianceMatrix({ stocks, portfolios, selectedPortfolioId, selectedPortfolioId2 }: VarianceMatrixProps) {
  const router = useRouter();
  const [showCorrelation, setShowCorrelation] = useState(true);

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
    const params = new URLSearchParams();
    if (portfolioId) params.set('portfolio', portfolioId);
    if (selectedPortfolioId2) params.set('portfolio2', selectedPortfolioId2);
    router.push(`/variance${params.toString() ? '?' + params.toString() : ''}`);
  };

  const handlePortfolio2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const portfolioId2 = e.target.value;
    const params = new URLSearchParams();
    if (selectedPortfolioId) params.set('portfolio', selectedPortfolioId);
    if (portfolioId2) params.set('portfolio2', portfolioId2);
    router.push(`/variance${params.toString() ? '?' + params.toString() : ''}`);
  };

  // Get color based on correlation value using RED-WHITE-GREEN spectrum
  const getCorrelationColor = (value: number): string => {
    // Clamp value between -1 and 1
    const clampedValue = Math.max(-1, Math.min(1, value));
    
    // Map -1 to 1 range to 0 to 1
    // -1 (strong negative) -> 0 (GREEN)
    // 0 (neutral) -> 0.5 (WHITE)
    // 1 (strong positive) -> 1 (RED)
    const normalized = (clampedValue + 1) / 2;
    
    let r, g, b;
    if (normalized < 0.5) {
      // GREEN to WHITE (0 to 0.5)
      const t = normalized * 2; // 0 to 1
      r = Math.round(100 + t * 155);  // 100 to 255
      g = Math.round(180 + t * 75);   // 180 to 255
      b = Math.round(100 + t * 155);  // 100 to 255
    } else {
      // WHITE to RED (0.5 to 1)
      const t = (normalized - 0.5) * 2; // 0 to 1
      r = 255;                         // stays 255
      g = Math.round(255 - t * 155);   // 255 to 100
      b = Math.round(255 - t * 155);   // 255 to 100
    }
    
    return `rgb(${r} ${g} ${b} / 0.85)`;
  };

  // Get color based on covariance value using RED-WHITE-GREEN spectrum
  const getCovarianceColor = (value: number, maxAbsValue: number): string => {
    const normalized = maxAbsValue > 0 ? value / maxAbsValue : 0;
    const mappedValue = (normalized + 1) / 2;
    
    let r, g, b;
    if (mappedValue < 0.5) {
      const t = mappedValue * 2;
      r = Math.round(100 + t * 155);
      g = Math.round(180 + t * 75);
      b = Math.round(100 + t * 155);
    } else {
      const t = (mappedValue - 0.5) * 2;
      r = 255;
      g = Math.round(255 - t * 155);
      b = Math.round(255 - t * 155);
    }
    
    return `rgb(${r} ${g} ${b} / 0.85)`;
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

  // Get portfolio names for display
  const portfolio1Name = portfolios.find(p => p.id === selectedPortfolioId)?.name;
  const portfolio2Name = portfolios.find(p => p.id === selectedPortfolioId2)?.name;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            {showCorrelation ? 'Correlation Matrix' : 'Variance-Covariance Matrix'}
            {selectedPortfolioId2 && (
              <span className="text-green-400 text-xl ml-3">
                (Combined Portfolio Simulation)
              </span>
            )}
          </h1>
          <p className="text-slate-400">
            {showCorrelation 
              ? 'Correlation coefficients between stock returns (90-day historical data)'
              : 'Variance-covariance between stock returns (90-day historical data)'}
          </p>
          {selectedPortfolioId2 && portfolio1Name && portfolio2Name && (
            <p className="text-green-400 text-sm mt-2">
              📊 Analyzing combined diversification: <span className="font-semibold">{portfolio1Name}</span> + <span className="font-semibold">{portfolio2Name}</span>
            </p>
          )}
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex gap-4 items-start flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Portfolio 1 (Base)
            </label>
            <select
              value={selectedPortfolioId || ''}
              onChange={handlePortfolioChange}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stocks</option>
              {portfolios.map(portfolio => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Portfolio 2 (Combine) - Optional
            </label>
            <select
              value={selectedPortfolioId2 || ''}
              onChange={handlePortfolio2Change}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">None</option>
              {portfolios
                .filter(p => p.id !== selectedPortfolioId)
                .map(portfolio => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))}
            </select>
            {selectedPortfolioId2 && (
              <p className="text-xs text-green-400 mt-1">
                📊 Simulating combined portfolio diversification
              </p>
            )}
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
                      // Hide diagonal values when showing correlation (always 1.000)
                      if (i === j && showCorrelation) {
                        return (
                          <td key={j} className="p-2 text-center bg-slate-900/50">
                            <span className="text-slate-600">-</span>
                          </td>
                        );
                      }
                      return (
                        <td
                          key={j}
                          className="p-2 text-center text-white"
                          style={{
                            backgroundColor: showCorrelation 
                              ? getCorrelationColor(value)
                              : getCovarianceColor(value, maxAbsCovariance)
                          }}
                        >
                          {showCorrelation 
                            ? value.toFixed(2)
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
                {showCorrelation ? 'Correlation Scale' : 'Covariance Scale'}
              </h3>
              {showCorrelation ? (
                <div className="space-y-2">
                  <div 
                    className="h-8 rounded-lg"
                    style={{
                      background: 'linear-gradient(to right, rgb(100 180 100 / 0.85), rgb(255 255 255 / 0.85), rgb(255 100 100 / 0.85))'
                    }}
                  ></div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>-1.00 (Perfect Negative - Excellent Diversification)</span>
                    <span>0.00 (No Correlation)</span>
                    <span>+1.00 (Perfect Positive - Poor Diversification)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div 
                    className="h-8 rounded-lg"
                    style={{
                      background: 'linear-gradient(to right, rgb(100 180 100 / 0.85), rgb(255 255 255 / 0.85), rgb(255 100 100 / 0.85))'
                    }}
                  ></div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Negative Covariance (Good Diversification)</span>
                    <span>Zero</span>
                    <span>Positive Covariance (Poor Diversification)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
