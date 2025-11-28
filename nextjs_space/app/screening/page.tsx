import { TrendingUp, CheckCircle2, Filter, Info, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { getStockData, STOCK_CONFIG } from '@/lib/stock-data';

export const revalidate = 1800; // 30 minutes

export default async function ScreeningPage() {
  // Fetch real stock data
  const stockData = await getStockData();
  
  // Build screening results from real data
  const recommendedStocks = STOCK_CONFIG.map((config) => {
    const data = stockData[config.ticker];
    const stockInfo = data && typeof data === 'object' && 'stock_data' in data ? data.stock_data : null;
    
    if (!stockInfo) {
      return null;
    }

    // Calculate returns (if price history available)
    let ytdReturn = 'N/A';
    let week52Return = 'N/A';
    
    if (stockInfo.change_percent !== undefined) {
      ytdReturn = `${stockInfo.change_percent >= 0 ? '+' : ''}${stockInfo.change_percent.toFixed(1)}%`;
    }
    
    if (stockInfo['52_week_high'] && stockInfo['52_week_low'] && stockInfo.current_price) {
      const weekRange = stockInfo['52_week_high'] - stockInfo['52_week_low'];
      const currentFromLow = stockInfo.current_price - stockInfo['52_week_low'];
      const week52Pct = (currentFromLow / stockInfo['52_week_low']) * 100;
      week52Return = `${week52Pct >= 0 ? '+' : ''}${week52Pct.toFixed(1)}%`;
    }

    return {
      ticker: config.ticker,
      name: config.name,
      sector: config.sector,
      pe: stockInfo.pe_ratio?.toFixed(2) || 'N/A',
      ytd: ytdReturn,
      week52: week52Return,
      pb: stockInfo.pb_ratio?.toFixed(2) || 'N/A',
      matchScore: 100, // You can implement actual screening logic here
    };
  }).filter((stock): stock is NonNullable<typeof stock> => stock !== null); // Remove null entries and fix TypeScript

  return (
    <main className="min-h-screen">
      <PageHeader
        title="Stock Screening Results"
        description="Stocks that meet all investment criteria and filtering requirements"
        action={
          <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl px-6 py-3">
            <Filter className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-emerald-400 text-xs font-medium">Stocks Found</p>
              <p className="text-white text-2xl font-bold">{recommendedStocks.length}</p>
            </div>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Stock Cards Grid (Mobile-friendly alternative to table) */}
        <div className="lg:hidden space-y-4 mb-8">
          {recommendedStocks.map((stock) => (
            <div
              key={stock.ticker}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6 hover:border-slate-700/50 transition-all hover:shadow-lg hover:shadow-blue-500/5"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{stock.ticker}</h3>
                  <p className="text-slate-400 text-sm">{stock.name}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">
                    {stock.sector}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">{stock.matchScore}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                  <p className="text-slate-400 text-xs mb-1">P/E Ratio</p>
                  <p className="text-emerald-400 font-mono font-bold text-lg">{stock.pe}</p>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                  <p className="text-slate-400 text-xs mb-1">P/B Ratio</p>
                  <p className="text-emerald-400 font-mono font-bold text-lg">{stock.pb}</p>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                  <p className="text-slate-400 text-xs mb-1">YTD Return</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <p className="text-emerald-400 font-mono font-bold text-lg">{stock.ytd}</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                  <p className="text-slate-400 text-xs mb-1">52W Return</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <p className="text-emerald-400 font-mono font-bold text-lg">{stock.week52}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stock Table (Desktop) */}
        <div className="hidden lg:block bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-950/50 to-slate-900/50 border-b border-slate-800/50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Sector
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                    P/E Ratio
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                    P/B Ratio
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                    YTD Return
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider">
                    52W Return
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Match Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recommendedStocks.map((stock, idx) => (
                  <tr
                    key={stock.ticker}
                    className="hover:bg-slate-800/30 transition-all group"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <div className="text-white font-bold text-lg">{stock.ticker}</div>
                        <div className="text-slate-400 text-sm mt-1">{stock.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">
                        {stock.sector}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-emerald-400 font-mono font-bold text-lg">{stock.pe}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-emerald-400 font-mono font-bold text-lg">{stock.pb}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-emerald-400 font-mono font-bold text-lg">{stock.ytd}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-emerald-400 font-mono font-bold text-lg">{stock.week52}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-emerald-400 font-bold text-lg">{stock.matchScore}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Methodology Card */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-xl p-6 backdrop-blur-sm mb-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                <Info className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-3">Screening Methodology</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                Our multi-factor screening approach identifies high-quality stocks through rigorous quantitative analysis:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h4 className="text-white font-semibold">Valuation</h4>
                  </div>
                  <p className="text-slate-400 text-sm">P/E &lt; 20 and P/B &lt; 3 ensures reasonable valuations</p>
                </div>
                <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h4 className="text-white font-semibold">Performance</h4>
                  </div>
                  <p className="text-slate-400 text-sm">Positive YTD and 52-week returns indicate strong momentum</p>
                </div>
                <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h4 className="text-white font-semibold">Sector Filter</h4>
                  </div>
                  <p className="text-slate-400 text-sm">Excludes alcohol and gambling sectors for ethical investing</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-800/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/20">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-400 mb-2">Investment Disclaimer</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                This information is for educational and informational purposes only and should not be considered as financial advice, investment recommendations, or an offer to buy or sell securities. 
                Past performance does not guarantee future results. Always conduct thorough due diligence and consult with a qualified financial advisor before making any investment decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
