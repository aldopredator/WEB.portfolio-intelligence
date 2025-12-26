'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

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

interface HoldingSnapshot {
  date: string;
  ticker: string;
  quantity: number;
  avgCost: number;
  marketPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
}

interface StockAttribution {
  ticker: string;
  totalReturn: number;
  contribution: number;
  dividends: number;
  fees: number;
  currentHolding: number;
  avgCost: number;
  currentPrice: number;
}

interface DailyReturn {
  date: string;
  portfolioValue: number;
  dailyReturn: number;
  cumulativeReturn: number;
}

export default function PerformanceAttributionClient() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [priceHistory, setPriceHistory] = useState<Record<string, PricePoint[]>>({});
  const [attribution, setAttribution] = useState<StockAttribution[]>([]);
  const [dailyReturns, setDailyReturns] = useState<DailyReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Load transactions from localStorage (Cash Aggregator data)
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
        
        // Fetch price history for each ticker
        await fetchPriceHistory(tickers);
        
        // Set date range
        if (stockTransactions.length > 0) {
          const dates = stockTransactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
          setStartDate(dates[0].toISOString().split('T')[0]);
          setEndDate(new Date().toISOString().split('T')[0]);
        }
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
          priceData[ticker] = data.priceHistory.map((p: any) => ({
            date: p.date,
            close: p.close
          })).sort((a: PricePoint, b: PricePoint) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
        }
      } catch (error) {
        console.error(`Failed to fetch price history for ${ticker}:`, error);
      }
    }
    
    setPriceHistory(priceData);
  };

  // Calculate performance attribution
  useEffect(() => {
    if (transactions.length === 0 || Object.keys(priceHistory).length === 0) return;
    
    calculateAttribution();
  }, [transactions, priceHistory]);

  const calculateAttribution = () => {
    // Group transactions by ticker
    const tickerGroups: Record<string, Transaction[]> = {};
    transactions.forEach(tx => {
      if (tx.ticker) {
        if (!tickerGroups[tx.ticker]) tickerGroups[tx.ticker] = [];
        tickerGroups[tx.ticker].push(tx);
      }
    });

    const attributionResults: StockAttribution[] = [];
    
    Object.entries(tickerGroups).forEach(([ticker, txs]) => {
      let totalQuantity = 0;
      let totalCost = 0;
      let dividends = 0;
      let fees = 0;
      
      // Calculate current holdings and costs
      txs.forEach(tx => {
        if (tx.direction === 'Buy') {
          totalQuantity += tx.quantity || 0;
          totalCost += Math.abs(tx.amount);
        } else if (tx.direction === 'Sell') {
          totalQuantity -= tx.quantity || 0;
          // Realized gains not tracked here
        }
        
        // Track dividends and fees
        if (tx.details.toLowerCase().includes('dividend')) {
          dividends += tx.amount;
        }
        if (tx.amount < 0 && (tx.details.toLowerCase().includes('fee') || tx.details.toLowerCase().includes('charge'))) {
          fees += tx.amount;
        }
      });
      
      // Get current price
      const prices = priceHistory[ticker];
      const currentPrice = prices && prices.length > 0 ? prices[prices.length - 1].close : 0;
      const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
      
      // Calculate returns
      const currentValue = totalQuantity * currentPrice;
      const totalReturn = currentValue - totalCost + dividends + fees;
      const contribution = (totalReturn / totalCost) * 100; // Percentage contribution
      
      attributionResults.push({
        ticker,
        totalReturn,
        contribution,
        dividends,
        fees,
        currentHolding: totalQuantity,
        avgCost,
        currentPrice
      });
    });
    
    // Sort by contribution (descending)
    attributionResults.sort((a, b) => b.totalReturn - a.totalReturn);
    setAttribution(attributionResults);
    
    // Calculate daily returns
    calculateDailyReturns(tickerGroups);
  };

  const calculateDailyReturns = (tickerGroups: Record<string, Transaction[]>) => {
    if (!startDate || !endDate) return;
    
    const dailyData: DailyReturn[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let previousValue = 0;
    let initialInvestment = 0;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      let portfolioValue = 0;
      
      // Calculate portfolio value on this date
      Object.entries(tickerGroups).forEach(([ticker, txs]) => {
        // Calculate holdings up to this date
        let quantity = 0;
        let costBasis = 0;
        
        txs.forEach(tx => {
          if (new Date(tx.date) <= d) {
            if (tx.direction === 'Buy') {
              quantity += tx.quantity || 0;
              costBasis += Math.abs(tx.amount);
            } else if (tx.direction === 'Sell') {
              quantity -= tx.quantity || 0;
            }
          }
        });
        
        // Get price on this date
        const prices = priceHistory[ticker];
        if (prices) {
          const priceOnDate = prices.find(p => p.date === dateStr);
          if (priceOnDate && quantity > 0) {
            portfolioValue += quantity * priceOnDate.close;
          } else if (quantity > 0 && prices.length > 0) {
            // Use closest available price
            const closestPrice = prices.reduce((prev, curr) => 
              Math.abs(new Date(curr.date).getTime() - d.getTime()) < 
              Math.abs(new Date(prev.date).getTime() - d.getTime()) ? curr : prev
            );
            portfolioValue += quantity * closestPrice.close;
          }
        }
        
        if (costBasis > initialInvestment) {
          initialInvestment = costBasis;
        }
      });
      
      // Calculate daily return
      const dailyReturn = previousValue > 0 ? ((portfolioValue - previousValue) / previousValue) * 100 : 0;
      const cumulativeReturn = initialInvestment > 0 ? ((portfolioValue - initialInvestment) / initialInvestment) * 100 : 0;
      
      if (portfolioValue > 0) {
        dailyData.push({
          date: dateStr,
          portfolioValue,
          dailyReturn,
          cumulativeReturn
        });
      }
      
      previousValue = portfolioValue;
    }
    
    setDailyReturns(dailyData);
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
            <p className="mt-4 text-slate-400">Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPortfolioReturn = attribution.reduce((sum, a) => sum + a.totalReturn, 0);
  const totalDividends = attribution.reduce((sum, a) => sum + a.dividends, 0);
  const totalFees = attribution.reduce((sum, a) => sum + a.fees, 0);
  const currentValue = attribution.reduce((sum, a) => sum + (a.currentHolding * a.currentPrice), 0);
  const totalCost = attribution.reduce((sum, a) => sum + (a.currentHolding * a.avgCost), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Performance Attribution</h1>
          <p className="text-slate-400">Analyze portfolio returns and attribution by stock</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Return</p>
                <p className={`text-2xl font-bold ${totalPortfolioReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(totalPortfolioReturn)}
                </p>
              </div>
              {totalPortfolioReturn >= 0 ? 
                <ArrowUpRight className="w-8 h-8 text-green-400" /> : 
                <ArrowDownRight className="w-8 h-8 text-red-400" />
              }
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Current Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(currentValue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Dividends</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(totalDividends)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Fees</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(totalFees)}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Cumulative Returns Chart */}
        {dailyReturns.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Cumulative Returns</h2>
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
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cumulativeReturn" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Cumulative Return %"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Attribution by Stock */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Attribution by Stock</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={attribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="ticker" 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(value: any) => [formatCurrency(value), 'Return']}
              />
              <Bar dataKey="totalReturn" name="Total Return">
                {attribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.totalReturn >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Attribution Table */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Detailed Attribution</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Ticker</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Holding</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Avg Cost</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Current Price</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Return %</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Total Return</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Dividends</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Fees</th>
                </tr>
              </thead>
              <tbody>
                {attribution.map((attr, index) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-white font-semibold">{attr.ticker}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{attr.currentHolding.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(attr.avgCost)}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(attr.currentPrice)}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${attr.contribution >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(attr.contribution)}
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${attr.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(attr.totalReturn)}
                    </td>
                    <td className="py-3 px-4 text-right text-green-400">{formatCurrency(attr.dividends)}</td>
                    <td className="py-3 px-4 text-right text-red-400">{formatCurrency(attr.fees)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-700 font-bold">
                  <td className="py-3 px-4 text-white">TOTAL</td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    {totalCost > 0 ? formatPercent((totalPortfolioReturn / totalCost) * 100) : '-'}
                  </td>
                  <td className={`py-3 px-4 text-right ${totalPortfolioReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(totalPortfolioReturn)}
                  </td>
                  <td className="py-3 px-4 text-right text-green-400">{formatCurrency(totalDividends)}</td>
                  <td className="py-3 px-4 text-right text-red-400">{formatCurrency(totalFees)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
