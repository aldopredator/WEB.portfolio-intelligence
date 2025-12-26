'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Activity, Calendar, BarChart3, Info } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface Transaction {
  date: string;
  ticker?: string;
  type: string;
  direction?: string;
  quantity?: number;
  price?: number;
  amount: number;
  details: string;
}

interface PricePoint {
  date: string;
  close: number;
}

interface PortfolioHolding {
  ticker: string;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  weight: number;
}

interface VaRResult {
  confidenceLevel: number;
  varAmount: number;
  varPercent: number;
  timeHorizon: number;
}

interface DailyReturn {
  date: string;
  return: number;
  portfolioValue: number;
}

export default function ValueAtRiskClient() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [priceHistory, setPriceHistory] = useState<Record<string, PricePoint[]>>({});
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [varResults, setVarResults] = useState<VaRResult[]>([]);
  const [dailyReturns, setDailyReturns] = useState<DailyReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [selectedConfidence, setSelectedConfidence] = useState(95);
  const [selectedHorizon, setSelectedHorizon] = useState(1);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Load transactions from localStorage
      const storedStatements = localStorage.getItem('cashAggregatorStatements');
      if (storedStatements) {
        const statements = JSON.parse(storedStatements);
        const allTransactions: Transaction[] = [];
        statements.forEach((statement: any) => {
          allTransactions.push(...statement.transactions);
        });
        
        // Filter only stock transactions (exclude ETFs and cash)
        const stockTransactions = allTransactions.filter(t => 
          t.type === 'Stock' && t.ticker && t.ticker !== '-'
        );
        
        setTransactions(stockTransactions);
        
        // Get unique tickers
        const tickers = [...new Set(stockTransactions.map(t => t.ticker).filter(Boolean))] as string[];
        
        // Fetch price history for each ticker (30 days)
        await fetchPriceHistory(tickers);
      }
      
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Fetch price history from API
  const fetchPriceHistory = async (tickers: string[]) => {
    const priceData: Record<string, PricePoint[]> = {};
    
    for (const ticker of tickers) {
      try {
        const response = await fetch(`/api/price-history?ticker=${ticker}`);
        const data = await response.json();
        
        if (data.success && data.priceHistory) {
          // Take only last 30 days
          const last30Days = data.priceHistory
            .slice(0, 30)
            .map((p: any) => ({
              date: p.date,
              close: p.close
            }))
            .sort((a: PricePoint, b: PricePoint) => 
              new Date(a.date).getTime() - new Date(b.date).getTime()
            );
          priceData[ticker] = last30Days;
        }
      } catch (error) {
        console.error(`Failed to fetch price history for ${ticker}:`, error);
      }
    }
    
    setPriceHistory(priceData);
  };

  // Calculate holdings and VaR when data is ready
  useEffect(() => {
    if (transactions.length === 0 || Object.keys(priceHistory).length === 0) return;
    
    calculateHoldings();
  }, [transactions, priceHistory]);

  const calculateHoldings = () => {
    // Group transactions by ticker
    const tickerGroups: Record<string, Transaction[]> = {};
    transactions.forEach(tx => {
      if (tx.ticker) {
        if (!tickerGroups[tx.ticker]) tickerGroups[tx.ticker] = [];
        tickerGroups[tx.ticker].push(tx);
      }
    });

    const currentHoldings: PortfolioHolding[] = [];
    let totalValue = 0;
    
    Object.entries(tickerGroups).forEach(([ticker, txs]) => {
      let quantity = 0;
      
      // Calculate current holdings
      txs.forEach(tx => {
        if (tx.direction === 'Buy') {
          quantity += tx.quantity || 0;
        } else if (tx.direction === 'Sell') {
          quantity -= tx.quantity || 0;
        }
      });
      
      if (quantity > 0) {
        // Get current price
        const prices = priceHistory[ticker];
        const currentPrice = prices && prices.length > 0 ? prices[prices.length - 1].close : 0;
        const currentValue = quantity * currentPrice;
        
        totalValue += currentValue;
        
        currentHoldings.push({
          ticker,
          quantity,
          currentPrice,
          currentValue,
          weight: 0 // Will be calculated after we know total value
        });
      }
    });
    
    // Calculate weights
    currentHoldings.forEach(holding => {
      holding.weight = totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0;
    });
    
    setHoldings(currentHoldings);
    setPortfolioValue(totalValue);
    
    // Calculate VaR
    calculateVaR(currentHoldings, totalValue);
  };

  const calculateVaR = (currentHoldings: PortfolioHolding[], totalValue: number) => {
    // Calculate daily returns for the portfolio
    const returns: DailyReturn[] = [];
    
    // Find common dates across all holdings
    const allDates = new Set<string>();
    currentHoldings.forEach(holding => {
      const prices = priceHistory[holding.ticker];
      if (prices) {
        prices.forEach(p => allDates.add(p.date));
      }
    });
    
    const sortedDates = Array.from(allDates).sort();
    
    // Calculate portfolio value for each date
    const portfolioValues: Record<string, number> = {};
    
    sortedDates.forEach(date => {
      let dayValue = 0;
      let hasAllPrices = true;
      
      currentHoldings.forEach(holding => {
        const prices = priceHistory[holding.ticker];
        const priceOnDate = prices?.find(p => p.date === date);
        
        if (priceOnDate) {
          dayValue += holding.quantity * priceOnDate.close;
        } else {
          hasAllPrices = false;
        }
      });
      
      if (hasAllPrices) {
        portfolioValues[date] = dayValue;
      }
    });
    
    // Calculate daily returns
    const dates = Object.keys(portfolioValues).sort();
    const dailyReturnsList: DailyReturn[] = [];
    
    for (let i = 1; i < dates.length; i++) {
      const prevValue = portfolioValues[dates[i - 1]];
      const currValue = portfolioValues[dates[i]];
      
      if (prevValue > 0) {
        const returnPct = ((currValue - prevValue) / prevValue) * 100;
        dailyReturnsList.push({
          date: dates[i],
          return: returnPct,
          portfolioValue: currValue
        });
      }
    }
    
    setDailyReturns(dailyReturnsList);
    
    // Calculate VaR at different confidence levels
    const confidenceLevels = [90, 95, 99];
    const timeHorizons = [1, 5, 10];
    const varCalculations: VaRResult[] = [];
    
    if (dailyReturnsList.length > 0) {
      // Sort returns for percentile calculation
      const sortedReturns = [...dailyReturnsList.map(d => d.return)].sort((a, b) => a - b);
      
      confidenceLevels.forEach(confidence => {
        timeHorizons.forEach(horizon => {
          // Find the percentile
          const percentile = 100 - confidence;
          const index = Math.floor((percentile / 100) * sortedReturns.length);
          const varReturn = sortedReturns[index] || sortedReturns[0];
          
          // Scale by time horizon (square root of time rule)
          const scaledVarReturn = varReturn * Math.sqrt(horizon);
          const varAmount = totalValue * (Math.abs(scaledVarReturn) / 100);
          
          varCalculations.push({
            confidenceLevel: confidence,
            varAmount,
            varPercent: scaledVarReturn,
            timeHorizon: horizon
          });
        });
      });
    }
    
    setVarResults(varCalculations);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-slate-400">Calculating Value at Risk...</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter VaR results based on selected confidence and horizon
  const filteredVaR = varResults.find(v => 
    v.confidenceLevel === selectedConfidence && v.timeHorizon === selectedHorizon
  );

  // Get all VaR results for selected confidence across different horizons
  const varByHorizon = varResults.filter(v => v.confidenceLevel === selectedConfidence);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Value at Risk (VaR)</h1>
          <p className="text-slate-400">Portfolio risk analysis based on 30-day historical data</p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-300">
            <p className="mb-2">
              <strong className="text-white">Value at Risk (VaR)</strong> estimates the maximum potential loss over a given time period at a specified confidence level.
            </p>
            <p>
              Example: A 95% VaR of £500 for 1 day means there's only a 5% chance of losing more than £500 in the next day.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Confidence Level</label>
              <select
                value={selectedConfidence}
                onChange={(e) => setSelectedConfidence(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value={90}>90% (1 in 10 days)</option>
                <option value={95}>95% (1 in 20 days)</option>
                <option value={99}>99% (1 in 100 days)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Time Horizon</label>
              <select
                value={selectedHorizon}
                onChange={(e) => setSelectedHorizon(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value={1}>1 Day</option>
                <option value={5}>5 Days (1 Week)</option>
                <option value={10}>10 Days (2 Weeks)</option>
              </select>
            </div>
          </div>
        </div>

        {/* VaR Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Portfolio Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(portfolioValue)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">VaR ({selectedConfidence}%)</p>
                <p className="text-2xl font-bold text-red-400">
                  {filteredVaR ? formatCurrency(filteredVaR.varAmount) : '-'}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">VaR %</p>
                <p className="text-2xl font-bold text-red-400">
                  {filteredVaR ? formatPercent(filteredVaR.varPercent) : '-'}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Time Horizon</p>
                <p className="text-2xl font-bold text-white">{selectedHorizon} Day{selectedHorizon > 1 ? 's' : ''}</p>
              </div>
              <Calendar className="w-8 h-8 text-violet-400" />
            </div>
          </div>
        </div>

        {/* VaR by Time Horizon Chart */}
        {varByHorizon.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">VaR by Time Horizon ({selectedConfidence}% Confidence)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={varByHorizon}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="timeHorizon" 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8' }}
                  tickFormatter={(value) => `${value} Day${value > 1 ? 's' : ''}`}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: any) => [formatCurrency(value), 'VaR']}
                  labelFormatter={(value) => `${value} Day${value > 1 ? 's' : ''}`}
                />
                <Bar dataKey="varAmount" fill="#ef4444" name="VaR" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Daily Returns Distribution */}
        {dailyReturns.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Daily Portfolio Returns</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyReturns}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8' }}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: any) => [`${value.toFixed(2)}%`, 'Return']}
                />
                <Line 
                  type="monotone" 
                  dataKey="return" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Daily Return %"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* VaR Matrix Table */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">VaR Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Confidence Level</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">1 Day</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">5 Days</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">10 Days</th>
                </tr>
              </thead>
              <tbody>
                {[90, 95, 99].map(confidence => (
                  <tr key={confidence} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-white font-semibold">{confidence}%</td>
                    {[1, 5, 10].map(horizon => {
                      const var_result = varResults.find(v => 
                        v.confidenceLevel === confidence && v.timeHorizon === horizon
                      );
                      return (
                        <td key={horizon} className="py-3 px-4 text-right">
                          {var_result ? (
                            <div>
                              <div className="text-red-400 font-semibold">{formatCurrency(var_result.varAmount)}</div>
                              <div className="text-slate-500 text-sm">{formatPercent(var_result.varPercent)}</div>
                            </div>
                          ) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Portfolio Holdings */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Current Holdings</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Ticker</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Quantity</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Current Price</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Market Value</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Weight %</th>
                </tr>
              </thead>
              <tbody>
                {holdings.sort((a, b) => b.weight - a.weight).map((holding, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-white font-semibold">{holding.ticker}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{holding.quantity.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(holding.currentPrice)}</td>
                    <td className="py-3 px-4 text-right text-white font-semibold">{formatCurrency(holding.currentValue)}</td>
                    <td className="py-3 px-4 text-right text-blue-400">{holding.weight.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-700 font-bold">
                  <td className="py-3 px-4 text-white">TOTAL</td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right text-white">{formatCurrency(portfolioValue)}</td>
                  <td className="py-3 px-4 text-right text-blue-400">100.00%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
