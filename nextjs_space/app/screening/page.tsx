import { CheckCircle2, Filter, Info, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { getStockData, STOCK_CONFIG } from '@/lib/stock-data';
import { parseCriteriaFromParams } from '@/lib/screening-criteria';

export const revalidate = 1800; // 30 minutes

export default async function ScreeningPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Parse criteria from URL parameters (or use defaults)
  const CRITERIA = parseCriteriaFromParams(new URLSearchParams(searchParams as Record<string, string>));
  
  // Fetch real stock data
  const stockData = await getStockData();
  
  // Build screening results from real data with actual filtering
  const recommendedStocks = STOCK_CONFIG.map((config) => {
    const data = stockData[config.ticker];
    const stockInfo = data && typeof data === 'object' && 'stock_data' in data ? data.stock_data : null;
    
    if (!stockInfo) {
      return null;
    }

    // Apply screening criteria (only check enabled criteria)
    const passes: Record<string, boolean> = {};
    
    if (CRITERIA.peEnabled) {
      passes.pe = !stockInfo.pe_ratio || stockInfo.pe_ratio < CRITERIA.maxPE;
    }
    
    if (CRITERIA.pbEnabled) {
      passes.pb = !stockInfo.pb_ratio || stockInfo.pb_ratio < CRITERIA.maxPB;
    }
    
    if (CRITERIA.marketCapEnabled && stockInfo.market_cap) {
      const marketCapB = stockInfo.market_cap / 1e9; // Convert to billions
      passes.marketCap = marketCapB >= CRITERIA.minMarketCap && marketCapB <= CRITERIA.maxMarketCap;
    }
    
    if (CRITERIA.betaEnabled && stockInfo.beta !== undefined) {
      passes.beta = stockInfo.beta >= CRITERIA.minBeta && stockInfo.beta <= CRITERIA.maxBeta;
    }
    
    if (CRITERIA.roeEnabled && stockInfo.roe !== undefined) {
      passes.roe = stockInfo.roe >= CRITERIA.minROE;
    }
    
    if (CRITERIA.profitMarginEnabled && stockInfo.profit_margin !== undefined) {
      passes.profitMargin = stockInfo.profit_margin >= CRITERIA.minProfitMargin;
    }
    
    if (CRITERIA.sentimentEnabled && CRITERIA.sentimentFilter !== 'all') {
      const sentiment = data && typeof data === 'object' && 'sentiment_data' in data ? data.sentiment_data : null;
      if (sentiment && typeof sentiment === 'object' && 'overall_sentiment' in sentiment) {
        passes.sentiment = sentiment.overall_sentiment === CRITERIA.sentimentFilter;
      } else {
        passes.sentiment = false; // Fail if no sentiment data
      }
    }
    
    if (CRITERIA.sectorsEnabled) {
      passes.sector = !CRITERIA.excludeSectors.includes(config.sector);
    }

    const totalCriteria = Object.keys(passes).length;
    const passCount = Object.values(passes).filter(Boolean).length;
    const matchScore = totalCriteria > 0 ? Math.round((passCount / totalCriteria) * 100) : 100;

    // Only include stocks that pass all enabled criteria
    if (matchScore < 100) {
      return null;
    }

    return {
      ticker: config.ticker,
      name: config.name,
      sector: config.sector,
      pe: stockInfo.pe_ratio?.toFixed(2) || 'N/A',
      pb: stockInfo.pb_ratio?.toFixed(2) || 'N/A',
      matchScore,
    };
  }).filter((stock): stock is NonNullable<typeof stock> => stock !== null);

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
        {/* Active Criteria Display */}
        <div className="mb-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                <Info className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Active Screening Criteria</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className={`bg-slate-900/50 border rounded-lg p-3 ${
                  CRITERIA.peEnabled ? 'border-emerald-500/30' : 'border-slate-800/50 opacity-50'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-slate-400">P/E Ratio</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      CRITERIA.peEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {CRITERIA.peEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-white font-mono font-semibold">&lt; {CRITERIA.maxPE}</p>
                </div>
                <div className={`bg-slate-900/50 border rounded-lg p-3 ${
                  CRITERIA.pbEnabled ? 'border-emerald-500/30' : 'border-slate-800/50 opacity-50'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-slate-400">P/B Ratio</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      CRITERIA.pbEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {CRITERIA.pbEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-white font-mono font-semibold">&lt; {CRITERIA.maxPB}</p>
                </div>
                
                {CRITERIA.marketCapEnabled && (
                  <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-3 col-span-1 md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-slate-400">Market Cap Range</p>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400">
                        Enabled
                      </span>
                    </div>
                    <p className="text-white font-mono font-semibold">${CRITERIA.minMarketCap}B - ${CRITERIA.maxMarketCap}B</p>
                  </div>
                )}
                
                {CRITERIA.betaEnabled && (
                  <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-slate-400">Beta Range</p>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400">
                        Enabled
                      </span>
                    </div>
                    <p className="text-white font-mono font-semibold">{CRITERIA.minBeta.toFixed(2)} - {CRITERIA.maxBeta.toFixed(2)}</p>
                  </div>
                )}
                
                {CRITERIA.roeEnabled && (
                  <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-slate-400">Min ROE</p>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400">
                        Enabled
                      </span>
                    </div>
                    <p className="text-white font-mono font-semibold">&gt; {CRITERIA.minROE}%</p>
                  </div>
                )}
                
                {CRITERIA.profitMarginEnabled && (
                  <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-slate-400">Min Profit Margin</p>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400">
                        Enabled
                      </span>
                    </div>
                    <p className="text-white font-mono font-semibold">&gt; {CRITERIA.minProfitMargin}%</p>
                  </div>
                )}
                
                {CRITERIA.sentimentEnabled && (
                  <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-slate-400">Sentiment Filter</p>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400">
                        Enabled
                      </span>
                    </div>
                    <p className="text-white font-mono font-semibold capitalize">{CRITERIA.sentimentFilter}</p>
                  </div>
                )}
                
                <div className={`bg-slate-900/50 border rounded-lg p-3 col-span-1 md:col-span-2 ${
                  CRITERIA.sectorsEnabled ? 'border-red-500/30' : 'border-slate-800/50 opacity-50'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-slate-400">Excluded Sectors</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      CRITERIA.sectorsEnabled ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {CRITERIA.sectorsEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-white font-mono font-semibold">
                    {CRITERIA.excludeSectors.length > 0 ? CRITERIA.excludeSectors.join(', ') : 'None'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
            <div className="flex-1">
              <h3 className="text-xl font-bold text-blue-400 mb-3">Screening Methodology</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                Your customized screening criteria filter stocks based on the following parameters:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CRITERIA.peEnabled && (
                  <div className="p-4 bg-slate-950/50 rounded-lg border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h4 className="text-white font-semibold">P/E Ratio Threshold</h4>
                    </div>
                    <p className="text-slate-400 text-sm">Filters stocks with P/E ratio less than {CRITERIA.maxPE}</p>
                  </div>
                )}
                {CRITERIA.pbEnabled && (
                  <div className="p-4 bg-slate-950/50 rounded-lg border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h4 className="text-white font-semibold">P/B Ratio Threshold</h4>
                    </div>
                    <p className="text-slate-400 text-sm">Filters stocks with P/B ratio less than {CRITERIA.maxPB}</p>
                  </div>
                )}
                {CRITERIA.marketCapEnabled && (
                  <div className="p-4 bg-slate-950/50 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      </div>
                      <h4 className="text-white font-semibold">Market Cap Range</h4>
                    </div>
                    <p className="text-slate-400 text-sm">Filters stocks with market cap between ${CRITERIA.minMarketCap}B and ${CRITERIA.maxMarketCap}B</p>
                  </div>
                )}
                {CRITERIA.betaEnabled && (
                  <div className="p-4 bg-slate-950/50 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      </div>
                      <h4 className="text-white font-semibold">Beta Range</h4>
                    </div>
                    <p className="text-slate-400 text-sm">Filters stocks with beta between {CRITERIA.minBeta.toFixed(2)} and {CRITERIA.maxBeta.toFixed(2)}</p>
                  </div>
                )}
                {CRITERIA.roeEnabled && (
                  <div className="p-4 bg-slate-950/50 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      </div>
                      <h4 className="text-white font-semibold">ROE Minimum</h4>
                    </div>
                    <p className="text-slate-400 text-sm">Filters stocks with ROE greater than {CRITERIA.minROE}%</p>
                  </div>
                )}
                {CRITERIA.profitMarginEnabled && (
                  <div className="p-4 bg-slate-950/50 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      </div>
                      <h4 className="text-white font-semibold">Profit Margin Minimum</h4>
                    </div>
                    <p className="text-slate-400 text-sm">Filters stocks with profit margin greater than {CRITERIA.minProfitMargin}%</p>
                  </div>
                )}
                {CRITERIA.sentimentEnabled && (
                  <div className="p-4 bg-slate-950/50 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      </div>
                      <h4 className="text-white font-semibold">Sentiment Filter</h4>
                    </div>
                    <p className="text-slate-400 text-sm capitalize">Filters stocks with {CRITERIA.sentimentFilter} social sentiment</p>
                  </div>
                )}
                {CRITERIA.sectorsEnabled && CRITERIA.excludeSectors.length > 0 && (
                  <div className="p-4 bg-slate-950/50 rounded-lg border border-red-500/30 col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-red-400" />
                      </div>
                      <h4 className="text-white font-semibold">Sector Exclusions</h4>
                    </div>
                    <p className="text-slate-400 text-sm">Excludes stocks in the following sectors: {CRITERIA.excludeSectors.join(', ')}</p>
                  </div>
                )}
              </div>
              {!CRITERIA.peEnabled && !CRITERIA.pbEnabled && !CRITERIA.marketCapEnabled && !CRITERIA.betaEnabled && 
               !CRITERIA.roeEnabled && !CRITERIA.profitMarginEnabled && !CRITERIA.sentimentEnabled && !CRITERIA.sectorsEnabled && (
                <p className="text-slate-400 text-sm italic">No criteria currently enabled. All stocks will be shown.</p>
              )}
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
