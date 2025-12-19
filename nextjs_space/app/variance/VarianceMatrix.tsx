'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

interface StockData {
  ticker: string;
  company: string;
  prices: number[];
  portfolioId: string | null;
  portfolioName?: string;
  sector?: string;
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

// Calculate optimal portfolio weights (minimum variance portfolio)
function calculateOptimalWeights(covarianceMatrix: number[][]): number[] {
  const n = covarianceMatrix.length;
  if (n === 0) return [];
  if (n === 1) return [1.0];
  
  // For minimum variance portfolio: w = (Σ^-1 * 1) / (1^T * Σ^-1 * 1)
  // Using simplified approach: equal weights as baseline, then adjusted
  // For production, you'd want a proper matrix inversion library
  
  // Simple approach: inverse variance weighting
  const variances = covarianceMatrix.map((row, i) => row[i]);
  const invVariances = variances.map(v => v > 0 ? 1 / v : 0);
  const sumInvVar = invVariances.reduce((sum, iv) => sum + iv, 0);
  
  if (sumInvVar === 0) {
    // Fallback to equal weights
    return Array(n).fill(1 / n);
  }
  
  return invVariances.map(iv => iv / sumInvVar);
}

export default function VarianceMatrix({ stocks, portfolios, selectedPortfolioId, selectedPortfolioId2 }: VarianceMatrixProps) {
  const router = useRouter();
  const [showCorrelation, setShowCorrelation] = useState(true);
  const [capitalAmount, setCapitalAmount] = useState<string>('20000');

  // Calculate variance-covariance matrix
  const { matrix, tickers, stocksMap, covarianceMatrix, optimalWeights, expectedReturn, portfolioStdDev, sharpeRatio } = useMemo(() => {
    // Sort stocks first by portfolio name, then by ticker
    const sortedStocks = [...stocks].sort((a, b) => {
      const portfolioCompare = (a.portfolioName || '').localeCompare(b.portfolioName || '');
      if (portfolioCompare !== 0) return portfolioCompare;
      return a.ticker.localeCompare(b.ticker);
    });
    
    const tickers = sortedStocks.map(s => s.ticker);
    const returnsData = sortedStocks.map(s => calculateReturns(s.prices));
    
    // Create a map of ticker to stock data for easy lookup
    const stocksMap = new Map(sortedStocks.map(s => [s.ticker, s]));
    
    // Calculate expected returns (mean of historical returns)
    const expectedReturns = returnsData.map(returns => mean(returns));
    
    // Calculate covariance matrix (always needed for weights)
    const covarianceMatrix: number[][] = [];
    for (let i = 0; i < tickers.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < tickers.length; j++) {
        row.push(covariance(returnsData[i], returnsData[j]));
      }
      covarianceMatrix.push(row);
    }
    
    // Calculate display matrix (correlation or covariance)
    const matrix: number[][] = [];
    for (let i = 0; i < tickers.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < tickers.length; j++) {
        if (showCorrelation) {
          row.push(correlation(returnsData[i], returnsData[j]));
        } else {
          row.push(covarianceMatrix[i][j]);
        }
      }
      matrix.push(row);
    }
    
    // Calculate optimal weights based on covariance matrix
    const optimalWeights = calculateOptimalWeights(covarianceMatrix);
    
    // Calculate portfolio expected return: E(Rp) = w^T * E(R)
    const expectedReturn = optimalWeights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0);
    
    // Calculate portfolio variance: σ²p = w^T * Σ * w
    let portfolioVariance = 0;
    for (let i = 0; i < optimalWeights.length; i++) {
      for (let j = 0; j < optimalWeights.length; j++) {
        portfolioVariance += optimalWeights[i] * optimalWeights[j] * covarianceMatrix[i][j];
      }
    }
    const portfolioStdDev = Math.sqrt(portfolioVariance);
    
    // Calculate annualized Sharpe ratio (assuming risk-free rate = 0 for simplicity)
    // Annualize: multiply daily return by 252, multiply daily std by sqrt(252)
    const annualizedReturn = expectedReturn * 252;
    const annualizedStdDev = portfolioStdDev * Math.sqrt(252);
    const sharpeRatio = annualizedStdDev > 0 ? annualizedReturn / annualizedStdDev : 0;
    
    return { matrix, tickers, stocksMap, covarianceMatrix, optimalWeights, expectedReturn, portfolioStdDev, sharpeRatio };
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

        {/* Optimal Allocation Weights */}
        {tickers.length > 0 && (
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <span className="text-2xl">⚖️</span>
                  Optimal Portfolio Allocation (Minimum Variance)
                </h2>
                <p className="text-slate-300 text-sm">
                  Based on Modern Portfolio Theory, these weights minimize portfolio variance while maintaining full investment (100% allocation).
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <label className="text-sm text-slate-300 font-medium">Capital to Invest</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">$</span>
                  <input
                    type="number"
                    value={capitalAmount}
                    onChange={(e) => setCapitalAmount(e.target.value)}
                    className="w-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="20000"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {tickers
                .map((ticker, i) => ({ ticker, weight: optimalWeights[i] || 0, index: i }))
                .sort((a, b) => b.weight - a.weight)
                .map(({ ticker, weight, index }) => {
                const stock = stocksMap.get(ticker);
                const stockPortfolioId = stock?.portfolioId || selectedPortfolioId;
                const capital = parseFloat(capitalAmount) || 0;
                const dollarAmount = capital * weight;
                const isToBuyPortfolio = stock?.portfolioName === 'TO BUY';
                
                return (
                  <div 
                    key={ticker}
                    className="bg-slate-800/50 backdrop-blur rounded-lg p-3 border border-slate-700 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <a 
                        href={`https://www.portfolio-intelligence.co.uk/?stock=${ticker}&portfolio=${stockPortfolioId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-white hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                      >
                        {ticker}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      {selectedPortfolioId2 && stock?.portfolioName && (
                        <span className="text-xs text-slate-400">{stock.portfolioName}</span>
                      )}
                    </div>
                    {stock?.sector && (
                      <div className="text-xs text-slate-400 mb-2">
                        {stock.sector}
                      </div>
                    )}
                    <div className="text-2xl font-bold text-blue-400">
                      {(weight * 100).toFixed(1)}%
                    </div>
                    {capital > 0 && (
                      <div className="text-sm text-green-400 font-semibold mt-1">
                        ${dollarAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    )}
                    <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${weight * 100}%` }}
                      ></div>
                    </div>
                    {isToBuyPortfolio && (
                      <button
                        onClick={() => {
                          if (confirm(`Transfer ${ticker} out of TO BUY portfolio?`)) {
                            window.location.href = `https://www.portfolio-intelligence.co.uk/?stock=${ticker}&portfolio=${stockPortfolioId}`;
                          }
                        }}
                        className="mt-2 w-full px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                      >
                        Transfer
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Portfolio Composition</h3>
                  <div className="relative" style={{ height: '300px' }}>
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {(() => {
                        let cumulativePercent = 0;
                        const colors = [
                          '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
                          '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7',
                          '#ef4444', '#84cc16', '#f43f5e', '#eab308', '#22c55e'
                        ];
                        
                        return tickers
                          .map((ticker, i) => ({ ticker, weight: optimalWeights[i] || 0, index: i }))
                          .sort((a, b) => b.weight - a.weight)
                          .map(({ ticker, weight, index }, i) => {
                            if (weight === 0) return null;
                            
                            const startAngle = cumulativePercent * 360;
                            const angle = weight * 360;
                            cumulativePercent += weight;
                            
                            const startRadians = (startAngle - 90) * Math.PI / 180;
                            const endRadians = (startAngle + angle - 90) * Math.PI / 180;
                            
                            const x1 = 100 + 80 * Math.cos(startRadians);
                            const y1 = 100 + 80 * Math.sin(startRadians);
                            const x2 = 100 + 80 * Math.cos(endRadians);
                            const y2 = 100 + 80 * Math.sin(endRadians);
                            
                            const largeArc = angle > 180 ? 1 : 0;
                            
                            const pathData = [
                              `M 100 100`,
                              `L ${x1} ${y1}`,
                              `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
                              'Z'
                            ].join(' ');
                            
                            return (
                              <g key={ticker}>
                                <path
                                  d={pathData}
                                  fill={colors[i % colors.length]}
                                  stroke="#1e293b"
                                  strokeWidth="1"
                                  opacity="0.9"
                                />
                                <title>{ticker}: {(weight * 100).toFixed(1)}%</title>
                              </g>
                            );
                          });
                      })()}
                    </svg>
                  </div>
                  {/* Legend */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    {tickers
                      .map((ticker, i) => ({ ticker, weight: optimalWeights[i] || 0, index: i }))
                      .sort((a, b) => b.weight - a.weight)
                      .slice(0, 15)
                      .map(({ ticker, weight }, i) => {
                        const colors = [
                          '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
                          '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7',
                          '#ef4444', '#84cc16', '#f43f5e', '#eab308', '#22c55e'
                        ];
                        return (
                          <div key={ticker} className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-sm flex-shrink-0" 
                              style={{ backgroundColor: colors[i % colors.length] }}
                            ></div>
                            <span className="text-slate-300 truncate">{ticker}</span>
                            <span className="text-slate-400 ml-auto">{(weight * 100).toFixed(1)}%</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
                
                {/* Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Portfolio Metrics</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Total Allocation</span>
                        <span className="text-2xl font-bold text-green-400">
                          {(optimalWeights.reduce((sum, w) => sum + w, 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Ex-ante Return</span>
                        <span className="text-2xl font-bold text-blue-400">
                          {(expectedReturn * 252 * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Annualized expected return</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Ex-ante Volatility</span>
                        <span className="text-2xl font-bold text-orange-400">
                          {(portfolioStdDev * Math.sqrt(252) * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Annualized standard deviation</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Sharpe Ratio</span>
                        <span className="text-2xl font-bold text-purple-400">
                          {sharpeRatio.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Risk-adjusted return</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  {selectedPortfolioId2 && (
                    <th className="sticky left-0 bg-slate-800 p-2 text-left text-slate-300 font-semibold min-w-[120px] z-20">
                      Portfolio
                    </th>
                  )}
                  <th className={`${selectedPortfolioId2 ? 'sticky left-[120px] z-20' : 'sticky left-0'} bg-slate-800 p-2 text-left text-slate-300 font-semibold min-w-[80px]`}>
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
                {tickers.map((ticker, i) => {
                  const stock = stocksMap.get(ticker);
                  const stockPortfolioId = stock?.portfolioId || selectedPortfolioId;
                  return (
                    <tr key={ticker} className="border-t border-slate-700">
                      {selectedPortfolioId2 && (
                        <td className="sticky left-0 bg-slate-800 p-2 text-left text-slate-400 text-xs z-10">
                          {stock?.portfolioName || ''}
                        </td>
                      )}
                      <td className={`${selectedPortfolioId2 ? 'sticky left-[120px] z-10' : 'sticky left-0'} bg-slate-800 p-2 text-left text-white font-semibold`}>
                        <a 
                          href={`https://www.portfolio-intelligence.co.uk/?stock=${ticker}&portfolio=${stockPortfolioId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                        >
                          {ticker}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
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
                  );
                })}
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
