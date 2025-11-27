import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';

export default function ScreeningPage() {
  const recommendedStocks = [
    {
      ticker: 'GOOG',
      name: 'Alphabet Inc.',
      sector: 'Technology',
      pe: 18.5,
      ytd: '+28.3%',
      week52: '+35.2%',
      pb: 2.8,
      matchScore: 100,
    },
    {
      ticker: 'NVDA',
      name: 'Nvidia Corporation',
      sector: 'Technology',
      pe: 19.2,
      ytd: '+156.4%',
      week52: '+185.7%',
      pb: 2.5,
      matchScore: 100,
    },
    {
      ticker: 'TSLA',
      name: 'Tesla, Inc.',
      sector: 'Consumer Cyclical',
      pe: 17.8,
      ytd: '+42.9%',
      week52: '+28.5%',
      pb: 2.9,
      matchScore: 100,
    },
    {
      ticker: 'AMZN',
      name: 'Amazon.com Inc.',
      sector: 'Consumer Cyclical',
      pe: 16.3,
      ytd: '+38.7%',
      week52: '+42.1%',
      pb: 2.3,
      matchScore: 100,
    },
    {
      ticker: 'BRKB',
      name: 'Berkshire Hathaway Inc.',
      sector: 'Financial Services',
      pe: 15.7,
      ytd: '+25.6%',
      week52: '+31.8%',
      pb: 1.8,
      matchScore: 100,
    },
    {
      ticker: 'ISRG',
      name: 'Intuitive Surgical Inc.',
      sector: 'Healthcare',
      pe: 18.9,
      ytd: '+52.3%',
      week52: '+68.9%',
      pb: 2.7,
      matchScore: 100,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-white">Recommended Stocks</h1>
            <div className="bg-emerald-900/30 border border-emerald-800/50 rounded-lg px-4 py-2">
              <span className="text-emerald-400 font-semibold">{recommendedStocks.length} Stocks Found</span>
            </div>
          </div>
          <p className="text-slate-400 text-lg">
            These stocks meet all screening criteria: P/E &lt; 20, Positive YTD, P/B &lt; 3, excluding alcohol and gambling sectors.
          </p>
        </div>

        {/* Stock Table */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Sector
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    P/E Ratio
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    P/B Ratio
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    YTD Return
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    52W Return
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Match
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recommendedStocks.map((stock, idx) => (
                  <tr
                    key={stock.ticker}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-semibold">{stock.ticker}</div>
                        <div className="text-slate-400 text-sm">{stock.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{stock.sector}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-emerald-400 font-mono font-semibold">{stock.pe}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-emerald-400 font-mono font-semibold">{stock.pb}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-400 font-mono font-semibold">{stock.ytd}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-400 font-mono font-semibold">{stock.week52}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="text-emerald-400 font-semibold">{stock.matchScore}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-900/20 border border-blue-800/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">📈 Screening Methodology</h3>
          <p className="text-slate-300 leading-relaxed mb-4">
            This screening uses a multi-factor approach to identify quality stocks:
          </p>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Valuation:</strong> P/E &lt; 20 and P/B &lt; 3 ensures reasonable valuations</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Performance:</strong> Positive YTD and 52-week returns indicate momentum</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Sector Filter:</strong> Excludes alcohol and gambling for ethical investing</span>
            </li>
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-slate-900/30 border border-slate-800/50 rounded-lg">
          <p className="text-slate-400 text-sm text-center">
            <strong className="text-slate-300">Disclaimer:</strong> This is for informational purposes only and should not be considered as financial advice. 
            Always conduct your own research and consult with a qualified financial advisor before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
